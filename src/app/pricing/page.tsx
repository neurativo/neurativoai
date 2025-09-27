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
        <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Pricing</h1>
                <p className="text-gray-300 mb-12">Choose the plan that fits your learning.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Free */}
                    <div className="feature-card relative transition-transform duration-200 hover:scale-[1.02]">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-white/10 border border-white/20 px-2 py-1 rounded-full">Starter</div>
                        <h3 className="text-2xl font-semibold text-white mb-1">Free</h3>
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300 mb-2">$0</div>
                        <p className="text-gray-300 mb-4">Basics to get going (fair use caps).</p>
                        <ul className="text-left text-gray-300 space-y-3 mb-6">
                            <li className="flex items-start gap-2"><i className="fas fa-check text-purple-300 mt-1"/><span>20 quiz generations / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-link text-purple-300 mt-1"/><span>5 URL quizzes / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-file-text text-purple-300 mt-1"/><span>10 text quizzes / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-file-pdf text-purple-300 mt-1"/><span>5 document quizzes / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-sun text-purple-300 mt-1"/><span>Daily cap: 5 quizzes/day</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-check text-purple-300 mt-1"/><span>Up to 8 questions per quiz</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-check text-purple-300 mt-1"/><span>AI explanations</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-envelope text-purple-300 mt-1"/><span>Email support</span></li>
                        </ul>
                        <Link href="/quiz" className="cta-button w-full">Start Free</Link>
                    </div>
                    {/* Plus */}
                    <div className={`feature-card relative border-purple-400/40 transition-transform duration-200 hover:scale-[1.03] ${currentPlan === 'plus' ? 'ring-2 ring-purple-400/50' : ''}`}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-gradient-to-r from-purple-600/40 to-blue-600/40 border border-purple-400/60 px-2 py-1 rounded-full">Recommended</div>
                        <h3 className="text-2xl font-semibold text-white mb-1">Plus</h3>
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300 mb-2">$9</div>
                        <p className="text-gray-300 mb-1">More power for regular learners.</p>
                        <div className="text-xs text-gray-400 mb-4">Up to 300 quizzes/month</div>
                        <ul className="text-left text-gray-300 space-y-3 mb-6">
                            <li className="flex items-start gap-2"><i className="fas fa-check text-purple-300 mt-1"/><span>100 quiz generations / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-link text-purple-300 mt-1"/><span>50 URL quizzes / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-file-text text-purple-300 mt-1"/><span>80 text quizzes / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-file-pdf text-purple-300 mt-1"/><span>30 document quizzes / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-sun text-purple-300 mt-1"/><span>Daily cap: 20 quizzes/day</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-check text-purple-300 mt-1"/><span>Up to 15 questions per quiz</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-wand-magic-sparkles text-purple-300 mt-1"/><span>AI explanations & hints</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-bolt text-purple-300 mt-1"/><span>Priority generation</span></li>
                        </ul>
                        {currentPlan === 'plus' ? (
                          <button className="btn btn-outline w-full rounded-full" disabled>Current plan</button>
                        ) : !userId ? (
                          <Link href="/signup" className="btn w-full rounded-full bg-white/10 border border-white/20 text-white">Sign in to upgrade</Link>
                        ) : pendingPlans.has('plus') ? (
                          <button className="btn w-full rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-200" disabled>In verification…</button>
                        ) : (
                          <Link href="/pricing/upgrade?plan=plus" className="cta-button w-full">Upgrade</Link>
                        )}
                    </div>
                    {/* Premium */}
                    <div className={`feature-card relative transition-transform duration-200 hover:scale-[1.03] ${currentPlan === 'premium' ? 'ring-2 ring-blue-400/50' : ''}`}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-gradient-to-r from-blue-600/40 to-purple-600/40 border border-blue-400/60 px-2 py-1 rounded-full">Best Offer</div>
                        <h3 className="text-2xl font-semibold text-white mb-1">Premium</h3>
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300 mb-2">$19</div>
                        <p className="text-gray-300 mb-1">For serious mastery.</p>
                        <div className="text-xs text-gray-400 mb-4">Up to 1000 quizzes/month</div>
                        <ul className="text-left text-gray-300 space-y-3 mb-6">
                            <li className="flex items-start gap-2"><i className="fas fa-check text-purple-300 mt-1"/><span>300 quiz generations / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-link text-purple-300 mt-1"/><span>150 URL quizzes / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-file-text text-purple-300 mt-1"/><span>250 text quizzes / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-file-pdf text-purple-300 mt-1"/><span>100 document quizzes / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-sun text-purple-300 mt-1"/><span>Daily cap: 50 quizzes/day</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-check text-purple-300 mt-1"/><span>Up to 25 questions per quiz</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-sparkles text-purple-300 mt-1"/><span>All AI features + priority</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-headset text-purple-300 mt-1"/><span>Premium support</span></li>
                        </ul>
                        {currentPlan === 'premium' ? (
                          <button className="btn btn-outline w-full rounded-full" disabled>Current plan</button>
                        ) : !userId ? (
                          <Link href="/signup" className="btn w-full rounded-full bg-white/10 border border-white/20 text-white">Sign in to upgrade</Link>
                        ) : pendingPlans.has('premium') ? (
                          <button className="btn w-full rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-200" disabled>In verification…</button>
                        ) : (
                          <Link href="/pricing/upgrade?plan=premium" className="cta-button w-full">Upgrade</Link>
                        )}
                    </div>
                    {/* Special - Live Lecture Plan */}
                    <div className={`feature-card relative transition-transform duration-200 hover:scale-[1.03] ${currentPlan === 'special' ? 'ring-2 ring-gold-400/50' : ''}`}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-gradient-to-r from-amber-600/40 to-orange-600/40 border border-amber-400/60 px-2 py-1 rounded-full">Special</div>
                        <h3 className="text-2xl font-semibold text-white mb-1">Special</h3>
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-300 mb-2">$29</div>
                        <p className="text-gray-300 mb-1">Live Lecture Assistant + Premium Features.</p>
                        <div className="text-xs text-gray-400 mb-4">Everything + Live Lecture AI</div>
                        <ul className="text-left text-gray-300 space-y-3 mb-6">
                            <li className="flex items-start gap-2"><i className="fas fa-microphone text-amber-300 mt-1"/><span><strong>Live Lecture Assistant</strong></span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-sticky-note text-amber-300 mt-1"/><span>Real-time note generation</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-layer-group text-amber-300 mt-1"/><span>Automatic flashcard creation</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-question-circle text-amber-300 mt-1"/><span>Live Q&A during lectures</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-bookmark text-amber-300 mt-1"/><span>Bookmark & highlight features</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-download text-amber-300 mt-1"/><span>Revision pack downloads</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-check text-purple-300 mt-1"/><span>500 quiz generations / month</span></li>
                            <li className="flex items-start gap-2"><i className="fas fa-crown text-purple-300 mt-1"/><span>All Premium features included</span></li>
                        </ul>
                        {currentPlan === 'special' ? (
                          <button className="btn btn-outline w-full rounded-full" disabled>Current plan</button>
                        ) : !userId ? (
                          <Link href="/signup" className="btn w-full rounded-full bg-white/10 border border-white/20 text-white">Sign in to upgrade</Link>
                        ) : pendingPlans.has('special') ? (
                          <button className="btn w-full rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-200" disabled>In verification…</button>
                        ) : (
                          <Link href="/pricing/upgrade?plan=special" className="cta-button w-full">Upgrade</Link>
                        )}
                    </div>
                </div>
                {showCongrats && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white/5 border border-white/20 rounded-2xl p-6 text-white text-center">
                      <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                      <p>Your {showCongrats} plan has been activated.</p>
                      <button className="cta-button mt-4" onClick={()=>setShowCongrats(null)}>Great</button>
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


