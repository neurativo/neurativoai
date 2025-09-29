import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { blockchainVerificationService } from '@/app/lib/blockchainVerificationService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'submit_payment':
        return await submitPayment(data);
      case 'verify_payment':
        return await verifyPayment(data);
      case 'get_payment_methods':
        return await getPaymentMethods();
      case 'get_user_payments':
        return await getUserPayments(data);
      case 'get_payment_stats':
        return await getPaymentStats();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Crypto payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function submitPayment(data: {
  userId: string;
  paymentMethodId: string;
  txId: string;
  fromAddress?: string;
  planKey?: string;
}) {
  try {
    const { userId, paymentMethodId, txId, fromAddress, planKey } = data;

    // Get payment method details
    const { data: paymentMethod, error: methodError } = await supabase
      .from('crypto_payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .eq('is_active', true)
      .single();

    if (methodError || !paymentMethod) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Check if transaction already exists
    const { data: existingPayment } = await supabase
      .from('crypto_payments')
      .select('id, status')
      .eq('tx_id', txId)
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Transaction already submitted' },
        { status: 400 }
      );
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('crypto_payments')
      .insert({
        user_id: userId,
        payment_method_id: paymentMethodId,
        tx_id: txId,
        from_address: fromAddress,
        to_address: paymentMethod.deposit_address,
        amount: 0, // Will be updated after verification
        plan_key: planKey,
        required_confirmations: paymentMethod.confirmation_blocks,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Start verification process
    await verifyPayment({ paymentId: payment.id });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        txId: payment.tx_id,
        toAddress: payment.to_address,
        requiredConfirmations: payment.required_confirmations,
        expiresAt: payment.expires_at
      }
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    return NextResponse.json(
      { error: 'Failed to submit payment' },
      { status: 500 }
    );
  }
}

async function verifyPayment(data: { paymentId: string }) {
  try {
    const { paymentId } = data;

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('crypto_payments')
      .select(`
        *,
        crypto_payment_methods (
          symbol,
          network,
          explorer_api_url,
          explorer_api_key,
          contract_address
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'confirmed' || payment.status === 'failed') {
      return NextResponse.json({
        success: true,
        status: payment.status,
        message: 'Payment already processed'
      });
    }

    // Update verification attempts
    await supabase
      .from('crypto_payments')
      .update({
        verification_attempts: payment.verification_attempts + 1,
        last_verification_at: new Date().toISOString(),
        status: 'verifying'
      })
      .eq('id', paymentId);

    // Verify with blockchain
    const verificationResult = await blockchainVerificationService.verifyPayment(
      payment.crypto_payment_methods.symbol,
      payment.tx_id,
      payment.to_address
    );

    // Record verification attempt
    await supabase
      .from('crypto_payment_verifications')
      .insert({
        payment_id: paymentId,
        verification_type: 'automatic',
        status: verificationResult.success ? 'success' : 'failed',
        explorer_response: verificationResult.rawData,
        error_message: verificationResult.error
      });

    if (!verificationResult.success) {
      // Check if we should mark as failed
      if (payment.verification_attempts >= 5) {
        await supabase
          .from('crypto_payments')
          .update({ status: 'failed' })
          .eq('id', paymentId);
      }

      return NextResponse.json({
        success: false,
        error: verificationResult.error || 'Verification failed'
      });
    }

    // Update payment with verification results
    const updateData: any = {
      confirmation_count: verificationResult.confirmationCount,
      block_height: verificationResult.blockHeight,
      block_hash: verificationResult.blockHash,
      gas_fee: verificationResult.gasFee
    };

    if (verificationResult.confirmed) {
      updateData.status = 'confirmed';
      updateData.verified_at = new Date().toISOString();
    } else {
      updateData.status = 'verifying';
    }

    await supabase
      .from('crypto_payments')
      .update(updateData)
      .eq('id', paymentId);

    return NextResponse.json({
      success: true,
      confirmed: verificationResult.confirmed,
      confirmationCount: verificationResult.confirmationCount,
      requiredConfirmations: verificationResult.requiredConfirmations,
      status: updateData.status
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

async function getPaymentMethods() {
  try {
    const { data: methods, error } = await supabase
      .from('crypto_payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      methods: methods.map(method => ({
        id: method.id,
        name: method.name,
        symbol: method.symbol,
        network: method.network,
        depositAddress: method.deposit_address,
        minAmount: method.min_amount,
        maxAmount: method.max_amount,
        confirmationBlocks: method.confirmation_blocks
      }))
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

async function getUserPayments(data: { userId: string; limit?: number; offset?: number }) {
  try {
    const { userId, limit = 20, offset = 0 } = data;

    const { data: payments, error } = await supabase
      .from('crypto_payments')
      .select(`
        *,
        crypto_payment_methods (
          name,
          symbol,
          network
        ),
        plans!crypto_payments_plan_key_fkey (
          name,
          key
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        txId: payment.tx_id,
        amount: payment.amount,
        amountUsd: payment.amount_usd,
        status: payment.status,
        confirmationCount: payment.confirmation_count,
        requiredConfirmations: payment.required_confirmations,
        createdAt: payment.created_at,
        verifiedAt: payment.verified_at,
        expiresAt: payment.expires_at,
        paymentMethod: payment.crypto_payment_methods,
        plan: payment.plans
      }))
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

async function getPaymentStats() {
  try {
    const { data: stats, error } = await supabase
      .rpc('get_payment_stats');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment statistics' },
      { status: 500 }
    );
  }
}
