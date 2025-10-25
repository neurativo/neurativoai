"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Play,
  Save,
  Sparkles
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

interface QuizPack {
  id: string;
  title: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  estimatedTime: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  totalTime: number;
}

interface StudyQuizzesProps {
  quizPacks: QuizPack[];
  onExplainQuestion?: (question: QuizQuestion) => void;
}

// Difficulty badge component
const DifficultyBadge = ({ difficulty }: { difficulty: string | undefined }) => {
  const colors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };
  
  const safeDifficulty = difficulty || 'medium';
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[safeDifficulty as keyof typeof colors] || colors.medium}`}>
      {safeDifficulty.charAt(0).toUpperCase() + safeDifficulty.slice(1)}
    </span>
  );
};

// Individual quiz component
const Quiz = ({ 
  quiz, 
  onComplete, 
  onExplainQuestion 
}: { 
  quiz: QuizPack; 
  onComplete: (results: { totalQuestions: number; correctAnswers: number; timeSpent: number; answers: number[]; questions: QuizQuestion[] }) => void;
  onExplainQuestion?: (question: QuizQuestion) => void;
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.estimatedTime * 60); // Convert to seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Start quiz
  const startQuiz = () => {
    setIsTimerRunning(true);
    setStartTime(new Date());
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  // Next question
  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Previous question
  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Submit quiz
  const handleSubmit = () => {
    setIsTimerRunning(false);
    setShowResults(true);
    
    const results = {
      totalQuestions: quiz.questions.length,
      correctAnswers: quiz.questions.filter((q, index) => 
        selectedAnswers[index] === q.correctAnswer
      ).length,
      timeSpent: startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0,
      answers: selectedAnswers,
      questions: quiz.questions
    };
    
    onComplete(results);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    const correctCount = quiz.questions.filter((q, index) => 
      selectedAnswers[index] === q.correctAnswer
    ).length;
    const percentage = Math.round((correctCount / quiz.questions.length) * 100);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
          <div className="text-4xl font-bold text-blue-600 mb-2">{percentage}%</div>
          <p className="text-gray-600">
            {correctCount} out of {quiz.questions.length} correct
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{correctCount}</div>
            <div className="text-sm text-green-700">Correct</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{quiz.questions.length - correctCount}</div>
            <div className="text-sm text-red-700">Incorrect</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div>
            <div className="text-sm text-blue-700">Time Left</div>
          </div>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((question, index) => {
            const isCorrect = selectedAnswers[index] === question.correctAnswer;
            const userAnswer = selectedAnswers[index];
            
            return (
              <div key={question.id} className={`p-4 rounded-lg border-2 ${
                isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={question.difficulty} />
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
                
                <p className="text-gray-800 mb-3">{question.question}</p>
                
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    let bgColor = 'bg-gray-50';
                    if (optionIndex === question.correctAnswer) {
                      bgColor = 'bg-green-100';
                    } else if (optionIndex === userAnswer && !isCorrect) {
                      bgColor = 'bg-red-100';
                    }
                    
                    return (
                      <div key={optionIndex} className={`p-2 rounded ${bgColor}`}>
                        {optionIndex === question.correctAnswer && (
                          <span className="text-green-600 font-medium">✓ </span>
                        )}
                        {optionIndex === userAnswer && !isCorrect && (
                          <span className="text-red-600 font-medium">✗ </span>
                        )}
                        {option}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-3 p-3 bg-gray-100 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setCurrentQuestion(0);
              setSelectedAnswers([]);
              setShowResults(false);
              setTimeLeft(quiz.estimatedTime * 60);
              setIsTimerRunning(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>
          <button
            onClick={() => {
              // Save results to localStorage
              const results = {
                quizId: quiz.id,
                score: percentage,
                correctAnswers: correctCount,
                totalQuestions: quiz.questions.length,
                timestamp: new Date().toISOString()
              };
              localStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(results));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Results
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  // Safety check for question
  if (!question) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Question not found. Please try again.</p>
        <button
          onClick={() => setCurrentQuestion(0)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
          <p className="text-gray-600">{quiz.questions.length} questions • {quiz.estimatedTime} minutes</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</div>
            <div className="text-xs text-gray-500">Time Left</div>
          </div>
          {!isTimerRunning && currentQuestion === 0 && (
            <button
              onClick={startQuiz}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Quiz
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={question.difficulty} />
            <span className="text-sm text-gray-500">{question.topic || 'General'}</span>
          </div>
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-6">{question.question}</h4>
        
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedAnswers[currentQuestion] === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion}`}
                value={index}
                checked={selectedAnswers[currentQuestion] === index}
                onChange={() => handleAnswerSelect(index)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedAnswers[currentQuestion] === index
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`} />
              <span className="text-gray-800">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={previousQuestion}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="flex items-center gap-2">
          {onExplainQuestion && (
            <button
              onClick={() => onExplainQuestion(question)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              AI Explain
            </button>
          )}
          
          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component
export default function StudyQuizzes({ quizPacks, onExplainQuestion }: StudyQuizzesProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizPack | null>(null);
  const [quizResults, setQuizResults] = useState<{ quizId: string; score: number; correctAnswers: number; totalQuestions: number; timestamp: string }[]>([]);

  // Load saved results
  useEffect(() => {
    const savedResults = quizPacks.map(quiz => {
      const saved = localStorage.getItem(`quiz_${quiz.id}`);
      return saved ? JSON.parse(saved) : null;
    }).filter(Boolean);
    setQuizResults(savedResults);
  }, [quizPacks]);

  // Debug logging
  useEffect(() => {
    console.log('StudyQuizzes - quizPacks:', quizPacks);
    if (quizPacks.length > 0) {
      console.log('First quiz pack:', quizPacks[0]);
      if (quizPacks[0].questions && quizPacks[0].questions.length > 0) {
        console.log('First question:', quizPacks[0].questions[0]);
      }
    }
  }, [quizPacks]);

  if (!quizPacks || quizPacks.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Quizzes Available</h3>
        <p className="text-gray-500">Upload a document to generate interactive quiz questions.</p>
      </div>
    );
  }

  if (selectedQuiz) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedQuiz(null)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Back to Quiz List
          </button>
        </div>
        
        <Quiz 
          quiz={selectedQuiz} 
          onComplete={(results) => {
            const quizResult = {
              quizId: selectedQuiz.id,
              score: Math.round((results.correctAnswers / results.totalQuestions) * 100),
              correctAnswers: results.correctAnswers,
              totalQuestions: results.totalQuestions,
              timestamp: new Date().toISOString()
            };
            setQuizResults(prev => [...prev, quizResult]);
            setSelectedQuiz(null);
          }}
          onExplainQuestion={onExplainQuestion}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">Study Quizzes</h2>
        <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
          {quizPacks.length}
        </span>
      </div>

      {/* Quiz List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizPacks.map((quiz) => {
          const savedResult = quizResults.find(r => r.quizId === quiz.id);
          
          return (
            <div key={quiz.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                <DifficultyBadge difficulty={quiz.difficulty} />
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {quiz.totalQuestions} questions
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {quiz.estimatedTime} minutes
                </div>
              </div>
              
              {savedResult && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-700">
                    <strong>Last Score:</strong> {savedResult.score}%
                  </div>
                  <div className="text-xs text-green-600">
                    {savedResult.correctAnswers}/{savedResult.totalQuestions} correct
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  console.log('Starting quiz:', quiz);
                  if (!quiz.questions || quiz.questions.length === 0) {
                    alert('This quiz has no questions available.');
                    return;
                  }
                  setSelectedQuiz(quiz);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                {savedResult ? 'Retake Quiz' : 'Start Quiz'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
