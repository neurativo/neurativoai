"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import { PRICING_CONFIG, USAGE_LIMITS } from "@/lib/usage-limits";
import { CurrencyConverter, getPricingInCurrency, CURRENCIES } from "@/lib/currency";
import CurrencySelector from "@/app/components/CurrencySelector";
import PricingDisplay from "@/app/components/PricingDisplay";

export default function PricingPage() {
    return (
        <Suspense fallback={<section className="py-20 text-center text-white">Loading…</section>}>
            <PricingPageInner />
        </Suspense>
    );
}

function PricingPageInner() {
    const supabase = getSupabaseBrowser();
    const sp = useSearchParams();
    const [userId, setUserId] = useState<string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);
    const [pendingPlans, setPendingPlans] = useState<Set<string>>(new Set());
    const [showCongrats, setShowCongrats] = useState<string | null>(null);
    const [usageStats, setUsageStats] = useState<any>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
    const [pricingData, setPricingData] = useState<any>({});
    const [isYearly, setIsYearly] = useState(false);

    useEffect(() => {
        let sub: any;
        (async () => {
            const { data } = await supabase.auth.getUser();
            const uid = data.user?.id ?? null;
            setUserId(uid);
            if (!uid) return;

            // Fetch current subscription from both subscriptions and profiles tables
            const { data: subRow } = await supabase.from("subscriptions").select("plan").eq("user_id", uid).maybeSingle();
            const { data: profileRow } = await supabase.from("profiles").select("plan").eq("id", uid).maybeSingle();
            
            // Use subscription plan if available, otherwise fall back to profile plan
            const userPlan = subRow?.plan || profileRow?.plan || 'free';
            setCurrentPlan(userPlan);

            // Fetch usage stats
            try {
                const response = await fetch(`/api/user/usage-limits?userId=${uid}`);
                if (response.ok) {
                    const data = await response.json();
                    setUsageStats(data);
                }
            } catch (error) {
                console.error('Error fetching usage stats:', error);
            }

            // Auto-detect user currency
            const detectedCurrency = CurrencyConverter.detectUserCurrency();
            setSelectedCurrency(detectedCurrency);

            // Fetch pending payments
            const { data: pays } = await supabase.from("payments").select("plan,status").eq("user_id", uid).eq("status", "pending");
            setPendingPlans(new Set((pays ?? []).map(p => p.plan)));

            // Realtime on subscriptions -> show congrats when plan changes
            sub = supabase
              .channel("pricing_subscriptions")
              .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${uid}` }, (payload: any) => {
                const newPlan = (payload.new?.plan || payload.record?.plan) as string | undefined;
                if (newPlan && newPlan !== currentPlan) {
                    setCurrentPlan(newPlan);
                    setPendingPlans(new Set());
                    setShowCongrats(newPlan);
                }
              })
              .subscribe();
        })();
        // Banner on redirect
        const submitted = sp.get('submitted');
        const sPlan = sp.get('plan');
        if (submitted && sPlan) {
          setPendingPlans(prev => new Set([...Array.from(prev), sPlan]));
        }
        return () => { if (sub) supabase.removeChannel(sub); };
    }, [supabase, sp]);

    // Calculate pricing when currency changes
    useEffect(() => {
        const calculatePricing = async () => {
            const pricing: any = {};
            for (const plan of Object.keys(PRICING_CONFIG)) {
                try {
                    pricing[plan] = await getPricingInCurrency(plan, selectedCurrency);
                } catch (error) {
                    console.error(`Error calculating pricing for ${plan}:`, error);
                }
            }
            setPricingData(pricing);
        };
        
        if (selectedCurrency) {
            calculatePricing();
        }
    }, [selectedCurrency]);

    return (
        <section className="py-24 bg-gradient-to-b from-black/20 to-black/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-16 sm:mb-20">
                    <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 mb-6 sm:mb-8">
                        <i className="fas fa-crown mr-2 sm:mr-3 text-lg sm:text-xl"></i>
                        Choose Your Learning Journey
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8">
                        Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Pricing</span>
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed mb-8 sm:mb-12">
                        Start free and upgrade as you grow. All plans include our core AI features with no hidden fees.
                    </p>
                    
                    
                    {/* Current Usage Display */}
                    {usageStats && (
                        <div className="max-w-5xl mx-auto mb-12">
                            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 shadow-2xl">
                                <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Current Usage</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-400">{usageStats.usage?.dailyQuizzes || 0}</div>
                                        <div className="text-gray-300">Quizzes Today</div>
                                        <div className="text-sm text-gray-400">
                                            {usageStats.remaining?.dailyQuizzes === -1 ? 'Unlimited' : `${usageStats.remaining?.dailyQuizzes || 0} remaining`}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-400">{usageStats.usage?.monthlyQuizzes || 0}</div>
                                        <div className="text-gray-300">Quizzes This Month</div>
                                        <div className="text-sm text-gray-400">
                                            {usageStats.remaining?.monthlyQuizzes === -1 ? 'Unlimited' : `${usageStats.remaining?.monthlyQuizzes || 0} remaining`}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-green-400 capitalize">{usageStats.user?.plan || 'free'}</div>
                                        <div className="text-gray-300">Current Plan</div>
                                        <div className="text-sm text-gray-400">
                                            {usageStats.limits?.quizTypes?.length || 0} quiz types available
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
                        <span className={`text-base sm:text-lg transition-colors ${!isYearly ? 'text-white' : 'text-gray-300'}`}>
                            Monthly
                        </span>
                        <div className="relative">
                            <button
                                onClick={() => setIsYearly(!isYearly)}
                                className={`w-14 h-7 sm:w-16 sm:h-8 rounded-full p-1 cursor-pointer transition-all duration-300 ${
                                    isYearly 
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                                        : 'bg-gray-600'
                                }`}
                            >
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                                    isYearly ? 'translate-x-7 sm:translate-x-8' : 'translate-x-0'
                                }`}></div>
                            </button>
                        </div>
                        <span className={`text-base sm:text-lg transition-colors ${isYearly ? 'text-white' : 'text-gray-300'}`}>
                            Yearly
                        </span>
                        <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-green-500/20 text-green-300 text-xs sm:text-sm rounded-full border border-green-500/30">
                            <i className="fas fa-gift mr-1"></i>
                            Save 20%
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
                    {Object.keys(PRICING_CONFIG).map((plan) => {
                        const pricing = pricingData[plan];
                        if (!pricing) return null;
                        
                        return (
                            <PricingDisplay
                                key={plan}
                                pricing={pricing}
                                isYearly={isYearly}
                                isPopular={plan === 'professional'}
                                isCurrentPlan={currentPlan === plan}
                                isPending={pendingPlans.has(plan)}
                                onUpgrade={(plan) => {
                                    // Handle upgrade logic
                                    console.log('Upgrade to:', plan);
                                }}
                            />
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="mt-24 text-center">
                    <h2 className="text-3xl font-bold text-white mb-12">Frequently Asked Questions</h2>
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                            <h3 className="text-xl font-semibold text-white mb-3">How does the currency conversion work?</h3>
                            <p className="text-gray-300">We use real-time exchange rates to convert our USD pricing to your local currency. Rates are updated daily and you can switch currencies anytime.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                            <h3 className="text-xl font-semibold text-white mb-3">Can I change my plan anytime?</h3>
                            <p className="text-gray-300">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any billing differences.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                            <h3 className="text-xl font-semibold text-white mb-3">What happens if I exceed my limits?</h3>
                            <p className="text-gray-300">We'll notify you when you're approaching your limits. You can upgrade your plan or wait for your usage to reset the next day/month.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Floating Currency Selector */}
            <div className="fixed top-20 right-4 z-50">
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10 shadow-2xl">
                    <div className="text-xs text-gray-300 mb-2 text-center font-medium">
                        Currency
                    </div>
                    <CurrencySelector
                        selectedCurrency={selectedCurrency}
                        onCurrencyChange={setSelectedCurrency}
                    />
                </div>
            </div>
        </section>
    );
}