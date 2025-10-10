"use client";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder, Plane } from '@react-three/drei';
import { useState, useRef, useMemo } from 'react';
import { Mesh } from 'three';

interface Question {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    correct: boolean;
  }>;
  explanation: string;
  scenario?: {
    type: 'physics' | 'biology' | 'geography' | 'chemistry' | 'math' | 'history' | 'general';
    objects: Array<{
      id: string;
      type: 'box' | 'sphere' | 'cylinder' | 'plane';
      position: [number, number, number];
      size: [number, number, number];
      color: string;
      interactive: boolean;
      label?: string;
    }>;
  };
}

interface Adaptive3DQuizProps {
  questions: Question[];
  onAnswer: (correct: boolean) => void;
  onComplete: (score: number) => void;
}

export default function Adaptive3DQuiz({ questions, onAnswer, onComplete }: Adaptive3DQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

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

  const render3DObject = (obj: any, index: number) => {
    const commonProps = {
      position: obj.position,
      onClick: obj.interactive ? () => handleAnswer(obj.id) : undefined,
      onPointerOver: obj.interactive ? () => setHoveredObject(obj.id) : undefined,
      onPointerOut: obj.interactive ? () => setHoveredObject(null) : undefined,
    };

    const materialProps = {
      color: hoveredObject === obj.id ? '#FFFFFF' : obj.color,
      emissive: hoveredObject === obj.id ? obj.color : '#000000',
      emissiveIntensity: hoveredObject === obj.id ? 0.3 : 0,
    };

    switch (obj.type) {
      case 'box':
        return (
          <Box key={index} args={obj.size} {...commonProps}>
            <meshStandardMaterial {...materialProps} />
            {obj.label && (
              <Text
                position={[obj.position[0], obj.position[1] - obj.size[1]/2 - 0.2, obj.position[2]]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                {obj.label}
              </Text>
            )}
          </Box>
        );
      case 'sphere':
        return (
          <Sphere key={index} args={[obj.size[0], 16, 16]} {...commonProps}>
            <meshStandardMaterial {...materialProps} />
            {obj.label && (
              <Text
                position={[obj.position[0], obj.position[1] - obj.size[0] - 0.2, obj.position[2]]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                {obj.label}
              </Text>
            )}
          </Sphere>
        );
      case 'cylinder':
        return (
          <Cylinder key={index} args={[obj.size[0], obj.size[1], obj.size[2]]} {...commonProps}>
            <meshStandardMaterial {...materialProps} />
            {obj.label && (
              <Text
                position={[obj.position[0], obj.position[1] - obj.size[2]/2 - 0.2, obj.position[2]]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                {obj.label}
              </Text>
            )}
          </Cylinder>
        );
      case 'plane':
        return (
          <Plane key={index} args={[obj.size[0], obj.size[1]]} {...commonProps}>
            <meshStandardMaterial {...materialProps} transparent opacity={0.7} />
            {obj.label && (
              <Text
                position={[obj.position[0], obj.position[1], obj.position[2] + 0.1]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                {obj.label}
              </Text>
            )}
          </Plane>
        );
      default:
        return null;
    }
  };

  const getScenarioBackground = (scenarioType?: string) => {
    switch (scenarioType) {
      case 'physics': return 'from-slate-900 via-purple-900 to-slate-900';
      case 'biology': return 'from-slate-900 via-green-900 to-slate-900';
      case 'geography': return 'from-slate-900 via-blue-900 to-slate-900';
      case 'chemistry': return 'from-slate-900 via-orange-900 to-slate-900';
      case 'math': return 'from-slate-900 via-indigo-900 to-slate-900';
      case 'history': return 'from-slate-900 via-amber-900 to-slate-900';
      default: return 'from-slate-900 via-purple-900 to-slate-900';
    }
  };

  return (
    <div className={`w-full h-screen bg-gradient-to-br ${getScenarioBackground(currentQ.scenario?.type)}`}>
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              {currentQ.scenario?.type ? `${currentQ.scenario.type.charAt(0).toUpperCase() + currentQ.scenario.type.slice(1)} 3D Quiz` : 'Interactive 3D Quiz'}
            </h2>
            <div className="text-white">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
          
          <p className="text-lg text-gray-300 mb-6">{currentQ.question}</p>
          
          {currentQ.scenario?.objects && currentQ.scenario.objects.some(obj => obj.interactive) && (
            <div className="text-sm text-gray-400 mb-4">
              Click on the interactive objects in the 3D scene below to answer the question.
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="text-sm">{option.text}</div>
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
      <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />
        
        {/* Render 3D objects based on scenario */}
        {currentQ.scenario?.objects?.map((obj, index) => render3DObject(obj, index))}
        
        {/* Default scene if no scenario objects */}
        {(!currentQ.scenario?.objects || currentQ.scenario.objects.length === 0) && (
          <group>
            <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#4A90E2" />
            </Sphere>
            <Text
              position={[0, -2, 0]}
              fontSize={0.5}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Interactive Learning
            </Text>
          </group>
        )}
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}
