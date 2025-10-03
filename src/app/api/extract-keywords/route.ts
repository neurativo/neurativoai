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

    const prompt = `You are an AI assistant extracting important keywords and key terms from lecture transcripts.

Analyze the following text and extract the most important keywords, terms, concepts, and phrases that students should remember. Focus on:
- Technical terms and jargon
- Important concepts and ideas
- Names of people, places, or things mentioned
- Key phrases and terminology
- Academic or subject-specific vocabulary

Text: "${text}"

Return a JSON array of keywords (strings only, no duplicates):
["keyword1", "keyword2", "keyword3"]

Extract 3-8 keywords maximum. Make them specific and meaningful.`;

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
      
      // Get unique words and take first 5
      keywords = [...new Set(words)].slice(0, 5);
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
