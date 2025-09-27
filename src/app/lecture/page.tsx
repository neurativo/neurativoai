"use client";
import { useState, useEffect, useRef } from "react";
import { LiveLectureAssistant, LiveLectureState, Flashcard, Bookmark, Highlight } from "@/app/lib/liveLectureAssistant";

export default function LiveLecturePage() {
  const [assistant] = useState(() => new LiveLectureAssistant());
  const [state, setState] = useState<LiveLectureState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentNotes, setCurrentNotes] = useState<string[]>([]);
  const [recentFlashcards, setRecentFlashcards] = useState<Flashcard[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [studentQuestion, setStudentQuestion] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [highlightText, setHighlightText] = useState("");
  const [bookmarkNotes, setBookmarkNotes] = useState("");

  // Update state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newState = assistant.getState();
      setState(newState);
      setCurrentNotes(assistant.getCurrentNotes());
      setRecentFlashcards(assistant.getRecentFlashcards());
      setBookmarks(assistant.getBookmarks());
      setHighlights(assistant.getHighlights());
    }, 1000);

    return () => clearInterval(interval);
  }, [assistant]);

  const startLecture = async () => {
    try {
      await assistant.startLecture();
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to start lecture:", error);
    }
  };

  const pauseLecture = async () => {
    await assistant.pauseLecture();
  };

  const resumeLecture = async () => {
    await assistant.resumeLecture();
  };

  const stopLecture = async () => {
    const revisionPack = await assistant.stopLecture();
    console.log("Revision pack generated:", revisionPack);
    // Handle revision pack download/display
  };

  const addBookmark = async () => {
    await assistant.addBookmark(bookmarkNotes);
    setBookmarkNotes("");
  };

  const addHighlight = async () => {
    if (highlightText.trim()) {
      await assistant.addHighlight(highlightText);
      setHighlightText("");
    }
  };

  const askQuestion = async () => {
    if (studentQuestion.trim()) {
      const answer = await assistant.askQuestion(studentQuestion);
      setQuestionAnswer(answer);
      setStudentQuestion("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Live Lecture Assistant</h1>
        
        {/* Control Panel */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Lecture Controls</h2>
          <div className="flex gap-4 mb-4">
            {!isInitialized ? (
              <button
                onClick={startLecture}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold"
              >
                Start Lecture
              </button>
            ) : (
              <>
                {state?.isPaused ? (
                  <button
                    onClick={resumeLecture}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold"
                  >
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={pauseLecture}
                    className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-lg font-semibold"
                  >
                    Pause
                  </button>
                )}
                <button
                  onClick={stopLecture}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold"
                >
                  End Lecture
                </button>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bookmark */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Add Bookmark</h3>
              <textarea
                value={bookmarkNotes}
                onChange={(e) => setBookmarkNotes(e.target.value)}
                placeholder="Add notes for this bookmark..."
                className="w-full bg-gray-600 text-white p-2 rounded mb-2"
                rows={2}
              />
              <button
                onClick={addBookmark}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
              >
                Bookmark
              </button>
            </div>

            {/* Highlight */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Highlight & Explain</h3>
              <input
                type="text"
                value={highlightText}
                onChange={(e) => setHighlightText(e.target.value)}
                placeholder="Highlight text for explanation..."
                className="w-full bg-gray-600 text-white p-2 rounded mb-2"
              />
              <button
                onClick={addHighlight}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-sm"
              >
                Highlight
              </button>
            </div>

            {/* Ask Question */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Ask Question</h3>
              <input
                type="text"
                value={studentQuestion}
                onChange={(e) => setStudentQuestion(e.target.value)}
                placeholder="Ask a question about the lecture..."
                className="w-full bg-gray-600 text-white p-2 rounded mb-2"
              />
              <button
                onClick={askQuestion}
                className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-sm"
              >
                Ask
              </button>
            </div>
          </div>

          {questionAnswer && (
            <div className="mt-4 p-4 bg-blue-900 rounded-lg">
              <h4 className="font-semibold mb-2">AI Answer:</h4>
              <p>{questionAnswer}</p>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Notes */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Live Notes</h2>
            <div className="bg-gray-700 p-4 rounded-lg min-h-[300px] max-h-[400px] overflow-y-auto">
              {currentNotes.length > 0 ? (
                <ul className="space-y-2">
                  {currentNotes.map((note, index) => (
                    <li key={index} className="text-sm">
                      {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">Notes will appear here as the lecture progresses...</p>
              )}
            </div>
          </div>

          {/* Recent Flashcards */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Flashcards</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentFlashcards.length > 0 ? (
                recentFlashcards.map((card) => (
                  <div key={card.id} className="bg-gray-700 p-3 rounded-lg">
                    <div className="font-semibold text-sm mb-1">{card.front}</div>
                    <div className="text-xs text-gray-300">{card.back}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {card.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Flashcards will be generated automatically...</p>
              )}
            </div>
          </div>
        </div>

        {/* Bookmarks and Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Bookmarks */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Bookmarks ({bookmarks.length})</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {bookmarks.length > 0 ? (
                bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-300 mb-1">
                      {bookmark.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="text-sm mb-2">{bookmark.transcript.slice(0, 100)}...</div>
                    {bookmark.notes && (
                      <div className="text-xs text-gray-400">{bookmark.notes}</div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No bookmarks yet</p>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Highlights ({highlights.length})</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {highlights.length > 0 ? (
                highlights.map((highlight) => (
                  <div key={highlight.id} className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-300 mb-1">
                      {highlight.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="text-sm font-semibold mb-2">"{highlight.text}"</div>
                    <div className="text-xs text-gray-400">{highlight.explanation}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No highlights yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Lecture Status */}
        {state && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Lecture Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Status:</span>
                <span className={`ml-2 ${state.isRecording ? 'text-green-400' : 'text-red-400'}`}>
                  {state.isRecording ? (state.isPaused ? 'Paused' : 'Recording') : 'Stopped'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="ml-2">
                  {Math.floor((Date.now() - state.startTime.getTime()) / 1000 / 60)} min
                </span>
              </div>
              <div>
                <span className="text-gray-400">Sections:</span>
                <span className="ml-2">{state.sections.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Flashcards:</span>
                <span className="ml-2">{state.flashcards.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
