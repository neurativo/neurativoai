import { NextRequest, NextResponse } from 'next/server';
import { UsageTracker } from '@/lib/usage-tracker';
import { getUserLimits, getPricing } from '@/lib/usage-limits';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's current usage and limits
    const usage = await UsageTracker.getUserUsage(userId);
    if (!usage) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const limits = getUserLimits(usage.plan);
    const pricing = getPricing(usage.plan);

    // Calculate remaining quotas
    const dailyRemaining = limits.dailyQuizzes === -1 
      ? -1 
      : Math.max(0, limits.dailyQuizzes - usage.dailyQuizzes);
      
    const monthlyRemaining = limits.monthlyQuizzes === -1 
      ? -1 
      : Math.max(0, limits.monthlyQuizzes - usage.monthlyQuizzes);

    const fileUploadsRemaining = limits.maxFileUploads === -1 
      ? -1 
      : Math.max(0, limits.maxFileUploads - usage.monthlyFileUploads);

    return NextResponse.json({
      user: {
        id: usage.userId,
        plan: usage.plan,
        pricing: pricing,
      },
      usage: {
        dailyQuizzes: usage.dailyQuizzes,
        monthlyQuizzes: usage.monthlyQuizzes,
        dailyFileUploads: usage.dailyFileUploads,
        monthlyFileUploads: usage.monthlyFileUploads,
      },
      limits: {
        dailyQuizzes: limits.dailyQuizzes,
        monthlyQuizzes: limits.monthlyQuizzes,
        maxFileUploads: limits.maxFileUploads,
        quizTypes: limits.quizTypes,
        maxQuestionsPerQuiz: limits.maxQuestionsPerQuiz,
        maxQuizDuration: limits.maxQuizDuration,
      },
      remaining: {
        dailyQuizzes: dailyRemaining,
        monthlyQuizzes: monthlyRemaining,
        fileUploads: fileUploadsRemaining,
      },
      features: {
        canAccessLectures: limits.canAccessLectures,
        canAccessStudyPacks: limits.canAccessStudyPacks,
        canExportData: limits.canExportData,
        canUseAdvancedFeatures: limits.canUseAdvancedFeatures,
        canCreateCustomQuizzes: limits.canCreateCustomQuizzes,
        canAccessAnalytics: limits.canAccessAnalytics,
        canUseAIFeatures: limits.canUseAIFeatures,
        canAccessPrioritySupport: limits.canAccessPrioritySupport,
      },
    });
  } catch (error) {
    console.error('Usage limits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
