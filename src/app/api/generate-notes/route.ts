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

    const prompt = `You are an expert AI assistant creating professional lecture notes from transcripts. Your job is to reconstruct and enhance incomplete or unclear content to create accurate, readable study materials.

Context: ${context || 'General Lecture'}

CRITICAL INSTRUCTIONS:
1. Detect and fix incomplete or missing words using context
2. Maintain correct grammar, flow, and sentence structure
3. Preserve technical terms, subject-specific jargon, and key formulas
4. If a word is unclear, infer the most likely meaning from lecture context
5. Never leave gaps like '[inaudible]' — reconstruct meaning naturally
6. Output should read like accurate lecture notes

Transcript: "${text}"

Create professional, structured notes that are:
- Grammatically correct and complete
- Technically accurate with proper terminology
- Well-organized with clear hierarchy
- Professional quality for study use

Return a JSON array of note objects with this structure:
[
  {
    "content": "• **Main Concept**: Complete, grammatically correct explanation\n• **Key Points**: \n  - Important detail 1\n  - Important detail 2\n• **Technical Terms**: Properly defined terminology",
    "type": "key_point|definition|example|concept",
    "importance": "high|medium|low",
    "title": "Professional topic title (3-6 words)",
    "confidence": "high|medium|low",
    "concept": "Main concept category",
    "subconcepts": ["subconcept1", "subconcept2"]
  }
]

Formatting guidelines:
- Use **bold** for main concepts and key terms
- Use bullet points (•) for main points
- Use sub-bullets (-) for details
- Maintain proper grammar and sentence structure
- Include technical terms and formulas accurately
- Reconstruct incomplete sentences naturally
- Create professional, study-ready content

Generate 1-3 high-quality notes maximum. Focus on accuracy and completeness.`;

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
