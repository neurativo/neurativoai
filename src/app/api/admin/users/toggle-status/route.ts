import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const adminId = authHeader.replace('Bearer ', '');
    if (!adminId) {
      return NextResponse.json({ error: 'Invalid admin ID' }, { status: 401 });
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

    // Log admin action (simplified)
    console.log(`Admin ${adminId} toggled user ${userId} status to ${isActive}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User status toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
