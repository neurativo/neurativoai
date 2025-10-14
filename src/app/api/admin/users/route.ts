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
        display_name,
        created_at,
        updated_at,
        is_admin
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
      full_name: user.display_name || 'No name',
      created_at: user.created_at,
      last_sign_in_at: user.updated_at, // Use updated_at as last activity
      plan: 'free', // Default plan since profiles table doesn't have plan column
      is_active: true, // All users are active
      is_admin: user.is_admin || false, // Include admin status
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
