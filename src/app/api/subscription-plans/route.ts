import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    
    // Try to fetch from new subscription_plans table
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.log('New subscription_plans table not available, using fallback:', error);
      
      // Fallback to hardcoded plans
      const fallbackPlans = [
        {
          id: 'free',
          name: 'free',
          monthly_price: 0,
          yearly_price: 0,
          features: ['Basic AI features', 'Community support'],
          daily_limit: 3,
          monthly_limit: 50
        },
        {
          id: 'professional',
          name: 'professional',
          monthly_price: 19,
          yearly_price: 190,
          features: ['All quiz types', 'Live lectures', 'Study packs', 'Analytics'],
          daily_limit: 10,
          monthly_limit: 200
        },
        {
          id: 'mastery',
          name: 'mastery',
          monthly_price: 39,
          yearly_price: 390,
          features: ['All features', 'Custom quizzes', 'Priority support', 'API access'],
          daily_limit: 25,
          monthly_limit: 500
        },
        {
          id: 'innovation',
          name: 'innovation',
          monthly_price: 79,
          yearly_price: 790,
          features: ['Unlimited everything', 'White-label', 'Custom integrations', 'Enterprise features'],
          daily_limit: -1, // Unlimited
          monthly_limit: -1 // Unlimited
        }
      ];
      
      return NextResponse.json({ 
        success: true,
        plans: fallbackPlans
      });
    }

    return NextResponse.json({ 
      success: true,
      plans: plans || []
    });

  } catch (error) {
    console.error('Error in subscription plans API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
