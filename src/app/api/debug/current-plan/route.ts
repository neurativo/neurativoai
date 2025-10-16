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
    
    // Get all subscriptions for the user
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // Get pending payments
    const { data: pendingPayments, error: pendingError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending');

    // Get all payments
    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      userId,
      subscriptions: subscriptions || [],
      subscriptionError: subError,
      profile: profile,
      profileError: profileError,
      pendingPayments: pendingPayments || [],
      pendingError: pendingError,
      allPayments: allPayments || [],
      allPaymentsError: allPaymentsError,
      currentActiveSubscription: subscriptions?.find(sub => sub.status === 'active'),
      currentPlan: subscriptions?.find(sub => sub.status === 'active')?.plan || profile?.plan || 'free'
    });
  } catch (error) {
    console.error('Error in debug current plan API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
