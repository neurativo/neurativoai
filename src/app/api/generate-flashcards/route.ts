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

    const prompt = `You are an expert AI assistant creating PERFECT, SMART flashcards from corrected lecture transcripts. Your job is to create study-ready flashcards that help students learn and retain information effectively.

Context: ${context || 'General Lecture'}

CRITICAL INSTRUCTIONS:
1. Create flashcards that test UNDERSTANDING, not just memorization
2. Focus on IMPORTANT CONCEPTS and KEY INFORMATION only
3. Make questions CLEAR, SPECIFIC, and STUDY-FRIENDLY
4. Create answers that are COMPLETE but CONCISE
5. Use PROPER ACADEMIC TERMINOLOGY
6. Ensure questions are RELEVANT to the actual lecture content
7. Create flashcards that are ACTUALLY USEFUL for studying
8. Extract the MOST IMPORTANT concepts from the corrected transcript
9. Make flashcards PERFECT for exam preparation

Transcript: "${text}"

Create SMART, USEFUL flashcards that are:
- Focused on the MOST IMPORTANT concepts from the corrected transcript
- Clear and specific in their questions
- Complete but concise in their answers
- Relevant to the actual lecture content
- Useful for studying and exam preparation
- Easy to understand and memorize
- PERFECT for exam preparation

Create exactly ${count} flashcards. Return a JSON array of flashcard objects with this structure:
[
  {
    "front": "Clear, specific question about an important concept",
    "back": "Complete but concise answer with key details",
    "category": "Topic category (e.g., 'Definitions', 'Concepts', 'Applications')",
    "difficulty": "easy|medium|hard"
  }
]

SMART GUIDELINES:
- Focus on the MOST IMPORTANT concepts from the corrected transcript
- Make questions test understanding, not just recall
- Keep answers complete but concise (2-3 sentences max)
- Use proper academic terminology
- Ensure all content is relevant to the lecture
- Make flashcards that are EASY to study with
- Focus on QUALITY over quantity
- Extract the MOST IMPORTANT information only
- Make flashcards PERFECT for exam preparation
- Use bullet points (•) for lists
- Use numbered lists (1., 2., 3.) for steps
- Use > for important quotes or examples
- Use `code` formatting for technical terms
- Use --- for visual separators
- Make questions specific and answers comprehensive but concise

Make the questions engaging and the answers detailed but easy to understand.`;

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
