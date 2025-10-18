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
        // Use the new subscriptions API
        const response = await fetch(`/api/subscriptions?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.currentPlan) {
            const planName = data.currentPlan.name.toLowerCase();
            setCurrentPlan(planName);
            onPlanUpdate(planName);
            return;
          }
        }
        
        // Fallback to free plan
        setCurrentPlan('free');
        onPlanUpdate('free');
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

    // Set up realtime subscription for user_subscriptions table
    const subscriptionChannel = supabase
      .channel(`subscription-changes-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newStatus = payload.new?.status;
            
            // Only update if it's an active subscription
            if (newStatus === 'active') {
              // Fetch the updated plan details
              try {
                const response = await fetch(`/api/subscriptions?userId=${userId}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.currentPlan) {
                    const planName = data.currentPlan.name.toLowerCase();
                    if (planName !== currentPlan) {
                      setCurrentPlan(planName);
                      onPlanUpdate(planName);
                    }
                  }
                }
              } catch (error) {
                console.error('Error fetching updated plan:', error);
              }
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
