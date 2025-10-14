import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Get total users from profiles
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (last 30 days) - using quiz attempts as activity indicator
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activeUserIds } = await supabase
      .from('quiz_attempts')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('user_id', 'is', null);

    const uniqueActiveUsers = new Set(activeUserIds?.map(a => a.user_id) || []).size;

    // Get total quizzes
    const { count: totalQuizzes } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true });

    // Get payment statistics
    const { data: payments } = await supabase
      .from('payments')
      .select('amount_cents, status')
      .eq('status', 'approved');

    const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount_cents || 0), 0) || 0;

    // Get today's quiz attempts as activity metric
    const today = new Date().toISOString().split('T')[0];
    const { count: todayActivity } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: uniqueActiveUsers || 0,
      totalQuizzes: totalQuizzes || 0,
      totalRevenue: totalRevenue / 100, // Convert cents to dollars
      todayViews: todayActivity || 0,
      maintenanceMode: false // Placeholder
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
