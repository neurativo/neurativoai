"use client";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder } from '@react-three/drei';
import { useState, useRef } from 'react';
import { Mesh } from 'three';

interface ComputerScienceQuizProps {
  onAnswer: (correct: boolean) => void;
  onComplete: (score: number) => void;
}

export default function ComputerScienceQuiz({ onAnswer, onComplete }: ComputerScienceQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const questions = [
    {
      id: 1,
      question: 'Drag the nodes to create a correct sorting algorithm flow (Bubble Sort)',
      correctOrder: ['start', 'input', 'loop', 'compare', 'swap', 'end'],
      explanation: 'Bubble Sort: Start → Input array → Loop through elements → Compare adjacent elements → Swap if needed → End when sorted.'
    },
    {
      id: 2,
      question: 'Arrange the nodes to show a binary search algorithm flow',
      correctOrder: ['start', 'input', 'middle', 'compare', 'found', 'end'],
      explanation: 'Binary Search: Start → Input sorted array → Find middle element → Compare with target → If found, return index → End.'
    },
    {
      id: 3,
      question: 'Create a simple if-else statement flow',
      correctOrder: ['start', 'condition', 'true', 'false', 'end'],
      explanation: 'If-Else: Start → Check condition → If true, execute true branch → If false, execute false branch → End.'
    }
  ];

  const nodes = {
    start: { position: [0, 2, 0] as [number, number, number], color: '#4CAF50', name: 'Start', type: 'start' },
    input: { position: [-2, 1, 0] as [number, number, number], color: '#2196F3', name: 'Input', type: 'process' },
    loop: { position: [-1, 0, 0] as [number, number, number], color: '#FF9800', name: 'Loop', type: 'process' },
    compare: { position: [0, 0, 0] as [number, number, number], color: '#9C27B0', name: 'Compare', type: 'decision' },
    swap: { position: [1, 0, 0] as [number, number, number], color: '#F44336', name: 'Swap', type: 'process' },
    middle: { position: [0, 1, 0] as [number, number, number], color: '#607D8B', name: 'Middle', type: 'process' },
    found: { position: [1, 1, 0] as [number, number, number], color: '#795548', name: 'Found', type: 'process' },
    condition: { position: [0, 1, 0] as [number, number, number], color: '#E91E63', name: 'Condition', type: 'decision' },
    true: { position: [-1, 0, 0] as [number, number, number], color: '#8BC34A', name: 'True', type: 'process' },
    false: { position: [1, 0, 0] as [number, number, number], color: '#FF5722', name: 'False', type: 'process' },
    end: { position: [0, -2, 0] as [number, number, number], color: '#9E9E9E', name: 'End', type: 'end' }
  };

  const [nodePositions, setNodePositions] = useState(nodes);

  const handleNodeClick = (nodeName: string) => {
    if (selectedNode) return;
    
    setSelectedNode(nodeName);
    const question = questions[currentQuestion];
    
    // For this demo, we'll check if the node is in the correct position
    // In a real implementation, you'd check the actual flow order
    const correct = question.correctOrder.includes(nodeName);
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
    
    onAnswer(correct);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedNode(null);
        setShowFeedback(false);
        setNodePositions(nodes); // Reset positions
      } else {
        onComplete(score + (correct ? 1 : 0));
      }
    }, 3000);
  };

  const handleNodeDrag = (nodeName: string, newPosition: [number, number, number]) => {
    setNodePositions(prev => ({
      ...prev,
      [nodeName]: {
        ...prev[nodeName],
        position: newPosition
      }
    }));
  };

  const currentQ = questions[currentQuestion];

  const renderNode = (nodeName: string, nodeData: any) => {
    const isSelected = selectedNode === nodeName;
    const isHovered = hoveredNode === nodeName;
    const isCorrectNode = currentQ.correctOrder.includes(nodeName);

    return (
      <group key={nodeName}>
        <Box
          args={[1, 0.5, 0.2]}
          position={nodeData.position}
          onClick={() => handleNodeClick(nodeName)}
          onPointerOver={() => setHoveredNode(nodeName)}
          onPointerOut={() => setHoveredNode(null)}
        >
          <meshStandardMaterial 
            color={
              isSelected
                ? isCorrect
                  ? '#00FF00'
                  : '#FF0000'
                : isHovered
                ? '#FFFFFF'
                : isCorrectNode && showFeedback
                ? '#00FF00'
                : nodeData.color
            }
            emissive={isHovered ? nodeData.color : '#000000'}
            emissiveIntensity={isHovered ? 0.3 : 0}
          />
        </Box>
        
        {/* Node Label */}
        <Text
          position={[nodeData.position[0], nodeData.position[1] - 0.4, nodeData.position[2] + 0.1]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {nodeData.name}
        </Text>
      </group>
    );
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Computer Science 3D Flow Quiz</h2>
            <div className="text-white">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
          
          <p className="text-lg text-gray-300 mb-6">{currentQ.question}</p>
          
          <div className="text-sm text-gray-400 mb-4">
            Click on the nodes in the 3D flow diagram below to build the correct algorithm flow.
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

      {/* 3D Flow Diagram Scene */}
      <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />
        
        {/* Flow Diagram Nodes */}
        {Object.entries(nodePositions).map(([nodeName, nodeData]) => 
          renderNode(nodeName, nodeData)
        )}
        
        {/* Connection Lines */}
        {currentQ.correctOrder.map((nodeName, index) => {
          if (index < currentQ.correctOrder.length - 1) {
            const currentPos = nodePositions[nodeName]?.position || [0, 0, 0];
            const nextPos = nodePositions[currentQ.correctOrder[index + 1]]?.position || [0, 0, 0];
            
            return (
              <Box
                key={`line-${index}`}
                args={[
                  Math.sqrt(
                    Math.pow(nextPos[0] - currentPos[0], 2) + 
                    Math.pow(nextPos[1] - currentPos[1], 2)
                  ),
                  0.05,
                  0.05
                ]}
                position={[
                  (currentPos[0] + nextPos[0]) / 2,
                  (currentPos[1] + nextPos[1]) / 2,
                  (currentPos[2] + nextPos[2]) / 2
                ]}
                rotation={[
                  0,
                  0,
                  Math.atan2(nextPos[1] - currentPos[1], nextPos[0] - currentPos[0])
                ]}
              >
                <meshStandardMaterial 
                  color={showFeedback ? '#00FF00' : '#666666'} 
                  transparent 
                  opacity={0.7}
                />
              </Box>
            );
          }
          return null;
        })}
        
        {/* Grid for Reference */}
        <gridHelper args={[10, 20, '#444444', '#444444']} position={[0, 0, -1]} />
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}
