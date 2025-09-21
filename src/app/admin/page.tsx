"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

export default function AdminHome() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      setEmail(data.user?.email ?? null);
      if (uid) {
        const { data: admin } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", uid)
          .maybeSingle();
        setIsAdmin(Boolean(admin));
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!email) return <div className="text-white">Sign in required.</div>;
  if (!isAdmin) return <div className="text-red-300">Access denied. Admins only.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <a href="/admin/payments" className="feature-card text-left">
        <h2 className="text-xl font-semibold mb-2">Payments</h2>
        <p className="text-gray-300">Review and approve payment proofs.</p>
      </a>
      <a href="/admin/users" className="feature-card text-left">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <p className="text-gray-300">Manage users, roles, and subscriptions.</p>
      </a>
      <a href="/admin/settings" className="feature-card text-left">
        <h2 className="text-xl font-semibold mb-2">Site Settings</h2>
        <p className="text-gray-300">Control global content and branding.</p>
      </a>
    </div>
  );
}


