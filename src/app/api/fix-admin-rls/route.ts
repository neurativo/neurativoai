import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Fix the RLS policies by disabling and recreating them
    const queries = [
      // Disable RLS temporarily
      'ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;',
      
      // Drop problematic policies
      'DROP POLICY IF EXISTS "Admins can view other admin users" ON admin_users;',
      'DROP POLICY IF EXISTS "Super Admins can insert admin users" ON admin_users;',
      'DROP POLICY IF EXISTS "Super Admins can update admin users" ON admin_users;',
      'DROP POLICY IF EXISTS "Super Admins can delete admin users" ON admin_users;',
      
      // Re-enable RLS
      'ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;',
      
      // Create new, non-recursive policies
      `CREATE POLICY "Service role can access admin_users" ON admin_users
       FOR ALL USING (auth.role() = 'service_role');`,
       
      `CREATE POLICY "Admins can view admin users" ON admin_users
       FOR SELECT USING (
           EXISTS (
               SELECT 1 FROM admin_users au 
               WHERE au.user_id = auth.uid() 
               AND au.is_active = true
           )
       );`,
       
      `CREATE POLICY "Super admins can manage admin users" ON admin_users
       FOR ALL USING (
           EXISTS (
               SELECT 1 FROM admin_users au 
               WHERE au.user_id = auth.uid() 
               AND au.role = 'super_admin'
               AND au.is_active = true
           )
       );`
    ];

    // Execute each query
    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error('SQL execution error:', error);
        return NextResponse.json({ 
          error: 'Failed to execute SQL', 
          details: error.message,
          query 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'RLS policies fixed successfully' 
    });

  } catch (error) {
    console.error('Fix RLS error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
