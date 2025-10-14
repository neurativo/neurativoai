import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(10);

    return NextResponse.json({
      adminUsers: {
        data: adminUsers,
        error: adminError?.message,
        count: adminUsers?.length || 0
      },
      authUsers: {
        data: authUsers,
        error: authError?.message,
        count: authUsers?.length || 0
      }
    });

  } catch (error) {
    console.error('Check admin users error:', error);
    return NextResponse.json({ 
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
