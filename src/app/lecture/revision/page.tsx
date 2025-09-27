"use client";
import { useState, useEffect } from "react";
import { RevisionPack, QuickRevisionSheet, DetailedNotes, Flashcard, QuizQuestion } from "@/app/lib/liveLectureAssistant";

export default function RevisionPackPage() {
  const [revisionPack, setRevisionPack] = useState<RevisionPack | null>(null);
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed' | 'flashcards' | 'quiz' | 'bookmarks'>('quick');
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: number }>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  useEffect(() => {
    // Load revision pack from localStorage or API
    const savedPack = localStorage.getItem('revisionPack');
    if (savedPack) {
      setRevisionPack(JSON.parse(savedPack));
    }
  }, []);

  const downloadRevisionPack = () => {
    if (!revisionPack) return;
    
    const content = generateRevisionContent(revisionPack);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lecture-revision-pack.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFlashcards = () => {
    if (!revisionPack) return;
    
    const ankiContent = generateAnkiFormat(revisionPack.flashcardDeck);
    const blob = new Blob([ankiContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lecture-flashcards.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitQuiz = () => {
    if (!revisionPack) return;
    
    let correct = 0;
    revisionPack.quizBank.forEach(question => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    
    const score = (correct / revisionPack.quizBank.length) * 100;
    setQuizScore(score);
  };

  if (!revisionPack) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Revision Pack Available</h1>
          <p className="text-gray-400">Complete a live lecture to generate your revision pack.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Revision Pack</h1>
          <div className="flex gap-4">
            <button
              onClick={downloadRevisionPack}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Download Pack
            </button>
            <button
              onClick={downloadFlashcards}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
            >
              Download Flashcards
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'quick', label: 'Quick Revision' },
            { id: 'detailed', label: 'Detailed Notes' },
            { id: 'flashcards', label: 'Flashcards' },
            { id: 'quiz', label: 'Quiz' },
            { id: 'bookmarks', label: 'Bookmarks' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'quick' && <QuickRevisionView sheet={revisionPack.quickRevision} />}
          {activeTab === 'detailed' && <DetailedNotesView notes={revisionPack.detailedNotes} />}
          {activeTab === 'flashcards' && <FlashcardsView flashcards={revisionPack.flashcardDeck} />}
          {activeTab === 'quiz' && <QuizView quiz={revisionPack.quizBank} />}
          {activeTab === 'bookmarks' && <BookmarksView bookmarks={revisionPack.bookmarks} />}
        </div>
      </div>
    </div>
  );
}

function QuickRevisionView({ sheet }: { sheet: QuickRevisionSheet }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{sheet.title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-blue-400">Key Points</h3>
          <ul className="space-y-2">
            {sheet.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-400">Formulas</h3>
          <ul className="space-y-2">
            {sheet.formulas.map((formula, index) => (
              <li key={index} className="bg-gray-700 p-2 rounded font-mono">
                {formula}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-purple-400">Definitions</h3>
          <ul className="space-y-2">
            {sheet.definitions.map((definition, index) => (
              <li key={index} className="text-sm">
                <strong>{definition.split(':')[0]}:</strong> {definition.split(':')[1]}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-orange-400">Concepts</h3>
          <ul className="space-y-2">
            {sheet.concepts.map((concept, index) => (
              <li key={index} className="flex items-start">
                <span className="text-orange-400 mr-2">•</span>
                <span>{concept}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DetailedNotesView({ notes }: { notes: DetailedNotes }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{notes.title}</h2>
      
      <div className="space-y-6">
        {notes.sections.map((section, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">{section.heading}</h3>
            <div className="prose prose-invert max-w-none">
              <p className="mb-3">{section.content}</p>
              
              {section.examples.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-semibold text-green-400 mb-2">Examples:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {section.examples.map((example, i) => (
                      <li key={i} className="text-sm">{example}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {section.formulas.length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Formulas:</h4>
                  <ul className="space-y-1">
                    {section.formulas.map((formula, i) => (
                      <li key={i} className="bg-gray-600 p-2 rounded font-mono text-sm">
                        {formula}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlashcardsView({ flashcards }: { flashcards: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentCard = flashcards[currentIndex];

  if (!currentCard) {
    return <div className="text-center text-gray-400">No flashcards available</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Flashcards</h2>
        <div className="text-sm text-gray-400">
          {currentIndex + 1} of {flashcards.length}
        </div>
      </div>

      <div className="bg-gray-700 rounded-lg p-6 min-h-[300px] flex flex-col justify-center">
        <div className="text-center mb-4">
          <div className="text-sm text-gray-400 mb-2">Question</div>
          <div className="text-lg font-semibold">{currentCard.front}</div>
        </div>

        {showAnswer && (
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400 mb-2">Answer</div>
            <div className="text-lg">{currentCard.back}</div>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
          
          <button
            onClick={() => {
              setCurrentIndex((currentIndex + 1) % flashcards.length);
              setShowAnswer(false);
            }}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
          >
            Next Card
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizView({ quiz }: { quiz: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const submitQuiz = () => {
    let correct = 0;
    quiz.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    const percentage = (correct / quiz.length) * 100;
    setScore(percentage);
    setShowResults(true);
  };

  if (quiz.length === 0) {
    return <div className="text-center text-gray-400">No quiz questions available</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Quiz</h2>
        {!showResults && (
          <button
            onClick={submitQuiz}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Submit Quiz
          </button>
        )}
      </div>

      {showResults && score !== null && (
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">Quiz Results</h3>
          <div className={`text-2xl font-bold ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
            {score.toFixed(1)}%
          </div>
        </div>
      )}

      <div className="space-y-6">
        {quiz.map((question, index) => (
          <div key={question.id} className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">
              {index + 1}. {question.question}
            </h3>
            
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => {
                const isSelected = answers[question.id] === optionIndex;
                const isCorrect = showResults && optionIndex === question.correctAnswer;
                const isWrong = showResults && isSelected && optionIndex !== question.correctAnswer;
                
                return (
                  <label
                    key={optionIndex}
                    className={`block p-3 rounded-lg cursor-pointer transition-colors ${
                      isCorrect
                        ? 'bg-green-600'
                        : isWrong
                        ? 'bg-red-600'
                        : isSelected
                        ? 'bg-blue-600'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={isSelected}
                      onChange={() => handleAnswerSelect(question.id, optionIndex)}
                      className="mr-3"
                      disabled={showResults}
                    />
                    {option}
                  </label>
                );
              })}
            </div>

            {showResults && (
              <div className="mt-3 p-3 bg-gray-600 rounded">
                <div className="text-sm text-gray-300">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookmarksView({ bookmarks }: { bookmarks: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Bookmarks</h2>
      
      {bookmarks.length === 0 ? (
        <div className="text-center text-gray-400">No bookmarks available</div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark, index) => (
            <div key={bookmark.id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-gray-400">
                  {new Date(bookmark.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-sm mb-2">{bookmark.transcript}</div>
              {bookmark.notes && (
                <div className="text-xs text-gray-300 bg-gray-600 p-2 rounded">
                  {bookmark.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
function generateRevisionContent(pack: RevisionPack): string {
  let content = `LECTURE REVISION PACK\n`;
  content += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  content += `QUICK REVISION SHEET\n`;
  content += `==================\n`;
  content += `Key Points:\n`;
  pack.quickRevision.keyPoints.forEach(point => content += `• ${point}\n`);
  content += `\nFormulas:\n`;
  pack.quickRevision.formulas.forEach(formula => content += `• ${formula}\n`);
  
  content += `\n\nDETAILED NOTES\n`;
  content += `==============\n`;
  pack.detailedNotes.sections.forEach(section => {
    content += `${section.heading}\n`;
    content += `${section.content}\n\n`;
  });
  
  return content;
}

function generateAnkiFormat(flashcards: Flashcard[]): string {
  let content = '';
  flashcards.forEach(card => {
    content += `${card.front}\t${card.back}\n`;
  });
  return content;
}
