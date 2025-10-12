"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";

// Copy to clipboard component
function CopyableText({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div 
      onClick={handleCopy}
      className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all cursor-pointer group"
    >
      <div className="flex-1">
        <span className="text-gray-400 text-sm">{label}:</span>
        <span className="text-white ml-2 font-mono">{text}</span>
      </div>
      <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <span className="text-green-400 text-sm flex items-center gap-1">
            <i className="fas fa-check text-xs"></i>
            Copied!
          </span>
        ) : (
          <span className="text-purple-400 text-sm flex items-center gap-1">
            <i className="fas fa-copy text-xs"></i>
            Click to copy
          </span>
        )}
      </div>
    </div>
  );
}

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
    
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) { 
      setMessage("Please sign in first."); 
      setSubmitting(false); 
      return; 
    }
    
    const amount_cents = plan === "premium" ? 1900 : plan === "special" ? 2900 : 900;
    
    // Try upload proof if provided
    let proof_url: string | null = null;
    try {
      if (file) {
        const path = `${uid}/${Date.now()}_${file.name}`;
        
        const { data: up, error: upErr } = await supabase.storage.from("payments").upload(path, file, { upsert: false });
        
        if (upErr) {
          setMessage(`File upload failed: ${upErr.message}`);
          setSubmitting(false);
          return;
        }
        
        if (up) {
          const { data: pub } = supabase.storage.from("payments").getPublicUrl(up.path);
          proof_url = pub.publicUrl ?? null;
        }
      }
    } catch (error) {
      setMessage(`File upload failed: ${error}`);
      setSubmitting(false);
      return;
    }

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
    
    if (error) {
      setMessage(error.message);
    } else {
      // Redirect to pricing to reflect pending state and show banner
      router.push(`/pricing?submitted=1&plan=${plan}`);
      return;
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Upgrade - {
        plan === "premium" ? "Mastery" : 
        plan === "special" ? "Innovation" : 
        "Professional"
      }</h1>

      <div className="card bg-white/5 backdrop-blur-xl border border-white/20">
        <div className="card-body space-y-4">
          <p className="text-gray-300">Complete your upgrade by sending payment to one of the methods below. After payment, upload your proof; our team will verify and activate your plan.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="feature-card text-left">
              <h2 className="text-xl font-semibold mb-4">Bank Transfer (Sri Lanka)</h2>
              <div className="space-y-3">
                <CopyableText text="106257813546" label="Account No" />
                <CopyableText text="H.A.S.S.K WICKRAMASINGHE" label="Account Name" />
                <CopyableText text="Sampath Bank" label="Bank" />
                <CopyableText text="Ampara" label="Branch" />
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <i className="fas fa-info-circle mr-2"></i>
                    Reference: {email ?? 'Your Email'}
                  </p>
                </div>
              </div>
            </div>
            <div className="feature-card text-left">
              <h2 className="text-xl font-semibold mb-4">Binance USDT (TRC20)</h2>
              <div className="space-y-3">
                <CopyableText text="743547396" label="Binance ID" />
                <CopyableText text="Hidden123" label="Name" />
                <CopyableText text="USDT" label="Currency" />
                <CopyableText text="TRC20" label="Network" />
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-sm">
                    <i className="fas fa-info-circle mr-2"></i>
                    Memo/Reference: {email ?? 'Your Email'}
                  </p>
                </div>
                <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Important: Make sure to use TRC20 network only. Other networks may result in loss of funds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="divider opacity-20"></div>

          <div className="space-y-3">
            <label className="text-white font-semibold mb-2 block">Upload Payment Proof (image/pdf)</label>
            <input 
              type="file" 
              accept="image/*,.pdf" 
              className="file-input file-input-bordered w-full bg-white/5 text-white" 
              onChange={(e)=>setFile(e.target.files?.[0] ?? null)} 
            />
            {file && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">
                  <i className="fas fa-check-circle mr-2"></i>
                  File selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
            <label className="text-white font-semibold mb-2 block">Notes</label>
            <textarea className="textarea textarea-bordered w-full bg-white/5 text-white placeholder-gray-400" placeholder="Optional notes" value={notes} onChange={(e)=>setNotes(e.target.value)}></textarea>
            {message && <div className="alert bg-white/10 border border-white/20 text-white">{message}</div>}
            <button type="button" className="cta-button w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit for Verification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


