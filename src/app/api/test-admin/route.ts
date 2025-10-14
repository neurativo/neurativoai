import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    
    // Check if admin_users table exists
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);
    
    // Check if admin_audit_logs table exists
    const { data: auditLogs, error: auditError } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .limit(1);
    
    // Check if site_settings table exists
    const { data: siteSettings, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1);
    
    return NextResponse.json({
      adminUsers: {
        data: adminUsers,
        error: adminError
      },
      auditLogs: {
        data: auditLogs,
        error: auditError
      },
      siteSettings: {
        data: siteSettings,
        error: settingsError
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
