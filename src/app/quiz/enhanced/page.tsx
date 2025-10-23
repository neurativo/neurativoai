"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Brain, 
  BookOpen, 
  Download, 
  Settings,
  Sparkles,
  Target,
  Clock,
  Star,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Layers,
  Lightbulb,
  Code,
  Sigma,
  Shield,
  Gauge
} from 'lucide-react';
import StudyPackViewer from '../../components/StudyPackViewer';
import { StudyPackMetadata, EnhancedNote, EnhancedFlashcard, EnhancedQuiz } from '../../lib/types/studyPack';
import { ICON_COLORS, ICON_SIZES } from '../../lib/iconPalette';

type StudyPackData = {
  metadata: StudyPackMetadata;
  notes: EnhancedNote[];
  flashcards: EnhancedFlashcard[];
  quizzes: EnhancedQuiz[];
};

export default function EnhancedQuizPage() {
  const [studyPackData, setStudyPackData] = useState<StudyPackData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStudyPack, setShowStudyPack] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (4.5MB limit for Vercel)
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB
    if (file.size > maxSize) {
      setError('File too large. Please use a file smaller than 4.5MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }

      const result = await response.json();
      
      if (result.success && result.studyPack) {
        // Transform the data to match our enhanced types
        const enhancedData: StudyPackData = {
          metadata: {
            id: result.studyPack.id,
            title: result.studyPack.title,
            description: `Comprehensive study materials generated from ${result.document.title}`,
            totalSections: result.studyPack.detailedNotes?.length || 0,
            totalFlashcards: result.studyPack.flashcardDeck?.length || 0,
            totalNotes: result.studyPack.detailedNotes?.length || 0,
            totalQuizzes: result.studyPack.quizBank?.length || 0,
            estimatedStudyTime: result.studyPack.summary?.estimatedStudyTime || 0,
            difficulty: result.studyPack.summary?.difficulty || 'medium',
            tags: result.studyPack.detailedNotes?.flatMap(note => note.tags || []) || [],
            createdAt: new Date(result.studyPack.generatedAt),
            updatedAt: new Date(result.studyPack.generatedAt),
            progress: {
              sectionsCompleted: 0,
              flashcardsMastered: 0,
              notesRead: 0,
              quizzesCompleted: 0,
              overallProgress: 0
            }
          },
          notes: (result.studyPack.detailedNotes || []).map((note: any, index: number) => ({
            id: note.id || `note_${index}`,
            title: note.title || `Note ${index + 1}`,
            topic: note.topic || 'General',
            content: {
              summary: {
                title: note.content?.summary?.title || note.title,
                keyConcepts: note.content?.summary?.keyConcepts || [],
                learningOutcomes: note.content?.summary?.learningOutcomes || []
              },
              importantTopics: {
                definitions: note.content?.importantTopics?.definitions || {},
                principles: note.content?.importantTopics?.principles || [],
                formulas: note.content?.importantTopics?.formulas || []
              },
              examples: note.content?.examples || [],
              examTips: note.content?.examTips || [],
              relatedTopics: note.content?.relatedTopics || []
            },
            level: note.level || 'intermediate',
            estimatedTime: note.estimatedTime || 5,
            difficulty: note.difficulty || 3,
            tags: note.tags || [],
            collapsible: true
          })),
          flashcards: (result.studyPack.flashcardDeck || []).map((card: any, index: number) => ({
            id: card.id || `flashcard_${index}`,
            front: card.front || 'Question not available',
            back: card.back || 'Answer not available',
            explanation: card.explanation,
            difficulty: card.difficulty || 'medium',
            topic: card.topic || 'General',
            type: card.type || 'concept',
            tags: card.tags || [],
            confidence: 0.5,
            reviewHistory: [],
            aiGenerated: true
          })),
          quizzes: (result.studyPack.quizBank || []).map((quiz: any, index: number) => ({
            id: quiz.id || `quiz_${index}`,
            title: quiz.title || `Quiz ${index + 1}`,
            questions: quiz.questions || [],
            totalQuestions: quiz.totalQuestions || 0,
            estimatedTime: quiz.estimatedTime || 10,
            difficulty: quiz.difficulty || 'medium',
            totalPoints: quiz.totalPoints || 100,
            passingScore: quiz.passingScore || 70,
            adaptiveMode: true,
            shuffleQuestions: true,
            timeLimit: quiz.timeLimit || 600
          }))
        };

        setStudyPackData(enhancedData);
        setShowStudyPack(true);
      } else {
        throw new Error('Failed to generate study pack');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      setError(error instanceof Error ? error.message : 'Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!studyPackData) return;

    setExportLoading('pdf');
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: studyPackData.metadata,
          notes: studyPackData.notes,
          flashcards: studyPackData.flashcards,
          quizzes: studyPackData.quizzes,
          exportType: 'study-pack'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const result = await response.json();
      
      // Download the PDF
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${result.pdf}`;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Failed to export PDF');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportRevisionSheet = async () => {
    if (!studyPackData) return;

    setExportLoading('revision');
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: studyPackData.metadata,
          notes: studyPackData.notes,
          flashcards: studyPackData.flashcards,
          quizzes: studyPackData.quizzes,
          exportType: 'revision-sheet'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate revision sheet');
      }

      const result = await response.json();
      
      // Download the PDF
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${result.pdf}`;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting revision sheet:', error);
      setError('Failed to export revision sheet');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportFlashcards = async () => {
    if (!studyPackData) return;

    setExportLoading('flashcards');
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: studyPackData.metadata,
          notes: studyPackData.notes,
          flashcards: studyPackData.flashcards,
          quizzes: studyPackData.quizzes,
          exportType: 'flashcards'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards PDF');
      }

      const result = await response.json();
      
      // Download the PDF
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${result.pdf}`;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting flashcards:', error);
      setError('Failed to export flashcards');
    } finally {
      setExportLoading(null);
    }
  };

  if (showStudyPack && studyPackData) {
    return (
      <StudyPackViewer
        metadata={studyPackData.metadata}
        notes={studyPackData.notes}
        flashcards={studyPackData.flashcards}
        quizzes={studyPackData.quizzes}
        onExportPDF={handleExportPDF}
        onExportRevisionSheet={handleExportRevisionSheet}
        onExportFlashcards={handleExportFlashcards}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              AI Study Pack Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform any document into an interactive, personalized study experience with 
              AI-powered notes, flashcards, and quizzes
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <BookOpen className={`${ICON_SIZES.lg} ${ICON_COLORS.note}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Notes</h3>
              <p className="text-gray-600 text-sm">
                AI-generated study notes with key concepts, examples, and exam tips
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Layers className={`${ICON_SIZES.lg} ${ICON_COLORS.flashcard}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Adaptive Flashcards</h3>
              <p className="text-gray-600 text-sm">
                Spaced repetition system with confidence tracking and personalized review
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Brain className={`${ICON_SIZES.lg} ${ICON_COLORS.quiz}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive Quizzes</h3>
              <p className="text-gray-600 text-sm">
                Multiple question types with adaptive difficulty and detailed explanations
              </p>
            </div>
          </motion.div>
        </div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Upload Your Study Material
              </h2>
              <p className="text-gray-600">
                Upload PDFs, Word documents, or text files to generate your personalized study pack
              </p>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {isProcessing ? 'Processing...' : 'Choose File or Drag & Drop'}
                </h3>
                <p className="text-gray-500 mb-4">
                  Supports PDF, DOC, DOCX, and TXT files up to 4.5MB
                </p>
                {selectedFile && (
                  <div className="bg-gray-100 rounded-lg p-3 mb-4">
                    <FileText className="w-5 h-5 inline mr-2" />
                    <span className="text-sm text-gray-700">{selectedFile.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    'Select File'
                  )}
                </button>
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <h4 className="font-semibold text-blue-800">Processing Your Document</h4>
                    <p className="text-blue-600 text-sm">
                      AI is analyzing your content and generating study materials...
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    Extracting text and structure
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    Generating study notes
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    Creating flashcards
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    Building quizzes
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 max-w-6xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Choose AI Study Packs?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI-Powered</h3>
              <p className="text-gray-600 text-sm">
                Advanced AI analyzes your content and creates personalized study materials
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Adaptive Learning</h3>
              <p className="text-gray-600 text-sm">
                Spaced repetition and confidence tracking optimize your study sessions
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Export & Print</h3>
              <p className="text-gray-600 text-sm">
                Generate professional PDFs for offline study and printing
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Progress Tracking</h3>
              <p className="text-gray-600 text-sm">
                Monitor your learning progress with detailed analytics and insights
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
