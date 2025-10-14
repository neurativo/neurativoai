import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { verifyAdminAccess, hasPermission, logAdminAction } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
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

    const { userId, isActive } = await req.json();

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Update user status in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    // Log admin action
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await logAdminAction(adminAccess.user.id, 'toggle_user_status', 'user', userId, { 
      isActive,
      action: isActive ? 'activated' : 'deactivated'
    }, clientIP);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User status toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
