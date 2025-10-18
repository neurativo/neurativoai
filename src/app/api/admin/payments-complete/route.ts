import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    
    // Fetch all payments with plan details using service role (bypasses RLS)
    const { data: payments, error } = await supabase
      .from('user_payments')
      .select(`
        *,
        subscription_plans!inner(
          id,
          name,
          monthly_price,
          yearly_price,
          features
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Get user details for each payment
    const paymentsWithUsers = await Promise.all(
      (payments || []).map(async (payment) => {
        try {
          // Get user details from auth.users
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(payment.user_id);
          
          if (userError || !userData.user) {
            console.warn(`Could not fetch user details for ${payment.user_id}:`, userError);
            return {
              ...payment,
              user_email: `User ${payment.user_id.slice(0, 8)}`,
              user_name: 'Unknown',
              plan_name: payment.subscription_plans.name
            };
          }

          return {
            ...payment,
            user_email: userData.user.email || 'Unknown',
            user_name: userData.user.user_metadata?.full_name || 'Unknown',
            plan_name: payment.subscription_plans.name
          };
        } catch (error) {
          console.warn(`Error fetching user details for ${payment.user_id}:`, error);
          return {
            ...payment,
            user_email: `User ${payment.user_id.slice(0, 8)}`,
            user_name: 'Unknown',
            plan_name: payment.subscription_plans.name
          };
        }
      })
    );

    return NextResponse.json({ payments: paymentsWithUsers });
  } catch (error) {
    console.error('Error in payments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { paymentId, status, adminNote } = await request.json();
    
    if (!paymentId || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: paymentId and status are required' 
      }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be "approved" or "rejected"' 
      }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    
    // First, get payment with plan details
    const { data: existingPayment, error: fetchError } = await supabase
      .from('user_payments')
      .select(`
        id, 
        user_id, 
        plan_id, 
        status,
        subscription_plans!inner(
          id,
          name
        )
      `)
      .eq('id', paymentId)
      .single();

    if (fetchError) {
      console.error('Error fetching payment:', fetchError);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // Update payment status
    const { error: updateError } = await supabase
      .from('user_payments')
      .update({ 
        status, 
        admin_note: adminNote || null,
        reviewed_by: null // TODO: Add admin user ID when implementing proper admin auth
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update payment', 
        details: updateError.message 
      }, { status: 500 });
    }

    // If approved, create new active subscription
    if (status === 'approved') {
      // First, deactivate any existing active subscriptions
      const { error: deactivateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'expired'
        })
        .eq('user_id', existingPayment.user_id)
        .eq('status', 'active');

      if (deactivateError) {
        console.warn('Error deactivating existing subscriptions:', deactivateError);
      }

      // Create new active subscription with 30-day expiry
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days from now

      const { error: subCreateError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: existingPayment.user_id,
          plan_id: existingPayment.plan_id,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          payment_id: paymentId
        });

      if (subCreateError) {
        console.error('Error creating subscription:', subCreateError);
        return NextResponse.json({ 
          error: 'Failed to create subscription', 
          details: subCreateError.message 
        }, { status: 500 });
      }

      const planName = (existingPayment.subscription_plans as any)?.name || 'Unknown';
      console.log(`Subscription activated for user ${existingPayment.user_id} with plan ${planName}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Payment ${status} successfully`,
      paymentId,
      status 
    });
  } catch (error) {
    console.error('Error in payment update API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
