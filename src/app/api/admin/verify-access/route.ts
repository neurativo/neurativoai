import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/admin-auth';

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

    // Log successful admin access
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await logAdminAction(adminAccess.user.id, 'admin_login', 'admin', adminAccess.user.id, { email: adminAccess.user.email }, clientIP);

    return NextResponse.json({ 
      success: true, 
      admin: {
        id: adminAccess.user.id,
        email: adminAccess.user.email,
        role: adminAccess.user.role,
        permissions: adminAccess.role?.permissions || {}
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
