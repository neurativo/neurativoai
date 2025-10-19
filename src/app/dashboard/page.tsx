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
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-gray-300 hover:text-white transition-colors"
            title="Notifications"
          >
            <span className="text-lg sm:text-xl">🔔</span>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>
          
          <button 
            className="px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 text-sm sm:text-base whitespace-nowrap" 
            onClick={() => {
              const supabase = getSupabaseBrowser();
              supabase.auth.getSession().then(({ data: { session } }) => {
                if (!session?.access_token) return;
                fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } })
                  .then(r => r.json())
                  .then(json => {
                    if (json?.success && json?.data) {
                      setUsage(prev => ({
                        plan: prev?.plan || json.data.plan, // Keep current plan
                        monthly_quiz_generations: prev?.monthly_quiz_generations || json.data.monthly_quiz_generations, // Keep current limits
                        used: json.data.monthly_used,
                        daily_used: json.data.daily_used,
                        daily_limit: prev?.daily_limit || json.data.daily_limit, // Keep current limits
                        max_questions_per_quiz: prev?.max_questions_per_quiz || json.data.max_questions_per_quiz, // Keep current limits
                        source_usage: json.data.source_usage,
                        source_limits: json.data.source_limits,
                        daily_source_usage: json.data.daily_source_usage,
                        daily_source_limits: json.data.daily_source_limits,
                      }));
                    }
                  });
              });
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {(nearingDaily || nearingMonthly) && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 rounded-xl p-3 sm:p-4">
          {nearingDaily && (
            <div className="text-sm sm:text-base">
              ⚠️ Heads up: You are approaching your daily limit ({usage?.daily_used}/{usage?.daily_limit}).
            </div>
          )}
          {nearingMonthly && (
            <div className="text-sm sm:text-base">
              ⚠️ Heads up: You are approaching your monthly limit ({usage?.used}/{usage?.monthly_quiz_generations}).
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
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 text-center text-sm sm:text-base"
            >
              🚀 Create Quiz
            </Link>
            <Link 
              href="/pricing" 
              className="px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 text-center text-sm sm:text-base"
            >
              💎 Upgrade Plan
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
                👤 Edit Profile
              </Link>
            </li>
            <li>
              <Link 
                href="/settings" 
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
              >
                ⚙️ Settings
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


