import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { model = 'gpt-4o-mini-realtime-preview-2024-12-17' } = await request.json();

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Create a temporary Realtime session to get ephemeral key
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Realtime session creation failed:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create Realtime session', details: errorText },
        { status: response.status }
      );
    }

    const session = await response.json();
    
    if (!session.client_secret?.value) {
      console.error('No client secret in session response:', session);
      return NextResponse.json(
        { error: 'No client secret received from OpenAI' },
        { status: 500 }
      );
    }

    console.log('Generated ephemeral key for Realtime API');
    
    return NextResponse.json({
      ephemeralKey: session.client_secret.value,
      expiresIn: 60 // 1 minute
    });

  } catch (error) {
    console.error('Error generating ephemeral key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
