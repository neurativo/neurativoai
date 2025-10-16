"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

interface RealtimePlanUpdaterProps {
  userId: string;
  onPlanUpdate: (newPlan: string) => void;
  children: React.ReactNode;
}

export default function RealtimePlanUpdater({ userId, onPlanUpdate, children }: RealtimePlanUpdaterProps) {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseBrowser();

    // Initial plan fetch
    const fetchCurrentPlan = async () => {
      try {
        // Try to get from subscriptions table first (what the frontend uses)
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (subscription?.plan) {
          setCurrentPlan(subscription.plan);
          onPlanUpdate(subscription.plan);
          return;
        }

        // Fallback to profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.plan) {
          setCurrentPlan(profile.plan);
          onPlanUpdate(profile.plan);
        }
      } catch (error) {
        console.error('Error fetching current plan:', error);
      }
    };

    fetchCurrentPlan();

    // Set up realtime subscription for subscriptions table
    const subscriptionChannel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Subscription change detected:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newPlan = payload.new?.plan;
            if (newPlan) {
              console.log('Plan updated via subscription:', newPlan);
              setCurrentPlan(newPlan);
              onPlanUpdate(newPlan);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newPlan = payload.new?.plan;
            if (newPlan) {
              console.log('Plan updated via profile:', newPlan);
              setCurrentPlan(newPlan);
              onPlanUpdate(newPlan);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup
    return () => {
      subscriptionChannel.unsubscribe();
    };
  }, [userId, onPlanUpdate]);

  // Show connection status in development
  if (process.env.NODE_ENV === 'development') {
    return (
      <div>
        <div className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-xs ${
          isConnected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
