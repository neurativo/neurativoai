import { NextRequest, NextResponse } from 'next/server';
import { createServerTranscriptionService } from '@/app/lib/audioTranscriptionService';

export async function POST(request: NextRequest) {
  try {
    console.log('Transcription API called');
    
    // Check if this is a request for API key (for streaming)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      if (body.action === 'get_api_key') {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        console.log('API key request:', { hasApiKey: !!apiKey, keyLength: apiKey?.length });
        if (!apiKey) {
          return NextResponse.json({ error: 'AssemblyAI API key not found' }, { status: 500 });
        }
        return NextResponse.json({ apiKey });
      }
      
      if (body.action === 'get_deepgram_key') {
        const apiKey = process.env.DEEPGRAM_API_KEY;
        console.log('Deepgram API key request:', { hasApiKey: !!apiKey, keyLength: apiKey?.length });
        if (!apiKey) {
          return NextResponse.json({ error: 'Deepgram API key not found' }, { status: 500 });
        }
        return NextResponse.json({ apiKey });
      }
    }
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const provider = formData.get('provider') as string || 'openai';

    console.log('Transcription request:', { 
      hasAudioFile: !!audioFile, 
      provider, 
      fileSize: audioFile?.size,
      fileType: audioFile?.type 
    });

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { 
      type: audioFile.type 
    });

    console.log('Audio blob created:', { size: audioBlob.size, type: audioBlob.type });

    // Handle AssemblyAI separately to avoid circular calls
    if (provider === 'assemblyai') {
      console.log('Handling AssemblyAI transcription directly...');
      
      const apiKey = process.env.ASSEMBLYAI_API_KEY;
      if (!apiKey) {
        throw new Error('AssemblyAI API key not found');
      }

      // Step 1: Upload audio file to AssemblyAI
      const uploadFormData = new FormData();
      uploadFormData.append('file', audioBlob, 'audio.webm');
      
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`AssemblyAI upload failed: ${errorData.error || uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.upload_url;
      console.log('Audio uploaded to AssemblyAI:', audioUrl);

      // Step 2: Start transcription
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_detection: true,
          punctuate: true,
          format_text: true,
        }),
      });

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        throw new Error(`AssemblyAI transcription failed: ${errorData.error || transcriptResponse.statusText}`);
      }

      const transcriptData = await transcriptResponse.json();
      const transcriptId = transcriptData.id;
      console.log('Transcription started with ID:', transcriptId);

      // Step 3: Poll for completion (with timeout)
      const maxAttempts = 30; // 30 seconds max
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            'Authorization': apiKey,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check transcription status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        console.log('Transcription status:', statusData.status);

        if (statusData.status === 'completed') {
          console.log('AssemblyAI transcription completed:', statusData);
          return NextResponse.json({
            transcript: statusData.text || '',
            language: statusData.language_code || 'en',
            confidence: statusData.confidence || 0.8
          });
        } else if (statusData.status === 'error') {
          throw new Error(`Transcription failed: ${statusData.error}`);
        }

        attempts++;
      }

      throw new Error('Transcription timeout - took too long to complete');
    }

    // For other providers, use the transcription service
    console.log('Creating transcription service for provider:', provider);
    const transcriptionService = createServerTranscriptionService(
      provider as 'openai' | 'google' | 'azure'
    );

    // Transcribe audio
    console.log('Starting transcription...');
    const result = await transcriptionService.transcribeAudio(audioBlob);
    console.log('Transcription completed:', result);

    return NextResponse.json({
      transcript: result.text,
      language: result.language,
      confidence: result.confidence
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Transcription failed',
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Transcription API endpoint',
    supportedProviders: ['openai', 'google', 'azure', 'assemblyai'],
    usage: 'POST with audio file and provider parameter'
  });
}
