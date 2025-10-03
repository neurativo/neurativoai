import { NextRequest, NextResponse } from 'next/server';

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: NextRequest) {
  try {
    const { text, context, count = 2 } = await request.json();

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Text too short for processing' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are an AI assistant creating educational flashcards for students during live lectures.

Context: ${context || 'General Lecture'}

Analyze the following transcript text and create high-quality flashcards that are:
- Educational and useful for studying
- Clear and concise
- Focused on key concepts, definitions, or important facts
- Suitable for active recall practice

Transcript: "${text}"

Create exactly ${count} flashcards. Return a JSON array of flashcard objects with this structure:
[
  {
    "front": "Question or term to study",
    "back": "Answer or definition"
  }
]

Make the questions specific and the answers comprehensive but concise.`;

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
            content: 'You are an expert educational content creator. Create high-quality flashcards that help students learn and retain information effectively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    let flashcards;
    try {
      flashcards = JSON.parse(content);
    } catch (parseError) {
      // Fallback: create simple flashcards if JSON parsing fails
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      flashcards = sentences.slice(0, count).map((sentence, index) => ({
        front: `Key Point ${index + 1}`,
        back: sentence.trim()
      }));
    }

    return NextResponse.json({
      success: true,
      flashcards: Array.isArray(flashcards) ? flashcards : []
    });

  } catch (error) {
    console.error('Flashcard generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate flashcards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
