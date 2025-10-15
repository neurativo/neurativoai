"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { CurrencyConverter, getPricingInCurrency } from "@/lib/currency";
import { PRICING_CONFIG } from "@/lib/usage-limits";

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
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">Loading…</div>}>
      <UpgradePageInner />
    </Suspense>
  );
}

function UpgradePageInner() {
  const supabase = getSupabaseBrowser();
  const params = useSearchParams();
  const router = useRouter();
  const plan = (params.get("plan") ?? "professional").toLowerCase();
  const billing = (params.get("billing") ?? "monthly").toLowerCase();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'binance'>('bank');
  const [pricing, setPricing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        // Determine currency based on payment method
        const currency = paymentMethod === 'bank' ? 'LKR' : 'USD';
        const pricingData = await getPricingInCurrency(plan, currency);
        setPricing(pricingData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading pricing:', error);
        // Fallback to basic pricing without currency conversion
        const planConfig = PRICING_CONFIG[plan];
        if (planConfig) {
          const fallbackCurrency = paymentMethod === 'bank' ? 'LKR' : 'USD';
          const fallbackPricing = {
            plan: planConfig.plan,
            monthlyPrice: paymentMethod === 'bank' ? planConfig.monthlyPrice * 320 : planConfig.monthlyPrice, // Rough LKR conversion
            yearlyPrice: paymentMethod === 'bank' ? planConfig.yearlyPrice * 320 : planConfig.yearlyPrice,
            monthlyPriceUSD: planConfig.monthlyPrice,
            yearlyPriceUSD: planConfig.yearlyPrice,
            currency: fallbackCurrency,
            monthlyPriceFormatted: paymentMethod === 'bank' ? `Rs ${(planConfig.monthlyPrice * 320).toFixed(0)}` : `$${planConfig.monthlyPrice.toFixed(2)}`,
            yearlyPriceFormatted: paymentMethod === 'bank' ? `Rs ${(planConfig.yearlyPrice * 320).toFixed(0)}` : `$${planConfig.yearlyPrice.toFixed(2)}`,
            savings: planConfig.yearlyPrice - (planConfig.monthlyPrice * 12),
            savingsFormatted: paymentMethod === 'bank' ? `Rs ${((planConfig.yearlyPrice - (planConfig.monthlyPrice * 12)) * 320).toFixed(0)}` : `$${(planConfig.yearlyPrice - (planConfig.monthlyPrice * 12)).toFixed(2)}`
          };
          setPricing(fallbackPricing);
        }
        setIsLoading(false);
      }
    };

    loadPricing();
  }, [plan, paymentMethod]);

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
    
    if (!pricing) {
      setMessage("Pricing information not loaded. Please try again.");
      setSubmitting(false);
      return;
    }
    
    const amount_cents = Math.round((paymentMethod === 'bank' ? pricing.monthlyPrice : pricing.monthlyPriceUSD) * 100);
    
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
      currency: paymentMethod === 'bank' ? 'LKR' : 'USD',
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

  const planConfig = PRICING_CONFIG[plan];
  const planName = planConfig?.plan || plan.charAt(0).toUpperCase() + plan.slice(1);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading pricing information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Upgrade to {planName}</h1>
        <p className="text-gray-300 text-lg">Complete your upgrade by selecting a payment method and sending payment</p>
      </div>

      {/* Plan Summary */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{planName} Plan</h2>
            <p className="text-gray-300">Billing: {billing === 'yearly' ? 'Annual' : 'Monthly'}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-400">
              {pricing ? (
                paymentMethod === 'bank' 
                  ? `Rs ${pricing.monthlyPrice.toFixed(0)}`
                  : `$${pricing.monthlyPriceUSD.toFixed(2)}`
              ) : 'Loading...'}
            </div>
            <div className="text-sm text-gray-400">
              {billing === 'yearly' ? 'per year' : 'per month'}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
        <h3 className="text-xl font-semibold mb-4">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod('bank')}
            className={`p-4 rounded-lg border transition-all ${
              paymentMethod === 'bank'
                ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                : 'border-white/20 bg-white/5 text-white hover:border-blue-400/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-university text-2xl"></i>
              <div className="text-left">
                <div className="font-semibold">Bank Transfer</div>
                <div className="text-sm opacity-75">Sri Lankan Rupees (LKR)</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setPaymentMethod('binance')}
            className={`p-4 rounded-lg border transition-all ${
              paymentMethod === 'binance'
                ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                : 'border-white/20 bg-white/5 text-white hover:border-yellow-400/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <i className="fab fa-bitcoin text-2xl"></i>
              <div className="text-left">
                <div className="font-semibold">Binance USDT</div>
                <div className="text-sm opacity-75">US Dollar (USD)</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
        <h3 className="text-xl font-semibold mb-4">
          Payment Details - {paymentMethod === 'bank' ? 'Bank Transfer (Sri Lanka)' : 'Binance USDT (TRC20)'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentMethod === 'bank' ? (
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
          ) : (
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
          )}
          
          {/* Price Display */}
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-purple-500/30">
            <h4 className="text-lg font-semibold mb-4">Payment Amount</h4>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {pricing ? (
                  paymentMethod === 'bank' 
                    ? `Rs ${pricing.monthlyPrice.toFixed(0)}`
                    : `$${pricing.monthlyPriceUSD.toFixed(2)}`
                ) : 'Loading...'}
              </div>
              <div className="text-sm text-gray-300">
                {billing === 'yearly' ? 'per year' : 'per month'}
              </div>
              {billing === 'yearly' && pricing && (
                <div className="text-sm text-green-400 mt-2">
                  Save {pricing.savingsFormatted} vs monthly billing
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Proof Upload */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
        <h3 className="text-xl font-semibold mb-4">Upload Payment Proof</h3>
        <div className="space-y-4">
          <div>
            <label className="text-white font-medium mb-2 block">Payment Proof (image/pdf)</label>
            <input 
              type="file" 
              accept="image/*,.pdf" 
              className="file-input file-input-bordered w-full bg-white/5 text-white border-white/20" 
              onChange={(e)=>setFile(e.target.files?.[0] ?? null)} 
            />
            {file && (
              <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">
                  <i className="fas fa-check-circle mr-2"></i>
                  File selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>
          
          <div>
            <label className="text-white font-medium mb-2 block">Additional Notes (Optional)</label>
            <textarea 
              className="textarea textarea-bordered w-full bg-white/5 text-white placeholder-gray-400 border-white/20" 
              placeholder="Any additional information about your payment..." 
              value={notes} 
              onChange={(e)=>setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          {message && (
            <div className="alert bg-red-500/10 border border-red-500/30 text-red-300">
              <i className="fas fa-exclamation-circle"></i>
              {message}
            </div>
          )}
          
          <button 
            type="button" 
            className="btn btn-primary w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105" 
            onClick={handleSubmit} 
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </span>
            ) : (
              'Submit for Verification'
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-300 mb-3">
          <i className="fas fa-info-circle mr-2"></i>
          Next Steps
        </h4>
        <ol className="text-gray-300 space-y-2 list-decimal list-inside">
          <li>Send the exact amount shown above to the payment details</li>
          <li>Use your email as the reference/memo</li>
          <li>Upload a screenshot or receipt of your payment</li>
          <li>Our team will verify and activate your plan within 24 hours</li>
          <li>You'll receive an email confirmation once approved</li>
        </ol>
      </div>
    </div>
  );
}