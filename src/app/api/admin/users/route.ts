import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    console.log('Fetching users from profiles table...');

    // Get users from profiles with related data
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        created_at,
        updated_at,
        is_admin,
        plan
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

    // Get real data for each user
    const transformedUsers = await Promise.all(
      (users || []).map(async (user) => {
        let quizCount = 0;
        let paymentCount = 0;
        let lastActivity = null;

        try {
          // Get quiz count for this user (if quizzes table exists)
          const { count: quizCountResult } = await supabase
            .from('quizzes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          quizCount = quizCountResult || 0;
        } catch (error) {
          console.warn('Quizzes table not found or error:', error);
        }

        try {
          // Get payment count for this user
          const { count: paymentCountResult } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          paymentCount = paymentCountResult || 0;
        } catch (error) {
          console.warn('Payments table error:', error);
        }

        try {
          // Get last activity from quiz attempts or user activity
          const { data: lastActivityResult } = await supabase
            .from('quiz_attempts')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          lastActivity = lastActivityResult;
        } catch (error) {
          console.warn('Quiz attempts table not found or error:', error);
        }

        return {
          id: user.id,
          email: user.email,
          full_name: user.display_name || 'No name',
          created_at: user.created_at,
          last_sign_in_at: lastActivity?.created_at || user.updated_at,
          plan: user.plan || 'free',
          is_active: true,
          is_admin: user.is_admin || false,
          total_quizzes: quizCount,
          total_payments: paymentCount,
        };
      })
    );

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
