"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">Loading…</div>}>
      <UpgradePageInner />
    </Suspense>
  );
}

function UpgradePageInner() {
  const supabase = getSupabaseBrowser();
  const params = useSearchParams();
  const router = useRouter();
  const plan = (params.get("plan") ?? "plus").toLowerCase();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  async function handleSubmit() {
    setSubmitting(true);
    setMessage(null);
    // Optionally upload proof to storage in future; for now store without proof
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) { setMessage("Please sign in first."); setSubmitting(false); return; }
    const amount_cents = plan === "premium" ? 1900 : 900;
    // Try upload proof if provided
    let proof_url: string | null = null;
    try {
      if (file) {
        const path = `${uid}/${Date.now()}_${file.name}`;
        const { data: up, error: upErr } = await supabase.storage.from("payments").upload(path, file, { upsert: false });
        if (!upErr && up) {
          const { data: pub } = supabase.storage.from("payments").getPublicUrl(up.path);
          proof_url = pub.publicUrl ?? null;
        }
      }
    } catch { /* ignore */ }

    const { error } = await supabase.from("payments").insert({
      user_id: uid,
      plan,
      method: file ? "proof_upload" : "manual",
      amount_cents,
      currency: "USD",
      proof_url,
      status: "pending",
      admin_note: notes || null,
    });
    if (error) setMessage(error.message); else {
      // Redirect to pricing to reflect pending state and show banner
      router.push(`/pricing?submitted=1&plan=${plan}`);
      return;
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Upgrade - {plan === "premium" ? "Premium" : "Plus"}</h1>

      <div className="card bg-white/5 backdrop-blur-xl border border-white/20">
        <div className="card-body space-y-4">
          <p className="text-gray-300">Complete your upgrade by sending payment to one of the methods below. After payment, upload your proof; our team will verify and activate your plan.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="feature-card text-left">
              <h2 className="text-xl font-semibold mb-2">Bank Transfer (Sri Lanka)</h2>
              <ul className="text-gray-300 space-y-1">
                <li>• Account Name: Neurativo (Pvt) Ltd</li>
                <li>• Bank: ABC Bank</li>
                <li>• Branch: Colombo</li>
                <li>• Account No: 123456789</li>
                <li>• Reference: {email ?? 'Your Email'}</li>
              </ul>
            </div>
            <div className="feature-card text-left">
              <h2 className="text-xl font-semibold mb-2">Binance USDT (TRC20)</h2>
              <ul className="text-gray-300 space-y-1">
                <li>• Recipient: neurativo@payments</li>
                <li>• Network: TRC20</li>
                <li>• Memo: {email ?? 'Your Email'}</li>
              </ul>
            </div>
          </div>

          <div className="divider opacity-20"></div>

          <div className="space-y-3">
            <label className="text-white font-semibold mb-2 block">Upload Payment Proof (image/pdf)</label>
            <input type="file" accept="image/*,.pdf" className="file-input file-input-bordered w-full bg-white/5 text-white" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
            <label className="text-white font-semibold mb-2 block">Notes</label>
            <textarea className="textarea textarea-bordered w-full bg-white/5 text-white placeholder-gray-400" placeholder="Optional notes" value={notes} onChange={(e)=>setNotes(e.target.value)}></textarea>
            {message && <div className="alert bg-white/10 border border-white/20 text-white">{message}</div>}
            <button type="button" className="cta-button w-full" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit for Verification'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}


