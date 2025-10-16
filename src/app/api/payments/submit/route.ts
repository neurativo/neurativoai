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
      proofUrl,
      // Bank transfer specific fields
      accountName,
      accountNumber,
      bankName,
      // Binance specific fields
      binanceId
    } = await request.json();
    
    // Validate required fields
    if (!plan || !billing || !amount || !currency || !paymentMethod || !transactionId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate plan
    const validPlans = ['professional', 'mastery', 'innovation'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ 
        error: 'Invalid plan' 
      }, { status: 400 });
    }

    // Validate billing
    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json({ 
        error: 'Invalid billing period' 
      }, { status: 400 });
    }

    // Validate payment method specific fields
    if (paymentMethod === 'bank') {
      if (!accountName || !accountNumber || !bankName) {
        return NextResponse.json({ 
          error: 'Bank transfer requires account name, account number, and bank name' 
        }, { status: 400 });
      }
    } else if (paymentMethod === 'binance') {
      if (!binanceId) {
        return NextResponse.json({ 
          error: 'Binance payment requires Binance ID' 
        }, { status: 400 });
      }
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

    // Calculate amount in cents
    const amountCents = Math.round(amount * 100);

    // Prepare payment data with method-specific fields
    const paymentData: any = {
      user_id: user.id,
      plan,
      method: paymentMethod,
      amount_cents: amountCents,
      currency,
      proof_url: proofUrl,
      status: 'pending',
      admin_note: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add method-specific data
    if (paymentMethod === 'bank') {
      paymentData.account_name = accountName;
      paymentData.account_number = accountNumber;
      paymentData.bank_name = bankName;
    } else if (paymentMethod === 'binance') {
      paymentData.binance_id = binanceId;
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json({ 
        error: 'Failed to create payment record' 
      }, { status: 500 });
    }

    // Send confirmation email (optional)
    try {
      // TODO: Implement email notification
      console.log('Payment created:', payment.id);
    } catch (emailError) {
      console.warn('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

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
