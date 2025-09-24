"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import Link from "next/link";

type Usage = {
  plan: string;
  monthly_quiz_generations: number;
  used: number;
  daily_used: number;
  daily_limit: number;
  max_questions_per_quiz: number;
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
      const { data: { user, session } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email);
      setUserId(user.id);
      // Call server API with service role to avoid PostgREST 400s
      const res = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
      const json = await res.json();
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

      // Realtime updates for usage counters
      chan = supabase
        .channel("dashboard_usage")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usage_counters', filter: `user_id=eq.${user.id}` }, (payload: any) => {
          const row = (payload.new || payload.record) as { counter_type?: string; count?: number; date?: string };
          if (!row?.counter_type) return;
          setUsage(prev => {
            if (!prev) return prev;
            if (row.counter_type === 'daily_quiz_generations') {
              return { ...prev, daily_used: row.count ?? prev.daily_used };
            }
            if (row.counter_type === 'monthly_quiz_generations') {
              return { ...prev, used: row.count ?? prev.used };
            }
            return prev;
          });
        })
        .subscribe();

      setLoading(false);
    }
    load();
    return () => {
      if (chan) supabase.removeChannel(chan);
    };
  }, []);

  // Polling fallback to keep usage fresh even if realtime misses an event
  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowser();

    let timer: NodeJS.Timer | null = null;

    async function refreshUsage() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
        const json = await res.json();
        if (json?.success && json?.data) {
          setUsage(prev => ({
            plan: json.data.plan,
            monthly_quiz_generations: json.data.monthly_quiz_generations,
            used: json.data.monthly_used,
            daily_used: json.data.daily_used,
            daily_limit: json.data.daily_limit,
            max_questions_per_quiz: json.data.max_questions_per_quiz,
          }));
        }
      } catch { /* ignore */ }
    }

    // Initial refresh, then interval
    refreshUsage();
    timer = setInterval(refreshUsage, 10000);

    // Refresh when tab becomes visible
    const onVis = () => { if (document.visibilityState === 'visible') refreshUsage(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [userId]);

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
      <p className="text-gray-300 mb-4">{email}</p>

      {(nearingDaily || nearingMonthly) && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 rounded-xl p-3">
          {nearingDaily && (<div>Heads up: You are approaching your daily limit ({usage?.daily_used}/{usage?.daily_limit}).</div>)}
          {nearingMonthly && (<div>Heads up: You are approaching your monthly limit ({usage?.used}/{usage?.monthly_quiz_generations}).</div>)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-number">{usage?.plan?.toUpperCase()}</div>
          <div className="stat-label">Current Plan</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{usage?.used}/{usage?.monthly_quiz_generations}</div>
          <div className="stat-label">Quizzes this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{usage?.daily_used}/{usage?.daily_limit}</div>
          <div className="stat-label">Quizzes today</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{usage?.max_questions_per_quiz}</div>
          <div className="stat-label">Max questions/quiz</div>
        </div>
      </div>

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


