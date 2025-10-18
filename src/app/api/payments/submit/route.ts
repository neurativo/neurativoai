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

    // Try to get plan details from subscription_plans table (new system)
    let planData: { id: string; name: string; monthly_price: number; yearly_price: number } | null = null;
    const { data: newPlanData, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, monthly_price, yearly_price')
      .eq('name', plan)
      .single();

    if (planError || !newPlanData) {
      // Fallback to old system - use hardcoded pricing
      const PRICING_CONFIG = {
        'free': { monthly_price: 0, yearly_price: 0 },
        'professional': { monthly_price: 19, yearly_price: 190 },
        'mastery': { monthly_price: 39, yearly_price: 390 },
        'innovation': { monthly_price: 79, yearly_price: 790 }
      };
      
      const oldPlanData = PRICING_CONFIG[plan as keyof typeof PRICING_CONFIG];
      if (!oldPlanData) {
        return NextResponse.json({ 
          error: 'Invalid plan' 
        }, { status: 400 });
      }
      
      planData = {
        id: plan, // Use plan name as ID for old system
        name: plan,
        monthly_price: oldPlanData.monthly_price,
        yearly_price: oldPlanData.yearly_price
      };
    } else {
      planData = newPlanData;
    }

    if (!planData) {
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

    // Try to create payment in new user_payments table first
    let payment: any = null;
    
    try {
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

      const { data: newPayment, error: newPaymentError } = await supabase
        .from('user_payments')
        .insert(paymentData)
        .select()
        .single();

      if (newPaymentError) {
        throw newPaymentError;
      }
      
      payment = newPayment;
    } catch (newSystemError) {
      console.log('New payment system not available, falling back to old system:', newSystemError);
      
      // Fallback to old payments table
      const oldPaymentData = {
        user_id: user.id,
        plan: plan,
        method: paymentMethod,
        amount_cents: Math.round(amount * 100),
        currency: currency,
        transaction_id: transactionId,
        proof_url: proofUrl,
        status: 'pending',
        admin_note: notes || null
      };

      const { data: oldPayment, error: oldPaymentError } = await supabase
        .from('payments')
        .insert(oldPaymentData)
        .select()
        .single();

      if (oldPaymentError) {
        console.error('Error creating payment in old system:', oldPaymentError);
        return NextResponse.json({ 
          error: 'Failed to create payment record' 
        }, { status: 500 });
      }
      
      payment = oldPayment;
    }

    console.log('Payment created:', payment?.id);

    return NextResponse.json({ 
      success: true,
      paymentId: payment?.id,
      message: 'Payment submitted successfully'
    });

  } catch (error) {
    console.error('Payment submission error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
