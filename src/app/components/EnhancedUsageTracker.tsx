"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

interface UsageData {
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
}

interface EnhancedUsageTrackerProps {
  userId: string;
  onUsageUpdate?: (usage: UsageData) => void;
}

export default function EnhancedUsageTracker({ userId, onUsageUpdate }: EnhancedUsageTrackerProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchUsage = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/usage', { 
        headers: { Authorization: `Bearer ${session?.access_token || ''}` } 
      });
      
      const json = await response.json();
      
      if (json?.success && json?.data) {
        const usageData: UsageData = {
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
        };
        
        setUsage(usageData);
        setLastUpdated(new Date());
        onUsageUpdate?.(usageData);
      } else {
        setError(json?.error || 'Failed to fetch usage data');
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchUsage();

    // Set up realtime updates
    const supabase = getSupabaseBrowser();
    
    const usageChannel = supabase
      .channel(`enhanced-usage-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usage_counters',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchUsage();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_usage',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchUsage();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_source_usage',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchUsage();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_daily_usage',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchUsage();
        }
      )
      .subscribe();

    // Polling fallback every 30 seconds
    const interval = setInterval(fetchUsage, 30000);

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUsage();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      usageChannel.unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'free': return 'text-gray-400';
      case 'professional': return 'text-blue-400';
      case 'mastery': return 'text-purple-400';
      case 'innovation': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 shadow-2xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-white">Loading usage data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 backdrop-blur-sm rounded-xl p-8 border border-red-500/20 shadow-2xl">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-2">⚠️</div>
          <h3 className="text-red-300 font-semibold mb-2">Error Loading Usage Data</h3>
          <p className="text-red-200 text-sm mb-4">{error}</p>
          <button
            onClick={fetchUsage}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-gray-900/20 backdrop-blur-sm rounded-xl p-8 border border-gray-500/20 shadow-2xl">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>No usage data available</p>
        </div>
      </div>
    );
  }

  const dailyPercentage = getUsagePercentage(usage.daily_used, usage.daily_limit);
  const monthlyPercentage = getUsagePercentage(usage.used, usage.monthly_quiz_generations);

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Usage Overview</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsage}
            className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all text-sm"
            title="Refresh usage data"
          >
            🔄 Refresh
          </button>
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Plan Status */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-lg font-semibold ${getPlanColor(usage.plan)}`}>
              {usage.plan?.toUpperCase() || 'FREE'} Plan
            </div>
            <div className="text-sm text-gray-400">
              Max {usage.max_questions_per_quiz} questions per quiz
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {usage.daily_used}/{usage.daily_limit}
            </div>
            <div className="text-sm text-gray-400">Today's Quizzes</div>
          </div>
        </div>
      </div>

      {/* Usage Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Daily Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Daily Usage</h3>
            <span className={`text-sm font-medium ${getUsageColor(dailyPercentage)}`}>
              {usage.daily_used}/{usage.daily_limit}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(dailyPercentage)}`}
              style={{ width: `${dailyPercentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-400">
            {usage.daily_limit - usage.daily_used} quizzes remaining today
          </div>
        </div>

        {/* Monthly Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Monthly Usage</h3>
            <span className={`text-sm font-medium ${getUsageColor(monthlyPercentage)}`}>
              {usage.used}/{usage.monthly_quiz_generations}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(monthlyPercentage)}`}
              style={{ width: `${monthlyPercentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-400">
            {usage.monthly_quiz_generations - usage.used} quizzes remaining this month
          </div>
        </div>
      </div>

      {/* Source-Specific Usage */}
      {usage.source_usage && usage.source_limits && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Source-Specific Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* URL Quizzes */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-link text-blue-400"></i>
                <span className="font-semibold text-white">URL Quizzes</span>
              </div>
              <div className="text-2xl font-bold mb-2 text-blue-400">
                {usage.source_usage.url}/{usage.source_limits.url}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (usage.source_usage.url / usage.source_limits.url) * 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-400">
                {usage.daily_source_usage?.url || 0}/{usage.daily_source_limits?.url || 5} today
              </div>
            </div>

            {/* Text Quizzes */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-file-text text-green-400"></i>
                <span className="font-semibold text-white">Text Quizzes</span>
              </div>
              <div className="text-2xl font-bold mb-2 text-green-400">
                {usage.source_usage.text}/{usage.source_limits.text}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (usage.source_usage.text / usage.source_limits.text) * 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-400">
                {usage.daily_source_usage?.text || 0}/{usage.daily_source_limits?.text || 5} today
              </div>
            </div>

            {/* Document Quizzes */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-file-pdf text-purple-400"></i>
                <span className="font-semibold text-white">Document Quizzes</span>
              </div>
              <div className="text-2xl font-bold mb-2 text-purple-400">
                {usage.source_usage.document}/{usage.source_limits.document}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-purple-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (usage.source_usage.document / usage.source_limits.document) * 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-400">
                {usage.daily_source_usage?.document || 0}/{usage.daily_source_limits?.document || 5} today
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Warnings */}
      {(dailyPercentage >= 80 || monthlyPercentage >= 80) && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-exclamation-triangle"></i>
            <span className="font-semibold">Usage Alert</span>
          </div>
          {dailyPercentage >= 80 && (
            <div>You're approaching your daily limit ({usage.daily_used}/{usage.daily_limit})</div>
          )}
          {monthlyPercentage >= 80 && (
            <div>You're approaching your monthly limit ({usage.used}/{usage.monthly_quiz_generations})</div>
          )}
        </div>
      )}
    </div>
  );
}
