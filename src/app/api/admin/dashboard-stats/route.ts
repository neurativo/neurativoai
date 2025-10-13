import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { verifyAdminAccess, hasPermission, logAdminAction } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const admin = await verifyAdminAccess(token);

    if (!admin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!hasPermission(admin, 'analytics_access')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = getSupabaseServer();

    // Get user statistics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Get quiz statistics
    const { count: totalQuizzes } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true });

    // Get payment statistics
    const { data: payments } = await supabase
      .from('payments')
      .select('amount_cents, status')
      .eq('status', 'approved');

    const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount_cents || 0), 0) || 0;

    // Get today's page views (simplified - in production, use proper analytics)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAnalytics } = await supabase
      .from('site_analytics')
      .select('page_views')
      .eq('date', today)
      .single();

    // Check maintenance mode
    const { data: maintenanceMode } = await supabase
      .from('maintenance_mode')
      .select('is_enabled')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // Log admin action
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await logAdminAction(admin.id, 'view_dashboard_stats', {}, clientIP);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalQuizzes: totalQuizzes || 0,
      totalRevenue,
      todayViews: todayAnalytics?.page_views || 0,
      maintenanceMode: maintenanceMode?.is_enabled || false,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
