import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { note } = await request.json();
    
    if (!note) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
    }

    const prompt = `Provide a professional, concise explanation of this study note. Focus on the key concepts and practical applications. Be direct and educational without being overly conversational.

Title: ${note.title}
Topic: ${note.topic}
Content: ${typeof note.content === 'string' ? note.content : JSON.stringify(note.content)}

Requirements:
- Explain the core concepts clearly and directly
- Highlight practical applications and examples
- Use professional, academic tone
- Keep it focused and concise (max 200 words)
- Do NOT include phrases like "feel free to ask" or "does that make sense"
- Focus on the specific content, not generic explanations`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational AI that provides clear, professional explanations of study materials. Focus on accuracy, clarity, and practical understanding. Avoid generic responses and conversational filler.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const explanation = response.choices[0]?.message?.content;
    
    if (!explanation) {
      return NextResponse.json({ error: 'No explanation generated' }, { status: 500 });
    }

    return NextResponse.json({ explanation });

  } catch (error) {
    console.error('Error generating AI explanation:', error);
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
  }
}
