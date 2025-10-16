import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing payments API...');
    
    // Check if service role key is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('Service role key available:', !!serviceRoleKey);
    
    const supabase = getSupabaseServer();
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('payments')
      .select('count')
      .limit(1);
    
    console.log('Test query result:', { data: testData, error: testError });
    
    if (testError) {
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError,
        serviceRoleKeyAvailable: !!serviceRoleKey
      }, { status: 500 });
    }
    
    // Fetch all payments
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Payments query result:', { data: payments, error });

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch payments', 
        details: error,
        serviceRoleKeyAvailable: !!serviceRoleKey
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      paymentsCount: payments?.length || 0,
      payments: payments || [],
      serviceRoleKeyAvailable: !!serviceRoleKey
    });
  } catch (error) {
    console.error('Error in test payments API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      serviceRoleKeyAvailable: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }, { status: 500 });
  }
}
