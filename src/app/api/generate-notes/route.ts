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

    const prompt = `You are an AI assistant helping students take smart notes during live lectures. You are EXTREMELY intelligent and can extract valuable information even from incomplete, unclear, or fragmented transcript text.

Context: ${context || 'General Lecture'}

IMPORTANT: The transcript below may be incomplete, unclear, or have gaps due to audio issues. Your job is to:
1. Extract ANY useful information, even from partial sentences
2. Infer context and meaning from fragments
3. Generate educational notes even if the transcript is unclear
4. Fill in gaps with logical assumptions based on the context
5. Create valuable study material regardless of transcription quality

Transcript: "${text}"

Create beautifully formatted, structured notes that are:
- Clear and concise with rich formatting
- Focused on key concepts, definitions, examples, and important points
- Categorized by importance (high, medium, low)
- Categorized by type (key_point, definition, example, formula, question, inference, summary)
- Use markdown formatting, emojis, and visual elements for better readability
- Be creative in extracting value from unclear text

Return a JSON array of note objects with this structure:
[
  {
    "content": "**Bold key terms** with *italic emphasis* and 📝 emojis. Use bullet points, numbered lists, and visual separators for clarity. Even if the original text was unclear, provide educational value.",
    "type": "key_point|definition|example|formula|question|inference|summary",
    "importance": "high|medium|low",
    "title": "Short descriptive title for the note",
    "confidence": "high|medium|low"
  }
]

Special instructions for unclear audio:
- If text is fragmented, try to piece together meaning
- If words are unclear, make educated guesses based on context
- If sentences are incomplete, infer what was likely being said
- If technical terms are garbled, suggest likely correct terms
- Always provide educational value, even from poor transcription
- Use "inference" type for notes where you had to guess meaning
- Use "summary" type for consolidating fragmented information

Formatting guidelines:
- Use **bold** for key terms and important concepts
- Use *italics* for emphasis and definitions
- Use 📝, 🔑, 💡, ⚡, 🎯, 📊, 🔬, 📚, ⭐, 🤔, 📋 emojis appropriately
- Use bullet points (•) and numbered lists (1., 2., 3.)
- Use --- for visual separators
- Use > for important quotes or examples
- Use \`code\` formatting for technical terms
- Keep content concise but informative
- Add [inferred] or [likely] tags when making assumptions

Generate 2-5 notes maximum. Be creative and extract maximum educational value from the text, regardless of quality.`;

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
