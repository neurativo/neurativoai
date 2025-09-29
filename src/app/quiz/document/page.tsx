'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

interface DocumentAnalysis {
  summary: string;
  keyConcepts: string[];
  topics: string[];
  difficulty: string;
  estimatedReadingTime: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  concept: string;
}

interface DocumentQuizData {
  document: {
    fileName: string;
    pageCount: number;
    wordCount: number;
    analysis: DocumentAnalysis;
  };
  quiz: {
    questions: QuizQuestion[];
    totalQuestions: number;
    difficulty: string;
    estimatedTime: number;
  };
  usage: {
    dailyUsed: number;
    dailyLimit: number;
  };
}

export default function DocumentQuizPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentQuizData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get user from Supabase
  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getUser();
  }, []);
  const [dragActive, setDragActive] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/signup');
    return null;
  }

  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF, TXT, or DOCX file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const response = await fetch('/api/document/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const startQuiz = () => {
    if (analysis) {
      // Store quiz data in sessionStorage and navigate to quiz
      sessionStorage.setItem('documentQuizData', JSON.stringify(analysis));
      router.push('/quiz/play');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Quiz by Document
          </h1>
          <p className="text-xl text-gray-300">
            Upload a document and get an intelligent quiz generated from its content
          </p>
        </div>

        {/* Upload Section */}
        <div className="feature-card p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Upload Document</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-900/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <div className="text-green-400 text-xl">✓</div>
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="btn btn-sm btn-outline"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl text-gray-400">📄</div>
                <div>
                  <p className="text-lg mb-2">Drag and drop your document here</p>
                  <p className="text-sm text-gray-400 mb-4">
                    or click to browse files
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary"
                  >
                    Choose File
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Supports PDF, TXT, and DOCX files (max 10MB)
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          {file && (
            <div className="mt-6 text-center">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary btn-lg"
              >
                {uploading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Analyzing Document...
                  </>
                ) : (
                  'Analyze Document'
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="feature-card p-8">
            <h2 className="text-2xl font-semibold mb-6">Document Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Document Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">File:</span> {analysis.document.fileName}</p>
                    <p><span className="text-gray-400">Pages:</span> {analysis.document.pageCount}</p>
                    <p><span className="text-gray-400">Words:</span> {analysis.document.wordCount.toLocaleString()}</p>
                    <p><span className="text-gray-400">Reading Time:</span> {analysis.document.analysis.estimatedReadingTime} min</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Quiz Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">Questions:</span> {analysis.quiz.totalQuestions}</p>
                    <p><span className="text-gray-400">Difficulty:</span> {analysis.quiz.difficulty}</p>
                    <p><span className="text-gray-400">Est. Time:</span> {analysis.quiz.estimatedTime} min</p>
                    <p><span className="text-gray-400">Daily Usage:</span> {analysis.usage.dailyUsed}/{analysis.usage.dailyLimit}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Summary</h3>
              <p className="text-gray-300">{analysis.document.analysis.summary}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Key Concepts</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.document.analysis.keyConcepts.map((concept, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-900/30 border border-blue-500 rounded-full text-sm"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={startQuiz}
                className="btn btn-primary btn-lg"
              >
                Start Quiz ({analysis.quiz.totalQuestions} questions)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}