import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

    // Get total quizzes
    const { count: totalQuizzes } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true });

    // Get total revenue (from payments table)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount_cents, currency')
      .eq('status', 'approved');

    const totalRevenue = payments?.reduce((sum, payment) => {
      const amount = payment.amount_cents / 100; // Convert cents to dollars
      return sum + amount;
    }, 0) || 0;

    // Get today's views (placeholder - you might want to implement actual analytics)
    const todayViews = Math.floor(Math.random() * 1000) + 500; // Placeholder

    // Check maintenance mode
    const { data: maintenanceMode } = await supabase
      .from('maintenance_mode')
      .select('is_enabled')
      .single();

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalQuizzes: totalQuizzes || 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      todayViews,
      maintenanceMode: maintenanceMode?.is_enabled || false
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}