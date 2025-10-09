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
          source_usage: json.data.source_usage,
          source_limits: json.data.source_limits,
          daily_source_usage: json.data.daily_source_usage,
          daily_source_limits: json.data.daily_source_limits,
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

    let timer: NodeJS.Timeout | null = null;

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
    timer = setInterval(refreshUsage, 5000);

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

      {/* Source-specific usage */}
      {usage?.source_usage && usage?.source_limits && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Source-Specific Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* URL Quizzes */}
            <div className="feature-card">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-link text-blue-400"></i>
                <span className="font-semibold">URL Quizzes</span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {usage.source_usage.url}/{usage.source_limits.url}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (usage.source_usage.url / usage.source_limits.url) * 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {usage.daily_source_usage?.url || 0}/{usage.daily_source_limits?.url || 5} today
              </div>
            </div>

            {/* Text Quizzes */}
            <div className="feature-card">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-file-text text-green-400"></i>
                <span className="font-semibold">Text Quizzes</span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {usage.source_usage.text}/{usage.source_limits.text}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (usage.source_usage.text / usage.source_limits.text) * 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {usage.daily_source_usage?.text || 0}/{usage.daily_source_limits?.text || 5} today
              </div>
            </div>

            {/* Document Quizzes */}
            <div className="feature-card">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-file-pdf text-purple-400"></i>
                <span className="font-semibold">Document Quizzes</span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {usage.source_usage.document}/{usage.source_limits.document}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (usage.source_usage.document / usage.source_limits.document) * 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {usage.daily_source_usage?.document || 0}/{usage.daily_source_limits?.document || 5} today
              </div>
            </div>
          </div>
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


