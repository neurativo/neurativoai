import { NextRequest, NextResponse } from 'next/server';

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

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

    const prompt = `You are an expert AI assistant extracting SMART, USEFUL keywords from corrected lecture transcripts. Your job is to identify the most important terms that students need to know for studying.

CRITICAL INSTRUCTIONS:
1. Extract ONLY the MOST IMPORTANT keywords and concepts
2. Focus on terms that are ESSENTIAL for understanding the topic
3. Include technical terms, key concepts, and important vocabulary
4. Make descriptions CLEAR and HELPFUL for studying
5. Prioritize QUALITY over quantity
6. Only include terms that are ACTUALLY MENTIONED in the corrected transcript
7. Extract the MOST IMPORTANT terms for exam preparation

Text: "${text}"

Extract SMART, USEFUL keywords that are:
- Essential for understanding the topic
- Clearly defined and explained
- Relevant to the actual lecture content
- Useful for studying and exam preparation
- Properly categorized by type
- PERFECT for exam preparation

Return a JSON array of keyword objects with this structure:
[
  {
    "term": "Important keyword or concept",
    "type": "concept|technical|formula|method|definition|example",
    "importance": "high|medium|low",
    "description": "Clear, helpful description for studying"
  }
]

SMART GUIDELINES:
- Extract 3-5 high-quality keywords maximum
- Focus on the MOST IMPORTANT terms only
- Make descriptions clear and study-friendly
- Ensure all terms are relevant to the lecture
- Prioritize terms that are essential for understanding
- Focus on QUALITY over quantity
- Extract the MOST IMPORTANT information only
- Make keywords PERFECT for exam preparation

Extract keywords that are actually useful for studying and exam preparation.`;

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
            content: 'You are an expert at extracting important keywords and key terms from educational content. Focus on terms that are most relevant for students to learn and remember.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
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
    let keywords;
    try {
      keywords = JSON.parse(content);
    } catch (parseError) {
      // Fallback: extract simple keywords if JSON parsing fails
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 4)
        .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much', 'some', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'these', 'think', 'want', 'were', 'what', 'when', 'will', 'with', 'your'].includes(word));
      
      // Get unique words and convert to new format
      const uniqueWords = [...new Set(words)].slice(0, 5);
      keywords = uniqueWords.map(word => ({
        term: word,
        type: 'concept',
        importance: 'medium',
        description: 'Extracted from lecture content'
      }));
    }

    return NextResponse.json({
      success: true,
      keywords: Array.isArray(keywords) ? keywords : []
    });

  } catch (error) {
    console.error('Keyword extraction error:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract keywords',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
