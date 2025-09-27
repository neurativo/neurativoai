import { NextRequest, NextResponse } from 'next/server';
import { createTranscriptionService } from '@/app/lib/audioTranscriptionService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const provider = formData.get('provider') as string || 'openai';

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

    // Create transcription service
    const transcriptionService = createTranscriptionService(
      provider as 'openai' | 'google' | 'azure' | 'assemblyai'
    );

    // Transcribe audio
    const result = await transcriptionService.transcribeAudio(audioBlob);

    return NextResponse.json({
      success: true,
      transcription: result
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error'
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
