import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list_payments';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    switch (action) {
      case 'list_payments':
        return await listPayments({ limit, offset, status, userId });
      case 'get_payment_details':
        return await getPaymentDetails(searchParams.get('paymentId')!);
      case 'get_payment_stats':
        return await getPaymentStats();
      case 'get_payment_methods':
        return await getPaymentMethods();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin crypto payments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'update_payment_status':
        return await updatePaymentStatus(data);
      case 'add_payment_method':
        return await addPaymentMethod(data);
      case 'update_payment_method':
        return await updatePaymentMethod(data);
      case 'delete_payment_method':
        return await deletePaymentMethod(data);
      case 'update_admin_settings':
        return await updateAdminSettings(data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin crypto payments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function listPayments(params: {
  limit: number;
  offset: number;
  status?: string | null;
  userId?: string | null;
}) {
  try {
    const { limit, offset, status, userId } = params;

    let query = supabase
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: payments, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      payments: (payments || []).map((payment: any) => ({
        id: payment.id,
        txId: payment.tx_id,
        fromAddress: payment.from_address,
        toAddress: payment.to_address,
        amount: payment.amount,
        amountUsd: payment.amount_usd,
        status: payment.status,
        confirmationCount: payment.confirmation_count,
        requiredConfirmations: payment.required_confirmations,
        verificationAttempts: payment.verification_attempts,
        lastVerificationAt: payment.last_verification_at,
        verifiedAt: payment.verified_at,
        createdAt: payment.created_at,
        expiresAt: payment.expires_at,
        adminNotes: payment.admin_notes,
        adminOverride: payment.admin_override,
        paymentMethod: payment.crypto_payment_methods,
        plan: payment.plans,
        userId: payment.user_id
      }))
    });
  } catch (error) {
    console.error('List payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

async function getPaymentDetails(paymentId: string) {
  try {
    const { data: payment, error } = await supabase
      .from('crypto_payments')
      .select(`
        *,
        crypto_payment_methods (
          name,
          symbol,
          network,
          explorer_api_url
        ),
        plans (
          name,
          key
        ),
        crypto_payment_verifications (
          id,
          verification_type,
          status,
          explorer_response,
          error_message,
          verified_by,
          created_at
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        txId: payment.tx_id,
        fromAddress: payment.from_address,
        toAddress: payment.to_address,
        amount: payment.amount,
        amountUsd: payment.amount_usd,
        status: payment.status,
        confirmationCount: payment.confirmation_count,
        requiredConfirmations: payment.required_confirmations,
        blockHeight: payment.block_height,
        blockHash: payment.block_hash,
        gasFee: payment.gas_fee,
        verificationAttempts: payment.verification_attempts,
        lastVerificationAt: payment.last_verification_at,
        verifiedAt: payment.verified_at,
        createdAt: payment.created_at,
        expiresAt: payment.expires_at,
        adminNotes: payment.admin_notes,
        adminOverride: payment.admin_override,
        paymentMethod: payment.crypto_payment_methods,
        plan: payment.plans,
        userId: payment.user_id,
        verifications: payment.crypto_payment_verifications
      }
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
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

    // Get additional stats
    const { data: statusBreakdown } = await supabase
      .from('crypto_payments')
      .select('status')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const statusCounts = statusBreakdown?.reduce((acc: any, payment: any) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        statusBreakdown,
        last7Days: statusCounts
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment statistics' },
      { status: 500 }
    );
  }
}

async function getPaymentMethods() {
  try {
    const { data: methods, error } = await supabase
      .from('crypto_payment_methods')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      methods: (methods || []).map((method: any) => ({
        id: method.id,
        name: method.name,
        symbol: method.symbol,
        network: method.network,
        contractAddress: method.contract_address,
        depositAddress: method.deposit_address,
        minAmount: method.min_amount,
        maxAmount: method.max_amount,
        confirmationBlocks: method.confirmation_blocks,
        explorerApiUrl: method.explorer_api_url,
        isActive: method.is_active,
        createdAt: method.created_at,
        updatedAt: method.updated_at
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

async function updatePaymentStatus(data: {
  paymentId: string;
  status: string;
  adminNotes?: string;
  adminOverride?: boolean;
}) {
  try {
    const { paymentId, status, adminNotes, adminOverride } = data;

    const { data: result, error } = await supabase
      .rpc('update_payment_status', {
        payment_id: paymentId,
        new_status: status,
        admin_notes: adminNotes,
        admin_override: adminOverride || false
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}

async function addPaymentMethod(data: {
  name: string;
  symbol: string;
  network: string;
  contractAddress?: string;
  depositAddress: string;
  minAmount: number;
  maxAmount?: number;
  confirmationBlocks: number;
  explorerApiUrl: string;
  explorerApiKey?: string;
}) {
  try {
    const { data: method, error } = await supabase
      .from('crypto_payment_methods')
      .insert({
        name: data.name,
        symbol: data.symbol,
        network: data.network,
        contract_address: data.contractAddress,
        deposit_address: data.depositAddress,
        min_amount: data.minAmount,
        max_amount: data.maxAmount,
        confirmation_blocks: data.confirmationBlocks,
        explorer_api_url: data.explorerApiUrl,
        explorer_api_key: data.explorerApiKey,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      method: {
        id: method.id,
        name: method.name,
        symbol: method.symbol,
        network: method.network,
        contractAddress: method.contract_address,
        depositAddress: method.deposit_address,
        minAmount: method.min_amount,
        maxAmount: method.max_amount,
        confirmationBlocks: method.confirmation_blocks,
        explorerApiUrl: method.explorer_api_url,
        isActive: method.is_active
      }
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to add payment method' },
      { status: 500 }
    );
  }
}

async function updatePaymentMethod(data: {
  methodId: string;
  name?: string;
  symbol?: string;
  network?: string;
  contractAddress?: string;
  depositAddress?: string;
  minAmount?: number;
  maxAmount?: number;
  confirmationBlocks?: number;
  explorerApiUrl?: string;
  explorerApiKey?: string;
  isActive?: boolean;
}) {
  try {
    const { methodId, ...updateData } = data;

    const { data: method, error } = await supabase
      .from('crypto_payment_methods')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', methodId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      method: {
        id: method.id,
        name: method.name,
        symbol: method.symbol,
        network: method.network,
        contractAddress: method.contract_address,
        depositAddress: method.deposit_address,
        minAmount: method.min_amount,
        maxAmount: method.max_amount,
        confirmationBlocks: method.confirmation_blocks,
        explorerApiUrl: method.explorer_api_url,
        isActive: method.is_active
      }
    });
  } catch (error) {
    console.error('Update payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

async function deletePaymentMethod(data: { methodId: string }) {
  try {
    const { methodId } = data;

    const { error } = await supabase
      .from('crypto_payment_methods')
      .delete()
      .eq('id', methodId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}

async function updateAdminSettings(data: {
  settings: Record<string, any>;
}) {
  try {
    const { settings } = data;

    const updates = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('admin_settings')
      .upsert(updates, { onConflict: 'setting_key' });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
