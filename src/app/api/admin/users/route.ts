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
    const adminAccess = await verifyAdminAccess(token);

    if (!adminAccess.isAdmin || !adminAccess.user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!hasPermission(adminAccess.user.id, 'user_management')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = getSupabaseServer();

    // Get users from auth.users
    const { data: users, error } = await supabase
      .from('auth.users')
      .select(`
        id,
        email,
        created_at,
        last_sign_in_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.email.split('@')[0], // Use email prefix as name
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      plan: 'free', // Default plan
      is_active: true, // All auth users are active
      total_quizzes: 0, // Will be calculated separately if needed
      total_payments: 0, // Will be calculated separately if needed
    })) || [];

    // Log admin action
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await logAdminAction(adminAccess.user.id, 'view_users', 'users', undefined, { count: transformedUsers.length }, clientIP);

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
