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
    if (!userId) {
      console.log('RealtimePlanUpdater: No userId provided');
      return;
    }

    console.log('RealtimePlanUpdater: Setting up for userId:', userId);
    const supabase = getSupabaseBrowser();

    // Initial plan fetch
    const fetchCurrentPlan = async () => {
      try {
        console.log('RealtimePlanUpdater: Fetching current plan...');
        
        // Try to get from subscriptions table first (what the frontend uses)
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (subError) {
          console.warn('RealtimePlanUpdater: Error fetching subscription:', subError);
        }

        if (subscription?.plan) {
          console.log('RealtimePlanUpdater: Found subscription plan:', subscription.plan);
          setCurrentPlan(subscription.plan);
          onPlanUpdate(subscription.plan);
          return;
        }

        // Fallback to profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.warn('RealtimePlanUpdater: Error fetching profile:', profileError);
        }

        if (profile?.plan) {
          console.log('RealtimePlanUpdater: Found profile plan:', profile.plan);
          setCurrentPlan(profile.plan);
          onPlanUpdate(profile.plan);
        } else {
          console.log('RealtimePlanUpdater: No plan found, defaulting to free');
          setCurrentPlan('free');
          onPlanUpdate('free');
        }
      } catch (error) {
        console.error('RealtimePlanUpdater: Error fetching current plan:', error);
      }
    };

    fetchCurrentPlan();

    // Set up realtime subscription for subscriptions table
    const subscriptionChannel = supabase
      .channel(`subscription-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('RealtimePlanUpdater: Subscription change detected:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newPlan = payload.new?.plan;
            if (newPlan && newPlan !== currentPlan) {
              console.log('RealtimePlanUpdater: Plan updated via subscription:', newPlan);
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
          console.log('RealtimePlanUpdater: Profile change detected:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newPlan = payload.new?.plan;
            if (newPlan && newPlan !== currentPlan) {
              console.log('RealtimePlanUpdater: Plan updated via profile:', newPlan);
              setCurrentPlan(newPlan);
              onPlanUpdate(newPlan);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('RealtimePlanUpdater: Subscription status:', status);
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
