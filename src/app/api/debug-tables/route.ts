import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    console.log('🔍 Checking all available tables...');

    // Check what tables exist by trying to query them
    const tables = [
      'profiles',
      'quizzes', 
      'payments',
      'quiz_attempts',
      'user_quizzes',
      'subscriptions',
      'transactions',
      'user_activity',
      'quiz_sessions'
    ];

    const results: any = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        results[table] = {
          exists: !error,
          error: error?.message,
          sampleData: data?.[0] || null,
          count: data?.length || 0
        };
      } catch (err) {
        results[table] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      success: true,
      tables: results
    });
  } catch (error) {
    console.error('Table debug error:', error);
    return NextResponse.json({ 
      error: 'Table debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
