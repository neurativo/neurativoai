export interface StudyProgress {
  sectionId: string;
  flashcards: {
    [flashcardId: string]: {
      status: 'new' | 'learning' | 'review' | 'mastered';
      lastReviewed: Date;
      nextReview: Date;
      confidence: number; // 0-1 scale
      reviewCount: number;
      correctStreak: number;
    };
  };
  notes: {
    [noteId: string]: {
      status: 'unread' | 'read' | 'mastered';
      lastViewed: Date;
      timeSpent: number; // in seconds
    };
  };
  quizzes: {
    [quizId: string]: {
      attempts: number;
      bestScore: number;
      lastAttempt: Date;
      completed: boolean;
    };
  };
}

export interface EnhancedFlashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  type: 'definition' | 'concept' | 'application' | 'formula' | 'example';
  tags: string[];
  confidence?: number;
  reviewHistory: {
    date: Date;
    correct: boolean;
    timeSpent: number;
  }[];
  aiGenerated: boolean;
  userModified?: boolean;
}

export interface EnhancedNote {
  id: string;
  title: string;
  topic: string;
  content: {
    summary: {
      title: string;
      keyConcepts: string[];
      learningOutcomes: string[];
    };
    importantTopics: {
      definitions: Record<string, string>;
      principles: string[];
      formulas?: string[];
    };
    examples: Array<{
      title: string;
      description: string;
      code?: string;
      explanation: string;
      language?: string;
    }>;
    examTips: string[];
    relatedTopics: string[];
  };
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  difficulty: number; // 1-5 scale
  tags: string[];
  collapsible: boolean;
  toc?: Array<{
    id: string;
    title: string;
    level: number;
  }>;
}

export interface EnhancedQuiz {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    type: 'multiple-choice' | 'fill-in-blank' | 'short-answer' | 'essay';
    options?: string[];
    correctAnswer: string | string[];
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    timeLimit?: number; // in seconds
  }>;
  totalQuestions: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  totalPoints: number;
  passingScore: number;
  adaptiveMode: boolean;
  shuffleQuestions: boolean;
  timeLimit?: number; // in seconds
}

export interface StudySession {
  id: string;
  studyPackId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  mode: 'flashcards' | 'notes' | 'quiz' | 'mixed' | 'exam-simulation';
  progress: {
    flashcardsStudied: number;
    notesRead: number;
    questionsAnswered: number;
    correctAnswers: number;
  };
  performance: {
    accuracy: number;
    averageTime: number;
    confidence: number;
  };
}

export interface StudyPackMetadata {
  id: string;
  title: string;
  description: string;
  totalSections: number;
  totalFlashcards: number;
  totalNotes: number;
  totalQuizzes: number;
  estimatedStudyTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessed?: Date;
  progress: {
    sectionsCompleted: number;
    flashcardsMastered: number;
    notesRead: number;
    quizzesCompleted: number;
    overallProgress: number; // 0-100
  };
}

export interface SpacedRepetitionSettings {
  intervals: number[]; // in days
  maxInterval: number; // in days
  easeFactor: number;
  minEaseFactor: number;
  maxEaseFactor: number;
  newCardsPerDay: number;
  reviewCardsPerDay: number;
}

export interface StudyPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  soundEffects: boolean;
  autoAdvance: boolean;
  showProgress: boolean;
  spacedRepetition: SpacedRepetitionSettings;
  studyReminders: {
    enabled: boolean;
    time: string;
    days: number[];
  };
}
