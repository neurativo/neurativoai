// AI Study Pack Generator - Creates comprehensive study materials from processed documents
// Generates notes, flashcards, quizzes, and revision packs

import { ProcessedDocument, DocumentSection } from './documentProcessor';

export interface StudyNote {
  id: string;
  topic: string;
  content: string;
  level: 'basic' | 'intermediate' | 'advanced';
  highlights: {
    keyFormulas: string[];
    examTips: string[];
    conceptChecks: string[];
  };
  examples: StudyExample[];
  relatedTopics: string[];
}

export interface StudyExample {
  id: string;
  title: string;
  description: string;
  code?: string;
  diagram?: string;
  explanation: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  tags: string[];
}

export interface QuizPack {
  id: string;
  title: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  estimatedTime: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
}

export interface RevisionPack {
  id: string;
  title: string;
  quickRevisionSheet: string;
  detailedNotes: StudyNote[];
  flashcardDeck: Flashcard[];
  quizBank: QuizPack[];
  summary: {
    totalTopics: number;
    totalFlashcards: number;
    totalQuestions: number;
    estimatedStudyTime: number; // in hours
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  generatedAt: Date;
}

export interface StudyPackGeneratorConfig {
  maxNotesPerSection: number;
  maxFlashcardsPerTopic: number;
  maxQuestionsPerChapter: number;
  includeExamples: boolean;
  includeDiagrams: boolean;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export class AIStudyPackGenerator {
  private config: StudyPackGeneratorConfig;

  constructor(config: Partial<StudyPackGeneratorConfig> = {}) {
    this.config = {
      maxNotesPerSection: 5,
      maxFlashcardsPerTopic: 10,
      maxQuestionsPerChapter: 10,
      includeExamples: true,
      includeDiagrams: true,
      difficultyLevel: 'intermediate',
      ...config
    };
  }

  async generateStudyPack(document: ProcessedDocument): Promise<RevisionPack> {
    console.log('Generating study pack for document:', document.title);
    
    const startTime = Date.now();
    
    try {
      // Generate detailed notes for each section
      const detailedNotes = await this.generateDetailedNotes(document.sections);
      
      // Generate flashcards for each topic
      const flashcardDeck = await this.generateFlashcards(document.sections);
      
      // Generate quiz packs for each chapter
      const quizBank = await this.generateQuizPacks(document.sections);
      
      // Generate quick revision sheet
      const quickRevisionSheet = await this.generateQuickRevisionSheet(document);
      
      // Calculate summary statistics
      const summary = this.calculateSummary(detailedNotes, flashcardDeck, quizBank);
      
      const revisionPack: RevisionPack = {
        id: `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${document.title} - Study Pack`,
        quickRevisionSheet,
        detailedNotes,
        flashcardDeck,
        quizBank,
        summary,
        generatedAt: new Date()
      };
      
      const processingTime = Date.now() - startTime;
      console.log(`Study pack generated in ${processingTime}ms:`, {
        notes: detailedNotes.length,
        flashcards: flashcardDeck.length,
        questions: quizBank.reduce((sum, pack) => sum + pack.questions.length, 0)
      });
      
      return revisionPack;
      
    } catch (error) {
      console.error('Error generating study pack:', error);
      throw new Error(`Failed to generate study pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateDetailedNotes(sections: DocumentSection[]): Promise<StudyNote[]> {
    console.log('Generating detailed notes...');
    
    const notes: StudyNote[] = [];
    
    for (const section of sections) {
      if (!section.isExamRelevant) continue;
      
      try {
        const note = await this.createStudyNote(section);
        notes.push(note);
      } catch (error) {
        console.error(`Error generating note for section ${section.id}:`, error);
      }
    }
    
    return notes;
  }

  private async createStudyNote(section: DocumentSection): Promise<StudyNote> {
    // This is a placeholder implementation
    // In production, you'd use AI to generate high-quality notes
    
    const content = this.formatNoteContent(section.content);
    const highlights = this.extractHighlights(section.content);
    const examples = this.generateExamples(section.content);
    const topics = this.extractRelatedTopics(section.content);
    
    return {
      id: `note_${section.id}`,
      topic: section.title,
      content,
      level: this.determineDifficultyLevel(section.content),
      highlights,
      examples,
      relatedTopics: topics
    };
  }

  private formatNoteContent(content: string): string {
    // Format content with proper structure and highlighting
    let formatted = content;
    
    // Add highlight markers
    formatted = formatted.replace(/\b(formula|equation|theorem|principle|definition)\b/gi, '✅ $1');
    formatted = formatted.replace(/\b(important|key|critical|essential|crucial)\b/gi, '⚠️ $1');
    formatted = formatted.replace(/\b(example|case study|application|use case)\b/gi, '💡 $1');
    
    // Structure with bullet points
    const lines = formatted.split('\n');
    const structuredLines = lines.map(line => {
      if (line.trim().length === 0) return line;
      if (line.match(/^\d+\./)) return line; // Already numbered
      if (line.match(/^[-*•]/)) return line; // Already bulleted
      if (line.match(/^[A-Z][^.]*:$/)) return line; // Headers
      return `• ${line}`;
    });
    
    return structuredLines.join('\n');
  }

  private extractHighlights(content: string): {
    keyFormulas: string[];
    examTips: string[];
    conceptChecks: string[];
  } {
    const keyFormulas: string[] = [];
    const examTips: string[] = [];
    const conceptChecks: string[] = [];
    
    // Extract formulas and equations
    const formulaPattern = /(?:formula|equation|theorem):\s*([^.\n]+)/gi;
    let match;
    while ((match = formulaPattern.exec(content)) !== null) {
      keyFormulas.push(match[1].trim());
    }
    
    // Extract exam tips
    const tipPattern = /(?:tip|hint|note|remember):\s*([^.\n]+)/gi;
    while ((match = tipPattern.exec(content)) !== null) {
      examTips.push(match[1].trim());
    }
    
    // Extract concept checks
    const conceptPattern = /(?:concept check|think about|consider):\s*([^.\n]+)/gi;
    while ((match = conceptPattern.exec(content)) !== null) {
      conceptChecks.push(match[1].trim());
    }
    
    return { keyFormulas, examTips, conceptChecks };
  }

  private generateExamples(content: string): StudyExample[] {
    const examples: StudyExample[] = [];
    
    // Look for example patterns
    const examplePattern = /(?:example|case study|application):\s*([^.\n]+)/gi;
    let match;
    let exampleCounter = 0;
    
    while ((match = examplePattern.exec(content)) !== null && exampleCounter < 3) {
      examples.push({
        id: `example_${exampleCounter++}`,
        title: `Example ${exampleCounter}`,
        description: match[1].trim(),
        explanation: `This example demonstrates the concept in a practical context.`
      });
    }
    
    return examples;
  }

  private extractRelatedTopics(content: string): string[] {
    // Simple topic extraction
    const topics: string[] = [];
    const words = content.toLowerCase().split(/\s+/);
    const commonTopics = [
      'database', 'sql', 'programming', 'algorithm', 'data structure',
      'network', 'security', 'software', 'hardware', 'system',
      'analysis', 'design', 'implementation', 'testing', 'maintenance'
    ];
    
    for (const topic of commonTopics) {
      if (words.some(word => word.includes(topic))) {
        topics.push(topic);
      }
    }
    
    return topics.slice(0, 5);
  }

  private determineDifficultyLevel(content: string): 'basic' | 'intermediate' | 'advanced' {
    const advancedKeywords = ['complex', 'advanced', 'sophisticated', 'intricate', 'comprehensive'];
    const basicKeywords = ['simple', 'basic', 'fundamental', 'introductory', 'elementary'];
    
    const contentLower = content.toLowerCase();
    const advancedCount = advancedKeywords.filter(keyword => contentLower.includes(keyword)).length;
    const basicCount = basicKeywords.filter(keyword => contentLower.includes(keyword)).length;
    
    if (advancedCount > basicCount) return 'advanced';
    if (basicCount > advancedCount) return 'basic';
    return 'intermediate';
  }

  private mapDifficultyLevel(level: 'basic' | 'intermediate' | 'advanced'): 'easy' | 'medium' | 'hard' {
    switch (level) {
      case 'basic':
        return 'easy';
      case 'intermediate':
        return 'medium';
      case 'advanced':
        return 'hard';
      default:
        return 'medium';
    }
  }

  private async generateFlashcards(sections: DocumentSection[]): Promise<Flashcard[]> {
    console.log('Generating flashcards...');
    
    const flashcards: Flashcard[] = [];
    
    for (const section of sections) {
      if (!section.isExamRelevant) continue;
      
      try {
        const sectionFlashcards = await this.createFlashcardsForSection(section);
        flashcards.push(...sectionFlashcards);
      } catch (error) {
        console.error(`Error generating flashcards for section ${section.id}:`, error);
      }
    }
    
    return flashcards;
  }

  private async createFlashcardsForSection(section: DocumentSection): Promise<Flashcard[]> {
    const flashcards: Flashcard[] = [];
    
    // Generate Q&A pairs from section content
    const qaPairs = this.extractQAPairs(section.content);
    
    for (let i = 0; i < Math.min(qaPairs.length, this.config.maxFlashcardsPerTopic); i++) {
      const qa = qaPairs[i];
      flashcards.push({
        id: `flashcard_${section.id}_${i}`,
        front: qa.question,
        back: qa.answer,
        difficulty: this.mapDifficultyLevel(this.determineDifficultyLevel(section.content)),
        topic: section.title,
        tags: section.topics
      });
    }
    
    return flashcards;
  }

  private extractQAPairs(content: string): { question: string; answer: string }[] {
    const qaPairs: { question: string; answer: string }[] = [];
    
    // Look for definition patterns
    const definitionPattern = /(?:what is|define|explain)\s+([^?]+)\?/gi;
    let match;
    while ((match = definitionPattern.exec(content)) !== null) {
      const term = match[1].trim();
      qaPairs.push({
        question: `What is ${term}?`,
        answer: `Definition of ${term} based on the content.`
      });
    }
    
    // Look for comparison patterns
    const comparisonPattern = /(?:difference between|compare|contrast)\s+([^?]+)\?/gi;
    while ((match = comparisonPattern.exec(content)) !== null) {
      const terms = match[1].trim();
      qaPairs.push({
        question: `What is the difference between ${terms}?`,
        answer: `Comparison between ${terms} based on the content.`
      });
    }
    
    return qaPairs;
  }

  private async generateQuizPacks(sections: DocumentSection[]): Promise<QuizPack[]> {
    console.log('Generating quiz packs...');
    
    const quizPacks: QuizPack[] = [];
    
    // Group sections by chapter (level 1)
    const chapters = sections.filter(s => s.level === 1);
    
    for (const chapter of chapters) {
      try {
        const quizPack = await this.createQuizPackForChapter(chapter, sections);
        quizPacks.push(quizPack);
      } catch (error) {
        console.error(`Error generating quiz pack for chapter ${chapter.id}:`, error);
      }
    }
    
    return quizPacks;
  }

  private async createQuizPackForChapter(chapter: DocumentSection, allSections: DocumentSection[]): Promise<QuizPack> {
    const questions: QuizQuestion[] = [];
    
    // Get all sections for this chapter
    const chapterSections = allSections.filter(s => 
      s.level > 1 && s.pageNumber && chapter.pageNumber && 
      s.pageNumber >= chapter.pageNumber
    );
    
    // Generate questions from chapter content
    const qaPairs = this.extractQAPairs(chapter.content);
    
    for (let i = 0; i < Math.min(qaPairs.length, this.config.maxQuestionsPerChapter); i++) {
      const qa = qaPairs[i];
      const question = this.createMultipleChoiceQuestion(qa, chapterSections);
      questions.push(question);
    }
    
    return {
      id: `quiz_${chapter.id}`,
      title: `${chapter.title} - Quiz`,
      questions,
      totalQuestions: questions.length,
      estimatedTime: questions.length * 2, // 2 minutes per question
      difficulty: this.mapDifficultyLevel(this.determineDifficultyLevel(chapter.content))
    };
  }

  private createMultipleChoiceQuestion(qa: { question: string; answer: string }, sections: DocumentSection[]): QuizQuestion {
    // Generate multiple choice options
    const options = [qa.answer];
    
    // Generate distractors from other sections
    const distractors = sections
      .filter(s => s.content !== qa.answer)
      .map(s => s.content.substring(0, 50) + '...')
      .slice(0, 3);
    
    options.push(...distractors);
    
    // Shuffle options
    const shuffledOptions = this.shuffleArray([...options]);
    const correctAnswer = shuffledOptions.indexOf(qa.answer);
    
    return {
      id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      question: qa.question,
      options: shuffledOptions,
      correctAnswer,
      explanation: `The correct answer is ${qa.answer}. This is based on the content from the chapter.`,
      difficulty: 'medium',
      topic: qa.question.split(' ')[0],
      tags: []
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async generateQuickRevisionSheet(document: ProcessedDocument): Promise<string> {
    console.log('Generating quick revision sheet...');
    
    let revisionSheet = `# ${document.title} - Quick Revision Sheet\n\n`;
    
    // Add document summary
    revisionSheet += `## Document Summary\n`;
    revisionSheet += `- **Total Pages:** ${document.totalPages}\n`;
    revisionSheet += `- **Total Words:** ${document.totalWords}\n`;
    revisionSheet += `- **Key Topics:** ${document.sections.length}\n\n`;
    
    // Add key points from each section
    for (const section of document.sections) {
      if (!section.isExamRelevant) continue;
      
      revisionSheet += `## ${section.title}\n`;
      revisionSheet += `- ${section.content.substring(0, 200)}...\n\n`;
    }
    
    return revisionSheet;
  }

  private calculateSummary(
    notes: StudyNote[],
    flashcards: Flashcard[],
    quizPacks: QuizPack[]
  ): RevisionPack['summary'] {
    const totalQuestions = quizPacks.reduce((sum, pack) => sum + pack.questions.length, 0);
    const estimatedStudyTime = (notes.length * 0.5) + (flashcards.length * 0.1) + (totalQuestions * 0.2);
    
    return {
      totalTopics: notes.length,
      totalFlashcards: flashcards.length,
      totalQuestions,
      estimatedStudyTime: Math.ceil(estimatedStudyTime),
      difficulty: this.config.difficultyLevel
    };
  }
}
