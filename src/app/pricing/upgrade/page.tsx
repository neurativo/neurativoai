"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { PRICING_CONFIG } from "@/lib/usage-limits";
import { getPricingInCurrency } from "@/lib/currency";
import PaymentSubmission from "@/app/components/PaymentSubmission";

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
            // Redirect back to pricing if parameters are missing
            router.push('/pricing');
            return;
        }

        if (!['monthly', 'yearly'].includes(billingParam)) {
            router.push('/pricing');
            return;
        }

        setPlan(planParam);
        setBilling(billingParam as 'monthly' | 'yearly');

        // Fetch pricing data
        const fetchPricing = async () => {
            try {
                const pricingData = await getPricingInCurrency(planParam, 'USD');
                setPricing(pricingData);
            } catch (error) {
                console.error('Error fetching pricing:', error);
            }
        };

        fetchPricing();
    }, [searchParams, router]);

    const handlePaymentSuccess = () => {
        // Redirect back to pricing page with success message
        router.push('/pricing?submitted=true&plan=' + plan);
    };

    const handlePaymentCancel = () => {
        // Redirect back to pricing page
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

    if (!plan || !billing) {
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

    return (
        <PaymentSubmission
            plan={plan}
            billing={billing}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
        />
    );
}