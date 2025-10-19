import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user notifications
    const { data: notifications, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      notifications: notifications || [] 
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, type, title, message, data } = await request.json();
    
    if (!user_id || !type || !title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, type, title, message' 
      }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Create notification
    const { data: notification, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        data: data || null,
        read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      notification 
    });

  } catch (error) {
    console.error('Error in create notification API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notification_id, read } = await request.json();
    
    if (!notification_id || typeof read !== 'boolean') {
      return NextResponse.json({ 
        error: 'Missing required fields: notification_id, read' 
      }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update notification
    const { error } = await supabase
      .from('user_notifications')
      .update({ read })
      .eq('id', notification_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification updated successfully' 
    });

  } catch (error) {
    console.error('Error in update notification API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
