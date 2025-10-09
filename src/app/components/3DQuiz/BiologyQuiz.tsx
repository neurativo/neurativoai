"use client";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Box, Cylinder } from '@react-three/drei';
import { useState, useRef } from 'react';
import { Mesh } from 'three';

interface BiologyQuizProps {
  onAnswer: (correct: boolean) => void;
  onComplete: (score: number) => void;
}

export default function BiologyQuiz({ onAnswer, onComplete }: BiologyQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOrganelle, setSelectedOrganelle] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hoveredOrganelle, setHoveredOrganelle] = useState<string | null>(null);

  const questions = [
    {
      id: 1,
      question: 'Which organelle performs energy conversion (ATP production)?',
      correctAnswer: 'mitochondria',
      explanation: 'Mitochondria are the powerhouses of the cell, converting glucose into ATP through cellular respiration.'
    },
    {
      id: 2,
      question: 'Which organelle contains the cell\'s genetic material?',
      correctAnswer: 'nucleus',
      explanation: 'The nucleus contains DNA and controls all cellular activities.'
    },
    {
      id: 3,
      question: 'Which organelle is responsible for protein synthesis?',
      correctAnswer: 'ribosome',
      explanation: 'Ribosomes read mRNA and assemble amino acids into proteins.'
    },
    {
      id: 4,
      question: 'Which organelle packages and distributes proteins?',
      correctAnswer: 'golgi',
      explanation: 'The Golgi apparatus modifies, packages, and ships proteins to their destinations.'
    }
  ];

  const organelles = {
    nucleus: { position: [0, 0, 0], color: '#4A90E2', size: 1.2, name: 'Nucleus' },
    mitochondria: { position: [1.5, 0.5, 0], color: '#7ED321', size: 0.8, name: 'Mitochondria' },
    ribosome: { position: [-1.5, -0.5, 0], color: '#F5A623', size: 0.4, name: 'Ribosome' },
    golgi: { position: [0, -1.5, 0], color: '#BD10E0', size: 0.6, name: 'Golgi Apparatus' },
    er: { position: [-0.5, 1, 0], color: '#50E3C2', size: 0.7, name: 'Endoplasmic Reticulum' },
    lysosome: { position: [1, -1, 0], color: '#B8E986', size: 0.5, name: 'Lysosome' }
  };

  const handleOrganelleClick = (organelleName: string) => {
    if (selectedOrganelle) return;
    
    setSelectedOrganelle(organelleName);
    const question = questions[currentQuestion];
    const correct = organelleName === question.correctAnswer;
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    onAnswer(correct);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOrganelle(null);
        setShowFeedback(false);
      } else {
        onComplete(score + (correct ? 1 : 0));
      }
    }, 3000);
  };

  const currentQ = questions[currentQuestion];

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Biology 3D Cell Quiz</h2>
            <div className="text-white">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
          
          <p className="text-lg text-gray-300 mb-6">{currentQ.question}</p>
          
          <div className="text-sm text-gray-400 mb-4">
            Click on the organelle in the 3D cell below to answer the question.
          </div>
          
          {showFeedback && (
            <div className={`p-4 rounded-xl ${
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

      {/* 3D Cell Scene */}
      <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />
        
        {/* Cell Membrane */}
        <Sphere args={[3, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial 
            color="#E8F4FD" 
            transparent 
            opacity={0.3} 
            wireframe={true}
          />
        </Sphere>
        
        {/* Organelles */}
        {Object.entries(organelles).map(([name, organelle]) => (
          <group key={name}>
            <Sphere
              args={[organelle.size, 16, 16]}
              position={organelle.position}
              onClick={() => handleOrganelleClick(name)}
              onPointerOver={() => setHoveredOrganelle(name)}
              onPointerOut={() => setHoveredOrganelle(null)}
            >
              <meshStandardMaterial 
                color={
                  selectedOrganelle === name
                    ? isCorrect
                      ? '#00FF00'
                      : '#FF0000'
                    : hoveredOrganelle === name
                    ? '#FFFFFF'
                    : organelle.color
                }
                emissive={hoveredOrganelle === name ? organelle.color : '#000000'}
                emissiveIntensity={hoveredOrganelle === name ? 0.3 : 0}
              />
            </Sphere>
            
            {/* Organelle Label */}
            <Text
              position={[organelle.position[0], organelle.position[1] - organelle.size - 0.3, organelle.position[2]]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {organelle.name}
            </Text>
          </group>
        ))}
        
        {/* Cytoplasm (background particles) */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Sphere
            key={i}
            position={[
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5
            ]}
            args={[0.05, 8, 8]}
          >
            <meshStandardMaterial color="#FFD700" />
          </Sphere>
        ))}
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}
