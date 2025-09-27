"use client";
import Link from "next/link";

export default function LiveLectureLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="glassmorphism-card p-12 mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Live Lecture Assistant
            </h1>
            <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Transform your university lectures into comprehensive study materials in real-time with AI-powered transcription and intelligent note generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/lecture" 
                className="btn btn-primary btn-lg px-12 py-4 text-xl font-semibold glassmorphism-btn"
              >
                <i className="fas fa-microphone mr-3"></i>
                Start Live Lecture
              </Link>
              <Link 
                href="/pricing" 
                className="btn btn-outline btn-lg px-12 py-4 text-xl font-semibold glassmorphism-btn"
              >
                <i className="fas fa-crown mr-3"></i>
                Upgrade to Special Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="glassmorphism-card p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl mb-6">🎤</div>
            <h3 className="text-2xl font-semibold mb-4 text-purple-300">Real-time Transcription</h3>
            <p className="text-gray-300 leading-relaxed">Convert speech to text with high accuracy using advanced AI-powered transcription services.</p>
          </div>
          
          <div className="glassmorphism-card p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl mb-6">📝</div>
            <h3 className="text-2xl font-semibold mb-4 text-green-300">Live Note Generation</h3>
            <p className="text-gray-300 leading-relaxed">Generate structured notes with key terms, formulas, and definitions in real-time.</p>
          </div>
          
          <div className="glassmorphism-card p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl mb-6">🃏</div>
            <h3 className="text-2xl font-semibold mb-4 text-blue-300">Automatic Flashcards</h3>
            <p className="text-gray-300 leading-relaxed">Create flashcards for new concepts automatically during the lecture.</p>
          </div>
          
          <div className="glassmorphism-card p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl mb-6">📊</div>
            <h3 className="text-2xl font-semibold mb-4 text-orange-300">Quiz Generation</h3>
            <p className="text-gray-300 leading-relaxed">Generate comprehensive quiz banks with multiple-choice questions and explanations.</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <div className="glassmorphism-card p-12">
            <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="glassmorphism-card w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500">
                  <i className="fas fa-play text-white"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-blue-300">Start Recording</h3>
                <p className="text-gray-300 leading-relaxed text-lg">Click "Start Lecture" and allow microphone access. The system begins transcribing your lecture in real-time with advanced AI.</p>
              </div>
              
              <div className="text-center">
                <div className="glassmorphism-card w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500">
                  <i className="fas fa-brain text-white"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-purple-300">AI Processing</h3>
                <p className="text-gray-300 leading-relaxed text-lg">Our AI analyzes the transcript, generates structured notes, creates flashcards, and identifies key concepts automatically.</p>
              </div>
              
              <div className="text-center">
                <div className="glassmorphism-card w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 bg-gradient-to-r from-green-500 to-blue-500">
                  <i className="fas fa-download text-white"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-green-300">Get Study Materials</h3>
                <p className="text-gray-300 leading-relaxed text-lg">Download your complete revision pack with notes, flashcards, and quiz questions ready for exam preparation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Controls */}
        <div className="mb-20">
          <div className="glassmorphism-card p-12">
            <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Student Controls
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="glassmorphism-card p-6 text-center hover:scale-105 transition-transform duration-300">
                <div className="text-4xl mb-4">⏸️</div>
                <h3 className="text-xl font-semibold mb-3 text-blue-300">Pause/Resume</h3>
                <p className="text-gray-300">Temporarily stop and restart transcription during breaks or when needed.</p>
              </div>
              
              <div className="glassmorphism-card p-6 text-center hover:scale-105 transition-transform duration-300">
                <div className="text-4xl mb-4">🔖</div>
                <h3 className="text-xl font-semibold mb-3 text-purple-300">Bookmarks</h3>
                <p className="text-gray-300">Mark important moments with custom notes for easy review later.</p>
              </div>
              
              <div className="glassmorphism-card p-6 text-center hover:scale-105 transition-transform duration-300">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-3 text-orange-300">Highlights</h3>
                <p className="text-gray-300">Highlight text for instant AI-powered explanations and clarifications.</p>
              </div>
              
              <div className="glassmorphism-card p-6 text-center hover:scale-105 transition-transform duration-300">
                <div className="text-4xl mb-4">❓</div>
                <h3 className="text-xl font-semibold mb-3 text-cyan-300">Q&A</h3>
                <p className="text-gray-300">Ask questions and get contextual answers during the lecture.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <div className="glassmorphism-card p-12">
            <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Why Choose Live Lecture Assistant?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="glassmorphism-card w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-clock text-purple-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-purple-300">Save Time</h3>
                    <p className="text-gray-300">No more manual note-taking. Focus on understanding while AI handles the documentation.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="glassmorphism-card w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-graduation-cap text-green-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-green-300">Better Grades</h3>
                    <p className="text-gray-300">Comprehensive study materials help you retain information and perform better in exams.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="glassmorphism-card w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-brain text-blue-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-blue-300">AI-Powered</h3>
                    <p className="text-gray-300">Advanced AI technology ensures accurate transcription and intelligent content analysis.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="glassmorphism-card w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-mobile-alt text-orange-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-orange-300">Mobile Friendly</h3>
                    <p className="text-gray-300">Works seamlessly on all devices - laptop, tablet, or smartphone.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="glassmorphism-card w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-download text-cyan-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-cyan-300">Export Ready</h3>
                    <p className="text-gray-300">Download materials in multiple formats for offline study and sharing.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="glassmorphism-card w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-shield-alt text-pink-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-pink-300">Secure & Private</h3>
                    <p className="text-gray-300">Your lecture data is encrypted and secure. Your privacy is our priority.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="glassmorphism-card p-16">
            <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Ready to Transform Your Lectures?
            </h2>
            <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of students who are already using AI to enhance their learning experience and achieve better grades.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/lecture" 
                className="btn btn-primary btn-lg px-12 py-4 text-xl font-semibold glassmorphism-btn"
              >
                <i className="fas fa-rocket mr-3"></i>
                Start Your First Live Lecture
              </Link>
              <Link 
                href="/pricing" 
                className="btn btn-outline btn-lg px-12 py-4 text-xl font-semibold glassmorphism-btn"
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
