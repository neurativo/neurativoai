"use client";
import Link from "next/link";
import { useState } from "react";

export default function LiveLectureLandingPage() {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'google' | 'azure' | 'assemblyai'>('openai');

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI Whisper',
      description: 'High accuracy, multiple languages, easy setup',
      cost: '$0.36/hour',
      features: ['High accuracy', 'Multiple languages', 'Easy setup', 'Good for development'],
      recommended: true
    },
    {
      id: 'google',
      name: 'Google Speech-to-Text',
      description: 'Enterprise features, speaker diarization',
      cost: '$14.40/hour',
      features: ['Speaker diarization', 'Custom vocabulary', 'Word-level timestamps', 'Enterprise features']
    },
    {
      id: 'azure',
      name: 'Azure Cognitive Services',
      description: 'Microsoft ecosystem integration',
      cost: '$1.00/hour',
      features: ['Microsoft integration', 'Enterprise features', 'Good accuracy', 'Cloud integration']
    },
    {
      id: 'assemblyai',
      name: 'AssemblyAI',
      description: 'Real-time streaming, advanced features',
      cost: '$1.08/hour',
      features: ['Real-time streaming', 'Speaker diarization', 'Confidence scores', 'Advanced features']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Live Lecture Assistant
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform your university lectures into comprehensive study materials in real-time. 
            Record audio, generate notes, create flashcards, and build quiz banks automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/lecture" 
              className="btn btn-primary btn-lg px-8 py-4 text-lg font-semibold"
            >
              <i className="fas fa-microphone mr-2"></i>
              Start Live Lecture
            </Link>
            <Link 
              href="/lecture/revision" 
              className="btn btn-outline btn-lg px-8 py-4 text-lg font-semibold"
            >
              <i className="fas fa-download mr-2"></i>
              View Revision Packs
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Transcription</h3>
            <p className="text-gray-400">Convert speech to text with high accuracy using AI-powered transcription services.</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">Live Note Generation</h3>
            <p className="text-gray-400">Generate structured notes with key terms, formulas, and definitions in real-time.</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">🃏</div>
            <h3 className="text-xl font-semibold mb-2">Automatic Flashcards</h3>
            <p className="text-gray-400">Create flashcards for new concepts automatically during the lecture.</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Quiz Generation</h3>
            <p className="text-gray-400">Generate comprehensive quiz banks with multiple-choice questions and explanations.</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-3">Start Recording</h3>
              <p className="text-gray-400">Click "Start Lecture" and allow microphone access. The system will begin transcribing your lecture in real-time.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-3">AI Processing</h3>
              <p className="text-gray-400">Our AI analyzes the transcript, generates notes, creates flashcards, and identifies key concepts automatically.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-3">Get Study Materials</h3>
              <p className="text-gray-400">Download your complete revision pack with notes, flashcards, and quiz questions ready for exam preparation.</p>
            </div>
          </div>
        </div>

        {/* Transcription Providers */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Transcription Provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`bg-gray-800 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedProvider === provider.id
                    ? 'ring-2 ring-purple-500 bg-gray-700'
                    : 'hover:bg-gray-700'
                }`}
                onClick={() => setSelectedProvider(provider.id as any)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{provider.name}</h3>
                  {provider.recommended && (
                    <span className="bg-green-600 text-xs px-2 py-1 rounded-full">Recommended</span>
                  )}
                </div>
                <p className="text-gray-400 mb-4">{provider.description}</p>
                <div className="text-lg font-semibold text-purple-400 mb-4">{provider.cost}</div>
                <ul className="space-y-2">
                  {provider.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-300">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Student Controls */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Student Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-2xl mb-3">⏸️</div>
              <h3 className="font-semibold mb-2">Pause/Resume</h3>
              <p className="text-sm text-gray-400">Temporarily stop and restart transcription during breaks.</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-2xl mb-3">🔖</div>
              <h3 className="font-semibold mb-2">Bookmarks</h3>
              <p className="text-sm text-gray-400">Mark important moments with custom notes for easy review.</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-2xl mb-3">✨</div>
              <h3 className="font-semibold mb-2">Highlights</h3>
              <p className="text-sm text-gray-400">Highlight text for instant AI-powered explanations.</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-2xl mb-3">❓</div>
              <h3 className="font-semibold mb-2">Q&A</h3>
              <p className="text-sm text-gray-400">Ask questions and get contextual answers during the lecture.</p>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-gray-800 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Quick Setup</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">1. Environment Setup</h3>
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-sm text-green-400">
                    # Add to your .env.local file<br/>
                    OPENAI_API_KEY=your_api_key_here<br/>
                    # Or choose another provider<br/>
                    GOOGLE_API_KEY=your_google_key<br/>
                    AZURE_API_KEY=your_azure_key<br/>
                    ASSEMBLYAI_API_KEY=your_assemblyai_key
                  </code>
                </div>
                <p className="text-sm text-gray-400">
                  Choose your preferred transcription provider and add the API key to your environment variables.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">2. Start Using</h3>
                <ol className="space-y-2 text-sm text-gray-300">
                  <li>1. Navigate to the Live Lecture page</li>
                  <li>2. Click "Start Lecture"</li>
                  <li>3. Allow microphone access</li>
                  <li>4. Begin your lecture</li>
                  <li>5. Use controls as needed</li>
                  <li>6. Download revision pack when done</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Lectures?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of students who are already using AI to enhance their learning experience.
          </p>
          <Link 
            href="/lecture" 
            className="btn btn-primary btn-lg px-12 py-4 text-xl font-semibold"
          >
            <i className="fas fa-rocket mr-3"></i>
            Start Your First Live Lecture
          </Link>
        </div>
      </div>
    </div>
  );
}
