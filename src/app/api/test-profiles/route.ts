import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Check if profiles table exists and has data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    console.log('Profiles query result:', { profiles, profilesError });

    // Also check auth.users
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .limit(5);

    console.log('Auth users query result:', { authUsers, authError });

    return NextResponse.json({
      profiles: {
        data: profiles,
        error: profilesError?.message,
        count: profiles?.length || 0
      },
      authUsers: {
        data: authUsers,
        error: authError?.message,
        count: authUsers?.length || 0
      }
    });
  } catch (error) {
    console.error('Test profiles error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
