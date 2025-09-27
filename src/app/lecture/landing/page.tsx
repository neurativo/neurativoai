"use client";
import Link from "next/link";

export default function LiveLectureLandingPage() {
  return (
    <div className="min-h-screen text-white relative">
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="feature-card p-12 mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300">
              Live Lecture Assistant
            </h1>
            <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Transform your university lectures into comprehensive study materials in real-time with AI-powered transcription and intelligent note generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/lecture" 
                className="cta-button text-lg px-12 py-4"
              >
                <i className="fas fa-microphone mr-3"></i>
                Start Live Lecture
              </Link>
              <Link 
                href="/pricing" 
                className="secondary-button text-lg px-12 py-4"
              >
                <i className="fas fa-crown mr-3"></i>
                Upgrade to Special Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="feature-card hover:scale-105 transition-transform duration-300">
            <div className="feature-icon"><i className="fas fa-microphone"></i></div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Transcription</h3>
            <p className="text-gray-300">Convert speech to text with high accuracy using advanced AI-powered transcription services.</p>
          </div>
          
          <div className="feature-card hover:scale-105 transition-transform duration-300">
            <div className="feature-icon"><i className="fas fa-sticky-note"></i></div>
            <h3 className="text-xl font-semibold text-white mb-2">Live Note Generation</h3>
            <p className="text-gray-300">Generate structured notes with key terms, formulas, and definitions in real-time.</p>
          </div>
          
          <div className="feature-card hover:scale-105 transition-transform duration-300">
            <div className="feature-icon"><i className="fas fa-layer-group"></i></div>
            <h3 className="text-xl font-semibold text-white mb-2">Automatic Flashcards</h3>
            <p className="text-gray-300">Create flashcards for new concepts automatically during the lecture.</p>
          </div>
          
          <div className="feature-card hover:scale-105 transition-transform duration-300">
            <div className="feature-icon"><i className="fas fa-question-circle"></i></div>
            <h3 className="text-xl font-semibold text-white mb-2">Quiz Generation</h3>
            <p className="text-gray-300">Generate comprehensive quiz banks with multiple-choice questions and explanations.</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <div className="feature-card p-12">
            <h2 className="text-4xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="feature-icon w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                  <i className="fas fa-play text-purple-400"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">Start Recording</h3>
                <p className="text-gray-300 leading-relaxed text-lg">Click "Start Lecture" and allow microphone access. The system begins transcribing your lecture in real-time with advanced AI.</p>
              </div>
              
              <div className="text-center">
                <div className="feature-icon w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                  <i className="fas fa-brain text-purple-400"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">AI Processing</h3>
                <p className="text-gray-300 leading-relaxed text-lg">Our AI analyzes the transcript, generates structured notes, creates flashcards, and identifies key concepts automatically.</p>
              </div>
              
              <div className="text-center">
                <div className="feature-icon w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                  <i className="fas fa-download text-purple-400"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">Get Study Materials</h3>
                <p className="text-gray-300 leading-relaxed text-lg">Download your complete revision pack with notes, flashcards, and quiz questions ready for exam preparation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Controls */}
        <div className="mb-20">
          <div className="feature-card p-12">
            <h2 className="text-4xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300">
              Student Controls
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="feature-card hover:scale-105 transition-transform duration-300">
                <div className="feature-icon"><i className="fas fa-pause"></i></div>
                <h3 className="text-xl font-semibold text-white mb-2">Pause/Resume</h3>
                <p className="text-gray-300">Temporarily stop and restart transcription during breaks or when needed.</p>
              </div>
              
              <div className="feature-card hover:scale-105 transition-transform duration-300">
                <div className="feature-icon"><i className="fas fa-bookmark"></i></div>
                <h3 className="text-xl font-semibold text-white mb-2">Bookmarks</h3>
                <p className="text-gray-300">Mark important moments with custom notes for easy review later.</p>
              </div>
              
              <div className="feature-card hover:scale-105 transition-transform duration-300">
                <div className="feature-icon"><i className="fas fa-highlighter"></i></div>
                <h3 className="text-xl font-semibold text-white mb-2">Highlights</h3>
                <p className="text-gray-300">Highlight text for instant AI-powered explanations and clarifications.</p>
              </div>
              
              <div className="feature-card hover:scale-105 transition-transform duration-300">
                <div className="feature-icon"><i className="fas fa-question-circle"></i></div>
                <h3 className="text-xl font-semibold text-white mb-2">Q&A</h3>
                <p className="text-gray-300">Ask questions and get contextual answers during the lecture.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <div className="feature-card p-12">
            <h2 className="text-4xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300">
              Why Choose Live Lecture Assistant?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="feature-icon w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-clock text-purple-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Save Time</h3>
                    <p className="text-gray-300">No more manual note-taking. Focus on understanding while AI handles the documentation.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="feature-icon w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-graduation-cap text-purple-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Better Grades</h3>
                    <p className="text-gray-300">Comprehensive study materials help you retain information and perform better in exams.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="feature-icon w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-brain text-purple-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-white">AI-Powered</h3>
                    <p className="text-gray-300">Advanced AI technology ensures accurate transcription and intelligent content analysis.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="feature-icon w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-mobile-alt text-purple-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Mobile Friendly</h3>
                    <p className="text-gray-300">Works seamlessly on all devices - laptop, tablet, or smartphone.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="feature-icon w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-download text-purple-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Export Ready</h3>
                    <p className="text-gray-300">Download materials in multiple formats for offline study and sharing.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="feature-icon w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-shield-alt text-purple-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Secure & Private</h3>
                    <p className="text-gray-300">Your lecture data is encrypted and secure. Your privacy is our priority.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="feature-card p-16">
            <h2 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300">
              Ready to Transform Your Lectures?
            </h2>
            <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of students who are already using AI to enhance their learning experience and achieve better grades.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/lecture" 
                className="cta-button text-xl px-12 py-4"
              >
                <i className="fas fa-rocket mr-3"></i>
                Start Your First Live Lecture
              </Link>
              <Link 
                href="/pricing" 
                className="secondary-button text-xl px-12 py-4"
              >
                <i className="fas fa-crown mr-3"></i>
                Upgrade to Special Plan
              </Link>
            </div>
            <div className="mt-8 text-gray-400">
              <p className="text-lg">✨ Free trial available • 🎓 Perfect for university students • 🚀 No setup required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
