// AI Study Pack Generator - Creates comprehensive study materials from processed documents
// Generates notes, flashcards, quizzes, and revision packs

import { ProcessedDocument, DocumentSection } from './documentProcessor';
import OpenAI from 'openai';

export interface StudyNote {
  id: string;
  title: string;
  topic: string;
  content: string;
  level: 'basic' | 'intermediate' | 'advanced';
  chapter?: string;
  pageReference?: string;
  highlights: {
    keyFormulas: string[];
    examTips: string[];
    conceptChecks: string[];
  };
  examples: StudyExample[];
  relatedTopics: string[];
  tags: string[];
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
  chapter?: string;
  type: 'concept' | 'qa' | 'cloze';
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  rationale: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  chapter?: string;
  timeEstimate: number; // minutes
  tags: string[];
}

export interface QuizPack {
  id: string;
  title: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  estimatedTime: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  chapter?: string;
  totalTime: number; // total time for all questions
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  chapter?: string;
  pageReference?: string;
  relatedTerms: string[];
}

export interface RevisionPack {
  id: string;
  title: string;
  quickRevisionSheet: string;
  detailedNotes: StudyNote[];
  flashcardDeck: Flashcard[];
  quizBank: QuizPack[];
  glossary: GlossaryTerm[];
  chapters: string[];
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
  private openai: OpenAI | null = null;

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
    
    // Initialize OpenAI client
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('OpenAI client initialized successfully');
    } else {
      console.warn('OPENAI_API_KEY not found, will use placeholder methods');
    }
  }

  async generateStudyPack(document: ProcessedDocument): Promise<RevisionPack> {
    console.log('Generating study pack for document:', document.title);
    
    const startTime = Date.now();
    
    try {
      // If no sections were created (small document), create a single section from the document
      let sections = document.sections;
      if (sections.length === 0 && document.totalWords > 0) {
        console.log('No sections found, creating single section from document content');
        sections = [{
          id: 'section_1',
          title: 'Document Content',
          level: 1,
          content: this.extractContentFromDocument(document),
          pageNumber: 1,
          wordCount: document.totalWords,
          isExamRelevant: true,
          topics: ['general']
        }];
      }
      
      // Detect chapters from sections
      const chapters = this.detectChapters(sections);
      
      // Generate detailed notes for each section (with shortnotes + citations)
      const detailedNotes = await this.generateDetailedNotes(sections, chapters);
      
      // Generate flashcards for each topic (add cloze cards)
      const flashcardDeck = await this.generateFlashcards(sections, chapters);
      const clozeCards = await this.generateClozeCards(sections, chapters);
      const allCards = [...flashcardDeck, ...clozeCards];
      
      // Generate quiz packs for each chapter (with rationales and estimates)
      const quizBank = await this.generateQuizPacks(sections, chapters);
      
      // Generate glossary from document content
      const glossary = await this.generateGlossary(sections, chapters);
      
      // Generate quick revision sheet
      const quickRevisionSheet = await this.generateQuickRevisionSheet(document);
      
      // Calculate summary statistics
      const summary = this.calculateSummary(detailedNotes, allCards, quizBank);
      
      const revisionPack: RevisionPack = {
        id: `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${document.title} - Study Pack`,
        quickRevisionSheet,
        detailedNotes,
        flashcardDeck: allCards,
        quizBank,
        glossary,
        chapters: chapters.map(c => c.title),
        summary,
        generatedAt: new Date()
      };
      
      const processingTime = Date.now() - startTime;
      console.log(`Study pack generated in ${processingTime}ms:`, {
        notes: detailedNotes.length,
        flashcards: allCards.length,
        questions: quizBank.reduce((sum, pack) => sum + pack.questions.length, 0),
        chapters: chapters.length,
        sections: sections.length
      });
      
      console.log('Generated content details:', {
        detailedNotes: detailedNotes.slice(0, 2), // First 2 notes
        flashcardDeck: allCards.slice(0, 2), // First 2 flashcards
        quizBank: quizBank.slice(0, 1), // First quiz pack
        chapters: chapters.map(c => c.title)
      });
      
      return revisionPack;
      
    } catch (error) {
      console.error('Error generating study pack:', error);
      throw new Error(`Failed to generate study pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateDetailedNotes(sections: DocumentSection[], chapters: Array<{ title: string; startIndex: number; endIndex: number }>): Promise<StudyNote[]> {
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
    if (!this.openai) {
      // Fallback to placeholder if OpenAI is not available
      return this.createPlaceholderNote(section);
    }

    try {
      const prompt = `Create comprehensive study notes from this content:

Title: ${section.title}
Content: ${section.content}

Please generate:
1. A well-structured summary with key concepts
2. Important formulas, definitions, and principles
3. Practical examples and applications
4. Related topics and connections
5. Study tips and exam focus areas

Format the response as JSON with this structure:
{
  "content": "Main study note content with clear structure",
  "highlights": {
    "keyFormulas": ["formula1", "formula2"],
    "examTips": ["tip1", "tip2"],
    "conceptChecks": ["check1", "check2"]
  },
  "examples": [
    {
      "title": "Example title",
      "description": "Example description",
      "code": "Code if applicable",
      "explanation": "Detailed explanation"
    }
  ],
  "relatedTopics": ["topic1", "topic2"],
  "tags": ["tag1", "tag2"],
  "level": "beginner|intermediate|advanced"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Generate comprehensive, well-structured study notes that help students understand and retain information effectively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(aiResponse);
      
      return {
        id: `note_${section.id}`,
        title: section.title,
        topic: section.title,
        content: parsed.content || this.formatNoteContent(section.content),
        level: parsed.level || this.determineDifficultyLevel(section.content),
        highlights: parsed.highlights || this.extractHighlights(section.content),
        examples: parsed.examples || this.generateExamples(section.content),
        relatedTopics: parsed.relatedTopics || this.extractRelatedTopics(section.content),
        tags: parsed.tags || this.extractTags(section.content)
      };

    } catch (error) {
      console.error('Error generating AI study note:', error);
      // Fallback to placeholder if AI fails
      return this.createPlaceholderNote(section);
    }
  }

  private createPlaceholderNote(section: DocumentSection): StudyNote {
    const content = this.formatNoteContent(section.content);
    const highlights = this.extractHighlights(section.content);
    const examples = this.generateExamples(section.content);
    const topics = this.extractRelatedTopics(section.content);
    
    return {
      id: `note_${section.id}`,
      title: section.title,
      topic: section.title,
      content,
      level: this.determineDifficultyLevel(section.content),
      highlights,
      examples,
      relatedTopics: topics,
      tags: this.extractTags(section.content)
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

  private extractTags(content: string): string[] {
    // Extract tags from content
    const tags: string[] = [];
    
    // Look for common academic tags
    const tagPatterns = [
      /\b(formula|equation|theorem|principle|definition|concept|theory|law|rule|method|technique|algorithm|process|procedure|strategy|approach|model|framework|paradigm|methodology)\b/gi,
      /\b(important|key|critical|essential|crucial|fundamental|basic|advanced|complex|simple|easy|difficult|challenging)\b/gi,
      /\b(example|case study|application|use case|scenario|instance|illustration|demonstration)\b/gi
    ];
    
    for (const pattern of tagPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          const tag = match.toLowerCase().trim();
          if (tag && !tags.includes(tag)) {
            tags.push(tag);
          }
        }
      }
    }
    
    return tags.slice(0, 8); // Limit to 8 tags
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

  private async generateFlashcards(sections: DocumentSection[], chapters: Array<{ title: string; startIndex: number; endIndex: number }>): Promise<Flashcard[]> {
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
    if (!this.openai) {
      // Fallback to placeholder if OpenAI is not available
      return this.createPlaceholderFlashcards(section);
    }

    try {
      const prompt = `Create educational flashcards from this content:

Title: ${section.title}
Content: ${section.content}

Generate ${this.config.maxFlashcardsPerTopic} flashcards with:
1. Clear, concise questions on the front
2. Comprehensive, accurate answers on the back
3. Mix of concept, definition, and application questions
4. Appropriate difficulty level

Format as JSON array:
[
  {
    "front": "Question text",
    "back": "Answer text",
    "type": "concept|qa|definition",
    "difficulty": "easy|medium|hard"
  }
]`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Generate high-quality flashcards that help students learn and retain information effectively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(aiResponse);
      
      return parsed.map((card: any, index: number) => ({
        id: `flashcard_${section.id}_${index}`,
        front: card.front,
        back: card.back,
        difficulty: this.mapDifficultyLevel(card.difficulty || this.determineDifficultyLevel(section.content)),
        topic: section.title,
        type: card.type || 'qa',
        tags: section.topics
      }));

    } catch (error) {
      console.error('Error generating AI flashcards:', error);
      // Fallback to placeholder if AI fails
      return this.createPlaceholderFlashcards(section);
    }
  }

  private createPlaceholderFlashcards(section: DocumentSection): Flashcard[] {
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
        type: 'qa',
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

  private async generateQuizPacks(sections: DocumentSection[], detectedChapters: Array<{ title: string; startIndex: number; endIndex: number }>): Promise<QuizPack[]> {
    console.log('Generating quiz packs...');
    
    const quizPacks: QuizPack[] = [];
    
    // Group sections by chapter (level 1)
    const chapterSections = sections.filter(s => s.level === 1);
    
    for (const chapter of chapterSections) {
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
      difficulty: this.mapDifficultyLevel(this.determineDifficultyLevel(chapter.content)),
      totalTime: questions.length * 2 // Same as estimatedTime for now
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
      rationale: `This question tests understanding of the key concepts covered in this chapter. The correct answer ${qa.answer} is directly supported by the material.`,
      difficulty: 'medium',
      topic: qa.question.split(' ')[0],
      timeEstimate: 2, // 2 minutes per question
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

  private detectChapters(sections: DocumentSection[]): Array<{ title: string; startIndex: number; endIndex: number }> {
    const chapters: Array<{ title: string; startIndex: number; endIndex: number }> = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Look for chapter indicators in title
      if (section.title.match(/^(Chapter|Ch\.?|Part|Section)\s*\d+/i)) {
        const prevChapter = chapters[chapters.length - 1];
        if (prevChapter) {
          prevChapter.endIndex = i - 1;
        }
        
        chapters.push({
          title: section.title,
          startIndex: i,
          endIndex: sections.length - 1
        });
      }
    }
    
    // If no chapters found, create one chapter per section
    if (chapters.length === 0) {
      for (let i = 0; i < sections.length; i++) {
        chapters.push({
          title: `Section ${i + 1}: ${sections[i].title}`,
          startIndex: i,
          endIndex: i
        });
      }
    }
    
    return chapters;
  }

  private async generateClozeCards(sections: DocumentSection[], chapters: Array<{ title: string; startIndex: number; endIndex: number }>): Promise<Flashcard[]> {
    const clozeCards: Flashcard[] = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const chapter = chapters.find(c => i >= c.startIndex && i <= c.endIndex);
      
      if (!section.isExamRelevant) continue;
      
      try {
        // Extract key terms and definitions from section content
        const content = section.content;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        
        for (const sentence of sentences.slice(0, 3)) { // Limit to 3 cloze cards per section
          // Look for definition patterns
          const definitionMatch = sentence.match(/(\w+(?:\s+\w+)*)\s+(?:is|are|refers to|means|can be defined as)\s+(.+)/i);
          if (definitionMatch) {
            const term = definitionMatch[1].trim();
            const definition = definitionMatch[2].trim();
            
            // Create cloze deletion
            const clozeText = sentence.replace(term, '_____');
            
            clozeCards.push({
              id: `cloze_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              front: clozeText,
              back: `${term}: ${definition}`,
              difficulty: 'medium',
              topic: section.title,
              chapter: chapter?.title,
              type: 'cloze',
              tags: ['cloze', 'definition', chapter?.title || 'general']
            });
          }
        }
      } catch (error) {
        console.error(`Error generating cloze cards for section ${section.id}:`, error);
      }
    }
    
    return clozeCards.slice(0, this.config.maxFlashcardsPerTopic);
  }

  private async generateGlossary(sections: DocumentSection[], chapters: Array<{ title: string; startIndex: number; endIndex: number }>): Promise<GlossaryTerm[]> {
    const glossary: GlossaryTerm[] = [];
    const termMap = new Map<string, GlossaryTerm>();
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const chapter = chapters.find(c => i >= c.startIndex && i <= c.endIndex);
      
      if (!section.isExamRelevant) continue;
      
      try {
        // Extract terms and definitions using various patterns
        const content = section.content;
        
        // Pattern 1: "Term is definition"
        const pattern1 = /(\w+(?:\s+\w+)*)\s+(?:is|are|refers to|means|can be defined as)\s+(.+?)(?:\n|\.|$)/gi;
        let match;
        while ((match = pattern1.exec(content)) !== null) {
          const term = match[1].trim();
          const definition = match[2].trim();
          
          if (term.length > 2 && definition.length > 10) {
            if (!termMap.has(term.toLowerCase())) {
              termMap.set(term.toLowerCase(), {
                term,
                definition,
                chapter: chapter?.title,
                pageReference: `Section ${i + 1}`,
                relatedTerms: []
              });
            }
          }
        }
        
        // Pattern 2: Bold terms followed by definitions
        const pattern2 = /\*\*([^*]+)\*\*\s*[:\-]\s*(.+?)(?:\n|$)/g;
        while ((match = pattern2.exec(content)) !== null) {
          const term = match[1].trim();
          const definition = match[2].trim();
          
          if (term.length > 2 && definition.length > 10) {
            if (!termMap.has(term.toLowerCase())) {
              termMap.set(term.toLowerCase(), {
                term,
                definition,
                chapter: chapter?.title,
                pageReference: `Section ${i + 1}`,
                relatedTerms: []
              });
            }
          }
        }
        
      } catch (error) {
        console.error(`Error generating glossary for section ${section.id}:`, error);
      }
    }
    
    // Convert map to array and limit size
    return Array.from(termMap.values()).slice(0, 50);
  }

  private extractContentFromDocument(document: ProcessedDocument): string {
    // Extract all content from sections if available, otherwise return a generic message
    if (document.sections && document.sections.length > 0) {
      return document.sections.map(section => 
        `${section.title}\n${section.content}`
      ).join('\n\n');
    }
    
    // Fallback: return document title and basic info
    return `Document: ${document.title}\nType: ${document.type}\nPages: ${document.totalPages}\nWords: ${document.totalWords}`;
  }
}
