'use client';

import React, { useState, useRef } from 'react';
import { DocumentProcessor, ProcessedDocument } from '@/app/lib/documentProcessor';
import { AIStudyPackGenerator, RevisionPack, StudyNote, Flashcard, QuizQuestion } from '@/app/lib/aiStudyPackGenerator';

export default function StudyPackPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);
  const [studyPack, setStudyPack] = useState<RevisionPack | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'notes' | 'flashcards' | 'quizzes' | 'revision'>('upload');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('subject', 'Computer Science');
      formData.append('course', 'Database Systems');
      formData.append('difficulty', 'intermediate');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setProcessedDocument(result.document);
      setStudyPack(result.studyPack);
      setActiveTab('notes');
      
      console.log('Document processed successfully:', result);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        fileInputRef.current.files = files;
        handleFileUpload({ target: { files } } as any);
      }
    }
  };

  const renderUploadSection = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Study Pack Generator
          </h1>
          <p className="text-xl text-gray-600">
            Upload your syllabus, textbook, or tutorial materials to generate comprehensive study materials
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png,.tiff"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900">
                Drop your document here
              </h3>
              
              <p className="text-gray-600">
                Supports PDF, DOCX, and scanned images (JPG, PNG, TIFF)
              </p>
              
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Choose File
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Processing document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Detailed Notes</h4>
              <p className="text-sm text-gray-600">Structured summaries with key concepts</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Flashcards</h4>
              <p className="text-sm text-gray-600">Q&A cards for active recall</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Quiz Packs</h4>
              <p className="text-sm text-gray-600">Multiple choice questions with explanations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotesSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Detailed Notes</h2>
        <p className="text-gray-600 mb-6">
          {studyPack?.detailedNotes.length || 0} structured notes with key concepts, examples, and highlights
        </p>
        
        <div className="space-y-4">
          {studyPack?.detailedNotes.map((note, index) => (
            <div key={note.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{note.topic}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  note.level === 'basic' ? 'bg-green-100 text-green-800' :
                  note.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {note.level}
                </span>
              </div>
              
              <div className="text-gray-700 whitespace-pre-line mb-3">
                {note.content}
              </div>
              
              {note.highlights.keyFormulas.length > 0 && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Key Formulas:</span>
                  <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                    {note.highlights.keyFormulas.map((formula, i) => (
                      <li key={i}>{formula}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {note.examples.length > 0 && (
                <div className="mt-3">
                  <span className="text-sm font-medium text-gray-600">Examples:</span>
                  {note.examples.map((example, i) => (
                    <div key={i} className="mt-2 p-3 bg-gray-50 rounded">
                      <h4 className="font-medium text-gray-900">{example.title}</h4>
                      <p className="text-sm text-gray-600">{example.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFlashcardsSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Flashcard Deck</h2>
        <p className="text-gray-600 mb-6">
          {studyPack?.flashcardDeck.length || 0} flashcards for active recall and memorization
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studyPack?.flashcardDeck.map((card, index) => (
            <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">{card.topic}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  card.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  card.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {card.difficulty}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded">
                  <h4 className="font-medium text-gray-900 mb-1">Question:</h4>
                  <p className="text-gray-700">{card.front}</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded">
                  <h4 className="font-medium text-gray-900 mb-1">Answer:</h4>
                  <p className="text-gray-700">{card.back}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuizzesSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Packs</h2>
        <p className="text-gray-600 mb-6">
          {studyPack?.quizBank.length || 0} quiz packs with {studyPack?.summary.totalQuestions || 0} total questions
        </p>
        
        <div className="space-y-4">
          {studyPack?.quizBank.map((quiz, index) => (
            <div key={quiz.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{quiz.totalQuestions} questions</span>
                  <span>{quiz.estimatedTime} min</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quiz.difficulty}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {quiz.questions.slice(0, 3).map((question, qIndex) => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {qIndex + 1}. {question.question}
                    </h4>
                    <div className="space-y-1">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {String.fromCharCode(65 + oIndex)}.
                          </span>
                          <span className={`text-sm ${
                            oIndex === question.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-700'
                          }`}>
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {quiz.questions.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... and {quiz.questions.length - 3} more questions
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRevisionSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Revision Sheet</h2>
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded">
            {studyPack?.quickRevisionSheet}
          </pre>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Study Pack Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{studyPack?.summary.totalTopics}</div>
            <div className="text-sm text-gray-600">Topics</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded">
            <div className="text-2xl font-bold text-purple-600">{studyPack?.summary.totalFlashcards}</div>
            <div className="text-sm text-gray-600">Flashcards</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded">
            <div className="text-2xl font-bold text-orange-600">{studyPack?.summary.totalQuestions}</div>
            <div className="text-sm text-gray-600">Questions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{studyPack?.summary.estimatedStudyTime}h</div>
            <div className="text-sm text-gray-600">Study Time</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!studyPack) {
    return renderUploadSection();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {studyPack.title}
            </h1>
            <button
              onClick={() => {
                setStudyPack(null);
                setProcessedDocument(null);
                setActiveTab('upload');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Upload New Document
            </button>
          </div>
          
          <nav className="flex space-x-8">
            {[
              { id: 'notes', label: 'Notes', count: studyPack.detailedNotes.length },
              { id: 'flashcards', label: 'Flashcards', count: studyPack.flashcardDeck.length },
              { id: 'quizzes', label: 'Quizzes', count: studyPack.quizBank.length },
              { id: 'revision', label: 'Revision', count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'notes' && renderNotesSection()}
        {activeTab === 'flashcards' && renderFlashcardsSection()}
        {activeTab === 'quizzes' && renderQuizzesSection()}
        {activeTab === 'revision' && renderRevisionSection()}
      </div>
    </div>
  );
}
