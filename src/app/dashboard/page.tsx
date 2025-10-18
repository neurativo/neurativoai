"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import Link from "next/link";
import EnhancedUsageTracker from "@/app/components/EnhancedUsageTracker";

type Usage = {
  plan: string;
  monthly_quiz_generations: number;
  used: number;
  daily_used: number;
  daily_limit: number;
  max_questions_per_quiz: number;
  source_usage?: {
    url: number;
    text: number;
    document: number;
  };
  source_limits?: {
    url: number;
    text: number;
    document: number;
  };
  daily_source_usage?: {
    url: number;
    text: number;
    document: number;
  };
  daily_source_limits?: {
    url: number;
    text: number;
    document: number;
  };
};

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let chan: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      setLoading(true);
      const [{ data: { user } }, { data: { session } }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession()
      ]);
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email || null);
      setUserId(user.id);
      // Get current subscription
      const subRes = await fetch(`/api/subscriptions?userId=${user.id}`);
      let subData: any = null;
      if (subRes.ok) {
        subData = await subRes.json();
        if (subData.success) {
          const planName = subData.currentPlan?.name?.toLowerCase() || 'free';
          setUsage({
            plan: planName,
            monthly_quiz_generations: subData.currentPlan?.monthly_limit || 50,
            used: 0, // TODO: Get actual usage from usage tracking
            daily_used: 0, // TODO: Get actual usage from usage tracking
            daily_limit: subData.currentPlan?.daily_limit || 3,
            max_questions_per_quiz: 10, // TODO: Get from plan features
            source_usage: undefined,
            source_limits: undefined,
            daily_source_usage: undefined,
            daily_source_limits: undefined,
          });
        }
      }

      // Also call the old usage API for compatibility
      const res = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
      const json = await res.json();
      if (json?.success && json?.data) {
        setUsage(prev => ({
          plan: prev?.plan || 'free',
          monthly_quiz_generations: prev?.monthly_quiz_generations || 50,
          used: json.data.monthly_used,
          daily_used: json.data.daily_used,
          daily_limit: prev?.daily_limit || 3,
          max_questions_per_quiz: prev?.max_questions_per_quiz || 10,
          source_usage: json.data.source_usage,
          source_limits: json.data.source_limits,
          daily_source_usage: json.data.daily_source_usage,
          daily_source_limits: json.data.daily_source_limits,
        }));
      }

      // Note: Real-time updates are now handled by EnhancedUsageTracker component

      setLoading(false);
    }
    load();
    return () => {
      if (chan) supabase.removeChannel(chan);
    };
  }, []);

  // Note: Polling and real-time updates are now handled by EnhancedUsageTracker component

  const nearingDaily = usage ? usage.daily_used >= Math.max(1, Math.floor(usage.daily_limit * 0.8)) : false;
  const nearingMonthly = usage ? usage.used >= Math.max(1, Math.floor(usage.monthly_quiz_generations * 0.8)) : false;

  if (loading) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-white">Loading...</div>;
  if (!email) return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-white">
      <p className="mb-4">You must be signed in to view your dashboard.</p>
      <button className="auth-btn" onClick={() => (window.location.href = "/")}>Go Home</button>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-gray-300">{email}</p>
        <button className="secondary-button" onClick={() => {
          const supabase = getSupabaseBrowser();
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session?.access_token) return;
            fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } })
              .then(r => r.json())
              .then(json => {
                if (json?.success && json?.data) {
                  setUsage({
                    plan: json.data.plan,
                    monthly_quiz_generations: json.data.monthly_quiz_generations,
                    used: json.data.monthly_used,
                    daily_used: json.data.daily_used,
                    daily_limit: json.data.daily_limit,
                    max_questions_per_quiz: json.data.max_questions_per_quiz,
                  });
                }
              });
          });
        }}>Refresh</button>
      </div>

      {(nearingDaily || nearingMonthly) && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 rounded-xl p-3">
          {nearingDaily && (<div>Heads up: You are approaching your daily limit ({usage?.daily_used}/{usage?.daily_limit}).</div>)}
          {nearingMonthly && (<div>Heads up: You are approaching your monthly limit ({usage?.used}/{usage?.monthly_quiz_generations}).</div>)}
        </div>
      )}

      {/* Enhanced Usage Tracker */}
      {userId && (
        <div className="mb-8">
          <EnhancedUsageTracker 
            userId={userId} 
            onUsageUpdate={(updatedUsage) => {
              setUsage({
                plan: updatedUsage.plan,
                monthly_quiz_generations: updatedUsage.monthly_quiz_generations,
                used: updatedUsage.used,
                daily_used: updatedUsage.daily_used,
                daily_limit: updatedUsage.daily_limit,
                max_questions_per_quiz: updatedUsage.max_questions_per_quiz,
                source_usage: updatedUsage.source_usage,
                source_limits: updatedUsage.source_limits,
                daily_source_usage: updatedUsage.daily_source_usage,
                daily_source_limits: updatedUsage.daily_source_limits,
              });
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="feature-card text-left">
          <h2 className="text-xl font-semibold mb-2">Quick actions</h2>
          <div className="flex gap-3 mt-3">
            <Link href="/quiz" className="cta-button">Create quiz</Link>
            <Link href="/pricing" className="secondary-button">Upgrade</Link>
          </div>
        </div>
        <div className="feature-card text-left">
          <h2 className="text-xl font-semibold mb-2">Account</h2>
          <ul className="space-y-2 text-gray-300">
            <li><Link href="/profile" className="footer-link">Edit profile</Link></li>
            <li><Link href="/settings" className="footer-link">Settings</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}


