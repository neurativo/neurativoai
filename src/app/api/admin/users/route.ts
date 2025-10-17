import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    console.log('Fetching users from profiles table...');

    // Get users from auth.users table (this is where Supabase stores user data)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Auth users query error:', authError);
      return NextResponse.json({ 
        error: 'Failed to fetch users from auth', 
        details: authError.message
      }, { status: 500 });
    }

    console.log('Auth users query result:', { users: authUsers?.users, count: authUsers?.users?.length });

    // Get additional profile data for each user
    const users = await Promise.all(
      (authUsers?.users || []).map(async (authUser) => {
        // Get profile data if it exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, is_admin, display_name, updated_at')
          .eq('id', authUser.id)
          .single();

        return {
          id: authUser.id,
          email: authUser.email,
          display_name: profile?.display_name || authUser.user_metadata?.full_name || 'No name',
          created_at: authUser.created_at,
          updated_at: profile?.updated_at || authUser.updated_at,
          is_admin: profile?.is_admin || false,
          plan: profile?.plan || 'free'
        };
      })
    );

    console.log('Users query result:', { users, count: users?.length });

    // Get real data for each user
    const transformedUsers = await Promise.all(
      (users || []).map(async (user) => {
        let quizCount = 0;
        let paymentCount = 0;
        let lastActivity: { created_at: string } | null = null;

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
