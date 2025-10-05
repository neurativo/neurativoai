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

    const prompt = `You are an expert AI assistant creating PERFECT, SMART lecture notes from corrected physics transcripts. Your job is to create study-ready notes that are clear, organized, and actually useful for learning.

Context: ${context || 'Physics Lecture'}

CRITICAL INSTRUCTIONS:
1. Create SHORT, UNDERSTANDABLE notes that students can actually use
2. Focus on ACTUAL LEARNING CONTENT from the corrected transcript
3. Make notes READABLE and LOGICAL, not fragmented
4. Use proper formatting with clear hierarchy
5. Include only MEANINGFUL information that helps with studying
6. Extract the MOST IMPORTANT concepts and key points
7. Create notes that are PERFECT for exam preparation
8. Handle physics equations and formulas properly
9. Organize by physics concepts and principles

Transcript: "${text}"

Create SMART, READABLE physics notes that are:
- SHORT and to the point (not long paragraphs)
- EASY to understand and study from
- WELL-ORGANIZED with clear structure
- FOCUSED on actual learning content
- PROFESSIONAL quality for academic use
- PERFECT for studying and exam preparation
- Include properly formatted equations and formulas

Return a JSON array of note objects with this structure:
[
  {
    "content": "• **Main Concept**: Clear, concise explanation\n• **Key Points**:\n  - Important detail 1\n  - Important detail 2\n• **Equations**: F = ma, E = mc², etc.\n• **Important Terms**: Key vocabulary with brief definitions",
    "type": "key_point|definition|example|concept|equation|law",
    "importance": "high|medium|low",
    "title": "Clear topic title (2-4 words)",
    "confidence": "high|medium|low",
    "concept": "Main concept category",
    "subconcepts": ["subconcept1", "subconcept2"]
  }
]

PHYSICS-SPECIFIC FORMATTING RULES:
- Use **bold** for main concepts and key terms
- Use bullet points (•) for main points
- Use sub-bullets (-) for supporting details
- Include **Equations** section with properly formatted formulas
- Use proper physics notation (F = ma, E = mc², etc.)
- Keep each note FOCUSED on ONE main concept
- Make titles SHORT and DESCRIPTIVE
- Only include content that makes SENSE for studying
- Extract the MOST IMPORTANT information only
- Focus on QUALITY over quantity
- Make notes PERFECT for exam preparation
- Include physics laws and principles clearly

Generate 1-2 high-quality notes maximum. Focus on creating notes that are actually useful for studying and exam preparation.`;

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
