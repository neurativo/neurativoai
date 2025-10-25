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
  Target,
  X,
  Loader2
} from 'lucide-react';

interface StudyNote {
  id: string;
  title: string;
  topic: string;
  content: string | { 
    summary?: { title?: string; keyConcepts?: string[] }; 
    importantTopics?: { definitions?: Record<string, string>; principles?: string[] };
    definitions?: Record<string, string>;
    principles?: string[];
  };
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
const formatNoteContent = (content: string | { 
  summary?: { title?: string; keyConcepts?: string[] }; 
  importantTopics?: { definitions?: Record<string, string>; principles?: string[] };
  definitions?: Record<string, string>;
  principles?: string[];
}): string => {
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
    
    // Handle other object structures
    if (content.definitions) {
      let formatted = '### Definitions\n\n';
      Object.entries(content.definitions).forEach(([key, value]) => {
        formatted += `**${key}**: ${value}\n\n`;
      });
      return formatted;
    }
    
    if (content.principles && Array.isArray(content.principles)) {
      let formatted = '### Principles\n\n';
      content.principles.forEach((principle: string) => {
        formatted += `- ${principle}\n`;
      });
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
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  
  const formattedContent = formatNoteContent(note.content);
  
  const handleAIExplain = async () => {
    if (onExplainSection) {
      setIsLoadingExplanation(true);
      try {
        await onExplainSection(note);
      } catch (error) {
        console.error('Error getting AI explanation:', error);
      } finally {
        setIsLoadingExplanation(false);
      }
    }
  };
  
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl hover:shadow-2xl hover:bg-white/15 transition-all duration-300">
      {/* Header */}
      <div 
        className="p-4 sm:p-6 border-b border-white/20 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-white/90 truncate">{note.title}</h3>
              <p className="text-xs sm:text-sm text-white/70 font-medium truncate">{note.topic}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
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
        <div className="p-4 sm:p-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'content'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-lg'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90 border border-white/10'
              }`}
            >
              📝 Content
            </button>
            {note.highlights && (
              <button
                onClick={() => setActiveTab('highlights')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'highlights'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-lg'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90 border border-white/10'
                }`}
              >
                ✨ Highlights
              </button>
            )}
            {note.examples && note.examples.length > 0 && (
              <button
                onClick={() => setActiveTab('examples')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'examples'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30 shadow-lg'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90 border border-white/10'
                }`}
              >
                💡 Examples
              </button>
            )}
          </div>
          
          {/* Tab Content */}
          {activeTab === 'content' && (
            <div className="prose prose-invert max-w-none leading-relaxed text-white/80 prose-sm sm:prose-base">
              <div className="overflow-x-auto">
                <div className="prose-headings:text-white prose-headings:font-bold prose-p:text-white/80 prose-strong:text-white prose-code:text-blue-300 prose-code:bg-blue-500/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700 prose-pre:overflow-x-auto prose-table:text-sm prose-th:text-white prose-td:text-white/80">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                  >
                    {formattedContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'highlights' && note.highlights && (
            <div className="space-y-4 sm:space-y-6">
              {note.highlights.keyFormulas && note.highlights.keyFormulas.length > 0 && (
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-amber-400/20 shadow-xl">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-xl">
                      <Key className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-amber-200">Key Formulas</h3>
                  </div>
                  <div className="grid gap-2 sm:gap-3">
                    {note.highlights.keyFormulas.map((formula, index) => (
                      <div key={index} className="bg-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
                        <code className="text-amber-100 font-mono text-xs sm:text-sm leading-relaxed block break-all overflow-x-auto">
                          {formula}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {note.highlights.examTips && note.highlights.examTips.length > 0 && (
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-400/20 shadow-xl">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-xl">
                      <Lightbulb className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-blue-200">Exam Tips</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {note.highlights.examTips.map((tip, index) => (
                      <div key={index} className="bg-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 flex items-start gap-2 sm:gap-3">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {note.highlights.conceptChecks && note.highlights.conceptChecks.length > 0 && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-green-400/20 shadow-xl">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-xl">
                      <Target className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-green-200">Concept Checks</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {note.highlights.conceptChecks.map((check, index) => (
                      <div key={index} className="bg-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 flex items-start gap-2 sm:gap-3">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="text-green-100 text-xs sm:text-sm leading-relaxed">{check}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'examples' && note.examples && note.examples.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              {note.examples.map((example, index) => (
                <div key={index} className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-purple-400/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-purple-500/20 rounded-xl flex-shrink-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                      <div>
                        <h4 className="text-lg sm:text-xl font-bold text-purple-200 mb-2 truncate">{example.title}</h4>
                        <p className="text-purple-100 leading-relaxed text-sm sm:text-base">{example.description}</p>
                      </div>
                      
                      {example.code && (
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></div>
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-white/60 ml-1 sm:ml-2">Code Example</span>
                          </div>
                          <pre className="overflow-x-auto">
                            <code className="text-green-300 font-mono text-xs sm:text-sm leading-relaxed">
                              {example.code}
                            </code>
                          </pre>
                        </div>
                      )}
                      
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full"></div>
                          <span className="text-xs sm:text-sm font-semibold text-purple-200">Explanation</span>
                        </div>
                        <p className="text-purple-100 text-xs sm:text-sm leading-relaxed">{example.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* AI Explain Button */}
          {onExplainSection && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
              <button
                onClick={handleAIExplain}
                disabled={isLoadingExplanation}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm text-blue-200 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingExplanation ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="font-semibold text-sm sm:text-base">
                  {isLoadingExplanation ? 'Getting AI Explanation...' : 'AI Explain This Section'}
                </span>
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
      <div className="text-center py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 max-w-md mx-auto">
          <div className="p-4 bg-blue-500/20 rounded-2xl w-fit mx-auto mb-6">
            <BookOpen className="w-16 h-16 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white/90 mb-3">No Notes Available</h3>
          <p className="text-white/70 leading-relaxed">Upload a document to generate comprehensive study notes with beautiful glassmorphism design.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-blue-500/20 rounded-xl">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-3xl font-bold text-white/90 truncate">Study Notes</h2>
            <p className="text-white/70 text-xs sm:text-sm">Comprehensive learning materials</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-xl border border-blue-400/30 flex-shrink-0">
            <span className="text-blue-200 font-bold text-sm sm:text-lg">{notes.length}</span>
            <span className="text-blue-300 text-xs sm:text-sm ml-1">notes</span>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{notes.length * 5} min study time</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
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
