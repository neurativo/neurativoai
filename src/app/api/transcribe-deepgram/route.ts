// Deepgram transcription API endpoint
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, audioData } = await request.json();

    if (action === 'get_api_key') {
      // Return Deepgram API key
      const apiKey = process.env.DEEPGRAM_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Deepgram API key not configured' },
          { status: 500 }
        );
      }

      return NextResponse.json({ apiKey });
    }

    if (action === 'transcribe' && audioData) {
      // Handle audio transcription using Deepgram
      const apiKey = process.env.DEEPGRAM_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Deepgram API key not configured' },
          { status: 500 }
        );
      }

      // Convert base64 audio data to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');

      // Call Deepgram API
      const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/webm'
        },
        body: audioBuffer
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Deepgram API error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

      return NextResponse.json({ 
        success: true, 
        transcript,
        confidence: result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0
      });

    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Deepgram transcription error:', error);
    return NextResponse.json(
      { 
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
