import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Step 1: Try to authenticate with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Auth result:', { authData, authError });

    if (authError) {
      return NextResponse.json({ 
        step: 'auth_failed',
        error: authError.message,
        code: authError.status,
        details: authError
      }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({ 
        step: 'no_user',
        error: 'No user data returned from auth'
      }, { status: 401 });
    }

    // Step 2: Check admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', authData.user.id);

    console.log('Admin users query:', { adminUsers, adminError, userId: authData.user.id });

    // Step 3: Check if any admin user exists for this user_id
    const { data: allAdminUsers, error: allAdminError } = await supabase
      .from('admin_users')
      .select('*');

    console.log('All admin users:', { allAdminUsers, allAdminError });

    // Step 4: Check if the user exists in auth.users
    const { data: authUser, error: authUserError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('id', authData.user.id)
      .single();

    console.log('Auth user lookup:', { authUser, authUserError });

    return NextResponse.json({
      step: 'debug_complete',
      auth: {
        success: !authError && !!authData.user,
        userId: authData.user?.id,
        email: authData.user?.email,
        error: authError?.message
      },
      adminCheck: {
        found: adminUsers?.length || 0,
        users: adminUsers,
        error: adminError?.message,
        query: `user_id = ${authData.user.id}`
      },
      allAdmins: {
        count: allAdminUsers?.length || 0,
        users: allAdminUsers,
        error: allAdminError?.message
      }
    });

  } catch (error) {
    console.error('Debug admin error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
