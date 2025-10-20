import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/app/lib/documentProcessor';
import { AIStudyPackGenerator } from '@/app/lib/aiStudyPackGenerator';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const subject = formData.get('subject') as string;
    const course = formData.get('course') as string;
    const difficulty = formData.get('difficulty') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Determine user plan to apply plan-based limits
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    let currentPlan = 'free';
    if (user) {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`subscription_plans!inner(name, daily_limit, monthly_limit, features)`) 
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      currentPlan = (subscription?.subscription_plans as any)?.name?.toLowerCase() || 'free';
    }

    // Allowed mime types (PDF, DOCX, TXT/MD, images)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or image files.' },
        { status: 400 }
      );
    }

    // Plan-based file size limits
    const planMaxMb: Record<string, number> = {
      free: 5,
      professional: 25,
      mastery: 50,
      innovation: 100
    };
    const maxSize = (planMaxMb[currentPlan] || 5) * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    console.log('Processing document upload:', {
      name: file.name,
      type: file.type,
      size: file.size,
      title,
      subject,
      course,
      plan: currentPlan
    });

    // Process the document
    const processor = new DocumentProcessor({
      enableOCR: true,
      minSectionLength: 50,
      examRelevanceThreshold: 0.7
    });

    const processedDocument = await processor.processDocument(file, {
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      subject,
      course
    });

    // Plan-based generation configuration
    const planConfig: Record<string, { notes: number; flashcards: number; questions: number; includeDiagrams: boolean; includeExamples: boolean }> = {
      free: { notes: 3, flashcards: 6, questions: 6, includeDiagrams: false, includeExamples: true },
      professional: { notes: 6, flashcards: 15, questions: 12, includeDiagrams: true, includeExamples: true },
      mastery: { notes: 10, flashcards: 25, questions: 20, includeDiagrams: true, includeExamples: true },
      innovation: { notes: 20, flashcards: 50, questions: 40, includeDiagrams: true, includeExamples: true }
    };
    const cfg = planConfig[currentPlan] || planConfig.free;

    // Generate study pack
    const generator = new AIStudyPackGenerator({
      difficultyLevel: (difficulty as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
      maxNotesPerSection: cfg.notes,
      maxFlashcardsPerTopic: cfg.flashcards,
      maxQuestionsPerChapter: cfg.questions,
      includeExamples: cfg.includeExamples,
      includeDiagrams: cfg.includeDiagrams
    });

    const studyPack = await generator.generateStudyPack(processedDocument);

    console.log('Study pack generated successfully:', {
      documentId: processedDocument.id,
      studyPackId: studyPack.id,
      notes: studyPack.detailedNotes.length,
      flashcards: studyPack.flashcardDeck.length,
      questions: studyPack.quizBank.reduce((sum, pack) => sum + pack.questions.length, 0)
    });

    return NextResponse.json({
      success: true,
      document: processedDocument,
      studyPack,
      message: 'Document processed and study pack generated successfully'
    });

  } catch (error) {
    console.error('Error processing document upload:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Document upload endpoint',
    supportedTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ],
    maxSize: '10MB',
    features: [
      'PDF text extraction',
      'DOCX text extraction',
      'OCR for scanned documents',
      'Automatic content structuring',
      'Exam-relevant content filtering',
      'AI-generated study materials'
    ]
  });
}
