"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import Link from "next/link";
import EnhancedUsageTracker from "@/app/components/EnhancedUsageTracker";
import NotificationCenter from "@/app/components/NotificationCenter";

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

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
          setCurrentPlan(planName);
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
      
      // Fetch notifications
      const notifRes = await fetch('/api/user/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.success) {
          const unreadCount = notifData.notifications.filter((n: any) => !n.read).length;
          setUnreadNotifications(unreadCount);
        }
      }

      // Also call the old usage API for compatibility
      const res = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
      const json = await res.json();
      if (json?.success && json?.data) {
        setUsage(prev => ({
          plan: prev?.plan || 'free', // Keep the plan from subscription API
          monthly_quiz_generations: prev?.monthly_quiz_generations || 50, // Keep from subscription API
          used: json.data.monthly_used,
          daily_used: json.data.daily_used,
          daily_limit: prev?.daily_limit || 3, // Keep from subscription API
          max_questions_per_quiz: prev?.max_questions_per_quiz || 10, // Keep from subscription API
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
    <div className="min-h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 text-white">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <p className="text-gray-300 text-sm sm:text-base truncate">{email}</p>
            {currentPlan && (
              <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full w-fit ${
                currentPlan === 'free' ? 'bg-gray-600 text-white' :
                currentPlan === 'professional' ? 'bg-blue-600 text-white' :
                currentPlan === 'mastery' ? 'bg-purple-600 text-white' :
                currentPlan === 'innovation' ? 'bg-yellow-600 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {currentPlan.toUpperCase()} PLAN
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-200 group"
            title="Notifications"
          >
            <svg 
              className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {(nearingDaily || nearingMonthly) && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 rounded-xl p-3 sm:p-4">
          {nearingDaily && (
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Heads up: You are approaching your daily limit ({usage?.daily_used}/{usage?.daily_limit}).
            </div>
          )}
          {nearingMonthly && (
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Heads up: You are approaching your monthly limit ({usage?.used}/{usage?.monthly_quiz_generations}).
            </div>
          )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 hover:border-white/20 transition-all duration-200">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link 
              href="/quiz" 
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 text-center text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Create Quiz
            </Link>
            <Link 
              href="/pricing" 
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 text-center text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Upgrade Plan
            </Link>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 hover:border-white/20 transition-all duration-200">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">Account</h2>
          <ul className="space-y-2 sm:space-y-3">
            <li>
              <Link 
                href="/profile" 
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit Profile
              </Link>
            </li>
            <li>
              <Link 
                href="/settings" 
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}


