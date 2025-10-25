"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  RotateCcw, 
  Shuffle, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  type: 'concept' | 'qa' | 'cloze' | 'definition';
  tags: string[];
}

interface StudyFlashcardsProps {
  flashcards: Flashcard[];
  onExplainCard?: (card: Flashcard) => void;
}

// Difficulty badge component
const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const colors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[difficulty as keyof typeof colors] || colors.medium}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
};

// Individual flashcard component with glassmorphism and proper flip animation
const Flashcard = ({ 
  card, 
  isFlipped, 
  onFlip
}: { 
  card: Flashcard; 
  isFlipped: boolean; 
  onFlip: () => void;
}) => {
  return (
    <div className="relative w-full max-w-md h-64 mx-auto cursor-pointer" onClick={onFlip}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isFlipped ? 'back' : 'front'}
          initial={{ rotateY: isFlipped ? -180 : 0, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: isFlipped ? 180 : -180, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-center p-6 text-center"
        >
          {isFlipped ? (
            // Back content
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-200 font-medium">Answer</span>
                <span className="text-xs text-blue-200 font-medium">{card.topic}</span>
              </div>
              <p className="text-white text-lg leading-relaxed font-medium">
                {card.back}
              </p>
              <div className="mt-4 text-xs text-blue-200">
                Click to flip back
              </div>
            </div>
          ) : (
            // Front content
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <DifficultyBadge difficulty={card.difficulty} />
                <span className="text-xs text-white/70 font-medium">{card.type}</span>
              </div>
              <p className="font-medium text-white text-lg leading-relaxed">
                {card.front}
              </p>
              <div className="mt-4 text-xs text-white/60">
                Click to reveal answer
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Main component
export default function StudyFlashcards({ flashcards, onExplainCard }: StudyFlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'normal' | 'shuffle'>('normal');
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [correctAnswers, setCorrectAnswers] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(false);

  // Initialize study cards
  useEffect(() => {
    setStudyCards(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  // Shuffle cards
  const shuffleCards = () => {
    const shuffled = [...studyCards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyMode('shuffle');
  };

  // Reset to original order
  const resetCards = () => {
    setStudyCards(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyMode('normal');
  };

  // Navigation
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  // Mark as studied
  const markAsStudied = (correct: boolean) => {
    const currentCard = studyCards[currentIndex];
    setStudiedCards(prev => new Set([...prev, currentCard.id]));
    if (correct) {
      setCorrectAnswers(prev => new Set([...prev, currentCard.id]));
    }
  };

  // Calculate progress
  const progress = studyCards.length > 0 ? (studiedCards.size / studyCards.length) * 100 : 0;
  const accuracy = studiedCards.size > 0 ? (correctAnswers.size / studiedCards.size) * 100 : 0;

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 max-w-md mx-auto">
          <div className="p-4 bg-purple-500/20 rounded-2xl w-fit mx-auto mb-6">
            <Layers className="w-16 h-16 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white/90 mb-3">No Flashcards Available</h3>
          <p className="text-white/70 leading-relaxed">Upload a document to generate interactive flashcards with beautiful animations.</p>
        </div>
      </div>
    );
  }

  const currentCard = studyCards[currentIndex];

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-purple-500/20 rounded-xl">
            <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-3xl font-bold text-white/90">Study Flashcards</h2>
            <p className="text-white/70 text-xs sm:text-sm">Interactive memory training</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-xl border border-purple-400/30 flex-shrink-0">
            <span className="text-purple-200 font-bold text-sm sm:text-lg">{flashcards.length}</span>
            <span className="text-purple-300 text-xs sm:text-sm ml-1">cards</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white/5 backdrop-blur-sm text-white/80 rounded-xl hover:bg-white/10 border border-white/10 transition-all duration-200"
          >
            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Stats</span>
          </button>
          <button
            onClick={shuffleCards}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-purple-500/20 backdrop-blur-sm text-purple-200 rounded-xl hover:bg-purple-500/30 border border-purple-400/30 transition-all duration-200"
          >
            <Shuffle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
          <button
            onClick={resetCards}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white/5 backdrop-blur-sm text-white/80 rounded-xl hover:bg-white/10 border border-white/10 transition-all duration-200"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-3xl font-bold text-white">{studiedCards.size}</div>
              <div className="text-sm text-white/70 font-medium">Studied</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-3xl font-bold text-green-400">{Math.round(accuracy)}%</div>
              <div className="text-sm text-white/70 font-medium">Accuracy</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-3xl font-bold text-blue-400">{Math.round(progress)}%</div>
              <div className="text-sm text-white/70 font-medium">Progress</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-white/10 backdrop-blur-sm rounded-full h-3 overflow-hidden">
        <motion.div 
          className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 h-3 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Card Display */}
      <div className="flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Flashcard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white/5 backdrop-blur-sm text-white/80 rounded-xl hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm"
        >
          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl px-3 sm:px-6 py-2 sm:py-3 border border-white/10 flex-1 sm:flex-none">
          <div className="text-xs sm:text-sm text-white font-medium">
            {currentIndex + 1} of {studyCards.length}
          </div>
          <div className="text-xs text-white/60">
            {studyMode === 'shuffle' && 'Shuffled'}
          </div>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === studyCards.length - 1}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white/5 backdrop-blur-sm text-white/80 rounded-xl hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Answer Feedback (when flipped) */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-2 sm:gap-4"
        >
          <button
            onClick={() => {
              markAsStudied(false);
              goToNext();
            }}
            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-red-500/20 backdrop-blur-sm text-red-200 rounded-xl hover:bg-red-500/30 border border-red-400/30 transition-all duration-200 text-xs sm:text-sm"
          >
            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Incorrect</span>
            <span className="sm:hidden">✗</span>
          </button>
          <button
            onClick={() => {
              markAsStudied(true);
              goToNext();
            }}
            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-500/20 backdrop-blur-sm text-green-200 rounded-xl hover:bg-green-500/30 border border-green-400/30 transition-all duration-200 text-xs sm:text-sm"
          >
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Correct</span>
            <span className="sm:hidden">✓</span>
          </button>
        </motion.div>
      )}

      {/* AI Explain Button */}
      {onExplainCard && (
        <div className="text-center">
          <button
            onClick={() => onExplainCard(currentCard)}
            className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm text-blue-200 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto text-sm sm:text-base"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold">AI Explain This Card</span>
          </button>
        </div>
      )}
    </div>
  );
}
