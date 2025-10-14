import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Check admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');

    console.log('Admin users query result:', { adminUsers, adminError });

    return NextResponse.json({
      adminUsers: {
        data: adminUsers,
        error: adminError?.message,
        count: adminUsers?.length || 0
      }
    });
  } catch (error) {
    console.error('Test admin users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
