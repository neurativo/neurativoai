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

    if (!hasPermission(admin, 'user_management')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = getSupabaseServer();

    // Get users with their quiz and payment counts
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

    // Log admin action
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await logAdminAction(admin.id, 'view_users', { count: transformedUsers.length }, clientIP);

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
