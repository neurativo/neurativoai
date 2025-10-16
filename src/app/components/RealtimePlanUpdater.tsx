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
      return;
    }

    // Reset initialization when userId changes
    isInitializedRef.current = false;

    const supabase = getSupabaseBrowser();

    // Initial plan fetch
    const fetchCurrentPlan = async () => {
      try {
        // Try to get from subscriptions table first (what the frontend uses)
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('plan, status, created_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (subscription?.plan && subscription?.status === 'active') {
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

        if (profile?.plan) {
          setCurrentPlan(profile.plan);
          onPlanUpdate(profile.plan);
        } else {
          setCurrentPlan('free');
          onPlanUpdate('free');
        }
      } catch (error) {
        console.error('Error fetching current plan:', error);
        // Set to free as fallback
        setCurrentPlan('free');
        onPlanUpdate('free');
      }
    };

    fetchCurrentPlan();

    // Clean up existing channel
    if (channelRef.current) {
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
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newPlan = payload.new?.plan;
            const newStatus = payload.new?.status;
            
            // Only update if it's an active subscription and the plan is different
            if (newPlan && newStatus === 'active' && newPlan !== currentPlan) {
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
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newPlan = payload.new?.plan;
            if (newPlan && newPlan !== currentPlan) {
              setCurrentPlan(newPlan);
              onPlanUpdate(newPlan);
            }
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          isInitializedRef.current = true;
        }
      });

    channelRef.current = subscriptionChannel;

    // Cleanup
    return () => {
      if (channelRef.current) {
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
