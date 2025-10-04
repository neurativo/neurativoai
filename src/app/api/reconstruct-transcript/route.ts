import { NextRequest, NextResponse } from 'next/server';

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: NextRequest) {
  try {
    const { text, context } = await request.json();

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: 'Text too short for reconstruction' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are an AI transcription corrector for university lectures. 

Input will be raw speech-to-text chunks that may contain errors, missing words, and broken sentences.

Your job:
- Fix grammar and sentence structure
- Restore missing words if context makes it obvious
- Remove random filler phrases like "right", "uh", "50" that don't belong
- Ensure the transcript flows naturally while staying faithful to the speaker's meaning
- Keep technical/academic terms accurate
- Connect broken phrases into complete, coherent sentences
- Remove repetitive words and meaningless fragments
- Fix incomplete words (e.g., "intel" → "intelligence")

Context: ${context || 'General Lecture'}

Input: "${text}"

Transform this fragmented speech into perfect, readable text that sounds like a natural lecture transcript. Return only the corrected transcript, no JSON or additional formatting.`;

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at reconstructing incomplete lecture transcripts into perfect, readable academic content. Always fix grammar, complete missing words, and preserve technical accuracy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const reconstructedText = result.choices?.[0]?.message?.content;

    if (!reconstructedText) {
      throw new Error('No reconstructed text received from OpenAI');
    }

    return NextResponse.json({
      success: true,
      originalText: text,
      reconstructedText: reconstructedText.trim()
    });

  } catch (error) {
    console.error('Transcript reconstruction error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reconstruct transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}