import { NextRequest, NextResponse } from 'next/server';

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: NextRequest) {
  try {
    const { text, context, type } = await request.json();

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

    const prompt = `You are an AI assistant helping students take smart notes during live lectures. 

Context: ${context || 'General Lecture'}

Analyze the following transcript text and extract the most important information. Create structured notes that are:
- Clear and concise
- Focused on key concepts, definitions, examples, and important points
- Categorized by importance (high, medium, low)
- Categorized by type (key_point, definition, example, formula, question)

Transcript: "${text}"

Return a JSON array of note objects with this structure:
[
  {
    "content": "Clear, concise note content",
    "type": "key_point|definition|example|formula|question",
    "importance": "high|medium|low"
  }
]

Generate 2-4 notes maximum. Focus on the most important information.`;

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
            content: 'You are an expert note-taking assistant for students. Extract key information from lecture transcripts and create structured, useful notes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
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
    let notes;
    try {
      notes = JSON.parse(content);
    } catch (parseError) {
      // Fallback: create simple notes if JSON parsing fails
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      notes = sentences.slice(0, 3).map(sentence => ({
        content: sentence.trim(),
        type: 'key_point',
        importance: 'medium'
      }));
    }

    return NextResponse.json({
      success: true,
      notes: Array.isArray(notes) ? notes : []
    });

  } catch (error) {
    console.error('Note generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate notes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
