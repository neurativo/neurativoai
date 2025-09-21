"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
  plan: string | null;
};

export default function AdminUsersPage() {
  const supabase = getSupabaseBrowser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) { setLoading(false); return; }
      const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", uid).maybeSingle();
      if (!admin) { setIsAdmin(false); setLoading(false); return; }
      setIsAdmin(true);
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id,email,display_name")
        .limit(200);
      if (error) setError(error.message);

      const ids = (users ?? []).map(u => u.id);
      const { data: admins } = await supabase.from("admins").select("user_id").in("user_id", ids);
      const { data: subs } = await supabase.from("subscriptions").select("user_id, plan").in("user_id", ids);

      const adminSet = new Set((admins ?? []).map(a => a.user_id));
      const planMap = new Map((subs ?? []).map(s => [s.user_id, s.plan] as const));

      setRows((users ?? []).map(u => ({
        id: u.id,
        email: u.email,
        display_name: u.display_name,
        is_admin: adminSet.has(u.id),
        plan: planMap.get(u.id) ?? null,
      })));

      setLoading(false);
    }
    load();
  }, [supabase]);

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    setError(null);
    if (makeAdmin) {
      const { error } = await supabase.from("admins").insert({ user_id: userId });
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from("admins").delete().eq("user_id", userId);
      if (error) { setError(error.message); return; }
    }
    setRows(prev => prev.map(r => r.id === userId ? { ...r, is_admin: makeAdmin } : r));
  }

  if (loading) return <div className="text-white">Loading...</div>;
  if (!isAdmin) return <div className="text-red-300">Admins only.</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Users</h2>
      {error && <div className="alert alert-error bg-white/10 border border-white/20 text-white">{error}</div>}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="table table-zebra-zebra text-white">
          <thead className="bg-white/5">
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Plan</th>
              <th>Admin</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="break-all">{r.email}</td>
                <td>{r.display_name ?? "-"}</td>
                <td className="capitalize">{r.plan ?? "-"}</td>
                <td>{r.is_admin ? "Yes" : "No"}</td>
                <td>
                  {r.is_admin ? (
                    <button className="btn btn-sm btn-outline" onClick={() => toggleAdmin(r.id, false)}>Remove Admin</button>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => toggleAdmin(r.id, true)}>Make Admin</button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-6">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


