"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { useSearchParams } from "next/navigation";

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

    useEffect(() => {
        let sub: any;
        (async () => {
            const { data } = await supabase.auth.getUser();
            const uid = data.user?.id ?? null;
            setUserId(uid);
            if (!uid) return;

            // Fetch current subscription
            const { data: subRow } = await supabase.from("subscriptions").select("plan").eq("user_id", uid).maybeSingle();
            setCurrentPlan(subRow?.plan ?? null);

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
    return (
        <section className="py-24 bg-gradient-to-b from-black/20 to-black/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-16 sm:mb-20">
                    <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 mb-6 sm:mb-8">
                        <i className="fas fa-crown mr-2 sm:mr-3 text-lg sm:text-xl"></i>
                        Choose Your Learning Journey
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8">
                        Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Pricing</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-12">
                        Start free and upgrade as you grow. All plans include our core AI features with no hidden fees.
                    </p>
                    
                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
                        <span className="text-base sm:text-lg text-gray-300">Monthly</span>
                        <div className="relative">
                            <div className="w-14 h-7 sm:w-16 sm:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-1 cursor-pointer">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300"></div>
                            </div>
                        </div>
                        <span className="text-base sm:text-lg text-gray-300">Yearly</span>
                        <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-green-500/20 text-green-300 text-xs sm:text-sm rounded-full border border-green-500/30">
                            <i className="fas fa-gift mr-1"></i>
                            Save 20%
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {/* Free Plan */}
                    <div className="group relative">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-white/10 hover:border-gray-400/50 transition-all duration-500 hover:transform hover:scale-105 h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-600/5 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="text-center mb-6 sm:mb-8">
                                    <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30 mb-4 sm:mb-6">
                                        <i className="fas fa-seedling mr-1.5 sm:mr-2"></i>
                                        Foundation
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Essential</h3>
                                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-400 mb-2">$0</div>
                                    <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6">Perfect for getting started</p>
                                </div>
                                
                                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-check text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">20 quiz generations / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-link text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">5 URL quizzes / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-file-text text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">10 text quizzes / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-file-pdf text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">5 document quizzes / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-sun text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Daily cap: 5 quizzes/day</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-question text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Up to 8 questions per quiz</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-brain text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">AI explanations</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-envelope text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Email support</span>
                                    </li>
                                </ul>
                                
                                <Link href="/quiz" className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center group">
                                    <i className="fas fa-rocket mr-2 group-hover:animate-bounce"></i>
                                    Start Free
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* Plus Plan */}
                    <div className={`group relative ${currentPlan === 'plus' ? 'ring-2 ring-purple-400/50' : ''}`}>
                        <div className="bg-white/5 backdrop-blur-sm border border-purple-400/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-white/10 hover:border-purple-400/60 transition-all duration-500 hover:transform hover:scale-105 h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 mb-6">
                                        <i className="fas fa-star mr-2"></i>
                                        Most Popular
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-4">Professional</h3>
                                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-2">$9</div>
                                    <p className="text-lg text-gray-300 mb-2">Perfect for professionals and students</p>
                                    <div className="text-sm text-purple-300 font-medium">Up to 300 quizzes/month</div>
                                </div>
                                
                                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-check text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">100 quiz generations / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-link text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">50 URL quizzes / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-file-text text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">80 text quizzes / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-file-pdf text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">30 document quizzes / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-sun text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Daily cap: 20 quizzes/day</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-question text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Up to 15 questions per quiz</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-wand-magic-sparkles text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">AI explanations & hints</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-bolt text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Priority generation</span>
                                    </li>
                                </ul>
                                
                                {currentPlan === 'plus' ? (
                                    <button className="w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-2 border-purple-400/50 text-purple-300 font-bold py-4 px-6 rounded-2xl cursor-not-allowed flex items-center justify-center">
                                        <i className="fas fa-check mr-2"></i>
                                        Current Plan
                                    </button>
                                ) : !userId ? (
                                    <Link href="/signup" className="w-full bg-white/10 border-2 border-white/20 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center hover:bg-white/20">
                                        <i className="fas fa-sign-in-alt mr-2"></i>
                                        Sign in to upgrade
                                    </Link>
                                ) : pendingPlans.has('plus') ? (
                                    <button className="w-full bg-yellow-500/20 border-2 border-yellow-500/40 text-yellow-200 font-bold py-4 px-6 rounded-2xl cursor-not-allowed flex items-center justify-center">
                                        <i className="fas fa-clock mr-2 animate-spin"></i>
                                        In verification…
                                    </button>
                                ) : (
                                    <Link href="/pricing/upgrade?plan=plus" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center group">
                                        <i className="fas fa-arrow-up mr-2 group-hover:animate-bounce"></i>
                                        Upgrade Now
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Premium Plan */}
                    <div className={`group relative ${currentPlan === 'premium' ? 'ring-2 ring-blue-400/50' : ''}`}>
                        <div className="bg-white/5 backdrop-blur-sm border border-blue-400/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-white/10 hover:border-blue-400/60 transition-all duration-500 hover:transform hover:scale-105 h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 mb-6">
                                        <i className="fas fa-crown mr-2"></i>
                                        Advanced
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-4">Mastery</h3>
                                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-2">$19</div>
                                    <p className="text-lg text-gray-300 mb-2">For advanced learners and educators</p>
                                    <div className="text-sm text-blue-300 font-medium">Up to 1000 quizzes/month</div>
                                </div>
                                
                                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-check text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">300 quiz generations / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-link text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">150 URL quizzes / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-file-text text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">250 text quizzes / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-file-pdf text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">100 document quizzes / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-sun text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Daily cap: 50 quizzes/day</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-question text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Up to 25 questions per quiz</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-sparkles text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">All AI features + priority</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-headset text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Premium support</span>
                                    </li>
                                </ul>
                                
                                {currentPlan === 'premium' ? (
                                    <button className="w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-400/50 text-blue-300 font-bold py-4 px-6 rounded-2xl cursor-not-allowed flex items-center justify-center">
                                        <i className="fas fa-check mr-2"></i>
                                        Current Plan
                                    </button>
                                ) : !userId ? (
                                    <Link href="/signup" className="w-full bg-white/10 border-2 border-white/20 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center hover:bg-white/20">
                                        <i className="fas fa-sign-in-alt mr-2"></i>
                                        Sign in to upgrade
                                    </Link>
                                ) : pendingPlans.has('premium') ? (
                                    <button className="w-full bg-yellow-500/20 border-2 border-yellow-500/40 text-yellow-200 font-bold py-4 px-6 rounded-2xl cursor-not-allowed flex items-center justify-center">
                                        <i className="fas fa-clock mr-2 animate-spin"></i>
                                        In verification…
                                    </button>
                                ) : (
                                    <Link href="/pricing/upgrade?plan=premium" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center group">
                                        <i className="fas fa-crown mr-2 group-hover:animate-pulse"></i>
                                        Go Mastery
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Special Plan - Live Lecture Assistant */}
                    <div className={`group relative ${currentPlan === 'special' ? 'ring-2 ring-amber-400/50' : ''}`}>
                        <div className="bg-white/5 backdrop-blur-sm border border-amber-400/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-white/10 hover:border-amber-400/60 transition-all duration-500 hover:transform hover:scale-105 h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 mb-6">
                                        <i className="fas fa-rocket mr-2"></i>
                                        Ultimate
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-4">Innovation</h3>
                                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300 mb-2">$29</div>
                                    <p className="text-lg text-gray-300 mb-2">Revolutionary AI-powered learning experience</p>
                                    <div className="text-sm text-amber-300 font-medium">Everything + Live Lecture AI</div>
                                </div>
                                
                                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-microphone text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300 font-semibold">Live Lecture Assistant</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-sticky-note text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Real-time note generation</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-layer-group text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Automatic flashcard creation</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-question-circle text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Live Q&A during lectures</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-bookmark text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Bookmark & highlight features</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-download text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">Revision pack downloads</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-check text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">500 quiz generations / month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fas fa-crown text-white text-xs"></i>
                                        </div>
                                        <span className="text-gray-300">All Premium features included</span>
                                    </li>
                                </ul>
                                
                                {currentPlan === 'special' ? (
                                    <button className="w-full bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-2 border-amber-400/50 text-amber-300 font-bold py-4 px-6 rounded-2xl cursor-not-allowed flex items-center justify-center">
                                        <i className="fas fa-check mr-2"></i>
                                        Current Plan
                                    </button>
                                ) : !userId ? (
                                    <Link href="/signup" className="w-full bg-white/10 border-2 border-white/20 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center hover:bg-white/20">
                                        <i className="fas fa-sign-in-alt mr-2"></i>
                                        Sign in to upgrade
                                    </Link>
                                ) : pendingPlans.has('special') ? (
                                    <button className="w-full bg-yellow-500/20 border-2 border-yellow-500/40 text-yellow-200 font-bold py-4 px-6 rounded-2xl cursor-not-allowed flex items-center justify-center">
                                        <i className="fas fa-clock mr-2 animate-spin"></i>
                                        In verification…
                                    </button>
                                ) : (
                                    <Link href="/pricing/upgrade?plan=special" className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center group">
                                        <i className="fas fa-rocket mr-2 group-hover:animate-pulse"></i>
                                        Go Innovation
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final CTA */}
                <div className="mt-16 sm:mt-24 text-center">
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-white/10">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                            Ready to Transform Your Learning?
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                            Join thousands of learners who are already experiencing the future of education with AI-powered learning.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/quiz" className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-base sm:text-lg rounded-2xl hover:from-purple-500 hover:to-blue-500 transition-all duration-300 group">
                                <i className="fas fa-rocket mr-3 group-hover:animate-bounce"></i>
                                Start Learning Free
                            </Link>
                            <Link href="/signup" className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white/10 border-2 border-white/20 text-white font-bold text-base sm:text-lg rounded-2xl hover:bg-white/20 transition-all duration-300">
                                <i className="fas fa-user-plus mr-3"></i>
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>

                {showCongrats && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-white text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-check text-2xl text-white"></i>
                      </div>
                      <h3 className="text-3xl font-bold mb-4">Congratulations!</h3>
                      <p className="text-lg text-gray-300 mb-6">Your {showCongrats} plan has been activated successfully.</p>
                      <button 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300"
                        onClick={()=>setShowCongrats(null)}
                      >
                        <i className="fas fa-thumbs-up mr-2"></i>
                        Awesome!
                      </button>
                    </div>
                  </div>
                )}
            </div>
            {sp.get('submitted') && (
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 border border-white/20 text-white rounded-full px-4 py-2 z-[90]">
                Payment submitted for verification.
              </div>
            )}
        </section>
    );
}


