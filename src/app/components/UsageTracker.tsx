"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

interface UsageStats {
  plan: string;
  monthly_quiz_generations: number;
  monthly_used: number;
  daily_used: number;
  daily_limit: number;
  max_questions_per_quiz: number;
  source_usage: {
    url: number;
    text: number;
    document: number;
  };
  source_limits: {
    url: number;
    text: number;
    document: number;
  };
  daily_source_usage: {
    url: number;
    text: number;
    document: number;
  };
  daily_source_limits: {
    url: number;
    text: number;
    document: number;
  };
}

interface UsageTrackerProps {
  userId: string;
  onUsageUpdate?: (usage: UsageStats) => void;
}

export default function UsageTracker({ userId, onUsageUpdate }: UsageTrackerProps) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/user/usage-limits?userId=${userId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setUsage(data.data);
          onUsageUpdate?.(data.data);
        } else {
          setError(data.error || 'Failed to fetch usage data');
        }
      } catch (err) {
        console.error('Error fetching usage:', err);
        setError('Network error - please check your connection');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();

    // Set up realtime updates
    const supabase = getSupabaseBrowser();
    
    const usageChannel = supabase
      .channel('usage-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_usage',
          filter: `user_id=eq.${userId}`
        },
        () => {
          console.log('Usage updated, refetching...');
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
          console.log('Source usage updated, refetching...');
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
          console.log('Daily usage updated, refetching...');
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      usageChannel.unsubscribe();
    };
  }, [userId, onUsageUpdate]);

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

  if (loading) {
    return (
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
        <div className="flex items-center gap-2">
          <span className="text-red-400">⚠️</span>
          <span className="text-red-300">{error}</span>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-gray-900/20 backdrop-blur-sm rounded-xl p-6 border border-gray-500/20">
        <p className="text-gray-400">No usage data available</p>
      </div>
    );
  }

  const monthlyPercentage = getUsagePercentage(usage.monthly_used, usage.monthly_quiz_generations);
  const dailyPercentage = getUsagePercentage(usage.daily_used, usage.daily_limit);

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Current Plan</h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            usage.plan === 'mastery' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
            usage.plan === 'professional' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' :
            usage.plan === 'innovation' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
            'bg-gray-600 text-white'
          }`}>
            {usage.plan.toUpperCase()}
          </span>
        </div>
        <p className="text-gray-300 text-sm">
          Max {usage.max_questions_per_quiz} questions per quiz
        </p>
      </div>

      {/* Monthly Usage */}
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Monthly Usage</h3>
          <span className={`text-sm font-semibold ${getUsageColor(monthlyPercentage)}`}>
            {usage.monthly_used} / {usage.monthly_quiz_generations}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(monthlyPercentage)}`}
            style={{ width: `${monthlyPercentage}%` }}
          ></div>
        </div>
        <p className="text-gray-400 text-sm">
          {usage.monthly_quiz_generations - usage.monthly_used} quizzes remaining this month
        </p>
      </div>

      {/* Daily Usage */}
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Daily Usage</h3>
          <span className={`text-sm font-semibold ${getUsageColor(dailyPercentage)}`}>
            {usage.daily_used} / {usage.daily_limit}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(dailyPercentage)}`}
            style={{ width: `${dailyPercentage}%` }}
          ></div>
        </div>
        <p className="text-gray-400 text-sm">
          {usage.daily_limit - usage.daily_used} quizzes remaining today
        </p>
      </div>

      {/* Source Usage */}
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">Source Usage (Monthly)</h3>
        <div className="space-y-4">
          {Object.entries(usage.source_usage).map(([source, used]) => {
            const limit = usage.source_limits[source as keyof typeof usage.source_limits];
            const percentage = getUsagePercentage(used, limit);
            
            return (
              <div key={source}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 capitalize">{source}</span>
                  <span className={`text-sm font-semibold ${getUsageColor(percentage)}`}>
                    {used} / {limit}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Source Usage */}
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">Source Usage (Daily)</h3>
        <div className="space-y-4">
          {Object.entries(usage.daily_source_usage).map(([source, used]) => {
            const limit = usage.daily_source_limits[source as keyof typeof usage.daily_source_limits];
            const percentage = getUsagePercentage(used, limit);
            
            return (
              <div key={source}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 capitalize">{source}</span>
                  <span className={`text-sm font-semibold ${getUsageColor(percentage)}`}>
                    {used} / {limit}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
