"use client";

import { useState, useEffect, useRef } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

interface RealtimePlanUpdaterProps {
  userId: string;
  onPlanUpdate: (newPlan: string) => void;
  children: React.ReactNode;
}

export default function RealtimePlanUpdater({ userId, onPlanUpdate, children }: RealtimePlanUpdaterProps) {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isConnected, setIsConnected] = useState(false);
  const isInitializedRef = useRef(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) {
      console.log('RealtimePlanUpdater: No userId provided');
      return;
    }

    // Reset initialization when userId changes
    isInitializedRef.current = false;

    console.log('RealtimePlanUpdater: Setting up for userId:', userId);
    const supabase = getSupabaseBrowser();

    // Initial plan fetch
    const fetchCurrentPlan = async () => {
      try {
        console.log('RealtimePlanUpdater: Fetching current plan for user:', userId);
        
        // Try to get from subscriptions table first (what the frontend uses)
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('plan, status, created_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .maybeSingle();

        console.log('RealtimePlanUpdater: Subscription query result:', subscription, 'error:', subError);

        if (subscription?.plan && subscription?.status === 'active') {
          console.log('RealtimePlanUpdater: Found active subscription plan:', subscription.plan);
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

        console.log('RealtimePlanUpdater: Profile query result:', profile, 'error:', profileError);

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
        // Set to free as fallback
        setCurrentPlan('free');
        onPlanUpdate('free');
      }
    };

    fetchCurrentPlan();

    // Clean up existing channel
    if (channelRef.current) {
      console.log('RealtimePlanUpdater: Cleaning up existing channel');
      channelRef.current.unsubscribe();
    }

    // Set up realtime subscription for subscriptions table
    const subscriptionChannel = supabase
      .channel(`subscription-changes-${userId}-${Date.now()}`)
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
            const newStatus = payload.new?.status;
            console.log('RealtimePlanUpdater: New plan from subscription:', newPlan, 'Status:', newStatus, 'Current plan:', currentPlan);
            
            // Only update if it's an active subscription and the plan is different
            if (newPlan && newStatus === 'active' && newPlan !== currentPlan) {
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
            console.log('RealtimePlanUpdater: New plan from profile:', newPlan, 'Current plan:', currentPlan);
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
        if (status === 'SUBSCRIBED') {
          isInitializedRef.current = true;
        }
      });

    channelRef.current = subscriptionChannel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        console.log('RealtimePlanUpdater: Cleaning up channel on unmount');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
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
