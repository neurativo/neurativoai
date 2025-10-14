import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Get total users from profiles
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (last 30 days) - using updated_at as last activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString());

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

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalQuizzes: totalQuizzes || 0,
      totalRevenue: totalRevenue / 100, // Convert cents to dollars
      todayViews: 0, // Placeholder
      maintenanceMode: false // Placeholder
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
