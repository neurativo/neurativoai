import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Get the admin user details
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        id,
        user_id,
        role,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ 
        error: 'No active admin user found',
        details: adminError?.message
      }, { status: 404 });
    }

    // Try to get the auth user details
    const { data: authUser, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('id', adminUser.user_id)
      .single();

    return NextResponse.json({
      adminUser,
      authUser: authUser || null,
      authError: authError?.message || null,
      message: authUser ? 
        `Admin user found. Email: ${authUser.email}` : 
        'Admin user found but no corresponding auth user. You may need to sign up first.'
    });

  } catch (error) {
    console.error('Get admin details error:', error);
    return NextResponse.json({ 
      error: 'Failed to get admin details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
