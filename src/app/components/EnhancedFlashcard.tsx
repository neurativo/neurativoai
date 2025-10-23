"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  Shuffle, 
  Eye, 
  EyeOff, 
  Download, 
  Star, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { EnhancedFlashcard as FlashcardType } from '../lib/types/studyPack';

interface EnhancedFlashcardProps {
  flashcard: FlashcardType;
  onAnswer: (performance: 'again' | 'hard' | 'good' | 'easy', timeSpent: number) => void;
  onShuffle: () => void;
  onExport: () => void;
  studyMode?: 'recall' | 'recognition' | 'mixed';
  showProgress?: boolean;
  isFlipped?: boolean;
  onFlip?: () => void;
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-red-100 text-red-800 border-red-200'
};

import { BookOpen, Lightbulb, Wrench, Sigma, MessageSquare } from 'lucide-react';

const typeIcons = {
  definition: BookOpen,
  concept: Lightbulb,
  application: Wrench,
  formula: Sigma,
  example: MessageSquare
};

export default function EnhancedFlashcard({
  flashcard,
  onAnswer,
  onShuffle,
  onExport,
  studyMode = 'mixed',
  showProgress = true,
  isFlipped = false,
  onFlip
}: EnhancedFlashcardProps) {
  const [flipped, setFlipped] = useState(isFlipped);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [studyModeEnabled, setStudyModeEnabled] = useState(false);

  useEffect(() => {
    setStartTime(Date.now());
  }, [flashcard.id]);

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip?.();
  };

  const handleAnswer = (performance: 'again' | 'hard' | 'good' | 'easy') => {
    const timeSpent = (Date.now() - startTime) / 1000;
    onAnswer(performance, timeSpent);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceButtons = () => {
    if (!flipped) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 mt-6"
      >
        <button
          onClick={() => handleAnswer('again')}
          className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Again
        </button>
        <button
          onClick={() => handleAnswer('hard')}
          className="flex-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Hard
        </button>
        <button
          onClick={() => handleAnswer('good')}
          className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Good
        </button>
        <button
          onClick={() => handleAnswer('easy')}
          className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
        >
          <Star className="w-4 h-4" />
          Easy
        </button>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {React.createElement(typeIcons[flashcard.type], { className: "w-6 h-6 text-blue-600" })}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${difficultyColors[flashcard.difficulty]}`}>
              {flashcard.difficulty}
            </span>
            <span className="text-sm text-gray-500">{flashcard.topic}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStudyModeEnabled(!studyModeEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              studyModeEnabled 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Study Mode (front only)"
          >
            {studyModeEnabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onShuffle}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Shuffle Cards"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button
            onClick={onExport}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Export Cards"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Confidence</span>
            <span className={getConfidenceColor(flashcard.confidence || 0.5)}>
              {Math.round((flashcard.confidence || 0.5) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                (flashcard.confidence || 0.5) >= 0.8 ? 'bg-green-500' :
                (flashcard.confidence || 0.5) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${(flashcard.confidence || 0.5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Flashcard */}
      <motion.div
        className="relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {/* Card Content */}
        <div className="p-8 min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!flipped ? (
              <motion.div
                key="front"
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {flashcard.front}
                </h3>
                {flashcard.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {flashcard.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {flashcard.back}
                </h3>
                
                {flashcard.explanation && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {showExplanation ? 'Hide' : 'Show'} Explanation
                    </button>
                    
                    <AnimatePresence>
                      {showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-4 bg-blue-50 rounded-lg text-left"
                        >
                          <p className="text-gray-700 text-sm">{flashcard.explanation}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Flip Button */}
        {!studyModeEnabled && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleFlip}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
              title="Flip Card"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      {getPerformanceButtons()}

      {/* Study Stats */}
      {flashcard.reviewHistory.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Study History</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Reviews:</span>
              <span className="ml-1 font-medium">{flashcard.reviewHistory.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Accuracy:</span>
              <span className="ml-1 font-medium">
                {Math.round(
                  (flashcard.reviewHistory.filter(r => r.correct).length / 
                   flashcard.reviewHistory.length) * 100
                )}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Avg Time:</span>
              <span className="ml-1 font-medium">
                {Math.round(
                  flashcard.reviewHistory.reduce((sum, r) => sum + r.timeSpent, 0) / 
                  flashcard.reviewHistory.length
                )}s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
