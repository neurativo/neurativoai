import { StudyProgress, SpacedRepetitionSettings } from './types/studyPack';

export class SpacedRepetitionSystem {
  private settings: SpacedRepetitionSettings;

  constructor(settings?: Partial<SpacedRepetitionSettings>) {
    this.settings = {
      intervals: [1, 6, 16, 35, 80, 170, 350], // Default SM-2 intervals
      maxInterval: 365,
      easeFactor: 2.5,
      minEaseFactor: 1.3,
      maxEaseFactor: 2.5,
      newCardsPerDay: 20,
      reviewCardsPerDay: 50,
      ...settings
    };
  }

  /**
   * Calculate the next review date for a flashcard based on performance
   */
  calculateNextReview(
    currentInterval: number,
    easeFactor: number,
    performance: 'again' | 'hard' | 'good' | 'easy',
    reviewCount: number
  ): { nextInterval: number; nextEaseFactor: number; nextReview: Date } {
    let newInterval: number;
    let newEaseFactor = easeFactor;

    switch (performance) {
      case 'again':
        // Reset to beginning
        newInterval = 1;
        newEaseFactor = Math.max(this.settings.minEaseFactor, easeFactor - 0.2);
        break;
      
      case 'hard':
        // Reduce interval but don't reset
        newInterval = Math.max(1, Math.floor(currentInterval * 0.8));
        newEaseFactor = Math.max(this.settings.minEaseFactor, easeFactor - 0.15);
        break;
      
      case 'good':
        // Normal progression
        if (reviewCount === 0) {
          newInterval = this.settings.intervals[0];
        } else if (reviewCount === 1) {
          newInterval = this.settings.intervals[1];
        } else {
          newInterval = Math.floor(currentInterval * easeFactor);
        }
        break;
      
      case 'easy':
        // Accelerated progression
        if (reviewCount === 0) {
          newInterval = this.settings.intervals[1];
        } else {
          newInterval = Math.floor(currentInterval * easeFactor * 1.3);
        }
        newEaseFactor = Math.min(this.settings.maxEaseFactor, easeFactor + 0.15);
        break;
    }

    // Cap the interval at maxInterval
    newInterval = Math.min(newInterval, this.settings.maxInterval);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return {
      nextInterval: newInterval,
      nextEaseFactor: newEaseFactor,
      nextReview
    };
  }

  /**
   * Get flashcards that are due for review
   */
  getDueFlashcards(progress: StudyProgress): string[] {
    const now = new Date();
    const dueFlashcards: string[] = [];

    Object.entries(progress.flashcards).forEach(([flashcardId, flashcard]) => {
      if (flashcard.nextReview <= now) {
        dueFlashcards.push(flashcardId);
      }
    });

    return dueFlashcards;
  }

  /**
   * Get new flashcards to introduce (respecting daily limits)
   */
  getNewFlashcards(
    progress: StudyProgress,
    allFlashcardIds: string[],
    studiedToday: number = 0
  ): string[] {
    const newFlashcards: string[] = [];
    const remainingNewCards = this.settings.newCardsPerDay - studiedToday;

    for (const flashcardId of allFlashcardIds) {
      if (newFlashcards.length >= remainingNewCards) break;
      
      if (!progress.flashcards[flashcardId]) {
        newFlashcards.push(flashcardId);
      }
    }

    return newFlashcards;
  }

  /**
   * Update flashcard progress after a review
   */
  updateFlashcardProgress(
    progress: StudyProgress,
    flashcardId: string,
    performance: 'again' | 'hard' | 'good' | 'easy',
    timeSpent: number
  ): StudyProgress {
    const flashcard = progress.flashcards[flashcardId];
    if (!flashcard) {
      // Initialize new flashcard
      progress.flashcards[flashcardId] = {
        status: 'new',
        lastReviewed: new Date(),
        nextReview: new Date(),
        confidence: 0.5,
        reviewCount: 0,
        correctStreak: 0
      };
    }

    const currentInterval = flashcard.reviewCount === 0 ? 0 : 
      Math.floor((flashcard.nextReview.getTime() - flashcard.lastReviewed.getTime()) / (1000 * 60 * 60 * 24));

    const { nextInterval, nextEaseFactor, nextReview } = this.calculateNextReview(
      currentInterval,
      flashcard.confidence,
      performance,
      flashcard.reviewCount
    );

    // Update flashcard status
    const isCorrect = performance === 'good' || performance === 'easy';
    const newCorrectStreak = isCorrect ? flashcard.correctStreak + 1 : 0;
    
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

    // Update progress
    progress.flashcards[flashcardId] = {
      ...flashcard,
      status: newStatus,
      lastReviewed: new Date(),
      nextReview,
      confidence: nextEaseFactor,
      reviewCount: flashcard.reviewCount + 1,
      correctStreak: newCorrectStreak
    };

    return progress;
  }

  /**
   * Calculate study session recommendations
   */
  getStudyRecommendations(progress: StudyProgress): {
    dueReviews: number;
    newCards: number;
    estimatedTime: number;
    priority: 'review' | 'new' | 'mixed';
  } {
    const dueReviews = this.getDueFlashcards(progress).length;
    const newCards = this.settings.newCardsPerDay;
    const estimatedTime = (dueReviews * 2) + (newCards * 3); // 2 min per review, 3 min per new card

    let priority: 'review' | 'new' | 'mixed';
    if (dueReviews > newCards * 2) {
      priority = 'review';
    } else if (dueReviews === 0) {
      priority = 'new';
    } else {
      priority = 'mixed';
    }

    return {
      dueReviews,
      newCards,
      estimatedTime,
      priority
    };
  }

  /**
   * Get study statistics
   */
  getStudyStats(progress: StudyProgress): {
    totalCards: number;
    masteredCards: number;
    learningCards: number;
    reviewCards: number;
    newCards: number;
    averageConfidence: number;
    streak: number;
  } {
    const flashcards = Object.values(progress.flashcards);
    const totalCards = flashcards.length;
    
    const masteredCards = flashcards.filter(f => f.status === 'mastered').length;
    const learningCards = flashcards.filter(f => f.status === 'learning').length;
    const reviewCards = flashcards.filter(f => f.status === 'review').length;
    const newCards = flashcards.filter(f => f.status === 'new').length;
    
    const averageConfidence = flashcards.length > 0 
      ? flashcards.reduce((sum, f) => sum + f.confidence, 0) / flashcards.length 
      : 0;
    
    const streak = Math.max(...flashcards.map(f => f.correctStreak), 0);

    return {
      totalCards,
      masteredCards,
      learningCards,
      reviewCards,
      newCards,
      averageConfidence,
      streak
    };
  }
}

export const defaultSpacedRepetitionSettings: SpacedRepetitionSettings = {
  intervals: [1, 6, 16, 35, 80, 170, 350],
  maxInterval: 365,
  easeFactor: 2.5,
  minEaseFactor: 1.3,
  maxEaseFactor: 2.5,
  newCardsPerDay: 20,
  reviewCardsPerDay: 50
};
