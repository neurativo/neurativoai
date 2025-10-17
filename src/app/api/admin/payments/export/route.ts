import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);
    
    // Get filter parameters from query string
    const status = searchParams.get('status') || 'all';
    const plan = searchParams.get('plan') || 'all';
    const method = searchParams.get('method') || 'all';
    const amountMin = searchParams.get('amountMin');
    const amountMax = searchParams.get('amountMax');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const searchTerm = searchParams.get('search') || '';

    // Build the query
    let query = supabase
      .from('payments')
      .select(`
        id,
        user_id,
        plan,
        method,
        amount_cents,
        currency,
        transaction_reference,
        proof_url,
        status,
        admin_note,
        created_at,
        updated_at,
        profiles!inner(
          display_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (plan !== 'all') {
      query = query.eq('plan', plan);
    }

    if (method !== 'all') {
      query = query.eq('method', method);
    }

    if (amountMin) {
      query = query.gte('amount_cents', parseFloat(amountMin) * 100);
    }

    if (amountMax) {
      query = query.lte('amount_cents', parseFloat(amountMax) * 100);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      // Add one day to include the entire end date
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', endDate.toISOString());
    }

    if (searchTerm) {
      query = query.or(`
        profiles.email.ilike.%${searchTerm}%,
        profiles.display_name.ilike.%${searchTerm}%,
        transaction_reference.ilike.%${searchTerm}%,
        id.ilike.%${searchTerm}%
      `);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments for export:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch payments for export' 
      }, { status: 500 });
    }

    // Convert to CSV format
    const csvHeaders = [
      'Payment ID',
      'User Email',
      'User Name',
      'Plan',
      'Payment Method',
      'Amount',
      'Currency',
      'Transaction Reference',
      'Status',
      'Admin Note',
      'Created At',
      'Updated At',
      'Proof URL'
    ];

    const csvRows = payments?.map(payment => {
      const profile = Array.isArray(payment.profiles) ? payment.profiles[0] : payment.profiles;
      return [
        payment.id,
        profile?.email || '',
        profile?.display_name || '',
        payment.plan,
        payment.method,
        (payment.amount_cents / 100).toFixed(2),
        payment.currency,
        payment.transaction_reference || '',
        payment.status,
        payment.admin_note || '',
        new Date(payment.created_at).toISOString(),
        new Date(payment.updated_at).toISOString(),
        payment.proof_url || ''
      ];
    }) || [];

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCsvValue = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    // Generate filename with timestamp and filters
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSuffix = status !== 'all' ? `_${status}` : '';
    const filename = `payments_export_${timestamp}${filterSuffix}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Payment export error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
