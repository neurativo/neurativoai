import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, transcript, timestamp, duration } = await request.json();

    if (!sessionId || !transcript) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Save transcript to database
    const { data, error } = await supabase
      .from('lecture_transcripts')
      .insert({
        session_id: sessionId,
        transcript: transcript,
        timestamp: new Date(timestamp),
        duration: duration,
        created_at: new Date()
      });

    if (error) {
      console.error('Error saving transcript:', error);
      return NextResponse.json(
        { error: 'Failed to save transcript' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Transcript saved successfully',
      id: data?.[0]?.id 
    });

  } catch (error) {
    console.error('Error in save-transcript API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
