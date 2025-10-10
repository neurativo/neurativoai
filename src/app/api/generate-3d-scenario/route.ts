import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert 3D educational scenario designer. Analyze quiz questions and content to create appropriate 3D interactive scenarios that help students learn through visual and interactive experiences.

Return ONLY valid JSON with this exact structure:
{
  "scenario": {
    "type": "physics|biology|geography|chemistry|math|history|general",
    "objects": [
      {
        "id": "unique_id",
        "type": "box|sphere|cylinder|plane",
        "position": [x, y, z],
        "size": [width, height, depth],
        "color": "#hexcolor",
        "interactive": true|false,
        "label": "Display Label"
      }
    ]
  }
}

Guidelines:
- Choose scenario type based on content subject matter
- Create 2-6 objects that relate to the question
- Use appropriate colors (hex format)
- Position objects in logical 3D arrangement
- Make objects interactive if they represent answer choices
- Use descriptive labels
- If no suitable 3D scenario, return: {"scenario": null}

Return ONLY the JSON, no other text.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    try {
      const parsed = JSON.parse(response);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error generating 3D scenario:', error);
    return NextResponse.json({ error: 'Failed to generate 3D scenario' }, { status: 500 });
  }
}
