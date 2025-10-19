"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import { PRICING_CONFIG, USAGE_LIMITS } from "@/lib/usage-limits";
import { CurrencyConverter, getPricingInCurrency, CURRENCIES } from "@/lib/currency";
import CurrencySelector from "@/app/components/CurrencySelector";
import PricingDisplay from "@/app/components/PricingDisplay";
import PlanUpgrade from "@/app/components/PlanUpgrade";
import RealtimePlanUpdater from "@/app/components/RealtimePlanUpdater";

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

            // Fetch current subscription from new user_subscriptions table
            try {
                const response = await fetch(`/api/subscriptions?userId=${uid}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const planName = data.currentPlan?.name?.toLowerCase() || 'free';
                        setCurrentPlan(planName);
                    } else {
                        setCurrentPlan('free');
                    }
                } else {
                    setCurrentPlan('free');
                }
            } catch (error) {
                console.error('Error fetching subscription:', error);
                setCurrentPlan('free');
            }


            // Auto-detect user currency
            const detectedCurrency = CurrencyConverter.detectUserCurrency();
            setSelectedCurrency(detectedCurrency);

            // Fetch pending payments from new user_payments table
            const { data: pendingPayments, error: pendingError } = await supabase
                .from('user_payments')
                .select(`
                    status,
                    subscription_plans!inner(name)
                `)
                .eq('user_id', uid)
                .eq('status', 'pending');

            if (pendingPayments) {
                console.log('Pending payments from user_payments:', pendingPayments);
                const pendingPlans = new Set(pendingPayments.map(p => {
                    const plan = Array.isArray(p.subscription_plans) ? p.subscription_plans[0] : p.subscription_plans;
                    const planName = plan?.name?.toLowerCase() || 'unknown';
                    console.log('Mapped plan name:', planName, 'from plan object:', plan);
                    return planName;
                }));
                console.log('Final pending plans set:', Array.from(pendingPlans));
                setPendingPlans(pendingPlans);
            } else {
                console.log('No pending payments from user_payments, trying old table...');
                // Fallback to old payments table if new table doesn't exist
                const { data: pays } = await supabase.from("payments").select("plan,status").eq("user_id", uid).eq("status", "pending");
                console.log('Pending payments from old payments table:', pays);
                setPendingPlans(new Set((pays ?? []).map(p => p.plan)));
            }

            // Note: Realtime updates are now handled by RealtimePlanUpdater component
        })();
        // Banner on redirect from upgrade page
        const submitted = sp.get('submitted');
        const sPlan = sp.get('plan');
        if (submitted && sPlan) {
          setPendingPlans(prev => new Set([...Array.from(prev), sPlan]));
        }
        return () => { if (sub) supabase.removeChannel(sub); };
    }, [supabase, sp]);

    // Periodic refresh as fallback for real-time updates
    useEffect(() => {
        if (!userId) return;

        const interval = setInterval(() => {
            refreshPlan();
        }, 10000); // Check every 10 seconds for faster updates

        return () => clearInterval(interval);
    }, [userId]);

    // Additional immediate refresh when component mounts
    useEffect(() => {
        if (userId) {
            refreshPlan();
        }
    }, [userId]);

    // Force refresh when page becomes visible (user comes back to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && userId) {
                refreshPlan();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [userId]);

    // Calculate pricing when currency changes
    useEffect(() => {
        const calculatePricing = async () => {
            try {
                // Fetch plans from database
                const response = await fetch('/api/subscription-plans');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const pricing: any = {};
                        for (const plan of data.plans) {
                            const planKey = plan.name.toLowerCase();
                            if (selectedCurrency === 'LKR') {
                                pricing[planKey] = {
                                    plan: planKey,
                                    monthlyPrice: plan.monthly_price * 300, // Approximate LKR conversion
                                    yearlyPrice: plan.yearly_price * 300,
                                    monthlyPriceFormatted: `LKR ${Math.round(plan.monthly_price * 300)}`,
                                    yearlyPriceFormatted: `LKR ${Math.round(plan.yearly_price * 300)}`,
                                    currency: 'LKR'
                                };
                            } else {
                                pricing[planKey] = {
                                    plan: planKey,
                                    monthlyPrice: plan.monthly_price,
                                    yearlyPrice: plan.yearly_price,
                                    monthlyPriceFormatted: `$${plan.monthly_price}`,
                                    yearlyPriceFormatted: `$${plan.yearly_price}`,
                                    currency: 'USD'
                                };
                            }
                        }
                        setPricingData(pricing);
                        return;
                    }
                }
                
                // Fallback to old method
                const pricing: any = {};
                for (const plan of Object.keys(PRICING_CONFIG)) {
                    try {
                        const planPricing = await getPricingInCurrency(plan, selectedCurrency);
                        pricing[plan] = {
                            ...planPricing,
                            plan: plan
                        };
                    } catch (error) {
                        console.error(`Error calculating pricing for ${plan}:`, error);
                        // Add fallback pricing structure
                        pricing[plan] = {
                            plan: plan,
                            monthlyPrice: 0,
                            yearlyPrice: 0,
                            monthlyPriceFormatted: '$0',
                            yearlyPriceFormatted: '$0',
                            currency: selectedCurrency
                        };
                    }
                }
                setPricingData(pricing);
            } catch (error) {
                console.error('Error fetching plans:', error);
            }
        };
        
        if (selectedCurrency) {
            calculatePricing();
        }
    }, [selectedCurrency]);

    const handleUpgrade = (plan: string, billing: 'monthly' | 'yearly') => {
        // Redirect to upgrade page with parameters
        window.location.href = `/pricing/upgrade?plan=${plan}&billing=${billing}`;
    };

    const handlePlanUpdate = (newPlan: string) => {
        setCurrentPlan(newPlan);
        setPendingPlans(new Set()); // Clear all pending plans when plan is updated
        
    };

    // Manual refresh function
    const refreshPlan = async () => {
        if (!userId) return;
        
        try {
            // Fetch current subscription from new API
            const response = await fetch(`/api/subscriptions?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const planName = data.currentPlan?.name?.toLowerCase() || 'free';
                    setCurrentPlan(planName);
                    setPendingPlans(new Set());
                    
                    return;
                }
            }

            // Fallback to free plan
            setCurrentPlan('free');
            setPendingPlans(new Set());

            // Also refresh pending payments from new table
            const supabase = getSupabaseBrowser();
            const { data: pendingPayments, error: pendingError } = await supabase
                .from('user_payments')
                .select(`
                    status,
                    subscription_plans!inner(name)
                `)
                .eq('user_id', userId)
                .eq('status', 'pending');

            if (pendingPayments) {
                console.log('Refresh: Pending payments from user_payments:', pendingPayments);
                const pendingPlans = new Set(pendingPayments.map(p => {
                    const plan = Array.isArray(p.subscription_plans) ? p.subscription_plans[0] : p.subscription_plans;
                    const planName = plan?.name?.toLowerCase() || 'unknown';
                    console.log('Refresh: Mapped plan name:', planName, 'from plan object:', plan);
                    return planName;
                }));
                console.log('Refresh: Final pending plans set:', Array.from(pendingPlans));
                setPendingPlans(pendingPlans);
            } else {
                console.log('Refresh: No pending payments found');
                setPendingPlans(new Set());
            }
        } catch (error) {
            console.error('Refresh error:', error);
        }
    };


    return (
        <RealtimePlanUpdater userId={userId || ''} onPlanUpdate={handlePlanUpdate}>
            <section className="py-24 bg-gradient-to-b from-black/20 to-black/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="text-center mb-12 sm:mb-16 md:mb-20">
                    <div className="inline-flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full text-xs sm:text-sm md:text-lg font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 mb-4 sm:mb-6 md:mb-8">
                        <i className="fas fa-crown mr-1.5 sm:mr-2 md:mr-3 text-sm sm:text-lg md:text-xl"></i>
                        <span className="hidden xs:inline">Choose Your Learning Journey</span>
                        <span className="xs:hidden">Learning Plans</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                            Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Pricing</span>
                        </h1>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed mb-8 sm:mb-12">
                        Start free and upgrade as you grow. All plans include our core AI features with no hidden fees.
                    </p>
                    
                    {/* Success Message */}
                    {sp.get('submitted') && sp.get('plan') && (
                        <div className="max-w-2xl mx-auto mb-8">
                            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
                                <div className="text-4xl mb-3">✅</div>
                                <h3 className="text-xl font-semibold text-green-300 mb-2">Payment Submitted Successfully!</h3>
                                <p className="text-green-200">
                                    Your payment for <span className="font-semibold">{sp.get('plan')}</span> plan has been submitted for review. 
                                    You'll receive an email confirmation once approved.
                                </p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {Object.keys(pricingData).map((plan) => {
                        const pricing = pricingData[plan];
                        if (!pricing || !pricing.plan) return null;
                        
                        return (
                            <PricingDisplay
                                key={plan}
                                pricing={pricing}
                                isYearly={isYearly}
                                isPopular={plan === 'professional'}
                                isCurrentPlan={currentPlan === plan}
                                isPending={pendingPlans.has(plan)}
                                onUpgrade={(plan) => handleUpgrade(plan, isYearly ? 'yearly' : 'monthly')}
                            />
                        );
                    })}
                </div>


            </div>
            
            {/* Floating Currency Selector */}
            <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-50">
                <div className="bg-black/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10 shadow-2xl">
                    <div className="text-xs text-gray-300 mb-1 sm:mb-2 text-center font-medium">
                        Currency
                    </div>
                    <CurrencySelector
                        selectedCurrency={selectedCurrency}
                        onCurrencyChange={setSelectedCurrency}
                    />
                </div>
            </div>
        </section>
        </RealtimePlanUpdater>
    );
}