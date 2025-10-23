import { StudyProgress, StudySession, StudyPackMetadata } from './types/studyPack';

export class ProgressTracker {
  private progress: StudyProgress;
  private sessions: StudySession[] = [];

  constructor(initialProgress?: Partial<StudyProgress>) {
    this.progress = {
      sectionId: '',
      flashcards: {},
      notes: {},
      quizzes: {},
      ...initialProgress
    };
  }

  /**
   * Start a new study session
   */
  startSession(studyPackId: string, userId: string, mode: StudySession['mode']): StudySession {
    const session: StudySession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studyPackId,
      userId,
      startTime: new Date(),
      duration: 0,
      mode,
      progress: {
        flashcardsStudied: 0,
        notesRead: 0,
        questionsAnswered: 0,
        correctAnswers: 0
      },
      performance: {
        accuracy: 0,
        averageTime: 0,
        confidence: 0
      }
    };

    this.sessions.push(session);
    return session;
  }

  /**
   * End a study session and calculate performance metrics
   */
  endSession(sessionId: string): StudySession | null {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return null;

    session.endTime = new Date();
    session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);

    // Calculate performance metrics
    const totalQuestions = session.progress.questionsAnswered;
    if (totalQuestions > 0) {
      session.performance.accuracy = (session.progress.correctAnswers / totalQuestions) * 100;
    }

    // Calculate average time per question (if applicable)
    if (session.mode === 'quiz' || session.mode === 'exam-simulation') {
      session.performance.averageTime = session.duration / totalQuestions;
    }

    // Calculate confidence based on accuracy and time
    session.performance.confidence = Math.min(100, 
      (session.performance.accuracy * 0.7) + 
      (Math.max(0, 100 - session.performance.averageTime) * 0.3)
    );

    return session;
  }

  /**
   * Update flashcard progress
   */
  updateFlashcardProgress(
    flashcardId: string,
    performance: 'again' | 'hard' | 'good' | 'easy',
    timeSpent: number,
    sessionId?: string
  ): void {
    const flashcard = this.progress.flashcards[flashcardId];
    if (!flashcard) {
    this.progress.flashcards[flashcardId] = {
      status: 'new',
      lastReviewed: new Date(),
      nextReview: new Date(),
      confidence: 0.5,
      reviewCount: 0,
      correctStreak: 0
    };
    }

    const isCorrect = performance === 'good' || performance === 'easy';
    const newCorrectStreak = isCorrect ? flashcard.correctStreak + 1 : 0;

    // Update flashcard status based on performance
    let newStatus: 'new' | 'learning' | 'review' | 'mastered';
    if (performance === 'again') {
      newStatus = 'learning';
    } else if (newCorrectStreak >= 3) {
      newStatus = 'mastered';
    } else if (flashcard.reviewCount >= 2) {
      newStatus = 'review';
    } else {
      newStatus = 'learning';
    }

    // Update confidence based on performance
    let newConfidence = flashcard.confidence;
    switch (performance) {
      case 'again':
        newConfidence = Math.max(0.1, newConfidence - 0.2);
        break;
      case 'hard':
        newConfidence = Math.max(0.1, newConfidence - 0.1);
        break;
      case 'good':
        newConfidence = Math.min(1, newConfidence + 0.1);
        break;
      case 'easy':
        newConfidence = Math.min(1, newConfidence + 0.2);
        break;
    }

    this.progress.flashcards[flashcardId] = {
      ...flashcard,
      status: newStatus,
      lastReviewed: new Date(),
      confidence: newConfidence,
      reviewCount: flashcard.reviewCount + 1,
      correctStreak: newCorrectStreak
    };

    // Update session progress
    if (sessionId) {
      const session = this.sessions.find(s => s.id === sessionId);
      if (session) {
        session.progress.flashcardsStudied++;
        if (isCorrect) {
          session.progress.correctAnswers++;
        }
      }
    }
  }

  /**
   * Update note progress
   */
  updateNoteProgress(
    noteId: string,
    status: 'unread' | 'read' | 'mastered',
    timeSpent: number,
    sessionId?: string
  ): void {
    this.progress.notes[noteId] = {
      status,
      lastViewed: new Date(),
      timeSpent: (this.progress.notes[noteId]?.timeSpent || 0) + timeSpent
    };

    // Update session progress
    if (sessionId) {
      const session = this.sessions.find(s => s.id === sessionId);
      if (session) {
        session.progress.notesRead++;
      }
    }
  }

  /**
   * Update quiz progress
   */
  updateQuizProgress(
    quizId: string,
    score: number,
    timeSpent: number,
    completed: boolean,
    sessionId?: string
  ): void {
    this.progress.quizzes[quizId] = {
      attempts: (this.progress.quizzes[quizId]?.attempts || 0) + 1,
      bestScore: Math.max(this.progress.quizzes[quizId]?.bestScore || 0, score),
      lastAttempt: new Date(),
      completed
    };

    // Update session progress
    if (sessionId) {
      const session = this.sessions.find(s => s.id === sessionId);
      if (session) {
        session.progress.questionsAnswered++;
        if (score >= 80) {
          session.progress.correctAnswers++;
        }
      }
    }
  }

  /**
   * Get overall progress statistics
   */
  getProgressStats(): {
    totalFlashcards: number;
    masteredFlashcards: number;
    totalNotes: number;
    readNotes: number;
    masteredNotes: number;
    totalQuizzes: number;
    completedQuizzes: number;
    overallProgress: number;
    studyStreak: number;
    totalStudyTime: number;
  } {
    const flashcards = Object.values(this.progress.flashcards);
    const notes = Object.values(this.progress.notes);
    const quizzes = Object.values(this.progress.quizzes);

    const totalFlashcards = flashcards.length;
    const masteredFlashcards = flashcards.filter(f => f.status === 'mastered').length;
    
    const totalNotes = notes.length;
    const readNotes = notes.filter(n => n.status === 'read' || n.status === 'mastered').length;
    const masteredNotes = notes.filter(n => n.status === 'mastered').length;
    
    const totalQuizzes = quizzes.length;
    const completedQuizzes = quizzes.filter(q => q.completed).length;

    // Calculate overall progress (weighted average)
    const flashcardProgress = totalFlashcards > 0 ? (masteredFlashcards / totalFlashcards) * 100 : 0;
    const noteProgress = totalNotes > 0 ? (readNotes / totalNotes) * 100 : 0;
    const quizProgress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
    
    const overallProgress = (flashcardProgress + noteProgress + quizProgress) / 3;

    // Calculate study streak (consecutive days with study activity)
    const studyStreak = this.calculateStudyStreak();

    // Calculate total study time
    const totalStudyTime = this.sessions.reduce((sum, session) => sum + session.duration, 0);

    return {
      totalFlashcards,
      masteredFlashcards,
      totalNotes,
      readNotes,
      masteredNotes,
      totalQuizzes,
      completedQuizzes,
      overallProgress,
      studyStreak,
      totalStudyTime
    };
  }

  /**
   * Calculate study streak (consecutive days with study activity)
   */
  private calculateStudyStreak(): number {
    if (this.sessions.length === 0) return 0;

    const sortedSessions = this.sessions
      .filter(s => s.endTime)
      .sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime());

    if (sortedSessions.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.endTime!);
      sessionDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (daysDiff === streak + 1) {
        // Continue streak
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get flashcards due for review
   */
  getDueFlashcards(): string[] {
    const now = new Date();
    return Object.entries(this.progress.flashcards)
      .filter(([_, flashcard]) => flashcard.nextReview <= now)
      .map(([id, _]) => id);
  }

  /**
   * Get study recommendations
   */
  getStudyRecommendations(): {
    priority: 'flashcards' | 'notes' | 'quizzes' | 'mixed';
    dueReviews: number;
    newContent: number;
    estimatedTime: number;
    suggestions: string[];
  } {
    const stats = this.getProgressStats();
    const dueReviews = this.getDueFlashcards().length;
    const newContent = stats.totalNotes - stats.readNotes;

    let priority: 'flashcards' | 'notes' | 'quizzes' | 'mixed';
    let suggestions: string[] = [];

    if (dueReviews > 5) {
      priority = 'flashcards';
      suggestions.push('Focus on reviewing due flashcards');
    } else if (newContent > 3) {
      priority = 'notes';
      suggestions.push('Read new notes to expand knowledge');
    } else if (stats.totalQuizzes - stats.completedQuizzes > 0) {
      priority = 'quizzes';
      suggestions.push('Take quizzes to test your knowledge');
    } else {
      priority = 'mixed';
      suggestions.push('Great job! Try a mixed study session');
    }

    const estimatedTime = (dueReviews * 2) + (newContent * 5) + ((stats.totalQuizzes - stats.completedQuizzes) * 10);

    return {
      priority,
      dueReviews,
      newContent,
      estimatedTime,
      suggestions
    };
  }

  /**
   * Export progress data
   */
  exportProgress(): StudyProgress {
    return { ...this.progress };
  }

  /**
   * Import progress data
   */
  importProgress(progress: StudyProgress): void {
    this.progress = { ...progress };
  }

  /**
   * Get recent study sessions
   */
  getRecentSessions(limit: number = 10): StudySession[] {
    return this.sessions
      .filter(s => s.endTime)
      .sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
      .slice(0, limit);
  }
}
