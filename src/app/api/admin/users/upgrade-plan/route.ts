import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId, newPlan } = await req.json();

    if (!userId || !newPlan) {
      return NextResponse.json({ error: 'User ID and new plan are required' }, { status: 400 });
    }

    const validPlans = ['free', 'professional', 'mastery', 'innovation'];
    if (!validPlans.includes(newPlan)) {
      return NextResponse.json({ error: 'Invalid plan specified' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Update user plan in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ plan: newPlan })
      .eq('id', userId);

    if (error) {
      console.error('Plan upgrade error:', error);
      return NextResponse.json({ error: 'Failed to upgrade user plan' }, { status: 500 });
    }

    // Log the admin action
    console.log(`Admin upgraded user ${userId} to ${newPlan} plan`);

    return NextResponse.json({ 
      success: true, 
      message: `User plan upgraded to ${newPlan}` 
    });
  } catch (error) {
    console.error('Plan upgrade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
