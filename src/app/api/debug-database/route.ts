import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    console.log('🔍 Debugging database access...');

    // Test 1: Check if profiles table exists and get its structure
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    console.log('Profiles query result:', { 
      profiles, 
      error: profilesError, 
      count: profiles?.length 
    });

    // Test 2: Check auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    console.log('Auth users result:', { 
      users: authUsers?.users?.length || 0, 
      error: authError 
    });

    // Test 3: Check admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');

    console.log('Admin users result:', { 
      adminUsers, 
      error: adminError, 
      count: adminUsers?.length 
    });

    return NextResponse.json({
      success: true,
      debug: {
        profiles: {
          data: profiles,
          error: profilesError?.message,
          count: profiles?.length || 0
        },
        authUsers: {
          count: authUsers?.users?.length || 0,
          error: authError?.message
        },
        adminUsers: {
          data: adminUsers,
          error: adminError?.message,
          count: adminUsers?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Database debug error:', error);
    return NextResponse.json({ 
      error: 'Database debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
