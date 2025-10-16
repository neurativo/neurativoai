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
              amount: payment.amount_cents / 100
            };
          }

          return {
            ...payment,
            user_email: userData.user.email || 'Unknown',
            user_name: userData.user.user_metadata?.full_name || 'Unknown',
            amount: payment.amount_cents / 100
          };
        } catch (error) {
          console.warn(`Error fetching user details for ${payment.user_id}:`, error);
          return {
            ...payment,
            user_email: `User ${payment.user_id.slice(0, 8)}`,
            user_name: 'Unknown',
            amount: payment.amount_cents / 100
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
    
    // First, check if payment exists
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('id, user_id, plan, status')
      .eq('id', paymentId)
      .single();

    if (fetchError) {
      console.error('Error fetching payment:', fetchError);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
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
      return NextResponse.json({ 
        error: 'Failed to update payment', 
        details: updateError.message 
      }, { status: 500 });
    }

    // If approved, update user's plan in both profiles and subscriptions tables
    if (status === 'approved') {
      // Update or create profile
      const { data: existingProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id, plan')
        .eq('id', existingPayment.user_id)
        .single();

      if (profileFetchError) {
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: existingPayment.user_id,
            plan: existingPayment.plan,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Error creating user profile:', createError);
        }
      } else {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            plan: existingPayment.plan,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.user_id);

        if (profileError) {
          console.error('Error updating user profile:', profileError);
        }
      }

      // Update or create subscription (this is what the frontend actually uses)
      // First, deactivate any existing active subscriptions
      const { error: deactivateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', existingPayment.user_id)
        .eq('status', 'active');

      if (deactivateError) {
        console.warn('Error deactivating existing subscriptions:', deactivateError);
      }

      // Create new active subscription
      const { error: subCreateError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: existingPayment.user_id,
          plan: existingPayment.plan,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (subCreateError) {
        console.error('Error creating subscription:', subCreateError);
      }
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
