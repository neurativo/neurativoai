import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Get all users from profiles
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        created_at,
        updated_at,
        is_admin
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Export users error:', error);
      return NextResponse.json({ error: 'Failed to export users' }, { status: 500 });
    }

    // Transform data for CSV export
    const csvData = users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.display_name || 'No name',
      created_at: user.created_at,
      last_activity: user.updated_at,
      is_admin: user.is_admin ? 'Yes' : 'No',
      plan: 'free' // Default since profiles table doesn't have plan column
    })) || [];

    // Convert to CSV format
    const headers = ['ID', 'Email', 'Full Name', 'Created At', 'Last Activity', 'Is Admin', 'Plan'];
    const csvRows = [
      headers.join(','),
      ...csvData.map(user => [
        user.id,
        `"${user.email}"`,
        `"${user.full_name}"`,
        user.created_at,
        user.last_activity,
        user.is_admin,
        user.plan
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="users-export.csv"'
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
