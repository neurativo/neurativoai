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

// Individual flashcard component
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
    <div className="relative w-80 h-48 cursor-pointer mx-auto" onClick={onFlip} style={{ perspective: '1000px' }}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="absolute inset-0 w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 bg-white shadow-xl rounded-2xl flex flex-col justify-center p-6 text-center border-2 border-gray-200"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-center justify-between mb-2">
            <DifficultyBadge difficulty={card.difficulty} />
            <span className="text-xs text-gray-500">{card.type}</span>
          </div>
          <p className="font-medium text-gray-800 text-lg leading-relaxed">
            {card.front}
          </p>
          <div className="mt-4 text-xs text-gray-400">
            Click to reveal answer
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl shadow-xl flex flex-col justify-center p-6 text-center"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-blue-200">Answer</span>
            <span className="text-xs text-blue-200">{card.topic}</span>
          </div>
          <p className="text-white text-lg leading-relaxed">
            {card.back}
          </p>
          <div className="mt-4 text-xs text-blue-200">
            Click to flip back
          </div>
        </div>
      </motion.div>
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
      <div className="text-center py-12">
        <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Flashcards Available</h3>
        <p className="text-gray-500">Upload a document to generate interactive flashcards.</p>
      </div>
    );
  }

  const currentCard = studyCards[currentIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Flashcards</h2>
          <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {flashcards.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Target className="w-4 h-4" />
            Stats
          </button>
          <button
            onClick={shuffleCards}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
          <button
            onClick={resetCards}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{studiedCards.size}</div>
              <div className="text-sm text-gray-600">Studied</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{Math.round(accuracy)}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
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
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="text-center">
          <div className="text-sm text-gray-600">
            {currentIndex + 1} of {studyCards.length}
          </div>
          <div className="text-xs text-gray-500">
            {studyMode === 'shuffle' && 'Shuffled'}
          </div>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === studyCards.length - 1}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Answer Feedback (when flipped) */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-4"
        >
          <button
            onClick={() => {
              markAsStudied(false);
              goToNext();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Incorrect
          </button>
          <button
            onClick={() => {
              markAsStudied(true);
              goToNext();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Correct
          </button>
        </motion.div>
      )}

      {/* AI Explain Button */}
      {onExplainCard && (
        <div className="text-center">
          <button
            onClick={() => onExplainCard(currentCard)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            AI Explain This Card
          </button>
        </div>
      )}
    </div>
  );
}
