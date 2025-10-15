import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UsageTracker } from '@/lib/usage-tracker';
import { isQuizTypeAllowed, getMaxQuestionsForPlan } from '@/lib/usage-limits';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { quizType, questions, subject, difficulty, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user can create a quiz
    const quizCheck = await UsageTracker.canUserCreateQuiz(userId);
    if (!quizCheck.allowed) {
      return NextResponse.json({
        error: 'Quiz limit reached',
        reason: quizCheck.reason,
        dailyRemaining: quizCheck.dailyRemaining,
        monthlyRemaining: quizCheck.monthlyRemaining,
        upgradeRequired: true,
      }, { status: 429 });
    }

    // Check if quiz type is allowed for user's plan
    if (!isQuizTypeAllowed(quizType, 'free')) { // We'll get the actual plan from the user
      return NextResponse.json({
        error: 'Quiz type not allowed',
        reason: `${quizType} quizzes are not available in your current plan`,
        upgradeRequired: true,
      }, { status: 403 });
    }

    // Check question limit
    const maxQuestions = getMaxQuestionsForPlan('free'); // We'll get the actual plan
    if (questions.length > maxQuestions) {
      return NextResponse.json({
        error: 'Question limit exceeded',
        reason: `Maximum ${maxQuestions} questions allowed in your current plan`,
        upgradeRequired: true,
      }, { status: 400 });
    }

    // Create the quiz
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        quiz_type: quizType,
        subject,
        difficulty,
        questions: questions,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quizError) {
      console.error('Quiz creation error:', quizError);
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
    }

    // Record the quiz creation for usage tracking
    await UsageTracker.recordQuizCreation(userId, quizType);

    return NextResponse.json({
      success: true,
      quiz,
      usage: {
        dailyRemaining: quizCheck.dailyRemaining,
        monthlyRemaining: quizCheck.monthlyRemaining,
      },
    });
  } catch (error) {
    console.error('Quiz creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
