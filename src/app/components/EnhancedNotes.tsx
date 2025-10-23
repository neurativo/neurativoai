"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Lightbulb, 
  Calculator,
  Target,
  Code,
  FileText,
  Clock,
  Star,
  CheckCircle
} from 'lucide-react';
// Simple syntax highlighting without external dependencies
import { EnhancedNote } from '../lib/types/studyPack';

interface EnhancedNotesProps {
  note: EnhancedNote;
  onMarkAsRead?: (noteId: string) => void;
  onMarkAsMastered?: (noteId: string) => void;
  showProgress?: boolean;
  isRead?: boolean;
  isMastered?: boolean;
}

const sectionIcons = {
  summary: BookOpen,
  importantTopics: Lightbulb,
  examples: Code,
  examTips: Target,
  relatedTopics: FileText
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border-red-200'
};

export default function EnhancedNotes({
  note,
  onMarkAsRead,
  onMarkAsMastered,
  showProgress = true,
  isRead = false,
  isMastered = false
}: EnhancedNotesProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    if (timeSpent > 30 && !isRead) {
      onMarkAsRead?.(note.id);
    }
  }, [timeSpent, isRead, note.id, onMarkAsRead]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getDifficultyColor = (level: string) => {
    return difficultyColors[level as keyof typeof difficultyColors] || difficultyColors.intermediate;
  };

  const renderTOC = () => {
    if (!note.toc || note.toc.length === 0) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Table of Contents
        </h4>
        <ul className="space-y-1">
          {note.toc.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">
                {'  '.repeat(item.level - 1)}•
              </span>
              <a
                href={`#${item.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderSection = (sectionId: string, title: string, content: React.ReactNode, icon: React.ComponentType<any>) => {
    const isExpanded = expandedSections.has(sectionId);
    const Icon = icon;

    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <button
          onClick={() => toggleSection(sectionId)}
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-800">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderSummary = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-800 mb-2">Key Concepts</h4>
        <ul className="space-y-1">
          {note.content.summary.keyConcepts.map((concept, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{concept}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-800 mb-2">Learning Outcomes</h4>
        <ul className="space-y-1">
          {note.content.summary.learningOutcomes.map((outcome, index) => (
            <li key={index} className="flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{outcome}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderImportantTopics = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-800 mb-2">Definitions</h4>
        <div className="space-y-2">
          {Object.entries(note.content.importantTopics.definitions).map(([term, definition]) => (
            <div key={term} className="bg-blue-50 p-3 rounded-lg">
              <dt className="font-medium text-blue-900">{term}</dt>
              <dd className="text-blue-800 text-sm mt-1">{definition}</dd>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-800 mb-2">Principles</h4>
        <ul className="space-y-1">
          {note.content.importantTopics.principles.map((principle, index) => (
            <li key={index} className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{principle}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {note.content.importantTopics.formulas && note.content.importantTopics.formulas.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Formulas</h4>
          <div className="space-y-2">
            {note.content.importantTopics.formulas.map((formula, index) => (
              <div key={index} className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                {formula}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderExamples = () => (
    <div className="space-y-4">
      {note.content.examples.map((example, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">{example.title}</h4>
          <p className="text-gray-600 text-sm mb-3">{example.description}</p>
          
          {example.code && (
            <div className="mb-3">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                <code>{example.code}</code>
              </pre>
            </div>
          )}
          
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-green-800 text-sm">
              <strong>Explanation:</strong> {example.explanation}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderExamTips = () => (
    <div className="space-y-2">
      {note.content.examTips.map((tip, index) => (
        <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
          <Target className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <span className="text-yellow-800 text-sm">{tip}</span>
        </div>
      ))}
    </div>
  );

  const renderRelatedTopics = () => (
    <div className="flex flex-wrap gap-2">
      {note.content.relatedTopics.map((topic, index) => (
        <span
          key={index}
          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
        >
          {topic}
        </span>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{note.title}</h2>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(note.level)}`}>
                {note.level}
              </span>
              <span className="text-sm text-gray-500">{note.topic}</span>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {note.estimatedTime} min
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Star className="w-4 h-4" />
                {note.difficulty}/5
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showProgress && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Time Spent</div>
                <div className="font-medium">{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => onMarkAsRead?.(note.id)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  isRead 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isRead ? 'Read' : 'Mark as Read'}
              </button>
              
              <button
                onClick={() => onMarkAsMastered?.(note.id)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  isMastered 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isMastered ? 'Mastered' : 'Mark as Mastered'}
              </button>
            </div>
          </div>
        </div>
        
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Table of Contents */}
      {renderTOC()}

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {renderSection('summary', 'Summary', renderSummary(), sectionIcons.summary)}
        {renderSection('importantTopics', 'Important Topics', renderImportantTopics(), sectionIcons.importantTopics)}
        {note.content.examples.length > 0 && renderSection('examples', 'Examples', renderExamples(), sectionIcons.examples)}
        {note.content.examTips.length > 0 && renderSection('examTips', 'Exam Tips', renderExamTips(), sectionIcons.examTips)}
        {note.content.relatedTopics.length > 0 && renderSection('relatedTopics', 'Related Topics', renderRelatedTopics(), sectionIcons.relatedTopics)}
      </div>
    </div>
  );
}
