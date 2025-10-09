"use client";
import { useState } from 'react';
import Link from 'next/link';
import PhysicsQuiz from '@/app/components/3DQuiz/PhysicsQuiz';
import BiologyQuiz from '@/app/components/3DQuiz/BiologyQuiz';
import GeographyQuiz from '@/app/components/3DQuiz/GeographyQuiz';
import ComputerScienceQuiz from '@/app/components/3DQuiz/ComputerScienceQuiz';

type QuizType = 'physics' | 'biology' | 'geography' | 'computerscience' | null;

export default function ThreeDQuizPage() {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizType>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const handleQuizComplete = (score: number) => {
    setQuizScore(score);
    setQuizComplete(true);
  };

  const handleAnswer = (correct: boolean) => {
    // This can be used for analytics or real-time feedback
    console.log('Answer:', correct ? 'Correct' : 'Incorrect');
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setQuizScore(0);
    setQuizComplete(false);
  };

  if (selectedQuiz && !quizComplete) {
    switch (selectedQuiz) {
      case 'physics':
        return <PhysicsQuiz onAnswer={handleAnswer} onComplete={handleQuizComplete} />;
      case 'biology':
        return <BiologyQuiz onAnswer={handleAnswer} onComplete={handleQuizComplete} />;
      case 'geography':
        return <GeographyQuiz onAnswer={handleAnswer} onComplete={handleQuizComplete} />;
      case 'computerscience':
        return <ComputerScienceQuiz onAnswer={handleAnswer} onComplete={handleQuizComplete} />;
      default:
        return null;
    }
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-trophy text-3xl text-white"></i>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">Quiz Complete!</h2>
          <p className="text-xl text-gray-300 mb-6">
            You scored <span className="text-green-400 font-bold">{quizScore}</span> out of 4
          </p>
          
          <div className="space-y-4">
            <button
              onClick={resetQuiz}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300"
            >
              <i className="fas fa-redo mr-2"></i>
              Try Another Quiz
            </button>
            
            <Link
              href="/quiz"
              className="w-full bg-white/10 border-2 border-white/20 text-white font-bold py-3 px-6 rounded-2xl hover:bg-white/20 transition-all duration-300 inline-block"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Regular Quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full text-lg font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 mb-8">
            <i className="fas fa-cube mr-3 text-xl"></i>
            Immersive 3D Learning
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-8">
            AR/VR <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Quizzes</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience learning like never before with interactive 3D environments. 
            Manipulate objects, explore virtual worlds, and learn through immersive experiences.
          </p>
        </div>

        {/* Quiz Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Physics Quiz */}
          <div 
            className="group relative cursor-pointer"
            onClick={() => setSelectedQuiz('physics')}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-500 hover:transform hover:scale-105 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <i className="fas fa-atom text-3xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Physics</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Manipulate levers, pulleys, and circuits in 3D. Learn mechanics through interactive experiments.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                  <i className="fas fa-play mr-2"></i>
                  Start Quiz
                </div>
              </div>
            </div>
          </div>

          {/* Biology Quiz */}
          <div 
            className="group relative cursor-pointer"
            onClick={() => setSelectedQuiz('biology')}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-green-500/50 transition-all duration-500 hover:transform hover:scale-105 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <i className="fas fa-dna text-3xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Biology</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Explore 3D cells and organelles. Click on structures to learn their functions.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                  <i className="fas fa-play mr-2"></i>
                  Start Quiz
                </div>
              </div>
            </div>
          </div>

          {/* Geography Quiz */}
          <div 
            className="group relative cursor-pointer"
            onClick={() => setSelectedQuiz('geography')}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-500 hover:transform hover:scale-105 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <i className="fas fa-globe text-3xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Geography</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Explore 3D Earth and locate continents, countries, and geographical features.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                  <i className="fas fa-play mr-2"></i>
                  Start Quiz
                </div>
              </div>
            </div>
          </div>

          {/* Computer Science Quiz */}
          <div 
            className="group relative cursor-pointer"
            onClick={() => setSelectedQuiz('computerscience')}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-500 hover:transform hover:scale-105 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <i className="fas fa-code text-3xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Computer Science</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Build algorithm flows in 3D. Drag and arrange nodes to create working programs.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium">
                  <i className="fas fa-play mr-2"></i>
                  Start Quiz
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Why 3D Learning?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-hand-paper text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Interactive Learning</h3>
              <p className="text-gray-300">Manipulate objects and explore concepts hands-on in 3D space.</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Better Retention</h3>
              <p className="text-gray-300">3D visualization improves memory and understanding of complex concepts.</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-gamepad text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Engaging Experience</h3>
              <p className="text-gray-300">Learning becomes fun and engaging with gamified 3D interactions.</p>
            </div>
          </div>
        </div>

        {/* Back to Regular Quizzes */}
        <div className="mt-16 text-center">
          <Link
            href="/quiz"
            className="inline-flex items-center px-8 py-4 bg-white/10 border-2 border-white/20 text-white font-bold text-lg rounded-2xl hover:bg-white/20 transition-all duration-300"
          >
            <i className="fas fa-arrow-left mr-3"></i>
            Back to Regular Quizzes
          </Link>
        </div>
      </div>
    </div>
  );
}
