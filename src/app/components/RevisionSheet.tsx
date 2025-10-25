"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  BookOpen, 
  Calculator, 
  Lightbulb, 
  Code,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RevisionSheetProps {
  content: string;
  glossary: Array<{ term: string; definition: string; chapter?: string }>;
  chapters: string[];
  onExplainSection?: (content: string) => void;
}

interface GlossaryTerm {
  term: string;
  definition: string;
  chapter?: string;
}

const RevisionSheet: React.FC<RevisionSheetProps> = ({ 
  content, 
  glossary, 
  chapters, 
  onExplainSection 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['key-concepts']));
  const [activeTab, setActiveTab] = useState<'overview' | 'glossary' | 'chapters'>('overview');

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const formatContent = (content: string) => {
    if (!content) return "No revision content available.";
    
    // If content is already markdown, return as is
    if (content.includes('##') || content.includes('**')) {
      return content;
    }
    
    // If content is structured data, format it
    try {
      const parsed = JSON.parse(content);
      if (parsed.sections) {
        return parsed.sections.map((section: any) => 
          `## ${section.title}\n${section.content}`
        ).join('\n\n');
      }
    } catch {
      // Not JSON, return as is
    }
    
    return content;
  };

  if (!content && glossary.length === 0 && chapters.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 max-w-md mx-auto">
          <div className="p-4 bg-orange-500/20 rounded-2xl w-fit mx-auto mb-6">
            <FileText className="w-16 h-16 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-white/90 mb-3">No Revision Content</h3>
          <p className="text-white/70 leading-relaxed">Upload a document to generate a comprehensive revision sheet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <FileText className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white/90">Revision Sheet</h2>
            <p className="text-white/70 text-sm">Quick reference for exam preparation</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-orange-400/30">
            <span className="text-orange-200 font-bold text-lg">{chapters.length}</span>
            <span className="text-orange-300 text-sm ml-1">chapters</span>
          </div>
        </div>
        <button className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm text-orange-200 rounded-xl hover:from-orange-500/30 hover:to-red-500/30 border border-orange-400/30 hover:border-orange-400/50 transition-all duration-200 shadow-lg hover:shadow-xl">
          <Download className="w-5 h-5" />
          <span className="font-semibold">Export PDF</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'glossary', label: 'Glossary', icon: Calculator, count: glossary.length },
          { id: 'chapters', label: 'Chapters', icon: Code, count: chapters.length }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30 shadow-lg'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90 border border-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count && tab.count > 0 && (
                <span className="ml-1 bg-orange-500/20 text-orange-300 py-0.5 px-2 rounded-full text-xs font-medium">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="prose prose-invert max-w-none leading-relaxed text-white/80">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formatContent(content)}
              </ReactMarkdown>
            </div>
          </div>

          {/* AI Explain Button */}
          {onExplainSection && (
            <div className="text-center">
              <button
                onClick={() => onExplainSection(content)}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm text-blue-200 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">AI Explain This Section</span>
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'glossary' && (
        <div className="space-y-4">
          {glossary.length > 0 ? (
            <div className="grid gap-4">
              {glossary.map((term, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
                      <Calculator className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-orange-200 mb-2">{term.term}</h3>
                      <p className="text-white/80 leading-relaxed">{term.definition}</p>
                      {term.chapter && (
                        <div className="mt-2">
                          <span className="text-xs text-orange-300 bg-orange-500/20 px-2 py-1 rounded-full">
                            {term.chapter}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calculator className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No glossary terms available</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chapters' && (
        <div className="space-y-4">
          {chapters.length > 0 ? (
            <div className="grid gap-4">
              {chapters.map((chapter, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Code className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{chapter}</h3>
                      <p className="text-white/60 text-sm">Chapter {index + 1}</p>
                    </div>
                    <div className="text-orange-300 text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Code className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No chapters available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RevisionSheet;
