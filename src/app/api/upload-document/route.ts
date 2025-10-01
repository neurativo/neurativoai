import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/app/lib/documentProcessor';
import { AIStudyPackGenerator } from '@/app/lib/aiStudyPackGenerator';

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

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
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
      course
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

    // Generate study pack
    const generator = new AIStudyPackGenerator({
      difficultyLevel: (difficulty as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
      maxNotesPerSection: 5,
      maxFlashcardsPerTopic: 10,
      maxQuestionsPerChapter: 10,
      includeExamples: true,
      includeDiagrams: true
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
