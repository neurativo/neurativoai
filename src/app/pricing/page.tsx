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
import PaymentSubmission from "@/app/components/PaymentSubmission";
import RealtimePlanUpdater from "@/app/components/RealtimePlanUpdater";
import UsageTracker from "@/app/components/UsageTracker";

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
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        let sub: any;
        (async () => {
            const { data } = await supabase.auth.getUser();
            const uid = data.user?.id ?? null;
            setUserId(uid);
            if (!uid) return;

            // Fetch current subscription from both subscriptions and profiles tables
            const { data: subRow } = await supabase.from("subscriptions").select("plan").eq("user_id", uid).maybeSingle();
            
            // Try to fetch from profiles table, but handle RLS errors gracefully
            let profileRow: { plan: string } | null = null;
            try {
                const { data: profileData } = await supabase.from("profiles").select("plan").eq("id", uid).maybeSingle();
                profileRow = profileData;
            } catch (error) {
                console.warn('Could not fetch profile data:', error);
                // Continue without profile data
            }
            
            // Use subscription plan if available, otherwise fall back to profile plan
            let userPlan = subRow?.plan || profileRow?.plan || 'free';
            
            // Map old plan names to new plan structure
            const planMapping: Record<string, string> = {
                'special': 'innovation', // Map special plan to innovation plan
                'premium': 'professional', // Map premium to professional if it exists
                'basic': 'free', // Map basic to free if it exists
            };
            
            userPlan = planMapping[userPlan] || userPlan;
            setCurrentPlan(userPlan);

            // Fetch usage stats
            try {
                const response = await fetch(`/api/user/usage-limits?userId=${uid}`);
                if (response.ok) {
                    const data = await response.json();
                    setUsageStats(data);
                } else {
                    console.warn('Usage stats API returned:', response.status, response.statusText);
                    // Set default usage stats if API fails
                    setUsageStats({
                        user: { id: uid, plan: userPlan, pricing: {} },
                        usage: { dailyQuizzes: 0, monthlyQuizzes: 0, dailyFileUploads: 0, monthlyFileUploads: 0 },
                        limits: { dailyQuizzes: 3, monthlyQuizzes: 50, maxFileUploads: 5, quizTypes: ['mcq', 'true_false'], maxQuestionsPerQuiz: 10, maxQuizDuration: 30 },
                        remaining: { dailyQuizzes: 3, monthlyQuizzes: 50, fileUploads: 5 },
                        features: { canAccessLectures: false, canAccessStudyPacks: false, canExportData: false, canUseAdvancedFeatures: false, canCreateCustomQuizzes: false, canAccessAnalytics: false, canUseAIFeatures: true, canAccessPrioritySupport: false }
                    });
                }
            } catch (error) {
                console.error('Error fetching usage stats:', error);
                // Set default usage stats if API fails
                setUsageStats({
                    user: { id: uid, plan: userPlan, pricing: {} },
                    usage: { dailyQuizzes: 0, monthlyQuizzes: 0, dailyFileUploads: 0, monthlyFileUploads: 0 },
                    limits: { dailyQuizzes: 3, monthlyQuizzes: 50, maxFileUploads: 5, quizTypes: ['mcq', 'true_false'], maxQuestionsPerQuiz: 10, maxQuizDuration: 30 },
                    remaining: { dailyQuizzes: 3, monthlyQuizzes: 50, fileUploads: 5 },
                    features: { canAccessLectures: false, canAccessStudyPacks: false, canExportData: false, canUseAdvancedFeatures: false, canCreateCustomQuizzes: false, canAccessAnalytics: false, canUseAIFeatures: true, canAccessPrioritySupport: false }
                });
            }

            // Auto-detect user currency
            const detectedCurrency = CurrencyConverter.detectUserCurrency();
            setSelectedCurrency(detectedCurrency);

            // Fetch pending payments
            const { data: pays } = await supabase.from("payments").select("plan,status").eq("user_id", uid).eq("status", "pending");
            setPendingPlans(new Set((pays ?? []).map(p => p.plan)));

            // Note: Realtime updates are now handled by RealtimePlanUpdater component
        })();
        // Banner on redirect
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
            console.log('Periodic refresh: Checking plan status...');
            refreshPlan();
        }, 10000); // Check every 10 seconds for faster updates

        return () => clearInterval(interval);
    }, [userId]);

    // Additional immediate refresh when component mounts
    useEffect(() => {
        if (userId) {
            console.log('Component mounted, doing immediate plan refresh...');
            refreshPlan();
        }
    }, [userId]);

    // Force refresh when page becomes visible (user comes back to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && userId) {
                console.log('Page became visible, refreshing plan...');
                refreshPlan();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [userId]);

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

    const handleUpgrade = (plan: string, billing: 'monthly' | 'yearly') => {
        setSelectedPlan(plan);
        setSelectedBilling(billing);
        setShowPaymentForm(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentForm(false);
        setSelectedPlan('');
        setSelectedBilling('monthly');
        // Add the submitted plan to pending plans
        if (selectedPlan) {
            setPendingPlans(prev => new Set([...Array.from(prev), selectedPlan]));
        }
        // Plan will be updated via realtime updates when admin approves
    };

    const handlePaymentCancel = () => {
        setShowPaymentForm(false);
        setSelectedPlan('');
        setSelectedBilling('monthly');
    };

    const handlePlanUpdate = (newPlan: string) => {
        console.log('Plan updated via RealtimePlanUpdater:', newPlan);
        console.log('Previous plan:', currentPlan);
        console.log('Previous pending plans:', Array.from(pendingPlans));
        
        setCurrentPlan(newPlan);
        setPendingPlans(new Set()); // Clear all pending plans when plan is updated
        
        // Refresh usage stats when plan changes
        if (userId) {
            fetch(`/api/user/usage-limits?userId=${userId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        setUsageStats(data);
                        console.log('Usage stats refreshed after plan update');
                    }
                })
                .catch(error => console.error('Error refreshing usage stats:', error));
        }
    };

    // Manual refresh function for debugging
    const refreshPlan = async () => {
        if (!userId) return;
        
        console.log('Manual refresh: Starting plan refresh for user:', userId);
        
        try {
            const supabase = getSupabaseBrowser();
            
            // Check subscriptions table
            const { data: subscription, error: subError } = await supabase
                .from('subscriptions')
                .select('plan')
                .eq('user_id', userId)
                .eq('status', 'active')
                .maybeSingle();

            if (subError) {
                console.error('Manual refresh: Subscription error:', subError);
            }

            if (subscription?.plan) {
                console.log('Manual refresh: Found subscription plan:', subscription.plan);
                setCurrentPlan(subscription.plan);
                setPendingPlans(new Set());
                return;
            }

            // Check profiles table
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) {
                console.error('Manual refresh: Profile error:', profileError);
            }

            if (profile?.plan) {
                console.log('Manual refresh: Found profile plan:', profile.plan);
                setCurrentPlan(profile.plan);
                setPendingPlans(new Set());
            } else {
                console.log('Manual refresh: No plan found, keeping current plan:', currentPlan);
            }

            // Also refresh pending payments
            const { data: pendingPayments } = await supabase
                .from('payments')
                .select('plan')
                .eq('user_id', userId)
                .eq('status', 'pending');

            if (pendingPayments) {
                const pendingPlans = new Set(pendingPayments.map(p => p.plan));
                console.log('Manual refresh: Pending plans:', Array.from(pendingPlans));
                setPendingPlans(pendingPlans);
            }
        } catch (error) {
            console.error('Manual refresh error:', error);
        }
    };

    if (showPaymentForm) {
        return (
            <PaymentSubmission
                plan={selectedPlan}
                billing={selectedBilling}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
            />
        );
    }

    return (
        <RealtimePlanUpdater userId={userId || ''} onPlanUpdate={handlePlanUpdate}>
            <section className="py-24 bg-gradient-to-b from-black/20 to-black/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="text-center mb-16 sm:mb-20">
                    <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 mb-6 sm:mb-8">
                        <i className="fas fa-crown mr-2 sm:mr-3 text-lg sm:text-xl"></i>
                        Choose Your Learning Journey
                    </div>
                    <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                            Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Pricing</span>
                        </h1>
                        {userId && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={refreshPlan}
                                    className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all text-sm"
                                    title="Refresh plan status"
                                >
                                    🔄 Refresh
                                </button>
                                <div className="text-xs text-gray-400">
                                    Current: {currentPlan} | Pending: {Array.from(pendingPlans).join(', ') || 'None'}
                                </div>
                                <div className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                                    Debug Mode
                                </div>
                            </div>
                        )}
                    </div>
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
                                onUpgrade={(plan) => handleUpgrade(plan, isYearly ? 'yearly' : 'monthly')}
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

                {/* Usage Tracker for logged in users */}
                {userId && (
                    <div className="mt-16">
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Usage</h2>
                            <UsageTracker
                                userId={userId}
                                onUsageUpdate={(usage) => {
                                    console.log('Usage updated:', usage);
                                }}
                            />
                        </div>
                    </div>
                )}
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
        </RealtimePlanUpdater>
    );
}