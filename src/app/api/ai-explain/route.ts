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

    const prompt = `Explain this study note in simple, easy-to-understand terms. Make it conversational and helpful for learning:

Title: ${note.title}
Topic: ${note.topic}
Content: ${typeof note.content === 'string' ? note.content : JSON.stringify(note.content)}

Provide a clear, engaging explanation that helps the student understand the concept better. Keep it concise but comprehensive.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI tutor. Explain concepts in simple, engaging terms that help students learn effectively. Be conversational and encouraging.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
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
