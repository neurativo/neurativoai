import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const adminId = authHeader.replace('Bearer ', '');
    
    // Simple validation - just check if adminId exists
    if (!adminId) {
      return NextResponse.json({ error: 'Invalid admin ID' }, { status: 401 });
    }

    const supabase = getSupabaseServer();

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
        is_active,
        quizzes:quizzes(count),
        payments:payments(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      plan: user.plan || 'free',
      is_active: user.is_active !== false,
      total_quizzes: user.quizzes?.[0]?.count || 0,
      total_payments: user.payments?.[0]?.count || 0,
    })) || [];

    // Log admin action (simplified)
    console.log(`Admin ${adminId} viewed users: ${transformedUsers.length} users`);

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
