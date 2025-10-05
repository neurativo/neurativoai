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

    const prompt = `You are an expert lecture transcript cleaner and physics equation formatter.

Input will be raw speech-to-text chunks that may contain errors, missing words, and broken sentences from lectures.

Your job:
- Remove filler words such as "uh", "hmm", "like", "right", "okay", "you know", "alright"
- If a filler occurs in the middle of a sentence, replace it with a natural pause or merge contextually
- Keep all educational or technical content intact
- Fix grammar and sentence structure for academic clarity
- Restore missing words if context makes it obvious
- Ensure the transcript flows naturally while staying faithful to the speaker's meaning
- Keep technical/physics terms accurate and properly formatted
- Connect broken phrases into complete, coherent sentences
- Remove repetitive words and meaningless fragments
- Fix incomplete words (e.g., "intel" → "intelligence")
- Detect and properly format physics equations and formulas
- Expand physics abbreviations and symbols correctly
- Handle colloquial expressions professionally

Context: ${context || 'Lecture'}

FILLER REMOVAL EXAMPLES:
- "Machine learning aims uh to teach a machine hmm to perform right a specific task" → "Machine learning aims to teach a machine to perform a specific task"
- "So uh this algorithm right works by like optimizing input patterns" → "This algorithm works by optimizing input patterns"
- "Okay so we have uh the equation F equals ma right" → "We have the equation F = ma"

PHYSICS EQUATION HANDLING:
- Convert "F equals M times A" → "F = ma (Newton's Second Law)"
- Convert "E equals M C squared" → "E = mc² (Einstein's mass-energy equivalence)"
- Convert "V equals I R" → "V = IR (Ohm's Law)"
- Convert "K E equals one half M V squared" → "KE = ½mv² (kinetic energy)"
- Convert "P equals M V" → "p = mv (momentum)"
- Convert "F equals G M M over R squared" → "F = GMm/r² (gravitational force)"
- Handle Greek letters: "theta" → "θ", "alpha" → "α", "beta" → "β"

Input: "${text}"

Transform this fragmented speech into perfect, readable lecture text with properly formatted equations and no filler words. Return only the corrected transcript, no JSON or additional formatting.`;

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