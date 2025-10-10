"use client";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Box, Cylinder } from '@react-three/drei';
import { useState, useRef, useMemo } from 'react';
import { Mesh, Vector3 } from 'three';

interface GeographyQuizProps {
  onAnswer: (correct: boolean) => void;
  onComplete: (score: number) => void;
}

export default function GeographyQuiz({ onAnswer, onComplete }: GeographyQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  const questions = [
    {
      id: 1,
      question: 'Which continent is known as the "Dark Continent"?',
      correctAnswer: 'africa',
      explanation: 'Africa is often called the "Dark Continent" due to its mysterious and unexplored nature in historical contexts.'
    },
    {
      id: 2,
      question: 'Which country is the largest by land area?',
      correctAnswer: 'russia',
      explanation: 'Russia is the largest country in the world by land area, covering over 17 million square kilometers.'
    },
    {
      id: 3,
      question: 'Which ocean is the largest?',
      correctAnswer: 'pacific',
      explanation: 'The Pacific Ocean is the largest ocean, covering more than 30% of Earth\'s surface.'
    },
    {
      id: 4,
      question: 'Which mountain range contains Mount Everest?',
      correctAnswer: 'himalayas',
      explanation: 'Mount Everest, the world\'s highest peak, is located in the Himalayas between Nepal and China.'
    }
  ];

  const locations = useMemo(() => ({
    africa: { 
      position: [0, 0, 0] as [number, number, number], 
      color: '#8B4513', 
      name: 'Africa',
      size: 0.8
    },
    asia: { 
      position: [1.2, 0.3, 0] as [number, number, number], 
      color: '#FF6B6B', 
      name: 'Asia',
      size: 1.0
    },
    europe: { 
      position: [0.3, 0.8, 0] as [number, number, number], 
      color: '#4ECDC4', 
      name: 'Europe',
      size: 0.6
    },
    northAmerica: { 
      position: [-1.5, 0.5, 0] as [number, number, number], 
      color: '#45B7D1', 
      name: 'North America',
      size: 0.9
    },
    southAmerica: { 
      position: [-1.2, -0.8, 0] as [number, number, number], 
      color: '#96CEB4', 
      name: 'South America',
      size: 0.7
    },
    australia: { 
      position: [1.8, -0.9, 0] as [number, number, number], 
      color: '#FFEAA7', 
      name: 'Australia',
      size: 0.5
    },
    antarctica: { 
      position: [0, -1.5, 0] as [number, number, number], 
      color: '#DDA0DD', 
      name: 'Antarctica',
      size: 0.6
    },
    pacific: { 
      position: [2.5, 0, 0] as [number, number, number], 
      color: '#87CEEB', 
      name: 'Pacific Ocean',
      size: 1.2
    },
    atlantic: { 
      position: [-0.5, 0, 0] as [number, number, number], 
      color: '#4682B4', 
      name: 'Atlantic Ocean',
      size: 0.8
    },
    himalayas: { 
      position: [1.0, 0.2, 0.3] as [number, number, number], 
      color: '#8B7355', 
      name: 'Himalayas',
      size: 0.3
    }
  }), []);

  const handleLocationClick = (locationName: string) => {
    if (selectedLocation) return;
    
    setSelectedLocation(locationName);
    const question = questions[currentQuestion];
    const correct = locationName === question.correctAnswer;
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    onAnswer(correct);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedLocation(null);
        setShowFeedback(false);
      } else {
        onComplete(score + (correct ? 1 : 0));
      }
    }, 3000);
  };

  const currentQ = questions[currentQuestion];

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Geography 3D Globe Quiz</h2>
            <div className="text-white">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
          
          <p className="text-lg text-gray-300 mb-6">{currentQ.question}</p>
          
          <div className="text-sm text-gray-400 mb-4">
            Click on the location in the 3D globe below to answer the question.
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

      {/* 3D Globe Scene */}
      <Canvas camera={{ position: [0, 0, 6], fov: 75 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />
        
        {/* Earth Globe */}
        <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial 
            color="#4A90E2" 
            transparent 
            opacity={0.8}
          />
        </Sphere>
        
        {/* Continents and Locations */}
        {Object.entries(locations).map(([name, location]) => (
          <group key={name}>
            <Box
              args={[location.size, location.size * 0.3, location.size * 0.1]}
              position={[location.position[0], location.position[1], location.position[2] + 2.1]}
              onClick={() => handleLocationClick(name)}
              onPointerOver={() => setHoveredLocation(name)}
              onPointerOut={() => setHoveredLocation(null)}
            >
              <meshStandardMaterial 
                color={
                  selectedLocation === name
                    ? isCorrect
                      ? '#00FF00'
                      : '#FF0000'
                    : hoveredLocation === name
                    ? '#FFFFFF'
                    : location.color
                }
                emissive={hoveredLocation === name ? location.color : '#000000'}
                emissiveIntensity={hoveredLocation === name ? 0.5 : 0}
              />
            </Box>
            
            {/* Location Label */}
            <Text
              position={[location.position[0], location.position[1] - location.size - 0.3, location.position[2] + 2.5]}
              fontSize={0.2}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {location.name}
            </Text>
          </group>
        ))}
        
        {/* Grid Lines for Reference */}
        <gridHelper args={[10, 20, '#444444', '#444444']} position={[0, -3, 0]} />
        
        {/* Rotation Animation */}
        <group rotation={[0, Date.now() * 0.0001, 0]}>
          {/* Additional Earth Details */}
          <Sphere args={[2.01, 32, 32]} position={[0, 0, 0]}>
            <meshStandardMaterial 
              color="#2E8B57" 
              transparent 
              opacity={0.3}
              wireframe={true}
            />
          </Sphere>
        </group>
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}
