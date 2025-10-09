"use client";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder, Plane } from '@react-three/drei';
import { useState, useRef } from 'react';
import { Mesh } from 'three';

interface PhysicsQuizProps {
  onAnswer: (correct: boolean) => void;
  onComplete: (score: number) => void;
}

export default function PhysicsQuiz({ onAnswer, onComplete }: PhysicsQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const leverRef = useRef<Mesh>(null);
  const pulleyRef = useRef<Mesh>(null);
  const circuitRef = useRef<Mesh>(null);

  const questions = [
    {
      id: 1,
      type: 'lever',
      question: 'Which lever configuration will lift the weight with the least effort?',
      options: [
        { id: 'A', description: 'Fulcrum near the weight', correct: false },
        { id: 'B', description: 'Fulcrum in the middle', correct: false },
        { id: 'C', description: 'Fulcrum near the effort', correct: true }
      ],
      explanation: 'The fulcrum should be near the effort (your hand) to create a mechanical advantage.'
    },
    {
      id: 2,
      type: 'pulley',
      question: 'How many pulleys are needed to lift a 100kg weight with 25kg of effort?',
      options: [
        { id: 'A', description: '1 pulley', correct: false },
        { id: 'B', description: '2 pulleys', correct: false },
        { id: 'C', description: '4 pulleys', correct: true }
      ],
      explanation: '4 pulleys create a 4:1 mechanical advantage, allowing 25kg to lift 100kg.'
    },
    {
      id: 3,
      type: 'circuit',
      question: 'What happens to current when resistance increases?',
      options: [
        { id: 'A', description: 'Current increases', correct: false },
        { id: 'B', description: 'Current decreases', correct: true },
        { id: 'C', description: 'Current stays the same', correct: false }
      ],
      explanation: 'According to Ohm\'s Law (V=IR), current decreases as resistance increases.'
    }
  ];

  const handleAnswer = (answerId: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answerId);
    const question = questions[currentQuestion];
    const selectedOption = question.options.find(opt => opt.id === answerId);
    const correct = selectedOption?.correct || false;
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    onAnswer(correct);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        onComplete(score + (correct ? 1 : 0));
      }
    }, 3000);
  };

  const currentQ = questions[currentQuestion];

  const render3DScene = () => {
    switch (currentQ.type) {
      case 'lever':
        return (
          <group>
            {/* Lever System */}
            <Box ref={leverRef} position={[0, 0, 0]} args={[4, 0.1, 0.2]} rotation={[0, 0, Math.PI / 4]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            {/* Fulcrum */}
            <Cylinder position={[0, -1, 0]} args={[0.1, 0.1, 0.5]} rotation={[0, 0, 0]}>
              <meshStandardMaterial color="#C0C0C0" />
            </Cylinder>
            {/* Weight */}
            <Box position={[-1.5, 0.5, 0]} args={[0.5, 0.5, 0.5]}>
              <meshStandardMaterial color="#FF6B6B" />
            </Box>
            {/* Effort Arrow */}
            <Box position={[1.5, 0.5, 0]} args={[0.3, 0.1, 0.1]}>
              <meshStandardMaterial color="#4ECDC4" />
            </Box>
          </group>
        );
      
      case 'pulley':
        return (
          <group>
            {/* Pulley System */}
            {[0, 1, 2, 3].map((i) => (
              <Cylinder key={i} position={[i * 0.5, 2, 0]} args={[0.2, 0.2, 0.1]} rotation={[0, 0, Math.PI / 2]}>
                <meshStandardMaterial color="#C0C0C0" />
              </Cylinder>
            ))}
            {/* Weight */}
            <Box position={[0, 0, 0]} args={[0.5, 0.5, 0.5]}>
              <meshStandardMaterial color="#FF6B6B" />
            </Box>
            {/* Rope */}
            <Box position={[0, 1, 0]} args={[4, 0.05, 0.05]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
          </group>
        );
      
      case 'circuit':
        return (
          <group>
            {/* Circuit Components */}
            <Box position={[-2, 0, 0]} args={[0.5, 0.5, 0.1]}>
              <meshStandardMaterial color="#FFD700" />
            </Box>
            <Box position={[0, 0, 0]} args={[0.3, 0.3, 0.1]}>
              <meshStandardMaterial color="#8B4513" />
            </Box>
            <Box position={[2, 0, 0]} args={[0.5, 0.5, 0.1]}>
              <meshStandardMaterial color="#FFD700" />
            </Box>
            {/* Wires */}
            <Box position={[-1, 0, 0]} args={[1, 0.05, 0.05]}>
              <meshStandardMaterial color="#C0C0C0" />
            </Box>
            <Box position={[1, 0, 0]} args={[1, 0.05, 0.05]}>
              <meshStandardMaterial color="#C0C0C0" />
            </Box>
            {/* Current Flow Animation */}
            <Sphere position={[Math.sin(Date.now() * 0.001) * 2, 0, 0]} args={[0.1]}>
              <meshStandardMaterial color="#00FF00" />
            </Sphere>
          </group>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Physics 3D Quiz</h2>
            <div className="text-white">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
          
          <p className="text-lg text-gray-300 mb-6">{currentQ.question}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentQ.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                disabled={selectedAnswer !== null}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  selectedAnswer === option.id
                    ? isCorrect
                      ? 'border-green-500 bg-green-500/20 text-green-300'
                      : 'border-red-500 bg-red-500/20 text-red-300'
                    : selectedAnswer && option.correct
                    ? 'border-green-500 bg-green-500/20 text-green-300'
                    : 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                <div className="font-bold text-lg mb-2">{option.id}</div>
                <div className="text-sm">{option.description}</div>
              </button>
            ))}
          </div>
          
          {showFeedback && (
            <div className={`mt-4 p-4 rounded-xl ${
              isCorrect ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <p className={`font-semibold ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect!'}
              </p>
              <p className="text-gray-300 mt-2">{currentQ.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-10, -10, -10]} />
        
        {render3DScene()}
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}
