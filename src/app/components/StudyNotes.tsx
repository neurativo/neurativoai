"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BookOpen, 
  Lightbulb, 
  Key, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  Clock,
  Target
} from 'lucide-react';

interface StudyNote {
  id: string;
  title: string;
  topic: string;
  content: string | { summary?: { title?: string; keyConcepts?: string[] }; importantTopics?: { definitions?: Record<string, string>; principles?: string[] } };
  level: 'basic' | 'intermediate' | 'advanced';
  highlights?: {
    keyFormulas?: string[];
    examTips?: string[];
    conceptChecks?: string[];
  };
  examples?: Array<{
    title: string;
    description: string;
    code?: string;
    explanation: string;
  }>;
  relatedTopics?: string[];
  tags?: string[];
}

interface StudyNotesProps {
  notes: StudyNote[];
  onExplainSection?: (note: StudyNote) => void;
}

// Helper function to format note content
const formatNoteContent = (content: string | { summary?: { title?: string; keyConcepts?: string[] }; importantTopics?: { definitions?: Record<string, string>; principles?: string[] } }): string => {
  if (typeof content === 'string') return content;
  
  if (content && typeof content === 'object') {
    // Handle structured content
    if (content.summary) {
      let formatted = '';
      if (content.summary.title) {
        formatted += `## ${content.summary.title}\n\n`;
      }
      if (content.summary.keyConcepts && Array.isArray(content.summary.keyConcepts)) {
        formatted += `### Key Concepts\n\n`;
        content.summary.keyConcepts.forEach((concept: string) => {
          formatted += `- ${concept}\n`;
        });
        formatted += '\n';
      }
      if (content.importantTopics) {
        if (content.importantTopics.definitions) {
          formatted += `### Definitions\n\n`;
          Object.entries(content.importantTopics.definitions).forEach(([key, value]) => {
            formatted += `**${key}**: ${value}\n\n`;
          });
        }
        if (content.importantTopics.principles && Array.isArray(content.importantTopics.principles)) {
          formatted += `### Principles\n\n`;
          content.importantTopics.principles.forEach((principle: string) => {
            formatted += `- ${principle}\n`;
          });
          formatted += '\n';
        }
      }
      return formatted;
    }
    
    // Fallback to JSON stringify for debugging
    return JSON.stringify(content, null, 2);
  }
  
  return '';
};

// Level badge component
const LevelBadge = ({ level }: { level: string }) => {
  const colors = {
    basic: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[level as keyof typeof colors] || colors.intermediate}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

// Individual note component
const NoteCard = ({ note, onExplainSection }: { note: StudyNote; onExplainSection?: (note: StudyNote) => void }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'highlights' | 'examples'>('content');
  
  const formattedContent = formatNoteContent(note.content);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div 
        className="p-4 border-b border-gray-100 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
              <p className="text-sm text-gray-600">{note.topic}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <LevelBadge level={note.level} />
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex space-x-1 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Content
            </button>
            {note.highlights && (
              <button
                onClick={() => setActiveTab('highlights')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'highlights'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Highlights
              </button>
            )}
            {note.examples && note.examples.length > 0 && (
              <button
                onClick={() => setActiveTab('examples')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'examples'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Examples
              </button>
            )}
          </div>
          
          {/* Tab Content */}
          {activeTab === 'content' && (
            <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {formattedContent}
              </ReactMarkdown>
            </div>
          )}
          
          {activeTab === 'highlights' && note.highlights && (
            <div className="space-y-4">
              {note.highlights.keyFormulas && note.highlights.keyFormulas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                    <Key className="w-5 h-5 text-amber-500" />
                    Key Formulas
                  </div>
                  <ul className="space-y-2">
                    {note.highlights.keyFormulas.map((formula, index) => (
                      <li key={index} className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                        {formula}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {note.highlights.examTips && note.highlights.examTips.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    Exam Tips
                  </div>
                  <ul className="space-y-2">
                    {note.highlights.examTips.map((tip, index) => (
                      <li key={index} className="bg-blue-50 p-3 rounded-lg">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {note.highlights.conceptChecks && note.highlights.conceptChecks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                    <Target className="w-5 h-5 text-green-500" />
                    Concept Checks
                  </div>
                  <ul className="space-y-2">
                    {note.highlights.conceptChecks.map((check, index) => (
                      <li key={index} className="bg-green-50 p-3 rounded-lg">
                        {check}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'examples' && note.examples && note.examples.length > 0 && (
            <div className="space-y-4">
              {note.examples.map((example, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{example.title}</h4>
                  <p className="text-gray-700 mb-3">{example.description}</p>
                  {example.code && (
                    <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
                      <code className="text-sm">{example.code}</code>
                    </pre>
                  )}
                  <p className="text-gray-600 text-sm mt-2">{example.explanation}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* AI Explain Button */}
          {onExplainSection && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => onExplainSection(note)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                AI Explain This Section
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main component
export default function StudyNotes({ notes, onExplainSection }: StudyNotesProps) {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes Available</h3>
        <p className="text-gray-500">Upload a document to generate comprehensive study notes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Study Notes</h2>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {notes.length}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Estimated study time: {notes.length * 5} minutes
        </div>
      </div>
      
      <div className="space-y-4">
        {notes.map((note) => (
          <NoteCard 
            key={note.id} 
            note={note} 
            onExplainSection={onExplainSection}
          />
        ))}
      </div>
    </div>
  );
}
