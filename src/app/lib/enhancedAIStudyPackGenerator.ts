import OpenAI from 'openai';
import { DocumentSection } from './documentProcessor';
import { EnhancedFlashcard, EnhancedNote, EnhancedQuiz, StudyPackMetadata } from './types/studyPack';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Safe JSON parsing function for AI responses
const safeJson = (str: string) => {
  try {
    const clean = str.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Invalid AI JSON:", e);
    return {};
  }
};

export class EnhancedAIStudyPackGenerator {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate enhanced study notes with deeper content structure
   */
  async createEnhancedStudyNote(section: DocumentSection): Promise<EnhancedNote> {
    console.log(`Creating enhanced study note for section: ${section.title}`);

    const prompt = `
Create a comprehensive study note for the following content. Structure it with detailed explanations, examples, and learning outcomes.

Content: ${section.content}

Please generate a structured study note with:
1. Summary with key concepts and learning outcomes
2. Important topics with definitions, principles, and formulas
3. Practical examples with code snippets where applicable
4. Exam tips and strategies
5. Related topics for further study

Format as JSON with this structure:
{
  "summary": {
    "title": "Brief descriptive title",
    "keyConcepts": ["concept1", "concept2", "concept3"],
    "learningOutcomes": ["outcome1", "outcome2", "outcome3"]
  },
  "importantTopics": {
    "definitions": {"term1": "definition1", "term2": "definition2"},
    "principles": ["principle1", "principle2"],
    "formulas": ["formula1", "formula2"]
  },
  "examples": [
    {
      "title": "Example title",
      "description": "What this example demonstrates",
      "code": "code snippet if applicable",
      "explanation": "Why this example is important",
      "language": "programming language if applicable"
    }
  ],
  "examTips": ["tip1", "tip2", "tip3"],
  "relatedTopics": ["topic1", "topic2", "topic3"]
}

Make the content educational, practical, and exam-focused. Include specific examples and actionable advice.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsedContent = safeJson(content);

      // Generate table of contents
      const toc = this.generateTOC(parsedContent);

      const enhancedNote: EnhancedNote = {
        id: `note_${section.id}`,
        title: section.title,
        topic: section.title,
        content: {
          summary: {
            title: parsedContent.summary?.title || section.title,
            keyConcepts: parsedContent.summary?.keyConcepts || [],
            learningOutcomes: parsedContent.summary?.learningOutcomes || []
          },
          importantTopics: {
            definitions: parsedContent.importantTopics?.definitions || {},
            principles: parsedContent.importantTopics?.principles || [],
            formulas: parsedContent.importantTopics?.formulas || []
          },
          examples: parsedContent.examples || [],
          examTips: parsedContent.examTips || [],
          relatedTopics: parsedContent.relatedTopics || []
        },
        level: this.determineLevel(section.content),
        estimatedTime: this.estimateReadingTime(section.content),
        difficulty: this.calculateDifficulty(section.content),
        tags: this.extractTags(section.content),
        collapsible: true,
        toc
      };

      console.log(`Enhanced study note created: ${enhancedNote.title}`);
      return enhancedNote;
    } catch (error) {
      console.error("Error creating enhanced study note:", error);
      return this.createFallbackNote(section);
    }
  }

  /**
   * Generate enhanced flashcards with explanations and confidence scoring
   */
  async createEnhancedFlashcards(section: DocumentSection): Promise<EnhancedFlashcard[]> {
    console.log(`Creating enhanced flashcards for section: ${section.title}`);

    const prompt = `
Create 6-8 high-quality flashcards for the following content. Each flashcard should have:
1. A clear, specific question or concept on the front
2. A comprehensive answer on the back
3. An optional explanation for deeper understanding
4. Appropriate difficulty level and type classification

Content: ${section.content}

Generate flashcards that cover:
- Key definitions and concepts
- Important principles and formulas
- Practical applications and examples
- Common exam questions and scenarios

Format as JSON array:
[
  {
    "front": "Question or concept",
    "back": "Detailed answer",
    "explanation": "Optional deeper explanation",
    "difficulty": "easy|medium|hard",
    "type": "definition|concept|application|formula|example",
    "tags": ["tag1", "tag2"]
  }
]

Make flashcards challenging but fair, with clear, unambiguous answers.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || "[]";
      const parsedContent = safeJson(content);

      const flashcards: EnhancedFlashcard[] = (parsedContent || []).map((card: any, index: number) => ({
        id: `flashcard_${section.id}_${index}`,
        front: card.front || "Question not available",
        back: card.back || "Answer not available",
        explanation: card.explanation,
        difficulty: card.difficulty || "medium",
        topic: section.title,
        type: card.type || "concept",
        tags: card.tags || [],
        confidence: 0.5,
        reviewHistory: [],
        aiGenerated: true
      }));

      console.log(`Created ${flashcards.length} enhanced flashcards for ${section.title}`);
      return flashcards;
    } catch (error) {
      console.error("Error creating enhanced flashcards:", error);
      return this.createFallbackFlashcards(section);
    }
  }

  /**
   * Generate enhanced quiz with multiple question types and adaptive features
   */
  async createEnhancedQuiz(section: DocumentSection): Promise<EnhancedQuiz> {
    console.log(`Creating enhanced quiz for section: ${section.title}`);

    const prompt = `
Create a comprehensive quiz for the following content with 8-12 questions covering different question types and difficulty levels.

Content: ${section.content}

Generate questions that include:
- Multiple choice questions (4-6 questions)
- Fill-in-the-blank questions (2-3 questions)
- Short answer questions (2-3 questions)
- Essay questions (1-2 questions)

Each question should have:
1. Clear, unambiguous wording
2. Appropriate difficulty level
3. Correct answer(s)
4. Detailed explanation
5. Point value based on difficulty

Format as JSON:
{
  "questions": [
    {
      "question": "Question text",
      "type": "multiple-choice|fill-in-blank|short-answer|essay",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "correct answer or array for multiple correct answers",
      "explanation": "Why this answer is correct",
      "difficulty": "easy|medium|hard",
      "points": 10
    }
  ]
}

Make questions challenging but fair, with clear explanations for learning.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsedContent = safeJson(content);

      const questions = (parsedContent.questions || []).map((q: any, index: number) => ({
        id: `question_${section.id}_${index}`,
        question: q.question || "Question not available",
        type: q.type || "multiple-choice",
        options: q.options || [],
        correctAnswer: q.correctAnswer || "",
        explanation: q.explanation || "Explanation not available",
        difficulty: q.difficulty || "medium",
        points: q.points || 10,
        timeLimit: this.getTimeLimit(q.type, q.difficulty)
      }));

      const totalPoints = questions.reduce((sum: number, q: any) => sum + q.points, 0);
      const estimatedTime = questions.reduce((sum: number, q: any) => sum + (q.timeLimit || 60), 0);

      const enhancedQuiz: EnhancedQuiz = {
        id: `quiz_${section.id}`,
        title: `${section.title} - Quiz`,
        questions,
        totalQuestions: questions.length,
        estimatedTime: Math.ceil(estimatedTime / 60),
        difficulty: this.calculateOverallDifficulty(questions),
        totalPoints,
        passingScore: 70,
        adaptiveMode: true,
        shuffleQuestions: true,
        timeLimit: Math.ceil(estimatedTime / 60) * 60 // Convert to seconds
      };

      console.log(`Created enhanced quiz with ${questions.length} questions for ${section.title}`);
      return enhancedQuiz;
    } catch (error) {
      console.error("Error creating enhanced quiz:", error);
      return this.createFallbackQuiz(section);
    }
  }

  /**
   * Generate comprehensive study pack metadata
   */
  async generateStudyPackMetadata(
    sections: DocumentSection[],
    flashcards: EnhancedFlashcard[],
    notes: EnhancedNote[],
    quizzes: EnhancedQuiz[]
  ): Promise<StudyPackMetadata> {
    const totalStudyTime = notes.reduce((sum, note) => sum + note.estimatedTime, 0) +
                          quizzes.reduce((sum, quiz) => sum + quiz.estimatedTime, 0) +
                          flashcards.length * 2; // 2 minutes per flashcard

    const difficulty = this.calculateOverallDifficulty([
      ...notes.map(n => ({ difficulty: n.difficulty })),
      ...quizzes.map(q => ({ difficulty: q.difficulty }))
    ]);

    const tags = Array.from(new Set([
      ...notes.flatMap(n => n.tags),
      ...flashcards.flatMap(f => f.tags)
    ]));

    return {
      id: `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Study Pack - ${sections[0]?.title || 'Document'}`,
      description: `Comprehensive study materials covering ${sections.length} sections with ${flashcards.length} flashcards, ${notes.length} detailed notes, and ${quizzes.length} quizzes.`,
      totalSections: sections.length,
      totalFlashcards: flashcards.length,
      totalNotes: notes.length,
      totalQuizzes: quizzes.length,
      estimatedStudyTime: Math.ceil(totalStudyTime),
      difficulty: this.mapDifficultyLevel(difficulty),
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {
        sectionsCompleted: 0,
        flashcardsMastered: 0,
        notesRead: 0,
        quizzesCompleted: 0,
        overallProgress: 0
      }
    };
  }

  /**
   * Generate AI explanations for flashcard answers
   */
  async generateFlashcardExplanation(flashcard: EnhancedFlashcard): Promise<string> {
    const prompt = `
Explain the answer to this flashcard in detail:

Front: ${flashcard.front}
Back: ${flashcard.back}
Type: ${flashcard.type}
Topic: ${flashcard.topic}

Provide a clear, educational explanation that helps the learner understand:
1. Why this answer is correct
2. Key concepts involved
3. Common misconceptions to avoid
4. How this relates to the broader topic

Keep the explanation concise but comprehensive (2-3 sentences).
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content || "Explanation not available";
    } catch (error) {
      console.error("Error generating flashcard explanation:", error);
      return "Explanation not available";
    }
  }

  // Helper methods
  private generateTOC(content: any): Array<{ id: string; title: string; level: number }> {
    const toc: Array<{ id: string; title: string; level: number }> = [];
    
    if (content.summary?.title) {
      toc.push({ id: 'summary', title: 'Summary', level: 1 });
    }
    if (content.importantTopics?.definitions && Object.keys(content.importantTopics.definitions).length > 0) {
      toc.push({ id: 'definitions', title: 'Definitions', level: 2 });
    }
    if (content.importantTopics?.principles && content.importantTopics.principles.length > 0) {
      toc.push({ id: 'principles', title: 'Principles', level: 2 });
    }
    if (content.examples && content.examples.length > 0) {
      toc.push({ id: 'examples', title: 'Examples', level: 1 });
    }
    if (content.examTips && content.examTips.length > 0) {
      toc.push({ id: 'exam-tips', title: 'Exam Tips', level: 1 });
    }
    
    return toc;
  }

  private determineLevel(content: string): 'beginner' | 'intermediate' | 'advanced' {
    const advancedKeywords = ['advanced', 'complex', 'sophisticated', 'expert', 'professional'];
    const beginnerKeywords = ['basic', 'introduction', 'fundamental', 'simple', 'beginner'];
    
    const lowerContent = content.toLowerCase();
    
    if (advancedKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'advanced';
    } else if (beginnerKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'beginner';
    } else {
      return 'intermediate';
    }
  }

  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private calculateDifficulty(content: string): number {
    // Simple difficulty calculation based on content length and complexity
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    // Difficulty scale 1-5
    if (avgWordsPerSentence < 10) return 1;
    if (avgWordsPerSentence < 15) return 2;
    if (avgWordsPerSentence < 20) return 3;
    if (avgWordsPerSentence < 25) return 4;
    return 5;
  }

  private extractTags(content: string): string[] {
    // Simple tag extraction based on common academic terms
    const commonTags = [
      'programming', 'mathematics', 'science', 'history', 'literature',
      'biology', 'chemistry', 'physics', 'economics', 'psychology',
      'philosophy', 'art', 'music', 'language', 'geography'
    ];
    
    const lowerContent = content.toLowerCase();
    return commonTags.filter(tag => lowerContent.includes(tag));
  }

  private getTimeLimit(type: string, difficulty: string): number {
    const baseTime = {
      'multiple-choice': 60,
      'fill-in-blank': 90,
      'short-answer': 120,
      'essay': 300
    };
    
    const difficultyMultiplier = {
      'easy': 0.8,
      'medium': 1.0,
      'hard': 1.2
    };
    
    return Math.ceil((baseTime[type as keyof typeof baseTime] || 60) * 
                    (difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1.0));
  }

  private calculateOverallDifficulty(items: Array<{ difficulty: number | string }>): number {
    if (items.length === 0) return 3;
    
    const difficulties = items.map(item => {
      if (typeof item.difficulty === 'string') {
        const difficultyMap = { 'easy': 1, 'medium': 3, 'hard': 5 };
        return difficultyMap[item.difficulty as keyof typeof difficultyMap] || 3;
      }
      return item.difficulty;
    });
    
    return Math.round(difficulties.reduce((sum, diff) => sum + diff, 0) / difficulties.length);
  }

  private mapDifficultyLevel(difficulty: number): 'beginner' | 'intermediate' | 'advanced' {
    if (difficulty <= 2) return 'beginner';
    if (difficulty <= 4) return 'intermediate';
    return 'advanced';
  }

  // Fallback methods for error handling
  private createFallbackNote(section: DocumentSection): EnhancedNote {
    return {
      id: `note_${section.id}`,
      title: section.title,
      topic: section.title,
      content: {
        summary: {
          title: section.title,
          keyConcepts: ['Key concept 1', 'Key concept 2'],
          learningOutcomes: ['Understand the main concepts', 'Apply knowledge practically']
        },
        importantTopics: {
          definitions: { 'Term': 'Definition' },
          principles: ['Important principle']
        },
        examples: [],
        examTips: ['Study this section thoroughly'],
        relatedTopics: []
      },
      level: 'intermediate',
      estimatedTime: 5,
      difficulty: 3,
      tags: ['general'],
      collapsible: true
    };
  }

  private createFallbackFlashcards(section: DocumentSection): EnhancedFlashcard[] {
    return [
      {
        id: `flashcard_${section.id}_0`,
        front: `What is the main topic of "${section.title}"?`,
        back: 'This section covers important concepts and principles.',
        difficulty: 'medium',
        topic: section.title,
        type: 'concept',
        tags: ['general'],
        confidence: 0.5,
        reviewHistory: [],
        aiGenerated: true
      }
    ];
  }

  private createFallbackQuiz(section: DocumentSection): EnhancedQuiz {
    return {
      id: `quiz_${section.id}`,
      title: `${section.title} - Quiz`,
      questions: [
        {
          id: `question_${section.id}_0`,
          question: `What is the main focus of "${section.title}"?`,
          type: 'short-answer',
          correctAnswer: 'This section covers important concepts',
          explanation: 'This section provides key information on the topic.',
          difficulty: 'medium',
          points: 10
        }
      ],
      totalQuestions: 1,
      estimatedTime: 5,
      difficulty: 'medium',
      totalPoints: 10,
      passingScore: 70,
      adaptiveMode: false,
      shuffleQuestions: false
    };
  }
}
