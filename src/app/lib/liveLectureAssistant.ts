// Live Lecture Assistant - Real-time audio processing and study material generation
// For university students during live lectures

import { AILectureService, createAILectureService } from './aiLectureService';
import { AudioTranscriptionService, StreamingTranscriptionService, createTranscriptionService } from './audioTranscriptionService';
import { AudioRecorder, AudioChunk } from './audioRecorder';

export interface LiveLectureState {
  isRecording: boolean;
  isPaused: boolean;
  currentTranscript: string;
  sections: LectureSection[];
  flashcards: Flashcard[];
  bookmarks: Bookmark[];
  highlights: Highlight[];
  studentQuestions: StudentQuestion[];
  startTime: Date;
  lastUpdate: Date;
}

export interface LectureSection {
  id: string;
  title: string;
  transcript: string;
  notes: string[];
  keyTerms: string[];
  formulas: string[];
  timestamp: Date;
  duration: number; // in seconds
}

export interface Flashcard {
  id: string;
  front: string; // Question
  back: string; // Answer
  concept: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timestamp: Date;
  sectionId: string;
}

export interface Bookmark {
  id: string;
  timestamp: Date;
  transcript: string;
  notes: string;
  sectionId: string;
}

export interface Highlight {
  id: string;
  text: string;
  explanation: string;
  timestamp: Date;
  sectionId: string;
}

export interface StudentQuestion {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  sectionId: string;
}

export interface RevisionPack {
  quickRevision: QuickRevisionSheet;
  detailedNotes: DetailedNotes;
  flashcardDeck: Flashcard[];
  quizBank: QuizQuestion[];
  bookmarks: Bookmark[];
  highlights: Highlight[];
}

export interface QuickRevisionSheet {
  title: string;
  keyPoints: string[];
  formulas: string[];
  definitions: string[];
  concepts: string[];
}

export interface DetailedNotes {
  title: string;
  sections: {
    heading: string;
    content: string;
    examples: string[];
    formulas: string[];
  }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concept: string;
}

export class LiveLectureAssistant {
  private state: LiveLectureState;
  private transcriptProcessor: TranscriptProcessor;
  private noteGenerator: NoteGenerator;
  private flashcardGenerator: FlashcardGenerator;
  private quizGenerator: QuizGenerator;
  private revisionPackGenerator: RevisionPackGenerator;
  private aiService: AILectureService;
  private transcriptionService: AudioTranscriptionService;
  private streamingService: StreamingTranscriptionService;
  private audioRecorder: AudioRecorder;
  private isInitialized: boolean = false;

  constructor(transcriptionProvider: 'openai' | 'google' | 'azure' | 'assemblyai' = 'openai') {
    this.state = {
      isRecording: false,
      isPaused: false,
      currentTranscript: '',
      sections: [],
      flashcards: [],
      bookmarks: [],
      highlights: [],
      studentQuestions: [],
      startTime: new Date(),
      lastUpdate: new Date()
    };

    this.transcriptProcessor = new TranscriptProcessor();
    this.noteGenerator = new NoteGenerator();
    this.flashcardGenerator = new FlashcardGenerator();
    this.quizGenerator = new QuizGenerator();
    this.revisionPackGenerator = new RevisionPackGenerator();
    this.aiService = createAILectureService();
    this.transcriptionService = createTranscriptionService(transcriptionProvider);
    this.streamingService = new StreamingTranscriptionService(this.transcriptionService);
    this.audioRecorder = new AudioRecorder();
  }

  // Cleanup method
  cleanup(): void {
    this.audioRecorder.cleanup();
    this.isInitialized = false;
  }

  // Core workflow methods
  async startLecture(): Promise<void> {
    try {
      console.log('Starting lecture...');
      
      // Initialize audio recorder if not already done
      if (!this.isInitialized) {
        console.log('Initializing audio recorder...');
        await this.audioRecorder.initialize();
        this.isInitialized = true;
        console.log('Audio recorder initialized');
      }

      this.state.isRecording = true;
      this.state.isPaused = false;
      this.state.startTime = new Date();
      
      // Start audio recording with real-time transcription
      console.log('Starting audio recording...');
      this.audioRecorder.startRecording(async (chunk: AudioChunk) => {
        console.log('Processing audio chunk...');
        await this.processAudioChunk(chunk);
      });
      
      console.log('Live lecture assistant started with real audio recording');
    } catch (error) {
      console.error('Failed to start lecture:', error);
      this.state.isRecording = false;
      this.state.isPaused = false;
      throw error;
    }
  }

  async pauseLecture(): Promise<void> {
    if (this.state.isRecording && !this.state.isPaused) {
      this.state.isPaused = true;
      this.audioRecorder.pauseRecording();
      console.log('Lecture paused');
    }
  }

  async resumeLecture(): Promise<void> {
    if (this.state.isRecording && this.state.isPaused) {
      this.state.isPaused = false;
      this.audioRecorder.resumeRecording();
      console.log('Lecture resumed');
    }
  }

  async stopLecture(): Promise<RevisionPack> {
    this.state.isRecording = false;
    this.state.isPaused = false;
    
    // Stop audio recording
    this.audioRecorder.stopRecording();
    
    // Generate final revision pack
    const revisionPack = await this.revisionPackGenerator.generateRevisionPack(this.state);
    
    console.log('Live lecture assistant stopped');
    return revisionPack;
  }

  // Process audio chunks for real-time transcription
  private async processAudioChunk(chunk: AudioChunk): Promise<void> {
    if (!this.state.isRecording || this.state.isPaused) return;

    try {
      console.log('Processing audio chunk:', { 
        size: chunk.data.size, 
        type: chunk.data.type, 
        timestamp: chunk.timestamp 
      });
      
      // Send audio chunk to transcription service
      const result = await this.transcriptionService.transcribeAudio(chunk.data);
      
      console.log('Transcription result:', result);
      
      if (result.text && result.text.trim()) {
        console.log('Processing transcription text:', result.text);
        await this.processTranscriptionResult(result);
      } else {
        console.log('No text in transcription result');
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }

  // Process transcription results from streaming service
  async processTranscriptionResult(result: any): Promise<void> {
    if (!this.state.isRecording || this.state.isPaused) return;

    try {
      console.log('Processing transcription result:', result);
      
      // 1. Process transcript
      const processedTranscript = await this.transcriptProcessor.processTranscript(result.text);
      console.log('Processed transcript:', processedTranscript);
      
      // 2. Update current transcript
      this.state.currentTranscript += processedTranscript.cleanText + ' ';
      console.log('Updated current transcript length:', this.state.currentTranscript.length);
      
      // 3. Check for section breaks
      const shouldCreateSection = await this.transcriptProcessor.shouldCreateSection(
        this.state.currentTranscript,
        this.state.sections
      );
      
      if (shouldCreateSection) {
        console.log('Creating new section');
        await this.createNewSection();
      }
      
      // 4. Generate real-time notes
      console.log('Generating live notes');
      await this.generateLiveNotes();
      
      // 5. Generate flashcards for new concepts
      console.log('Generating flashcards');
      await this.generateFlashcards();
      
      this.state.lastUpdate = new Date();
      console.log('Transcription processing complete');
    } catch (error) {
      console.error('Error processing transcription result:', error);
    }
  }


  // Student controls
  async addBookmark(notes?: string): Promise<void> {
    const bookmark: Bookmark = {
      id: this.generateId(),
      timestamp: new Date(),
      transcript: this.state.currentTranscript.slice(-200), // Last 200 chars
      notes: notes || '',
      sectionId: this.getCurrentSectionId()
    };
    
    this.state.bookmarks.push(bookmark);
    console.log('Bookmark added');
  }

  async addHighlight(text: string): Promise<void> {
    const explanation = await this.generateInstantExplanation(text);
    
    const highlight: Highlight = {
      id: this.generateId(),
      text,
      explanation,
      timestamp: new Date(),
      sectionId: this.getCurrentSectionId()
    };
    
    this.state.highlights.push(highlight);
    console.log('Highlight added with explanation');
  }

  async askQuestion(question: string): Promise<string> {
    const answer = await this.generateContextualAnswer(question);
    
    const studentQuestion: StudentQuestion = {
      id: this.generateId(),
      question,
      answer,
      timestamp: new Date(),
      sectionId: this.getCurrentSectionId()
    };
    
    this.state.studentQuestions.push(studentQuestion);
    return answer;
  }

  // Internal methods
  private async createNewSection(): Promise<void> {
    const section: LectureSection = {
      id: this.generateId(),
      title: await this.transcriptProcessor.generateSectionTitle(this.state.currentTranscript),
      transcript: this.state.currentTranscript,
      notes: [],
      keyTerms: [],
      formulas: [],
      timestamp: new Date(),
      duration: 0
    };
    
    this.state.sections.push(section);
    this.state.currentTranscript = ''; // Reset for new section
  }

  private async generateLiveNotes(): Promise<void> {
    const currentSection = this.getCurrentSection();
    if (!currentSection) return;

    const notes = await this.noteGenerator.generateNotes(this.state.currentTranscript);
    currentSection.notes = notes;
    
    // Extract key terms and formulas
    currentSection.keyTerms = await this.transcriptProcessor.extractKeyTerms(this.state.currentTranscript);
    currentSection.formulas = await this.transcriptProcessor.extractFormulas(this.state.currentTranscript);
  }

  private async generateFlashcards(): Promise<void> {
    const newConcepts = await this.transcriptProcessor.extractNewConcepts(
      this.state.currentTranscript,
      this.state.flashcards
    );
    
    for (const concept of newConcepts) {
      const flashcard = await this.flashcardGenerator.generateFlashcard(concept);
      this.state.flashcards.push(flashcard);
    }
  }

  private async generateInstantExplanation(text: string): Promise<string> {
    const context = this.state.currentTranscript.slice(-1000);
    return await this.aiService.generateInstantExplanation(text, context);
  }

  private async generateContextualAnswer(question: string): Promise<string> {
    const context = this.state.currentTranscript.slice(-1000);
    return await this.aiService.generateContextualAnswer(question, context);
  }

  private getCurrentSection(): LectureSection | null {
    return this.state.sections[this.state.sections.length - 1] || null;
  }

  private getCurrentSectionId(): string {
    const currentSection = this.getCurrentSection();
    return currentSection?.id || 'default';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Getters for UI
  getState(): LiveLectureState {
    return { ...this.state };
  }

  getCurrentNotes(): string[] {
    const currentSection = this.getCurrentSection();
    return currentSection?.notes || [];
  }

  getRecentFlashcards(count: number = 5): Flashcard[] {
    return this.state.flashcards.slice(-count);
  }

  getBookmarks(): Bookmark[] {
    return [...this.state.bookmarks];
  }

  getHighlights(): Highlight[] {
    return [...this.state.highlights];
  }
}

// Supporting classes

class TranscriptProcessor {
  private aiService: AILectureService;

  constructor() {
    this.aiService = createAILectureService();
  }

  async processTranscript(transcript: string): Promise<{ cleanText: string }> {
    // Remove filler words, clean up text
    const cleanText = transcript
      .replace(/\b(um|uh|ah|like|you know|so|well)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return { cleanText };
  }

  async shouldCreateSection(transcript: string, sections: LectureSection[]): Promise<boolean> {
    return await this.aiService.shouldCreateSection(transcript, sections);
  }

  async generateSectionTitle(transcript: string): Promise<string> {
    return await this.aiService.generateSectionTitle(transcript);
  }

  async extractKeyTerms(transcript: string): Promise<string[]> {
    return await this.aiService.extractKeyTerms(transcript);
  }

  async extractFormulas(transcript: string): Promise<string[]> {
    return await this.aiService.extractFormulas(transcript);
  }

  async extractNewConcepts(transcript: string, existingFlashcards: Flashcard[]): Promise<string[]> {
    // Identify new concepts not already covered
    const existingConcepts = existingFlashcards.map(card => card.concept.toLowerCase());
    const allTerms = await this.extractKeyTerms(transcript);
    return allTerms.filter(term => !existingConcepts.includes(term.toLowerCase()));
  }
}

class NoteGenerator {
  private aiService: AILectureService;

  constructor() {
    this.aiService = createAILectureService();
  }

  async generateNotes(transcript: string): Promise<string[]> {
    return await this.aiService.generateLiveNotes(transcript);
  }
}

class FlashcardGenerator {
  private aiService: AILectureService;

  constructor() {
    this.aiService = createAILectureService();
  }

  async generateFlashcard(concept: string): Promise<Flashcard> {
    const context = "Lecture context"; // You might want to pass actual context
    const { front, back } = await this.aiService.generateFlashcard(concept, context);
    
    return {
      id: Date.now().toString(),
      front,
      back,
      concept,
      difficulty: 'medium',
      timestamp: new Date(),
      sectionId: 'current'
    };
  }
}

class QuizGenerator {
  private aiService: AILectureService;

  constructor() {
    this.aiService = createAILectureService();
  }

  async generateQuiz(sections: LectureSection[]): Promise<QuizQuestion[]> {
    const lectureContent = sections.map(section => section.transcript).join(' ');
    return await this.aiService.generateQuizQuestions(lectureContent, 5);
  }
}

class RevisionPackGenerator {
  private aiService: AILectureService;

  constructor() {
    this.aiService = createAILectureService();
  }

  async generateRevisionPack(state: LiveLectureState): Promise<RevisionPack> {
    const lectureContent = state.sections.map(section => section.transcript).join(' ');
    
    const quickRevision = await this.aiService.generateQuickRevisionSheet(lectureContent);
    const detailedNotes = await this.aiService.generateDetailedNotes(state.sections);
    const quizBank = await this.aiService.generateQuizQuestions(lectureContent, 10);
    
    return {
      quickRevision,
      detailedNotes,
      flashcardDeck: state.flashcards,
      quizBank,
      bookmarks: state.bookmarks,
      highlights: state.highlights
    };
  }
}
