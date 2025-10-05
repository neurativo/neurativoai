import { NextRequest, NextResponse } from 'next/server';

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: NextRequest) {
  try {
    const { newSegment, context, lastTopic } = await request.json();

    if (!newSegment || !context) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a topic continuity watchdog for lecture transcripts.

Your job is to determine if a new transcript segment fits naturally with the previous context or if it represents a topic change or hallucination.

Context (last 3 sentences): "${context}"
Last topic: "${lastTopic}"
New segment: "${newSegment}"

Analyze if the new segment:
1. Continues the same topic naturally
2. Represents a logical transition to a new topic
3. Is a hallucination or completely unrelated content
4. Contains filler words or incomplete thoughts that should be cleaned

Return a JSON response:
{
  "fitsContext": true/false,
  "reason": "Brief explanation of your decision",
  "confidence": 0.0-1.0
}

Guidelines:
- If the new segment continues the same topic or is a natural transition, return true
- If the segment is completely unrelated or appears to be hallucination, return false
- If the segment contains only filler words or incomplete thoughts, return false
- Consider academic context and logical flow
- Be conservative - when in doubt, return false`;

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI API');
    }

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch (parseError) {
      // Fallback parsing
      const fitsContext = content.toLowerCase().includes('"fitsContext": true') || 
                         content.toLowerCase().includes('true');
      return NextResponse.json({
        fitsContext,
        reason: "Fallback parsing used",
        confidence: 0.5
      });
    }

  } catch (error) {
    console.error('Error checking topic continuity:', error);
    return NextResponse.json(
      { error: 'Failed to check topic continuity' },
      { status: 500 }
    );
  }
}
