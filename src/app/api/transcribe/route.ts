import { NextRequest, NextResponse } from 'next/server';
import { createTranscriptionService } from '@/app/lib/audioTranscriptionService';

export async function POST(request: NextRequest) {
  try {
    console.log('Transcription API called');
    
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

    // Create transcription service
    console.log('Creating transcription service for provider:', provider);
    const transcriptionService = createTranscriptionService(
      provider as 'openai' | 'google' | 'azure' | 'assemblyai'
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
