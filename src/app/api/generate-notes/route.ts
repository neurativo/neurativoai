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

    const prompt = `You are an AI assistant creating clean, readable study notes from lecture transcripts. Focus on creating SHORT, UNDERSTANDABLE notes that students can actually use.

Context: ${context || 'General Lecture'}

IMPORTANT: Create ONLY meaningful, readable notes. If the transcript is too unclear or fragmented, create fewer but better notes.

Transcript: "${text}"

Create clean, readable notes that are:
- SHORT and to the point
- Easy to understand
- In bullet point format
- Focused on actual learning content
- Well-organized and logical

Return a JSON array of note objects with this structure:
[
  {
    "content": "• Clear, concise bullet point\n• Another important point\n• Key concept or definition",
    "type": "key_point|definition|example|concept",
    "importance": "high|medium|low",
    "title": "Brief topic title (2-4 words max)",
    "confidence": "high|medium|low"
  }
]

Guidelines:
- Use simple bullet points (•)
- Keep each note focused on ONE topic
- Make titles short and descriptive
- Only include content that makes sense
- If transcript is unclear, create fewer but better notes
- Focus on educational value, not just word extraction
- Use simple language that students can understand

Generate 1-3 notes maximum. Quality over quantity.`;

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
      notes = sentences.slice(0, 3).map((sentence, index) => ({
        content: sentence.trim(),
        type: index === 0 ? 'key_point' : 'summary',
        importance: 'medium',
        title: `Note ${index + 1}`,
        confidence: 'medium'
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
