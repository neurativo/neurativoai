import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        status,
        created_at,
        subscription_plans!inner(
          id,
          name,
          monthly_limit,
          daily_limit,
          features
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    // Get current usage
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Error fetching usage:', usageError);
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }

    // Determine current plan
    const currentPlan = subscription?.subscription_plans?.name?.toLowerCase() || 'free';
    
    // Get plan limits
    let planLimits = {
      monthly_limit: 5,
      daily_limit: 2,
      max_questions_per_quiz: 8,
      max_file_size: 5 * 1024 * 1024, // 5MB
      can_access_study_packs: false,
      features: []
    };

    if (subscription?.subscription_plans) {
      const plan = subscription.subscription_plans;
      planLimits = {
        monthly_limit: plan.monthly_limit || 5,
        daily_limit: plan.daily_limit || 2,
        max_questions_per_quiz: plan.features?.max_questions_per_quiz || 8,
        max_file_size: currentPlan === 'free' ? 5 * 1024 * 1024 :
                      currentPlan === 'professional' ? 25 * 1024 * 1024 :
                      currentPlan === 'mastery' ? 50 * 1024 * 1024 :
                      100 * 1024 * 1024, // innovation
        can_access_study_packs: currentPlan !== 'free',
        features: plan.features || []
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        currentPlan,
        planLimits,
        usage: usage || {
          monthly_quiz_generations: 0,
          daily_quiz_generations: 0,
          study_pack_generations: 0
        },
        subscription
      }
    });

  } catch (error) {
    console.error('Error in usage-limits API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}