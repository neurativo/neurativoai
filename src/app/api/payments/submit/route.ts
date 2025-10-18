import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      plan, 
      billing, 
      amount, 
      currency, 
      paymentMethod, 
      transactionId, 
      notes, 
      proofUrl
    } = await request.json();
    
    // Validate required fields
    if (!plan || !billing || !amount || !currency || !paymentMethod || !transactionId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate payment method
    if (!['bank', 'binance'].includes(paymentMethod)) {
      return NextResponse.json({ 
        error: 'Invalid payment method. Must be "bank" or "binance"' 
      }, { status: 400 });
    }

    // Validate billing
    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json({ 
        error: 'Invalid billing period' 
      }, { status: 400 });
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid authentication' 
      }, { status: 401 });
    }

    // Get plan details from subscription_plans table
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, monthly_price, yearly_price')
      .eq('name', plan)
      .single();

    if (planError || !planData) {
      return NextResponse.json({ 
        error: 'Invalid plan' 
      }, { status: 400 });
    }

    // Validate amount matches plan pricing
    const expectedAmount = billing === 'yearly' ? planData.yearly_price : planData.monthly_price;
    if (Math.abs(amount - expectedAmount) > 0.01) { // Allow small floating point differences
      return NextResponse.json({ 
        error: `Amount mismatch. Expected ${currency} ${expectedAmount} for ${plan} ${billing}` 
      }, { status: 400 });
    }

    // Prepare payment data for new structure
    const paymentData = {
      user_id: user.id,
      plan_id: planData.id,
      method: paymentMethod,
      amount: amount,
      currency,
      transaction_reference: transactionId,
      proof_url: proofUrl,
      status: 'pending',
      admin_note: notes || null
    };

    // Create payment record in new user_payments table
    const { data: payment, error: paymentError } = await supabase
      .from('user_payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json({ 
        error: 'Failed to create payment record' 
      }, { status: 500 });
    }

    console.log('Payment created:', payment.id);

    return NextResponse.json({ 
      success: true,
      paymentId: payment.id,
      message: 'Payment submitted successfully'
    });

  } catch (error) {
    console.error('Payment submission error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
