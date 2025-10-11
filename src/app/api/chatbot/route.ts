import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Site-specific knowledge base for the chatbot
const SITE_KNOWLEDGE = `
You are Neurativo's AI assistant, helping users navigate and understand our AI-powered education platform. Here's what you need to know:

## About Neurativo:
- AI-powered education platform for students
- Founded by Shazad Arshad and Shariff Ahamed in 2025
- Mission: Transform education with intelligent learning experiences
- Slogan: "Transforming Education with Intelligence"

## Core Features:
1. **AI Quiz Generation**: Create personalized quizzes from text, documents, or URLs
2. **Live Lecture Assistant**: Real-time transcription, note-taking, and flashcard generation
3. **Study Pack Generator**: Comprehensive study materials with notes, flashcards, and quizzes
4. **3D Interactive Learning**: Immersive 3D quizzes for subjects like Physics, Biology, Geography, CS
5. **Progress Tracking**: Analytics and performance insights
6. **Multi-format Support**: PDF, DOCX, text, URLs, images

## Subscription Plans:
- **Essential**: Free tier with basic features
- **Professional**: Advanced features and higher limits
- **Mastery**: Premium features for serious learners
- **Innovation**: Enterprise-level features

## Key Pages:
- /quiz: Main quiz creation and management
- /lecture: Live lecture assistant
- /library: User's saved content
- /pricing: Subscription plans
- /dashboard: User dashboard and analytics
- /about: Company information and FAQ

## Common User Queries:
- How to create quizzes
- How to use live lecture features
- Subscription and pricing questions
- Technical support issues
- Feature explanations
- Account management

## Guidelines:
- Be helpful, friendly, and professional
- Provide specific, actionable answers
- Direct users to relevant pages when appropriate
- If you don't know something, suggest contacting support
- Always maintain a positive, encouraging tone
- Focus on helping users succeed with their learning goals
`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation context
    const messages = [
      {
        role: 'system' as const,
        content: SITE_KNOWLEDGE
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user' as const,
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    
    // Get the message from the request body for fallback
    let userMessage = '';
    try {
      const body = await request.json();
      userMessage = body.message || '';
    } catch {
      // If we can't parse the body, use empty string
    }
    
    // Fallback responses for common queries
    const fallbackResponses: { [key: string]: string } = {
      'quiz': 'To create a quiz, go to the Quiz page (/quiz) and choose from text, document, or URL options. You can generate personalized quizzes with AI-powered questions.',
      'lecture': 'The Live Lecture feature (/lecture) provides real-time transcription, note-taking, and flashcard generation during lectures.',
      'pricing': 'Check our Pricing page (/pricing) for subscription plans. We offer Essential (free), Professional, Mastery, and Innovation tiers.',
      'help': 'I\'m here to help! You can ask me about features, pricing, how to use the platform, or any other questions about Neurativo.',
      'support': 'For technical support, please contact us through the About page or try the features mentioned in our FAQ section.'
    };

    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (lowerMessage.includes(key)) {
        return NextResponse.json({
          response,
          timestamp: new Date().toISOString(),
          fallback: true
        });
      }
    }

    return NextResponse.json({
      response: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact our support team for assistance.',
      timestamp: new Date().toISOString(),
      error: true
    }, { status: 500 });
  }
}
