import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    
    // Get user's current active subscription with plan details
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        status,
        start_date,
        end_date,
        created_at,
        subscription_plans!inner(
          id,
          name,
          monthly_price,
          yearly_price,
          features,
          daily_limit,
          monthly_limit
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      return NextResponse.json({ 
        error: 'Failed to fetch subscription' 
      }, { status: 500 });
    }

    // If no active subscription, return free plan
    if (!subscription) {
      const { data: freePlan, error: freePlanError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'Free')
        .single();

      if (freePlanError) {
        console.error('Error fetching free plan:', freePlanError);
        return NextResponse.json({ 
          error: 'Failed to fetch free plan' 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        subscription: null,
        currentPlan: freePlan,
        isActive: false
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        created_at: subscription.created_at
      },
      currentPlan: subscription.subscription_plans,
      isActive: true
    });

  } catch (error) {
    console.error('Error in subscriptions API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
