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
      
      console.log('Deepgram transcription request received');
      console.log('Audio data length:', audioData.length);
      console.log('API key available:', !!apiKey);
      
      if (!apiKey) {
        console.error('Deepgram API key not configured');
        return NextResponse.json(
          { error: 'Deepgram API key not configured' },
          { status: 500 }
        );
      }

      // Convert base64 audio data to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      console.log('Audio buffer size:', audioBuffer.length);

      // Call Deepgram API with lecture-optimized settings
      const deepgramUrl = new URL('https://api.deepgram.com/v1/listen');
      deepgramUrl.searchParams.set('model', 'nova-2-meeting'); // Optimized for lectures/discussions
      deepgramUrl.searchParams.set('language', 'en');
      deepgramUrl.searchParams.set('smart_format', 'true');
      deepgramUrl.searchParams.set('punctuate', 'true');
      deepgramUrl.searchParams.set('diarize', 'true'); // Speaker identification
      deepgramUrl.searchParams.set('utterances', 'true'); // Better sentence breaks
      deepgramUrl.searchParams.set('interim_results', 'true'); // Get partial results
      deepgramUrl.searchParams.set('endpointing', '300'); // 300ms pause detection
      deepgramUrl.searchParams.set('vad_events', 'true'); // Voice activity detection
      
      // Add academic keywords for better recognition
      const keywords = [
        'algorithm', 'analysis', 'application', 'approach', 'assessment', 'assumption',
        'concept', 'conclusion', 'condition', 'configuration', 'connection', 'consideration',
        'definition', 'demonstration', 'description', 'determination', 'development', 'discussion',
        'equation', 'evaluation', 'example', 'explanation', 'expression', 'extension',
        'formula', 'function', 'fundamental', 'hypothesis', 'implementation', 'interpretation',
        'methodology', 'observation', 'optimization', 'organization', 'parameter', 'perspective',
        'principle', 'procedure', 'process', 'proposition', 'relationship', 'representation',
        'requirement', 'research', 'resolution', 'solution', 'specification', 'structure',
        'technique', 'theory', 'understanding', 'validation', 'variable', 'verification'
      ];
      
      deepgramUrl.searchParams.set('keywords', keywords.join(','));

      console.log('Calling Deepgram API:', deepgramUrl.toString());
      const response = await fetch(deepgramUrl.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/webm'
        },
        body: audioBuffer
      });

      console.log('Deepgram response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Deepgram API error:', errorData);
        throw new Error(`Deepgram API error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Deepgram API result:', result);
      
      // Extract transcript with better handling of partial/final results
      const channel = result.results?.channels?.[0];
      const alternative = channel?.alternatives?.[0];
      const transcript = alternative?.transcript || '';
      const confidence = alternative?.confidence || 0;
      const isFinal = result.is_final || false;
      
      // Extract speaker information if available
      const speaker = channel?.speaker || null;
      
      // Extract words with timestamps for better processing
      const words = alternative?.words || [];
      
      // Extract utterances for better sentence structure
      const utterances = result.utterances || [];

      return NextResponse.json({ 
        success: true, 
        transcript: transcript.trim(),
        confidence,
        isFinal,
        speaker,
        words,
        utterances,
        wordCount: words.length,
        processingTime: result.metadata?.processing_time || 0
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
