"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Play, 
  Pause, 
  Flag,
  Target,
  Brain,
  Timer,
  Award,
  BarChart3,
  Circle,
  FileText,
  Edit3,
  FileEdit,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { EnhancedQuiz as QuizType } from '../lib/types/studyPack';

interface EnhancedQuizProps {
  quiz: QuizType;
  onComplete: (score: number, timeSpent: number, answers: QuizAnswer[]) => void;
  onExit: () => void;
  examMode?: boolean;
  adaptiveMode?: boolean;
}

interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-red-100 text-red-800 border-red-200'
};

export default function EnhancedQuiz({
  quiz,
  onComplete,
  onExit,
  examMode = false,
  adaptiveMode = false
}: EnhancedQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.totalQuestions) * 100;

  useEffect(() => {
    if (quiz.timeLimit && !isPaused && !isCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz.timeLimit, isPaused, isCompleted]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer: string | string[]) => {
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const isCorrect = checkAnswer(answer, currentQuestion.correctAnswer);
    
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      timeSpent
    };

    setAnswers(prev => [...prev.filter(a => a.questionId !== currentQuestion.id), newAnswer]);
  };

  const checkAnswer = (userAnswer: string | string[], correctAnswer: string | string[]) => {
    if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
      return userAnswer.length === correctAnswer.length && 
             userAnswer.every(ans => correctAnswer.includes(ans));
    }
    return userAnswer === correctAnswer;
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsCompleted(true);
    setShowResults(true);
    
    const totalTime = quiz.timeLimit ? quiz.timeLimit - timeRemaining : 
                     answers.reduce((sum, a) => sum + a.timeSpent, 0);
    
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const score = (correctAnswers / quiz.totalQuestions) * 100;
    
    onComplete(score, totalTime, answers);
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestionIndex)) {
      newFlagged.delete(currentQuestionIndex);
    } else {
      newFlagged.add(currentQuestionIndex);
    }
    setFlaggedQuestions(newFlagged);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple-choice': return Circle;
      case 'fill-in-blank': return FileText;
      case 'short-answer': return Edit3;
      case 'essay': return FileEdit;
      default: return HelpCircle;
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

    return (
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {React.createElement(getQuestionTypeIcon(currentQuestion.type), { className: "w-6 h-6 text-blue-600" })}
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Question {currentQuestionIndex + 1} of {quiz.totalQuestions}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${difficultyColors[currentQuestion.difficulty]}`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-sm text-gray-500">{currentQuestion.points} points</span>
                {currentQuestion.timeLimit && (
                  <span className="text-sm text-gray-500">
                    <Timer className="w-4 h-4 inline mr-1" />
                    {currentQuestion.timeLimit}s
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={toggleFlag}
            className={`p-2 rounded-lg transition-colors ${
              flaggedQuestions.has(currentQuestionIndex)
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Flag Question"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Question Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">
            {currentQuestion.question}
          </h4>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    currentAnswer?.answer === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={currentAnswer?.answer === option}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="sr-only"
                  />
                  <span className="w-6 h-6 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                    {currentAnswer?.answer === option && (
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                    )}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </label>
              ))
            )}

            {currentQuestion.type === 'fill-in-blank' && (
              <input
                type="text"
                value={currentAnswer?.answer as string || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your answer..."
              />
            )}

            {currentQuestion.type === 'short-answer' && (
              <textarea
                value={currentAnswer?.answer as string || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter your answer..."
              />
            )}

            {currentQuestion.type === 'essay' && (
              <textarea
                value={currentAnswer?.answer as string || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={8}
                placeholder="Write your essay here..."
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const score = (correctAnswers / quiz.totalQuestions) * 100;
    const totalTime = quiz.timeLimit ? quiz.timeLimit - timeRemaining : 
                     answers.reduce((sum, a) => sum + a.timeSpent, 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex justify-center mb-4">
          {score >= 80 ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          ) : score >= 60 ? (
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-yellow-600" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          )}
        </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Job!' : 'Keep Learning!'}
          </h2>
          
          <div className="text-4xl font-bold text-blue-600 mb-4">
            {Math.round(score)}%
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{quiz.totalQuestions - correctAnswers}</div>
              <div className="text-sm text-gray-500">Incorrect</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{formatTime(Math.floor(totalTime))}</div>
              <div className="text-sm text-gray-500">Time</div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setCurrentQuestionIndex(0);
              setAnswers([]);
              setShowResults(false);
              setIsCompleted(false);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>
          
          <button
            onClick={onExit}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Exit
          </button>
        </div>
      </motion.div>
    );
  };

  if (showResults) {
    return renderResults();
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{quiz.title}</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-500">
                {quiz.totalQuestions} questions • {quiz.estimatedTime} min
              </span>
              {quiz.adaptiveMode && (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  Adaptive Mode
                </span>
              )}
              {examMode && (
                <span className="text-sm text-red-600 flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Exam Mode
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {quiz.timeLimit && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className={`text-lg font-mono ${
                  timeRemaining < 60 ? 'text-red-600' : 'text-gray-800'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            
            <button
              onClick={togglePause}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        
        <div className="flex gap-1">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-blue-500 text-white'
                  : answers.find(a => a.questionId === quiz.questions[index].id)
                  ? 'bg-green-100 text-green-700'
                  : flaggedQuestions.has(index)
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderQuestion()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
