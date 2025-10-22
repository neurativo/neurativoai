import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Document analysis API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }

    console.log('Document analysis request:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId
    });

    // Get user's plan and limits
    const { data: userData, error: userError } = await supabase
      .from('subscriptions')
      .select(`
        plan_id,
        plans (
          key,
          name,
          document_quiz_limit,
          daily_quiz_generations,
          max_questions_per_quiz
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User plan not found' },
        { status: 404 }
      );
    }

    const plan = userData.plans as any;
    console.log('User plan:', plan);

    // Check if user has document quiz access
    if (!plan || plan.document_quiz_limit === 0) {
      return NextResponse.json(
        { error: 'Document quiz not available in your plan' },
        { status: 403 }
      );
    }

    // Check daily usage
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyUsage } = await supabase
      .from('user_daily_usage')
      .select('used_count')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('usage_type', 'document_quiz_generations')
      .single();

    const dailyUsed = dailyUsage?.used_count || 0;
    if (dailyUsed >= (plan.daily_quiz_generations || 0)) {
      return NextResponse.json(
        { error: 'Daily quiz generation limit reached' },
        { status: 429 }
      );
    }

    // Process document based on file type
    let documentContent = '';
    let pageCount = 0;
    let wordCount = 0;

    try {
    if (file.type === 'application/pdf') {
      const result = await processPDF(file);
      documentContent = result.content;
      pageCount = result.pageCount;
      wordCount = result.wordCount;
    } else if (file.type.includes('text/') || file.name.endsWith('.txt')) {
      const result = await processTextFile(file);
      documentContent = result.content;
      pageCount = result.pageCount;
      wordCount = result.wordCount;
    } else if (file.type.includes('application/vnd.openxmlformats') || file.name.endsWith('.docx')) {
      const result = await processWordDocument(file);
      documentContent = result.content;
      pageCount = result.pageCount;
      wordCount = result.wordCount;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, TXT, or DOCX files.' },
        { status: 400 }
      );
    }
    } catch (processingError) {
      console.error('Document processing error:', processingError);
      return NextResponse.json(
        { 
          error: 'Failed to process document',
          details: processingError instanceof Error ? processingError.message : 'Unknown processing error',
          fileName: file.name,
          fileType: file.type
        },
        { status: 400 }
      );
    }

    // Validate document content
    if (!documentContent || documentContent.trim().length < 10) {
      return NextResponse.json(
        { 
          error: 'Document appears to be empty or contains insufficient text. Please ensure your document has readable content.',
          details: {
            contentLength: documentContent?.length || 0,
            fileType: file.type,
            fileName: file.name
          }
        },
        { status: 400 }
      );
    }

    console.log('Document processed successfully:', {
      fileName: file.name,
      contentLength: documentContent.length,
      pageCount,
      wordCount,
      fileType: file.type
    });

    // Check page and word limits based on plan
    const planKey = plan.key || 'free';
    const maxPages = getMaxPagesForPlan(planKey);
    const maxWords = getMaxWordsForPlan(planKey);
    
    if (pageCount > maxPages) {
      return NextResponse.json(
        { 
          error: `Document has ${pageCount} pages, but your plan allows maximum ${maxPages} pages`,
          pageCount,
          maxPages,
          plan: plan.name || 'Unknown Plan'
        },
        { status: 413 }
      );
    }
    
    if (wordCount > maxWords) {
      return NextResponse.json(
        { 
          error: `Document has ${wordCount} words, but your plan allows maximum ${maxWords} words`,
          wordCount,
          maxWords,
          plan: plan.name || 'Unknown Plan'
        },
        { status: 413 }
      );
    }

    // Analyze document content with enhanced analysis
    const analysis = await analyzeDocument(documentContent, planKey, pageCount, wordCount);
    
    // Generate quiz questions with plan-based limits
    const maxQuestions = Math.min(plan.max_questions_per_quiz || 5, getMaxQuestionsForPlan(planKey));
    const quizQuestions = await generateQuizFromDocument(analysis, maxQuestions, planKey);

    // Increment usage
    await supabase.rpc('increment_daily_usage', {
      p_user_id: userId,
      p_usage_type: 'document_quiz_generations',
      p_date: today
    });

    return NextResponse.json({
      success: true,
      document: {
        fileName: file.name,
        pageCount,
        wordCount,
        analysis,
        limits: {
          maxPages: maxPages,
          maxWords: maxWords,
          maxQuestions: maxQuestions
        }
      },
      quiz: {
        questions: quizQuestions,
        totalQuestions: quizQuestions.length,
        difficulty: analysis.difficulty,
        documentType: analysis.documentType,
        estimatedTime: Math.ceil(quizQuestions.length * 1.5), // 1.5 minutes per question
        learningObjectives: analysis.learningObjectives,
        keyConcepts: analysis.keyConcepts,
        topics: analysis.topics
      },
      usage: {
        dailyUsed: dailyUsed + 1,
        dailyLimit: plan.daily_quiz_generations || 0
      }
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Document analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
async function processPDF(file: File): Promise<{ content: string; pageCount: number; wordCount: number }> {
  try {
    console.log('Processing PDF file:', file.name, file.size);
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use pdfjs-dist for PDF parsing
    const pdfjsLib = await import('pdfjs-dist');
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: false,
      disableRange: false,
      disableStream: false
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    // Extract text from all pages
    let fullText = '';
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      fullText += pageText + '\n\n';
    }
    
    // Clean and validate the extracted text
    let cleanText = fullText;
    
    // Remove excessive whitespace and normalize
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Check if we got meaningful content
    if (cleanText.length < 10) {
      throw new Error('PDF appears to contain no readable text. It might be image-based or corrupted.');
    }
    
    console.log('PDF parsed successfully:', {
      pages: numPages,
      textLength: cleanText.length,
      wordCount: cleanText.split(/\s+/).length,
      originalTextLength: fullText.length
    });
    
    return {
      content: cleanText,
      pageCount: numPages,
      wordCount: cleanText.split(/\s+/).length
    };
    
  } catch (error) {
    console.error('PDF processing error:', error);
    // Return fallback
    const text = `PDF processing failed for ${file.name}. Please try a different file format.`;
    return {
      content: text,
      pageCount: 1,
      wordCount: text.split(' ').length
    };
  }
}

async function processTextFile(file: File): Promise<{ content: string; pageCount: number; wordCount: number }> {
  const text = await file.text();
  
  // Clean and validate the text
  let cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Check if we got meaningful content
  if (cleanText.length < 10) {
    throw new Error('Text file appears to be empty or contains insufficient content.');
  }
  
  const wordCount = cleanText.split(/\s+/).length;
  const pageCount = Math.ceil(wordCount / 250); // Estimate 250 words per page
  
  console.log('Text file processed successfully:', {
    fileName: file.name,
    contentLength: cleanText.length,
    wordCount,
    pageCount
  });
  
  return {
    content: cleanText,
    pageCount,
    wordCount
  };
}

async function processWordDocument(file: File): Promise<{ content: string; pageCount: number; wordCount: number }> {
  // For now, return a placeholder - you can integrate with a DOCX processing library
  const text = `Word document processing not implemented yet. File: ${file.name}. Please convert your document to PDF or TXT format for analysis.`;
  
  console.log('Word document processing not available:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });
  
  return {
    content: text,
    pageCount: 1, // Placeholder
    wordCount: text.split(' ').length
  };
}

function getMaxPagesForPlan(planKey: string): number {
  const limits = {
    'free': 5,
    'plus': 20,
    'premium': 50,
    'pro': 100,
    'special': 200
  };
  return limits[planKey as keyof typeof limits] || 5;
}

function getMaxWordsForPlan(planKey: string): number {
  const limits = {
    'free': 2500,    // ~10 pages at 250 words/page
    'plus': 10000,   // ~40 pages
    'premium': 25000, // ~100 pages
    'pro': 50000,    // ~200 pages
    'special': 100000 // ~400 pages
  };
  return limits[planKey as keyof typeof limits] || 2500;
}

function getMaxQuestionsForPlan(planKey: string): number {
  const limits = {
    'free': 5,
    'plus': 10,
    'premium': 15,
    'pro': 20,
    'special': 25
  };
  return limits[planKey as keyof typeof limits] || 5;
}

function getContentLimitForPlan(planKey: string): number {
  const limits = {
    'free': 8000,     // ~2 pages worth of content
    'plus': 16000,    // ~4 pages
    'premium': 32000, // ~8 pages
    'pro': 64000,     // ~16 pages
    'special': 128000 // ~32 pages
  };
  return limits[planKey as keyof typeof limits] || 8000;
}

function getDifficultyDistribution(planKey: string, documentDifficulty: string): { easy: number; medium: number; hard: number } {
  // Higher-tier plans get more challenging questions
  const distributions = {
    'free': { easy: 0.6, medium: 0.4, hard: 0.0 },
    'plus': { easy: 0.4, medium: 0.5, hard: 0.1 },
    'premium': { easy: 0.3, medium: 0.5, hard: 0.2 },
    'pro': { easy: 0.2, medium: 0.5, hard: 0.3 },
    'special': { easy: 0.1, medium: 0.4, hard: 0.5 }
  };
  
  const baseDistribution = distributions[planKey as keyof typeof distributions] || distributions['free'];
  
  // Adjust based on document difficulty
  if (documentDifficulty === 'easy') {
    return { easy: 0.5, medium: 0.4, hard: 0.1 };
  } else if (documentDifficulty === 'hard') {
    return { easy: 0.1, medium: 0.4, hard: 0.5 };
  }
  
  return baseDistribution;
}

async function analyzeDocument(content: string, planKey: string, pageCount: number, wordCount: number): Promise<any> {
  try {
    console.log('Analyzing document with AI...', { 
      contentLength: content.length, 
      planKey, 
      pageCount, 
      wordCount 
    });
    
    // Determine content limit based on plan
    const contentLimit = getContentLimitForPlan(planKey);
    const truncatedContent = content.substring(0, contentLimit);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert document analyzer and educational content specialist. Analyze the given document comprehensively and extract:

1. **Executive Summary** (3-4 sentences): A clear, concise overview of the document's main purpose and key findings
2. **Key Concepts** (8-12 most important): The most critical concepts, terms, and ideas that readers must understand
3. **Main Topics/Themes** (4-6 topics): The primary subject areas and themes covered
4. **Difficulty Level** (easy/medium/hard): Overall complexity based on vocabulary, concepts, and structure
5. **Document Type** (academic/research/business/technical/educational/other): The nature and purpose of the document
6. **Key Learning Objectives** (3-5 objectives): What readers should be able to do after studying this content
7. **Important Definitions** (5-8 terms): Critical terms that need clear understanding
8. **Estimated Reading Time** (in minutes): Based on content complexity and length
9. **Content Structure**: How the document is organized (sections, chapters, etc.)
10. **Prerequisites**: What background knowledge is needed to understand this content

Return your analysis as a JSON object with these exact keys: 
summary, keyConcepts, topics, difficulty, documentType, learningObjectives, definitions, estimatedReadingTime, contentStructure, prerequisites.`
          },
          {
            role: 'user',
            content: `Please analyze this document (${pageCount} pages, ${wordCount} words):

${truncatedContent}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('No analysis received from AI');
    }

    // Parse the JSON response
    const analysis = JSON.parse(analysisText);
    
    // Validate and set defaults with enhanced structure
    return {
      summary: analysis.summary || 'Document analysis completed',
      keyConcepts: Array.isArray(analysis.keyConcepts) ? analysis.keyConcepts : ['Key concepts extracted'],
      topics: Array.isArray(analysis.topics) ? analysis.topics : ['Main topics'],
      difficulty: analysis.difficulty || 'medium',
      documentType: analysis.documentType || 'general',
      learningObjectives: Array.isArray(analysis.learningObjectives) ? analysis.learningObjectives : ['Understand key concepts'],
      definitions: Array.isArray(analysis.definitions) ? analysis.definitions : ['Important terms'],
      estimatedReadingTime: analysis.estimatedReadingTime || Math.ceil(wordCount / 200),
      contentStructure: analysis.contentStructure || 'Structured content',
      prerequisites: Array.isArray(analysis.prerequisites) ? analysis.prerequisites : ['Basic knowledge'],
      pageCount,
      wordCount
    };
    
  } catch (error) {
    console.error('Document analysis error:', error);
    // Return fallback analysis with enhanced structure
    return {
      summary: 'Document analysis completed (AI analysis unavailable)',
      keyConcepts: ['Key concepts', 'Important terms', 'Main ideas'],
      topics: ['General topics', 'Main themes'],
      difficulty: 'medium',
      documentType: 'general',
      learningObjectives: ['Understand key concepts', 'Apply knowledge'],
      definitions: ['Important terms', 'Key definitions'],
      estimatedReadingTime: Math.ceil(wordCount / 200),
      contentStructure: 'Structured content',
      prerequisites: ['Basic knowledge'],
      pageCount,
      wordCount
    };
  }
}

async function generateQuizFromDocument(analysis: any, maxQuestions: number, planKey: string): Promise<any[]> {
  try {
    console.log('Generating quiz with AI...', { 
      maxQuestions, 
      planKey,
      analysisKeys: Object.keys(analysis),
      documentType: analysis.documentType,
      difficulty: analysis.difficulty
    });
    
    // Determine difficulty distribution based on plan
    const difficultyDistribution = getDifficultyDistribution(planKey, analysis.difficulty);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational quiz generator and assessment specialist. Create high-quality, pedagogically sound multiple-choice questions based on the comprehensive document analysis provided.

**Requirements:**
- Generate exactly ${maxQuestions} questions
- Each question should have 4 options (A, B, C, D)
- Only one correct answer per question
- Include a clear, educational explanation for the correct answer
- Vary difficulty levels according to this distribution: ${JSON.stringify(difficultyDistribution)}
- Focus on the key concepts, learning objectives, and definitions from the analysis
- Make questions test deep understanding, application, and critical thinking
- Avoid trivial or obvious questions
- Ensure distractors are plausible but clearly incorrect
- Include questions that test different cognitive levels (remember, understand, apply, analyze)

**Question Types to Include:**
- Conceptual understanding questions
- Application-based scenarios
- Definition and terminology questions
- Process and procedure questions
- Analysis and comparison questions
- Problem-solving questions

Return as JSON array with this exact structure:
[
  {
    "id": "1",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation for why this answer is correct, including key concepts and reasoning",
    "difficulty": "easy|medium|hard",
    "concept": "Key concept being tested",
    "learningObjective": "Which learning objective this question addresses",
    "questionType": "conceptual|application|definition|process|analysis|problem-solving"
  }
]`
          },
          {
            role: 'user',
            content: `Generate a comprehensive quiz based on this document analysis:

**Document Overview:**
- Type: ${analysis.documentType}
- Pages: ${analysis.pageCount}
- Words: ${analysis.wordCount}
- Difficulty: ${analysis.difficulty}

**Executive Summary:** ${analysis.summary}

**Key Concepts:** ${analysis.keyConcepts.join(', ')}

**Main Topics:** ${analysis.topics.join(', ')}

**Learning Objectives:** ${analysis.learningObjectives.join(', ')}

**Important Definitions:** ${analysis.definitions.join(', ')}

**Content Structure:** ${analysis.contentStructure}

**Prerequisites:** ${analysis.prerequisites.join(', ')}

Create ${maxQuestions} high-quality questions that comprehensively test understanding of these concepts, topics, and learning objectives. Ensure the questions are appropriate for the document's difficulty level and type.`
          }
        ],
        temperature: 0.6,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const quizText = data.choices[0]?.message?.content;
    
    if (!quizText) {
      throw new Error('No quiz received from AI');
    }

    // Parse the JSON response
    const questions = JSON.parse(quizText);
    
    // Validate and ensure we have the right number of questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid quiz format received');
    }

    // Ensure we don't exceed maxQuestions
    const limitedQuestions = questions.slice(0, maxQuestions);
    
    // Add IDs if missing and validate structure with enhanced fields
    return limitedQuestions.map((q: any, index: number) => ({
      id: q.id || String(index + 1),
      question: q.question || 'Question not available',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < 4 ? q.correctAnswer : 0,
      explanation: q.explanation || 'Explanation not available',
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      concept: q.concept || 'General concept',
      learningObjective: q.learningObjective || 'Understand key concepts',
      questionType: ['conceptual', 'application', 'definition', 'process', 'analysis', 'problem-solving'].includes(q.questionType) ? q.questionType : 'conceptual'
    }));
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    // Return fallback questions with enhanced structure
    return [
      {
        id: '1',
        question: 'What is the main topic discussed in this document?',
        options: ['The main topic from the analysis', 'A secondary topic', 'An unrelated topic', 'No clear topic'],
        correctAnswer: 0,
        explanation: 'Based on the document analysis, the main topic is clearly identified.',
        difficulty: 'easy',
        concept: 'Main Topic',
        learningObjective: 'Understand the main topic',
        questionType: 'conceptual'
      },
      {
        id: '2',
        question: 'Which of the following is a key concept mentioned in the document?',
        options: ['A key concept from the analysis', 'An unrelated concept', 'A general concept', 'No specific concept'],
        correctAnswer: 0,
        explanation: 'This concept was identified as one of the key concepts in the document analysis.',
        difficulty: 'medium',
        concept: 'Key Concepts',
        learningObjective: 'Identify key concepts',
        questionType: 'definition'
      }
    ].slice(0, maxQuestions);
  }
}