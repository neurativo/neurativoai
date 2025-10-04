import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    
    console.log('Testing Deepgram API key...');
    console.log('API key available:', !!apiKey);
    console.log('API key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Deepgram API key not configured',
        envVars: Object.keys(process.env).filter(key => key.includes('DEEPGRAM'))
      });
    }

    // Test with a simple API call
    const testResponse = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Deepgram test response status:', testResponse.status);
    
    if (testResponse.ok) {
      const projects = await testResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Deepgram API is working',
        projects: projects.projects?.length || 0
      });
    } else {
      const error = await testResponse.text();
      return NextResponse.json({
        success: false,
        error: 'Deepgram API test failed',
        status: testResponse.status,
        details: error
      });
    }

  } catch (error) {
    console.error('Deepgram test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Deepgram test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
