"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Download, 
  Settings, 
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Target,
  Clock,
  Star,
  CheckCircle,
  TrendingUp,
  Layers,
  Lightbulb,
  Code,
  Sigma,
  Shield,
  Gauge
} from 'lucide-react';
import EnhancedFlashcard from './EnhancedFlashcard';
import EnhancedNotes from './EnhancedNotes';
import EnhancedQuiz from './EnhancedQuiz';
import { StudyPackMetadata, EnhancedFlashcard as FlashcardType, EnhancedNote, EnhancedQuiz as QuizType, StudyProgress, StudySession } from '../lib/types/studyPack';
import { SpacedRepetitionSystem } from '../lib/spacedRepetition';
import { ProgressTracker } from '../lib/progressTracker';
import { ICON_COLORS, ICON_SIZES } from '../lib/iconPalette';

interface StudyPackViewerProps {
  metadata: StudyPackMetadata;
  notes: EnhancedNote[];
  flashcards: FlashcardType[];
  quizzes: QuizType[];
  onExportPDF: () => void;
  onExportRevisionSheet: () => void;
  onExportFlashcards: () => void;
}

type ViewMode = 'overview' | 'notes' | 'flashcards' | 'quizzes' | 'exam-simulation' | 'quick-review';
type StudyMode = 'flashcards' | 'notes' | 'quiz' | 'mixed' | 'exam-simulation';

export default function StudyPackViewer({
  metadata,
  notes,
  flashcards,
  quizzes,
  onExportPDF,
  onExportRevisionSheet,
  onExportFlashcards
}: StudyPackViewerProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
  const [studyMode, setStudyMode] = useState<StudyMode>('mixed');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [progress, setProgress] = useState<StudyProgress>({
    sectionId: metadata.id,
    flashcards: {},
    notes: {},
    quizzes: {}
  });
  const [isStudyActive, setIsStudyActive] = useState(false);
  const [studyStats, setStudyStats] = useState({
    timeSpent: 0,
    cardsStudied: 0,
    notesRead: 0,
    questionsAnswered: 0,
    correctAnswers: 0
  });

  const spacedRepetition = new SpacedRepetitionSystem();
  const progressTracker = new ProgressTracker(progress);

  useEffect(() => {
    // Initialize progress tracking
    const savedProgress = localStorage.getItem(`study_progress_${metadata.id}`);
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, [metadata.id]);

  useEffect(() => {
    // Save progress to localStorage
    localStorage.setItem(`study_progress_${metadata.id}`, JSON.stringify(progress));
  }, [progress, metadata.id]);

  const startStudySession = (mode: StudyMode) => {
    const session = progressTracker.startSession(metadata.id, 'user', mode);
    setStudySession(session);
    setIsStudyActive(true);
    setStudyMode(mode);
  };

  const endStudySession = () => {
    if (studySession) {
      const completedSession = progressTracker.endSession(studySession.id);
      setStudySession(null);
      setIsStudyActive(false);
      
      // Update study stats
      if (completedSession) {
        setStudyStats(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + completedSession.duration,
          cardsStudied: completedSession.progress.flashcardsStudied,
          notesRead: completedSession.progress.notesRead,
          questionsAnswered: completedSession.progress.questionsAnswered,
          correctAnswers: completedSession.progress.correctAnswers
        }));
      }
    }
  };

  const handleFlashcardAnswer = (performance: 'again' | 'hard' | 'good' | 'easy', timeSpent: number) => {
    const flashcard = flashcards[currentFlashcardIndex];
    if (!flashcard) return;

    // Update progress
    const updatedProgress = spacedRepetition.updateFlashcardProgress(
      progress,
      flashcard.id,
      performance,
      timeSpent
    );
    setProgress(updatedProgress);

    // Move to next card
    if (currentFlashcardIndex < flashcards.length - 1) {
      setCurrentFlashcardIndex(prev => prev + 1);
    } else {
      // End of deck
      endStudySession();
    }
  };

  const handleNoteRead = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    progressTracker.updateNoteProgress(noteId, 'read', 60, studySession?.id);
    setProgress(progressTracker.exportProgress());
  };

  const handleNoteMastered = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    progressTracker.updateNoteProgress(noteId, 'mastered', 60, studySession?.id);
    setProgress(progressTracker.exportProgress());
  };

  const handleQuizComplete = (score: number, timeSpent: number, answers: any[]) => {
    const quiz = quizzes[currentQuizIndex];
    if (!quiz) return;

    progressTracker.updateQuizProgress(quiz.id, score, timeSpent, true, studySession?.id);
    setProgress(progressTracker.exportProgress());

    // Move to next quiz or end session
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      endStudySession();
    }
  };

  const shuffleFlashcards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setCurrentFlashcardIndex(0);
  };

  const getProgressStats = () => {
    return progressTracker.getProgressStats();
  };

  const getStudyRecommendations = () => {
    return progressTracker.getStudyRecommendations();
  };

  const renderOverview = () => {
    const stats = getProgressStats();
    const recommendations = getStudyRecommendations();

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{metadata.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{metadata.description}</p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {metadata.estimatedStudyTime} min
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {metadata.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {metadata.tags.join(', ')}
            </span>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Your Progress
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.overallProgress.toFixed(0)}%</div>
              <div className="text-sm text-gray-500">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.masteredFlashcards}</div>
              <div className="text-sm text-gray-500">Cards Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.readNotes}</div>
              <div className="text-sm text-gray-500">Notes Read</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.studyStreak}</div>
              <div className="text-sm text-gray-500">Day Streak</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Study Progress</span>
              <span>{stats.overallProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Study Recommendations */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Study Recommendations
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">
                {recommendations.dueReviews} flashcards due for review
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">
                {recommendations.newContent} new notes to read
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700">
                Estimated time: {recommendations.estimatedTime} minutes
              </span>
            </div>
          </div>
        </div>

        {/* Study Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className={`${ICON_SIZES.lg} ${ICON_COLORS.note}`} />
              <h3 className="text-xl font-bold text-gray-800">Study Notes</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Read detailed notes with examples, definitions, and exam tips
            </p>
            <button
              onClick={() => setCurrentView('notes')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Reading
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Layers className={`${ICON_SIZES.lg} ${ICON_COLORS.flashcard}`} />
              <h3 className="text-xl font-bold text-gray-800">Flashcards</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Practice with spaced repetition and adaptive learning
            </p>
            <button
              onClick={() => setCurrentView('flashcards')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Practicing
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Brain className={`${ICON_SIZES.lg} ${ICON_COLORS.quiz}`} />
              <h3 className="text-xl font-bold text-gray-800">Quizzes</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Test your knowledge with interactive quizzes
            </p>
            <button
              onClick={() => setCurrentView('quizzes')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Take Quiz
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={onExportRevisionSheet}
              className="flex items-center gap-2 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Revision Sheet
            </button>
            <button
              onClick={onExportFlashcards}
              className="flex items-center gap-2 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Brain className="w-4 h-4" />
              Export Flashcards
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNotes = () => {
    if (notes.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Notes Available</h3>
          <p className="text-gray-500">Notes will appear here once generated.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Study Notes</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentNoteIndex(prev => prev > 0 ? prev - 1 : notes.length - 1)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <span className="text-sm text-gray-500">
              {currentNoteIndex + 1} of {notes.length}
            </span>
            <button
              onClick={() => setCurrentNoteIndex(prev => prev < notes.length - 1 ? prev + 1 : 0)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <EnhancedNotes
          note={notes[currentNoteIndex]}
          onMarkAsRead={handleNoteRead}
          onMarkAsMastered={handleNoteMastered}
          showProgress={true}
          isRead={progress.notes[notes[currentNoteIndex]?.id]?.status === 'read' || progress.notes[notes[currentNoteIndex]?.id]?.status === 'mastered'}
          isMastered={progress.notes[notes[currentNoteIndex]?.id]?.status === 'mastered'}
        />
      </div>
    );
  };

  const renderFlashcards = () => {
    if (flashcards.length === 0) {
      return (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Flashcards Available</h3>
          <p className="text-gray-500">Flashcards will appear here once generated.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Flashcards</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentFlashcardIndex(prev => prev > 0 ? prev - 1 : flashcards.length - 1)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <span className="text-sm text-gray-500">
              {currentFlashcardIndex + 1} of {flashcards.length}
            </span>
            <button
              onClick={() => setCurrentFlashcardIndex(prev => prev < flashcards.length - 1 ? prev + 1 : 0)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <EnhancedFlashcard
          flashcard={flashcards[currentFlashcardIndex]}
          onAnswer={handleFlashcardAnswer}
          onShuffle={shuffleFlashcards}
          onExport={onExportFlashcards}
          studyMode="mixed"
          showProgress={true}
        />
      </div>
    );
  };

  const renderQuizzes = () => {
    if (quizzes.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Quizzes Available</h3>
          <p className="text-gray-500">Quizzes will appear here once generated.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Quizzes</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentQuizIndex(prev => prev > 0 ? prev - 1 : quizzes.length - 1)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <span className="text-sm text-gray-500">
              {currentQuizIndex + 1} of {quizzes.length}
            </span>
            <button
              onClick={() => setCurrentQuizIndex(prev => prev < quizzes.length - 1 ? prev + 1 : 0)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <EnhancedQuiz
          quiz={quizzes[currentQuizIndex]}
          onComplete={handleQuizComplete}
          onExit={() => setCurrentView('overview')}
          examMode={false}
          adaptiveMode={true}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('overview')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'overview' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView('notes')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'notes' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setCurrentView('flashcards')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'flashcards' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Flashcards
              </button>
              <button
                onClick={() => setCurrentView('quizzes')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'quizzes' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Quizzes
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isStudyActive && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Study Session Active
                </div>
              )}
              <button
                onClick={() => setCurrentView('overview')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'overview' && renderOverview()}
            {currentView === 'notes' && renderNotes()}
            {currentView === 'flashcards' && renderFlashcards()}
            {currentView === 'quizzes' && renderQuizzes()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
