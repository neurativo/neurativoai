import { NextRequest, NextResponse } from 'next/server';

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: NextRequest) {
  try {
    const { text, context } = await request.json();

    if (!text || text.trim().length < 10) {
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

    const prompt = `You are an expert at reconstructing incomplete or unclear lecture transcripts into perfect, readable text.

Context: ${context || 'General Lecture'}

CRITICAL INSTRUCTIONS:
1. ALWAYS detect and fix incomplete or missing words using context
2. ALWAYS maintain correct grammar, flow, and sentence structure
3. ALWAYS preserve technical terms, subject-specific jargon, and key formulas
4. If a word is unclear, infer the most likely meaning from lecture context
5. NEVER leave gaps like '[inaudible]' — reconstruct meaning naturally
6. Output should read like accurate, professional lecture notes

Original transcript: "${text}"

Reconstruct this into perfect, readable lecture content that:
- Has complete, grammatically correct sentences
- Preserves all technical terms and formulas
- Maintains proper academic tone
- Flows naturally and logically
- Is ready for professional use

Return only the reconstructed text, no JSON or additional formatting.`;

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