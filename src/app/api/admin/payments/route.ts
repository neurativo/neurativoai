import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    
    // Fetch all payments using service role (bypasses RLS)
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Format payments for display
    const formattedPayments = payments?.map(payment => ({
      ...payment,
      user_email: `User ${payment.user_id?.slice(0, 8) || 'Unknown'}`, // Show partial user ID
      user_name: 'Unknown',
      amount: payment.amount_cents / 100
    })) || [];

    return NextResponse.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Error in payments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { paymentId, status, adminNote } = await request.json();
    
    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    
    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        status, 
        admin_note: adminNote || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }

    // If approved, update user's plan
    if (status === 'approved') {
      const { data: payment } = await supabase
        .from('payments')
        .select('user_id, plan')
        .eq('id', paymentId)
        .single();

      if (payment) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ plan: payment.plan })
          .eq('id', payment.user_id);

        if (profileError) {
          console.error('Error updating user plan:', profileError);
          return NextResponse.json({ error: 'Payment approved but failed to update user plan' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in payment update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
