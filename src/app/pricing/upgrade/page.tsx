"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { PRICING_CONFIG } from "@/lib/usage-limits";
import { getPricingInCurrency } from "@/lib/currency";

export default function UpgradePage() {
    return (
        <Suspense fallback={<section className="py-20 text-center text-white">Loading…</section>}>
            <UpgradePageInner />
        </Suspense>
    );
}

function UpgradePageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<string>('');
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
    const [pricing, setPricing] = useState<any>(null);
    const [lkrPricing, setLkrPricing] = useState<any>(null);
    const [selectedMethod, setSelectedMethod] = useState<'bank' | 'binance'>('bank');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [bankData, setBankData] = useState({
        transactionId: '',
        notes: ''
    });

    const [binanceData, setBinanceData] = useState({
        transactionId: '',
        notes: ''
    });

    const [proofFile, setProofFile] = useState<File | null>(null);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const supabase = getSupabaseBrowser();
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
            setLoading(false);
        };
        getUser();
    }, []);

    useEffect(() => {
        const planParam = searchParams.get('plan');
        const billingParam = searchParams.get('billing');

        if (!planParam || !billingParam) {
            router.push('/pricing');
            return;
        }

        if (!['monthly', 'yearly'].includes(billingParam)) {
            router.push('/pricing');
            return;
        }

        setPlan(planParam);
        setBilling(billingParam as 'monthly' | 'yearly');

        // Fetch pricing data from database
        const fetchPricing = async () => {
            try {
                const response = await fetch('/api/subscription-plans');
                if (response.ok) {
                    const data = await response.json();
                    const planData = data.plans.find((p: any) => p.name.toLowerCase() === planParam.toLowerCase());
                    if (planData) {
                        // Convert to expected format
                        const pricingDataUSD = {
                            monthlyPrice: planData.monthly_price,
                            yearlyPrice: planData.yearly_price
                        };
                        const pricingDataLKR = {
                            monthlyPrice: planData.monthly_price * 300, // Approximate LKR conversion
                            yearlyPrice: planData.yearly_price * 300
                        };
                        setPricing(pricingDataUSD);
                        setLkrPricing(pricingDataLKR);
                    }
                } else {
                    // Fallback to old method
                    const pricingDataUSD = await getPricingInCurrency(planParam, 'USD');
                    const pricingDataLKR = await getPricingInCurrency(planParam, 'LKR');
                    setPricing(pricingDataUSD);
                    setLkrPricing(pricingDataLKR);
                }
            } catch (error) {
                console.error('Error fetching pricing:', error);
            }
        };

        fetchPricing();
    }, [searchParams, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setError('File must be an image (JPEG, PNG, GIF) or PDF');
                return;
            }
            setProofFile(file);
            setError(null);
        }
    };

    const handleCopyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyFeedback(`${label} copied to clipboard!`);
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            setCopyFeedback('Failed to copy. Please select and copy manually.');
            setTimeout(() => setCopyFeedback(null), 3000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setSubmitting(true);
        setError(null);

        try {
            // Upload proof file if provided
            let proofUrl: string | null = null;
            if (proofFile) {
                try {
                    const supabase = getSupabaseBrowser();
                    const fileExt = proofFile.name.split('.').pop();
                    const fileName = `${userId}/${Date.now()}.${fileExt}`;
                    
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('payments')
                        .upload(fileName, proofFile);

                    if (uploadError) {
                        console.warn('File upload failed:', uploadError);
                        // Continue without proof - don't fail the entire payment
                    } else {
                        const { data: { publicUrl } } = supabase.storage
                            .from('payments')
                            .getPublicUrl(fileName);
                        proofUrl = publicUrl;
                    }
                } catch (uploadErr) {
                    console.warn('File upload error:', uploadErr);
                    // Continue without proof
                }
            }

            // Prepare payment data
            const paymentData = selectedMethod === 'bank' ? bankData : binanceData;
            const currentPricing = selectedMethod === 'bank' ? lkrPricing : pricing;
            const rawPrice = billing === 'yearly' ? currentPricing.yearlyPrice : currentPricing.monthlyPrice;
            const price = Math.round(rawPrice * 100) / 100; // Round to 2 decimal places
            const currency = selectedMethod === 'bank' ? 'LKR' : 'USD';

            // Get auth token
            const supabase = getSupabaseBrowser();
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session?.access_token) {
                throw new Error('Authentication required. Please sign in again.');
            }

            // Submit payment
            const response = await fetch('/api/payments/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    plan,
                    billing,
                    amount: price,
                    currency: currency,
                    paymentMethod: selectedMethod,
                    transactionId: paymentData.transactionId,
                    notes: paymentData.notes,
                    proofUrl
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Payment submission failed');
            }

            // Redirect back to pricing page with success message
            router.push('/pricing?submitted=true&plan=' + plan);

        } catch (err) {
            console.error('Payment submission error:', err);
            setError(err instanceof Error ? err.message : 'Payment submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentCancel = () => {
        router.push('/pricing');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <div className="text-white text-xl">Loading...</div>
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
                    <p className="text-gray-300 mb-6">Please sign in to upgrade your plan.</p>
                    <button
                        onClick={() => router.push('/pricing')}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
                    >
                        Back to Pricing
                    </button>
                </div>
            </div>
        );
    }

    if (!plan || !billing || !pricing || !lkrPricing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Invalid Parameters</h1>
                    <p className="text-gray-300 mb-6">Please select a plan from the pricing page.</p>
                    <button
                        onClick={() => router.push('/pricing')}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
                    >
                        Back to Pricing
                    </button>
                </div>
            </div>
        );
    }

    const currentPricing = selectedMethod === 'bank' ? lkrPricing : pricing;
    const rawPrice = billing === 'yearly' ? currentPricing.yearlyPrice : currentPricing.monthlyPrice;
    const price = Math.round(rawPrice * 100) / 100; // Round to 2 decimal places
    const currency = selectedMethod === 'bank' ? 'LKR' : 'USD';
    
    // Format price for display
    const formatPrice = (price: number, currency: string) => {
        if (currency === 'LKR') {
            return price.toLocaleString('en-LK', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
        } else {
            return price.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }
    };
    
    const formattedPrice = formatPrice(price, currency);

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
                {/* Copy Feedback Toast */}
                {copyFeedback && (
                    <div className="fixed top-4 right-4 z-50 bg-green-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-green-500/30 animate-pulse">
                        {copyFeedback}
                    </div>
                )}
                
                <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                        Complete Your Upgrade
                    </h1>
                    <p className="text-gray-300">
                        Upgrade to <span className="font-semibold text-purple-300">{plan}</span> plan
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Plan Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-semibold text-white mb-4">Plan Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-300">Plan:</span>
                                <span className="text-white font-semibold capitalize">{plan}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Billing:</span>
                                <span className="text-white font-semibold capitalize">{billing}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Amount:</span>
                                <span className="text-white font-semibold text-lg">
                                    {currency} {formattedPrice}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-lg font-semibold text-white mb-3">Features Included:</h4>
                            <ul className="space-y-2">
                                {PRICING_CONFIG[plan]?.features?.map((feature: string, index: number) => (
                                    <li key={index} className="flex items-center text-gray-300">
                                        <span className="text-green-400 mr-2">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-6">
                        {/* Payment Method Selection */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                            <h3 className="text-xl font-semibold text-white mb-4">Choose Payment Method</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => setSelectedMethod('bank')}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        selectedMethod === 'bank'
                                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                            : 'border-gray-600 bg-gray-600/20 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">🏦</div>
                                        <div className="font-semibold">Bank Transfer</div>
                                        <div className="text-sm opacity-75">Direct bank transfer</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('binance')}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        selectedMethod === 'binance'
                                            ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                                            : 'border-gray-600 bg-gray-600/20 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">₿</div>
                                        <div className="font-semibold">Binance</div>
                                        <div className="text-sm opacity-75">Cryptocurrency</div>
                                    </div>
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                                    <p className="text-red-300 text-sm">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Bank Details Form */}
                                {selectedMethod === 'bank' && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-white">Bank Transfer Payment</h4>
                                        
                                        {/* Your Bank Details */}
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                            <h5 className="text-blue-300 font-semibold mb-3">Send Payment To:</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Account Name:</span>
                                                    <span 
                                                        className="text-white font-mono cursor-pointer hover:text-blue-300 transition-colors select-all"
                                                        onClick={() => handleCopyToClipboard('H.A.S.S.K WICKRAMASINGHE', 'Account Name')}
                                                        title="Click to copy"
                                                    >
                                                        H.A.S.S.K WICKRAMASINGHE
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Account Number:</span>
                                                    <span 
                                                        className="text-white font-mono cursor-pointer hover:text-blue-300 transition-colors select-all"
                                                        onClick={() => handleCopyToClipboard('106257813546', 'Account Number')}
                                                        title="Click to copy"
                                                    >
                                                        106257813546
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Bank Name:</span>
                                                    <span 
                                                        className="text-white font-mono cursor-pointer hover:text-blue-300 transition-colors select-all"
                                                        onClick={() => handleCopyToClipboard('Sampath Bank', 'Bank Name')}
                                                        title="Click to copy"
                                                    >
                                                        Sampath Bank
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Branch:</span>
                                                    <span 
                                                        className="text-white font-mono cursor-pointer hover:text-blue-300 transition-colors select-all"
                                                        onClick={() => handleCopyToClipboard('Ampara', 'Branch')}
                                                        title="Click to copy"
                                                    >
                                                        Ampara
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Amount:</span>
                                                    <span className="text-green-400 font-semibold">{currency} {formattedPrice}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Your Transaction Reference *
                                            </label>
                                            <input
                                                type="text"
                                                value={bankData.transactionId}
                                                onChange={(e) => setBankData({...bankData, transactionId: e.target.value})}
                                                placeholder="Enter your bank transaction reference"
                                                required
                                                className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Binance Details Form */}
                                {selectedMethod === 'binance' && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-white">Binance Payment</h4>
                                        
                                        {/* Your Binance Details */}
                                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                            <h5 className="text-yellow-300 font-semibold mb-3">Send Payment To:</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Binance ID:</span>
                                                    <span className="text-white font-mono">neurativo_ai_learning</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Amount:</span>
                                                    <span className="text-green-400 font-semibold">{currency} {formattedPrice}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-2">
                                                    Send USDT or USDC to the above Binance ID
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Your Transaction Hash *
                                            </label>
                                            <input
                                                type="text"
                                                value={binanceData.transactionId}
                                                onChange={(e) => setBinanceData({...binanceData, transactionId: e.target.value})}
                                                placeholder="Enter your Binance transaction hash"
                                                required
                                                className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Common Fields */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Payment Receipt *
                                    </label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                        required
                                        className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Upload receipt, screenshot, or proof of payment (max 10MB) - Required for verification
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        value={selectedMethod === 'bank' ? bankData.notes : binanceData.notes}
                                        onChange={(e) => {
                                            if (selectedMethod === 'bank') {
                                                setBankData({...bankData, notes: e.target.value});
                                            } else {
                                                setBinanceData({...binanceData, notes: e.target.value});
                                            }
                                        }}
                                        placeholder="Any additional information..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handlePaymentCancel}
                                        className="flex-1 px-6 py-3 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}