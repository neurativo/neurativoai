import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // First, try to authenticate with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // First, get the user's profile to get the profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.log('Profile lookup failed:', { profileError: profileError?.message, userId: authData.user.id });
      return NextResponse.json({ 
        error: 'User profile not found. Please complete your profile setup.',
        debug: { profileError: profileError?.message, userId: authData.user.id }
      }, { status: 403 });
    }

    // Use direct SQL query to bypass RLS issues
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        id,
        user_id,
        role,
        is_active,
        created_at
      `)
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .single();

    console.log('Admin user lookup:', {
      userId: authData.user.id,
      adminUser,
      adminError: adminError?.message,
      adminErrorCode: adminError?.code
    });

    if (adminError || !adminUser) {
      // Let's also check if there are any admin users at all
      const { data: allAdmins, error: allAdminsError } = await supabase
        .from('admin_users')
        .select('*');
      
      console.log('All admin users:', { allAdmins, allAdminsError });
      
      return NextResponse.json({ 
        error: 'Access denied. Admin privileges required.',
        debug: {
          userId: authData.user.id,
          adminError: adminError?.message,
          allAdmins: allAdmins?.length || 0
        }
      }, { status: 403 });
    }

    // Return admin info without complex token handling
    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminUser.user_id,
        email: authData.user.email,
        role: adminUser.role,
        is_active: adminUser.is_active
      }
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
