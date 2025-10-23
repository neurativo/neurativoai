import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSecureResponse, secureLog, secureErrorLog, securityHeaders } from '@/app/lib/secureApi';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { studyPackId, message, studyContent, conversationHistory } = await request.json();

    if (!message || !studyPackId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: securityHeaders }
      );
    }

    secureLog('AI tutor chat request', { studyPackId, messageLength: message.length });

    // Build context from study content
    const context = buildStudyContext(studyContent);
    
    // Build conversation context
    const conversationContext = conversationHistory
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `
You are an AI study tutor helping a student with their study materials. Use the following context to provide helpful, educational responses.

STUDY CONTENT CONTEXT:
${context}

CONVERSATION HISTORY:
${conversationContext}

CURRENT QUESTION:
${message}

Instructions:
1. Provide clear, educational explanations
2. Reference specific concepts from the study materials when relevant
3. Ask follow-up questions to deepen understanding
4. Be encouraging and supportive
5. If the question is unclear, ask for clarification
6. Suggest related topics or concepts to explore

Respond in a conversational, helpful tone. Keep responses concise but informative (2-3 paragraphs max).
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI study tutor. Help students understand their study materials through clear explanations, examples, and guided questions. Be encouraging and educational."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    // Determine response type based on content
    const responseType = determineResponseType(message, aiResponse);
    
    // Find related content
    const relatedContent = findRelatedContent(message, studyContent);

    const result = {
      response: aiResponse,
      type: responseType,
      relatedContent,
      timestamp: new Date().toISOString()
    };

    secureLog('AI tutor response generated', { 
      studyPackId, 
      responseType, 
      hasRelatedContent: !!relatedContent 
    });

    return NextResponse.json(result, {
      headers: securityHeaders
    });

  } catch (error) {
    secureErrorLog('AI tutor chat error', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: process.env.NODE_ENV === 'production' 
          ? 'Please try again later.' 
          : error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: securityHeaders }
    );
  }
}

function buildStudyContext(studyContent: any): string {
  let context = '';

  // Add notes context
  if (studyContent.notes && studyContent.notes.length > 0) {
    context += '\nSTUDY NOTES:\n';
    studyContent.notes.forEach((note: any, index: number) => {
      context += `\nNote ${index + 1}: ${note.title}\n`;
      if (note.content?.summary?.keyConcepts) {
        context += `Key Concepts: ${note.content.summary.keyConcepts.join(', ')}\n`;
      }
      if (note.content?.importantTopics?.definitions) {
        const definitions = Object.entries(note.content.importantTopics.definitions)
          .map(([term, def]) => `${term}: ${def}`)
          .join('; ');
        context += `Definitions: ${definitions}\n`;
      }
    });
  }

  // Add flashcards context
  if (studyContent.flashcards && studyContent.flashcards.length > 0) {
    context += '\nFLASHCARDS:\n';
    studyContent.flashcards.slice(0, 10).forEach((card: any, index: number) => {
      context += `\nCard ${index + 1}: ${card.front} → ${card.back}\n`;
    });
  }

  // Add quizzes context
  if (studyContent.quizzes && studyContent.quizzes.length > 0) {
    context += '\nQUIZZES:\n';
    studyContent.quizzes.forEach((quiz: any, index: number) => {
      context += `\nQuiz ${index + 1}: ${quiz.title} (${quiz.totalQuestions} questions)\n`;
    });
  }

  return context;
}

function determineResponseType(message: string, response: string): string {
  const lowerMessage = message.toLowerCase();
  const lowerResponse = response.toLowerCase();

  if (lowerMessage.includes('what') || lowerMessage.includes('explain') || lowerMessage.includes('how')) {
    return 'explanation';
  }

  if (lowerMessage.includes('?') || lowerResponse.includes('?')) {
    return 'question';
  }

  if (lowerResponse.includes('hint') || lowerResponse.includes('try') || lowerResponse.includes('consider')) {
    return 'hint';
  }

  if (lowerResponse.includes('great') || lowerResponse.includes('excellent') || lowerResponse.includes('good job')) {
    return 'encouragement';
  }

  return 'explanation';
}

function findRelatedContent(message: string, studyContent: any): any {
  const lowerMessage = message.toLowerCase();
  
  // Search in notes
  if (studyContent.notes) {
    for (const note of studyContent.notes) {
      if (note.title && lowerMessage.includes(note.title.toLowerCase())) {
        return {
          type: 'note',
          id: note.id,
          title: note.title
        };
      }
      
      if (note.content?.summary?.keyConcepts) {
        for (const concept of note.content.summary.keyConcepts) {
          if (lowerMessage.includes(concept.toLowerCase())) {
            return {
              type: 'note',
              id: note.id,
              title: note.title
            };
          }
        }
      }
    }
  }

  // Search in flashcards
  if (studyContent.flashcards) {
    for (const card of studyContent.flashcards) {
      if (card.front && lowerMessage.includes(card.front.toLowerCase())) {
        return {
          type: 'flashcard',
          id: card.id,
          title: card.front
        };
      }
    }
  }

  // Search in quizzes
  if (studyContent.quizzes) {
    for (const quiz of studyContent.quizzes) {
      if (quiz.title && lowerMessage.includes(quiz.title.toLowerCase())) {
        return {
          type: 'quiz',
          id: quiz.id,
          title: quiz.title
        };
      }
    }
  }

  return null;
}
