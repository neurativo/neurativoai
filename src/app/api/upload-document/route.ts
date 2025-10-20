import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/app/lib/documentProcessor';
import { AIStudyPackGenerator } from '@/app/lib/aiStudyPackGenerator';
import { getSupabaseServer } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { updateJobStatus } from '@/app/api/study-pack/status/route';

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
        { error: `File too large. Maximum size is ${planMaxMb[currentPlan] || 5}MB for ${currentPlan} plan.` },
        { status: 400 }
      );
    }

    // Determine processing mode based on file size
    const CHUNK_THRESHOLD = 10 * 1024 * 1024; // 10MB threshold for chunked processing
    const useChunkedProcessing = file.size > CHUNK_THRESHOLD;

    console.log('Processing document upload:', {
      name: file.name,
      type: file.type,
      size: file.size,
      title,
      subject,
      course,
      plan: currentPlan,
      useChunkedProcessing
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

    // For chunked processing, we'll process in smaller chunks
    if (useChunkedProcessing) {
      console.log('Using chunked processing for large document');
      return await processDocumentInChunks(processedDocument, currentPlan, difficulty);
    }

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

// Chunked processing function for large documents
async function processDocumentInChunks(
  processedDocument: any,
  currentPlan: string,
  difficulty: string
): Promise<NextResponse> {
  const jobId = uuidv4();
  
  try {
    console.log(`Starting chunked processing job ${jobId} for document:`, processedDocument.title);
    
    // Initialize job status
    updateJobStatus(jobId, { status: 'processing', progress: 0 });

    // Plan-based generation configuration
    const planConfig: Record<string, { notes: number; flashcards: number; questions: number; includeDiagrams: boolean; includeExamples: boolean }> = {
      free: { notes: 3, flashcards: 6, questions: 6, includeDiagrams: false, includeExamples: true },
      professional: { notes: 6, flashcards: 15, questions: 12, includeDiagrams: true, includeExamples: true },
      mastery: { notes: 10, flashcards: 25, questions: 20, includeDiagrams: true, includeExamples: true },
      innovation: { notes: 20, flashcards: 50, questions: 40, includeDiagrams: true, includeExamples: true }
    };
    const cfg = planConfig[currentPlan] || planConfig.free;

    // Split document into chunks for processing
    const chunks = splitDocumentIntoChunks(processedDocument, 2000); // 2000 characters per chunk
    console.log(`Document split into ${chunks.length} chunks`);
    updateJobStatus(jobId, { progress: 10 });

    // Process chunks in parallel (with rate limiting)
    const chunkResults = await processChunksInBatches(chunks, cfg, difficulty, jobId);
    updateJobStatus(jobId, { progress: 80 });

    // Merge results from all chunks
    const mergedStudyPack = mergeChunkResults(chunkResults, processedDocument);
    updateJobStatus(jobId, { progress: 90 });

    console.log('Chunked processing completed successfully:', {
      jobId,
      chunksProcessed: chunks.length,
      notes: mergedStudyPack.detailedNotes.length,
      flashcards: mergedStudyPack.flashcardDeck.length,
      questions: mergedStudyPack.quizBank.reduce((sum, pack) => sum + pack.questions.length, 0)
    });

    // Mark job as completed
    updateJobStatus(jobId, { status: 'completed', progress: 100 });

    return NextResponse.json({
      success: true,
      document: processedDocument,
      studyPack: mergedStudyPack,
      message: 'Document processed and study pack generated successfully using chunked processing',
      jobId,
      processingMode: 'chunked'
    });

  } catch (error) {
    console.error('Error in chunked processing:', error);
    updateJobStatus(jobId, { 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { 
        error: 'Failed to process document in chunks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Split document into manageable chunks
function splitDocumentIntoChunks(document: any, chunkSize: number): any[] {
  const chunks: any[] = [];
  const sections = document.sections || [];
  
  for (const section of sections) {
    if (section.content.length <= chunkSize) {
      chunks.push({
        ...section,
        chunkIndex: chunks.length,
        isComplete: true
      });
    } else {
      // Split large sections into smaller chunks
      const words = section.content.split(' ');
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunkWords = words.slice(i, i + chunkSize);
        chunks.push({
          ...section,
          content: chunkWords.join(' '),
          chunkIndex: chunks.length,
          isComplete: i + chunkSize >= words.length
        });
      }
    }
  }
  
  return chunks;
}

// Process chunks in batches to avoid rate limiting
async function processChunksInBatches(
  chunks: any[],
  config: any,
  difficulty: string,
  jobId: string
): Promise<any[]> {
  const BATCH_SIZE = 3; // Process 3 chunks at a time
  const results: any[] = [];
  const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
  
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`Processing batch ${batchNumber}/${totalBatches}`);
    
    // Update progress (10% to 80% range)
    const progress = 10 + (batchNumber / totalBatches) * 70;
    updateJobStatus(jobId, { progress: Math.round(progress) });
    
    const batchPromises = batch.map(async (chunk) => {
      const generator = new AIStudyPackGenerator({
        difficultyLevel: (difficulty as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
        maxNotesPerSection: Math.max(1, Math.floor(config.notes / chunks.length)),
        maxFlashcardsPerTopic: Math.max(1, Math.floor(config.flashcards / chunks.length)),
        maxQuestionsPerChapter: Math.max(1, Math.floor(config.questions / chunks.length)),
        includeExamples: config.includeExamples,
        includeDiagrams: config.includeDiagrams
      });
      
      // Create a minimal document structure for the chunk
      const chunkDocument = {
        id: `chunk-${chunk.chunkIndex}`,
        title: chunk.title || 'Document Chunk',
        type: 'pdf' as const,
        totalPages: 1,
        totalWords: chunk.content.split(' ').length,
        sections: [chunk],
        metadata: chunk.metadata || {}
      };
      
      return await generator.generateStudyPack(chunkDocument);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Merge results from all chunks into a single study pack
function mergeChunkResults(chunkResults: any[], originalDocument: any): any {
  const merged = {
    id: originalDocument.id,
    title: originalDocument.title,
    subject: originalDocument.subject,
    course: originalDocument.course,
    createdAt: new Date().toISOString(),
    detailedNotes: [] as any[],
    flashcardDeck: [] as any[],
    quizBank: [] as any[],
    quickRevisionSheet: '',
    summary: {
      totalTopics: 0,
      totalFlashcards: 0,
      totalQuestions: 0,
      estimatedStudyTime: 0
    },
    chapters: [] as string[],
    glossary: [] as any[]
  };

  // Merge notes
  chunkResults.forEach(result => {
    if (result.detailedNotes) {
      merged.detailedNotes.push(...result.detailedNotes);
    }
  });

  // Merge flashcards
  chunkResults.forEach(result => {
    if (result.flashcardDeck) {
      merged.flashcardDeck.push(...result.flashcardDeck);
    }
  });

  // Merge quiz banks
  chunkResults.forEach(result => {
    if (result.quizBank) {
      merged.quizBank.push(...result.quizBank);
    }
  });

  // Merge revision sheets
  const revisionSheets = chunkResults
    .map(result => result.quickRevisionSheet)
    .filter(Boolean);
  merged.quickRevisionSheet = revisionSheets.join('\n\n');

  // Update summary
  merged.summary = {
    totalTopics: merged.detailedNotes.length,
    totalFlashcards: merged.flashcardDeck.length,
    totalQuestions: merged.quizBank.reduce((sum, pack) => sum + pack.questions.length, 0),
    estimatedStudyTime: Math.ceil((merged.detailedNotes.length + merged.flashcardDeck.length + merged.quizBank.length) / 10)
  };

  // Extract unique chapters
  const chapters = new Set<string>();
  merged.detailedNotes.forEach(note => {
    if (note.chapter) chapters.add(note.chapter);
  });
  merged.chapters = Array.from(chapters);

  return merged;
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
      'AI-generated study materials',
      'Chunked processing for large documents'
    ]
  });
}
