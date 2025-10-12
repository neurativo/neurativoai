"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

type PaymentRow = {
  id: string;
  user_id: string;
  plan: string;
  method: string;
  amount_cents: number;
  currency: string;
  proof_url: string | null;
  status: string;
  created_at: string;
  admin_note?: string;
};

// File viewer component
function FileViewer({ url, type }: { url: string; type: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!url) return <span className="text-gray-400">No proof uploaded</span>;

  const isImage = type.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = type === 'application/pdf' || url.match(/\.pdf$/i);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
        <div className="relative max-w-4xl max-h-full">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
          >
            <i className="fas fa-times"></i>
          </button>
          {isImage ? (
            <img src={url} alt="Payment proof" className="max-w-full max-h-full object-contain" />
          ) : isPdf ? (
            <iframe src={url} className="w-full h-[80vh] border-0 rounded-lg" />
          ) : (
            <div className="bg-white/10 p-8 rounded-lg text-center">
              <i className="fas fa-file text-4xl text-gray-400 mb-4"></i>
              <p className="text-white mb-4">File preview not available</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <i className="fas fa-download mr-2"></i>
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isImage ? (
        <div className="relative">
          <img 
            src={url} 
            alt="Payment proof" 
            className="w-32 h-20 object-cover rounded-lg border border-white/20 cursor-pointer hover:border-purple-400/50 transition-colors"
            onClick={() => setIsFullscreen(true)}
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 rounded-lg flex items-center justify-center transition-colors">
            <i className="fas fa-expand text-white opacity-0 hover:opacity-100 transition-opacity"></i>
          </div>
        </div>
      ) : isPdf ? (
        <div className="w-32 h-20 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-red-400/50 transition-colors" onClick={() => setIsFullscreen(true)}>
          <div className="text-center">
            <i className="fas fa-file-pdf text-red-400 text-2xl mb-1"></i>
            <p className="text-red-300 text-xs">PDF</p>
          </div>
        </div>
      ) : (
        <div className="w-32 h-20 bg-gray-500/20 border border-gray-500/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-file text-gray-400 text-2xl mb-1"></i>
            <p className="text-gray-300 text-xs">File</p>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setIsFullscreen(true)}
          className="btn btn-xs btn-outline"
        >
          <i className="fas fa-eye mr-1"></i>
          View
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline">
          <i className="fas fa-download mr-1"></i>
          Download
        </a>
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const supabase = getSupabaseBrowser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("plus");
  const [reviewNote, setReviewNote] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
      const { data: payData, error } = await supabase
        .from("payments")
        .select("id,user_id,plan,method,amount_cents,currency,proof_url,status,created_at")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      setRows(payData ?? []);
      setFilteredRows(payData ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  // Filter payments based on status
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredRows(rows);
    } else {
      setFilteredRows(rows.filter(r => r.status === statusFilter));
    }
  }, [statusFilter, rows]);

  async function loadDetail(p: PaymentRow) {
    setOpenId(p.id);
    setSelectedPlan(p.plan);
    setReviewNote("");
    setProfileEmail(null);
    setProfileName(null);
    setCurrentPlan(null);
    const [{ data: prof }, { data: sub }] = await Promise.all([
      supabase.from("profiles").select("email,display_name").eq("id", p.user_id).maybeSingle(),
      supabase.from("subscriptions").select("plan").eq("user_id", p.user_id).maybeSingle(),
    ]);
    setProfileEmail(prof?.email ?? null);
    setProfileName(prof?.display_name ?? null);
    setCurrentPlan(sub?.plan ?? null);
  }

  async function approvePayment(p: PaymentRow) {
    setError(null);
    // 1) Update subscription plan and extend period 30 days from now
    const periodStart = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30*24*60*60*1000).toISOString();
    const { error: subErr } = await supabase
      .from("subscriptions")
      .upsert({ user_id: p.user_id, plan: selectedPlan as any, status: "active", current_period_start: periodStart, current_period_end: periodEnd }, { onConflict: "user_id" });
    if (subErr) { setError(subErr.message); return; }
    // 2) Mark payment approved and save note
    const { error: payErr } = await supabase
      .from("payments")
      .update({ status: "approved", admin_note: reviewNote, reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (payErr) { setError(payErr.message); return; }
    setRows(prev => prev.map(r => r.id === p.id ? { ...r, status: "approved" } : r));
    setFilteredRows(prev => prev.map(r => r.id === p.id ? { ...r, status: "approved" } : r));
    setOpenId(null);
  }

  async function rejectPayment(p: PaymentRow) {
    setError(null);
    const { error: payErr } = await supabase
      .from("payments")
      .update({ status: "rejected", admin_note: reviewNote, reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (payErr) { setError(payErr.message); return; }
    setRows(prev => prev.map(r => r.id === p.id ? { ...r, status: "rejected" } : r));
    setFilteredRows(prev => prev.map(r => r.id === p.id ? { ...r, status: "rejected" } : r));
    setOpenId(null);
  }

  if (loading) return <div className="text-white">Loading...</div>;
  if (!isAdmin) return <div className="text-red-300">Admins only.</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Payment Verification</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-300">
            Total: {rows.length} | Pending: {rows.filter(r => r.status === 'pending').length}
          </div>
          <select 
            className="select select-bordered select-sm bg-white/5 text-white" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      {error && <div className="alert alert-error bg-white/10 border border-white/20 text-white">{error}</div>}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="table table-zebra-zebra text-white">
          <thead className="bg-white/5">
            <tr>
              <th>Created</th>
              <th>User</th>
              <th>Plan</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Proof</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id}>
                <td className="text-gray-300 text-sm">{new Date(r.created_at).toLocaleString()}</td>
                <td className="text-gray-300 text-sm break-all">{r.user_id}</td>
                <td className="capitalize">{r.plan}</td>
                <td>{r.method}</td>
                <td>{r.amount_cents/100} {r.currency}</td>
                <td>
                  <FileViewer url={r.proof_url || ""} type={r.proof_url?.split('.').pop() || ""} />
                </td>
                <td>
                  <span className={`badge badge-sm ${
                    r.status === 'pending' ? 'badge-warning' : 
                    r.status === 'approved' ? 'badge-success' : 
                    'badge-error'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button className="btn btn-sm btn-primary" onClick={() => loadDetail(r)}>
                    <i className="fas fa-eye mr-1"></i>
                    Review
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-6">
                  {statusFilter === 'all' ? 'No payments submitted yet.' : `No ${statusFilter} payments found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Detail Drawer */}
      {openId && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end bg-black/50">
          <div className="w-full max-w-md h-full bg-white/5 backdrop-blur-xl border-l border-white/20 p-5 overflow-y-auto text-white">
            {(() => { const p = rows.find(x => x.id === openId)!; return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold">Payment Review</h3>
                  <button className="btn btn-ghost" onClick={()=>setOpenId(null)}>Close</button>
                </div>
                <div className="space-y-2 text-gray-300 text-sm">
                  <div><span className="text-gray-400">Created:</span> {new Date(p.created_at).toLocaleString()}</div>
                  <div><span className="text-gray-400">User ID:</span> <span className="break-all">{p.user_id}</span></div>
                  <div><span className="text-gray-400">Email:</span> {profileEmail ?? "-"}</div>
                  <div><span className="text-gray-400">Name:</span> {profileName ?? "-"}</div>
                  <div><span className="text-gray-400">Current Plan:</span> {currentPlan ?? "-"}</div>
                  <div className="border-t border-white/10 my-2" />
                  <div><span className="text-gray-400">Requested Plan:</span> <span className="capitalize">{p.plan}</span></div>
                  <div><span className="text-gray-400">Method:</span> {p.method}</div>
                  <div><span className="text-gray-400">Amount:</span> {p.amount_cents/100} {p.currency}</div>
                  <div><span className="text-gray-400">Proof:</span></div>
                  <div className="ml-4">
                    <FileViewer url={p.proof_url || ""} type={p.proof_url?.split('.').pop() || ""} />
                  </div>
                  <div><span className="text-gray-400">Status:</span> <span className="capitalize">{p.status}</span></div>
                </div>
                <div className="border-t border-white/10 my-4" />
                <label className="text-white font-semibold mb-2 block">Approve with plan</label>
                <select className="select select-bordered w-full bg-white/5 text-white mb-3" value={selectedPlan} onChange={(e)=>setSelectedPlan(e.target.value)}>
                  <option value="plus">Plus ($9/month)</option>
                  <option value="premium">Premium ($19/month)</option>
                  <option value="special">Special ($29/month)</option>
                </select>
                <label className="text-white font-semibold mb-2 block">Admin note</label>
                <textarea className="textarea textarea-bordered w-full bg-white/5 text-white" rows={3} value={reviewNote} onChange={(e)=>setReviewNote(e.target.value)} placeholder="Optional note..." />
                <div className="flex gap-2 mt-4">
                  <button className="btn btn-success" onClick={()=>approvePayment(p)}>Approve & Upgrade</button>
                  <button className="btn btn-error" onClick={()=>rejectPayment(p)}>Reject</button>
                </div>
              </>
            );})()}
          </div>
        </div>
      )}
    </div>
  );
}


