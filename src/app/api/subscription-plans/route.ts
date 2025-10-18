import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    
    // Fetch all subscription plans
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription plans' }, { status: 500 });
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
