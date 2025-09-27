"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { LiveLectureAssistant, LiveLectureState, Flashcard, Bookmark, Highlight } from "@/app/lib/liveLectureAssistant";

export default function LiveLecturePage() {
  const router = useRouter();
  const [assistant] = useState(() => new LiveLectureAssistant('assemblyai')); // Use AssemblyAI by default
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
  const [setupComplete, setSetupComplete] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [micTested, setMicTested] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Check user plan and setup
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user is logged in and has Special plan
        const { data: { user } } = await getSupabaseBrowser().auth.getUser();
        if (!user) {
          router.push('/signup');
          return;
        }

        // Check user's subscription plan
        const { data: subscription } = await getSupabaseBrowser()
          .from('subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .maybeSingle();

        const plan = subscription?.plan;
        setUserPlan(plan);

        if (plan !== 'special') {
          router.push('/pricing?feature=live-lecture');
          return;
        }

        // Check if API keys are configured (client-side can only access NEXT_PUBLIC_ variables)
        // For now, we'll assume AssemblyAI is configured since user added it to .env.local
        // In production, you'd want to check this server-side
        setSetupComplete(true);
      } catch (error) {
        console.error('Error checking access:', error);
        router.push('/signup');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  // Update state periodically for real-time updates
  useEffect(() => {
    if (!setupComplete) return;
    
    const interval = setInterval(() => {
      const newState = assistant.getState();
      setState(newState);
      setCurrentNotes(assistant.getCurrentNotes());
      setRecentFlashcards(assistant.getRecentFlashcards());
      setBookmarks(assistant.getBookmarks());
      setHighlights(assistant.getHighlights());
    }, 500); // Update every 500ms for smoother real-time experience

    return () => clearInterval(interval);
  }, [assistant, setupComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      assistant.cleanup();
    };
  }, [assistant]);

  const testMicrophone = async () => {
    try {
      setMicError(null);
      console.log('Testing microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone test successful');
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      setMicTested(true);
    } catch (error: any) {
      console.error('Microphone test failed:', error);
      let errorMessage = 'Microphone test failed. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Audio recording not supported in this browser.';
      } else {
        errorMessage += error.message;
      }
      
      setMicError(errorMessage);
    }
  };

  const startLecture = async () => {
    try {
      await assistant.startLecture();
      setIsInitialized(true);
    } catch (error: any) {
      console.error("Failed to start lecture:", error);
      setMicError(error.message || "Failed to start lecture. Please check microphone permissions and try again.");
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

  if (isLoading || !setupComplete) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center feature-card p-8">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-gray-300">
            {isLoading ? 'Checking access...' : 'Setting up Live Lecture Assistant...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="feature-card p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300">
              Live Lecture Assistant
            </h1>
            <Link 
              href="/lecture/landing" 
              className="btn btn-outline btn-sm"
            >
              <i className="fas fa-info-circle mr-2"></i>
              Setup Guide
            </Link>
          </div>
          <p className="text-gray-300 text-lg">
            Transform your university lectures into comprehensive study materials in real-time with AI-powered transcription and note generation.
          </p>
        </div>
        
        {/* Control Panel */}
        <div className="feature-card p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Lecture Controls</h2>
          <div className="flex justify-center gap-4 mb-6">
            {!isInitialized ? (
              <div className="flex flex-col items-center gap-4">
                {!micTested && (
                  <button
                    onClick={testMicrophone}
                    className="btn btn-outline btn-lg px-6 py-3 text-lg font-semibold"
                  >
                    <i className="fas fa-microphone mr-2"></i>
                    Test Microphone
                  </button>
                )}
                {micTested && (
                  <div className="text-center">
                    <div className="text-green-400 mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      Microphone Ready
                    </div>
                    <button
                      onClick={startLecture}
                      className="cta-button btn-lg px-8 py-3 text-lg font-semibold"
                    >
                      <i className="fas fa-play mr-2"></i>
                      Start Lecture
                    </button>
                  </div>
                )}
                {micError && (
                  <div className="text-center">
                    <div className="text-red-400 mb-2">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      {micError}
                    </div>
                    <button
                      onClick={testMicrophone}
                      className="btn btn-outline btn-sm px-4 py-2"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {state?.isPaused ? (
                  <button
                    onClick={resumeLecture}
                    className="btn btn-info btn-lg px-6 py-3 text-lg font-semibold"
                  >
                    <i className="fas fa-play mr-2"></i>
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={pauseLecture}
                    className="btn btn-warning btn-lg px-6 py-3 text-lg font-semibold"
                  >
                    <i className="fas fa-pause mr-2"></i>
                    Pause
                  </button>
                )}
                <button
                  onClick={stopLecture}
                  className="btn btn-error btn-lg px-6 py-3 text-lg font-semibold"
                >
                  <i className="fas fa-stop mr-2"></i>
                  End Lecture
                </button>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bookmark */}
            <div className="feature-card p-4">
              <h3 className="font-semibold mb-3 text-center">
                <i className="fas fa-bookmark mr-2 text-purple-400"></i>
                Add Bookmark
              </h3>
              <textarea
                value={bookmarkNotes}
                onChange={(e) => setBookmarkNotes(e.target.value)}
                placeholder="Add notes for this bookmark..."
                className="w-full form-input p-3 rounded-lg mb-3 text-white placeholder-gray-400"
                rows={2}
              />
              <button
                onClick={addBookmark}
                className="btn btn-primary w-full btn"
              >
                <i className="fas fa-bookmark mr-2"></i>
                Bookmark
              </button>
            </div>

            {/* Highlight */}
            <div className="feature-card p-4">
              <h3 className="font-semibold mb-3 text-center">
                <i className="fas fa-highlighter mr-2 text-orange-400"></i>
                Highlight & Explain
              </h3>
              <input
                type="text"
                value={highlightText}
                onChange={(e) => setHighlightText(e.target.value)}
                placeholder="Highlight text for explanation..."
                className="w-full form-input p-3 rounded-lg mb-3 text-white placeholder-gray-400"
              />
              <button
                onClick={addHighlight}
                className="btn btn-warning w-full btn"
              >
                <i className="fas fa-highlighter mr-2"></i>
                Highlight
              </button>
            </div>

            {/* Ask Question */}
            <div className="feature-card p-4">
              <h3 className="font-semibold mb-3 text-center">
                <i className="fas fa-question-circle mr-2 text-cyan-400"></i>
                Ask Question
              </h3>
              <input
                type="text"
                value={studentQuestion}
                onChange={(e) => setStudentQuestion(e.target.value)}
                placeholder="Ask a question about the lecture..."
                className="w-full form-input p-3 rounded-lg mb-3 text-white placeholder-gray-400"
              />
              <button
                onClick={askQuestion}
                className="btn btn-info w-full btn"
              >
                <i className="fas fa-question-circle mr-2"></i>
                Ask
              </button>
            </div>
          </div>

          {questionAnswer && (
            <div className="mt-6 feature-card p-4">
              <h4 className="font-semibold mb-2 text-cyan-400">
                <i className="fas fa-robot mr-2"></i>
                AI Answer:
              </h4>
              <p className="text-gray-300">{questionAnswer}</p>
            </div>
          )}
        </div>

        {/* Real-Time Lecture Environment */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Live Transcript - Left Side */}
          <div className="feature-card p-6 h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                <i className="fas fa-microphone mr-2 text-blue-400"></i>
                Live Transcript
              </h2>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${state?.isRecording ? (state.isPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse') : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-400">
                  {state?.isRecording ? (state.isPaused ? 'Paused' : 'Recording') : 'Stopped'}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              {state?.currentTranscript ? (
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {state.currentTranscript}
                  <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1"></span>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <i className="fas fa-microphone text-3xl mb-3 opacity-50"></i>
                  <p>Transcript will appear here as you speak...</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Notes - Right Side */}
          <div className="feature-card p-6 h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                <i className="fas fa-sticky-note mr-2 text-green-400"></i>
                Live Notes
              </h2>
              <div className="text-sm text-gray-400">
                {currentNotes.length} notes
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              {currentNotes.length > 0 ? (
                <div className="space-y-3">
                  {currentNotes.map((note, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-green-400">
                      <div className="text-sm text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: note.replace(/\*\*(.*?)\*\*/g, '<strong class="text-green-300">$1</strong>') }}></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <i className="fas fa-sticky-note text-3xl mb-3 opacity-50"></i>
                  <p>AI-generated notes will appear here...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Flashcards */}
          <div className="feature-card p-6">
            <h2 className="text-xl font-semibold mb-4">
              <i className="fas fa-layer-group mr-2 text-purple-400"></i>
              Auto-Generated Flashcards
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentFlashcards.length > 0 ? (
                recentFlashcards.slice(-5).map((card) => (
                  <div key={card.id} className="bg-gray-800/50 rounded-lg p-3 border border-purple-400/30">
                    <div className="font-semibold text-sm mb-2 text-white">{card.front}</div>
                    <div className="text-xs text-gray-300 mb-2">{card.back}</div>
                    <div className="text-xs text-gray-500">
                      <i className="fas fa-clock mr-1"></i>
                      {card.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <i className="fas fa-layer-group text-2xl mb-2 opacity-50"></i>
                  <p className="text-sm">Flashcards will appear automatically...</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Stats */}
          <div className="feature-card p-6">
            <h2 className="text-xl font-semibold mb-4">
              <i className="fas fa-chart-line mr-2 text-orange-400"></i>
              Live Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{state?.sections.length || 0}</div>
                <div className="text-sm text-gray-400">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{state?.flashcards.length || 0}</div>
                <div className="text-sm text-gray-400">Flashcards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{bookmarks.length}</div>
                <div className="text-sm text-gray-400">Bookmarks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{highlights.length}</div>
                <div className="text-sm text-gray-400">Highlights</div>
              </div>
            </div>
            {state?.isRecording && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {Math.floor((Date.now() - state.startTime.getTime()) / 1000 / 60)} min
                  </div>
                  <div className="text-sm text-gray-400">Recording Time</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bookmarks and Highlights - Collapsible */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bookmarks */}
          <div className="feature-card p-6">
            <h2 className="text-xl font-semibold mb-4">
              <i className="fas fa-bookmark mr-2 text-purple-400"></i>
              Bookmarks ({bookmarks.length})
            </h2>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {bookmarks.length > 0 ? (
                bookmarks.slice(-3).map((bookmark) => (
                  <div key={bookmark.id} className="bg-gray-800/50 rounded-lg p-3 border border-purple-400/30">
                    <div className="text-xs text-gray-400 mb-2">
                      <i className="fas fa-clock mr-1"></i>
                      {bookmark.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="text-sm mb-2 text-gray-300">{bookmark.transcript.slice(0, 80)}...</div>
                    {bookmark.notes && (
                      <div className="text-xs text-gray-400 bg-gray-700/50 p-2 rounded">
                        <i className="fas fa-sticky-note mr-1"></i>
                        {bookmark.notes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <i className="fas fa-bookmark text-2xl mb-2 opacity-50"></i>
                  <p className="text-sm">No bookmarks yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="feature-card p-6">
            <h2 className="text-xl font-semibold mb-4">
              <i className="fas fa-highlighter mr-2 text-orange-400"></i>
              Highlights ({highlights.length})
            </h2>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {highlights.length > 0 ? (
                highlights.slice(-3).map((highlight) => (
                  <div key={highlight.id} className="bg-gray-800/50 rounded-lg p-3 border border-orange-400/30">
                    <div className="text-xs text-gray-400 mb-2">
                      <i className="fas fa-clock mr-1"></i>
                      {highlight.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="text-sm font-semibold mb-2 text-yellow-300">"{highlight.text}"</div>
                    <div className="text-xs text-gray-300 bg-gray-700/50 p-2 rounded">
                      <i className="fas fa-lightbulb mr-1"></i>
                      {highlight.explanation}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <i className="fas fa-highlighter text-2xl mb-2 opacity-50"></i>
                  <p className="text-sm">No highlights yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
