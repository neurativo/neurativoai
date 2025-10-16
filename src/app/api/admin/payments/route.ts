import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabaseBrowser();
    
    // Verify user and check admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid authentication' 
      }, { status: 401 });
    }

    // Check if user is admin using RLS
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // Fetch all payments (RLS will allow this for admins)
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch payments',
        details: error.message 
      }, { status: 500 });
    }

    // Format payments with user details
    const paymentsWithUsers = payments.map((payment: any) => ({
      ...payment,
      user_email: payment.profiles?.email || 'Unknown',
      user_name: payment.profiles?.full_name || 'Unknown'
    }));

    return NextResponse.json({ 
      payments: paymentsWithUsers,
      count: paymentsWithUsers.length 
    });

  } catch (error) {
    console.error('Error in payments API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabaseBrowser();
    
    // Verify user and check admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid authentication' 
      }, { status: 401 });
    }

    // Check if user is admin using RLS
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

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