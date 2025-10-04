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

    const prompt = `You are an expert transcript editor that reconstructs fragmented speech into perfect, readable sentences while preserving the original meaning.

Context: ${context || 'General Lecture'}

CRITICAL INSTRUCTIONS:
1. Reconstruct fragmented speech into complete, grammatically correct sentences
2. Connect broken phrases and incomplete words naturally
3. Fix obvious grammar errors and sentence structure
4. Remove filler words like "um", "uh", "okay", "right", "so"
5. PRESERVE the speaker's exact meaning and all original concepts
6. Make the text flow naturally and read like proper speech
7. If unclear, make reasonable connections between fragments
8. Create coherent, readable paragraphs

Original fragmented transcript: "${text}"

Transform this fragmented speech into perfect, readable text:
- Connect broken phrases into complete sentences
- Fix grammar and sentence structure
- Remove filler words and repetitions
- Make the text flow naturally
- Keep ALL original concepts and ideas
- Create coherent, readable paragraphs
- Ensure proper punctuation and capitalization

Return only the reconstructed transcript, no JSON or additional formatting.`;

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