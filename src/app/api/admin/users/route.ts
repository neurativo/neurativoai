import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    console.log('Fetching users from profiles table...');

    // Get users from profiles
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        last_sign_in_at,
        plan,
        is_active
      `)
      .order('created_at', { ascending: false });

    console.log('Users query result:', { users, error, count: users?.length });

    if (error) {
      console.error('Users query error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch users', 
        details: error.message,
        debug: { error }
      }, { status: 500 });
    }

    // Transform the data
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name || 'No name',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      plan: user.plan || 'free',
      is_active: user.is_active !== false,
      total_quizzes: 0, // Placeholder
      total_payments: 0, // Placeholder
    })) || [];

    console.log('Transformed users:', transformedUsers.length);

    return NextResponse.json({ 
      users: transformedUsers,
      debug: {
        originalCount: users?.length || 0,
        transformedCount: transformedUsers.length
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
