'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Note {
  id: string;
  content: string;
  title?: string;
  timestamp: number;
  type: 'key_point' | 'definition' | 'example' | 'concept';
  importance: 'high' | 'medium' | 'low';
  confidence?: 'high' | 'medium' | 'low';
  concept?: string;
  subconcepts?: string[];
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timestamp: number;
}

interface Keyword {
  term: string;
  type: 'concept' | 'person' | 'place' | 'technical' | 'formula' | 'method';
  importance: 'high' | 'medium' | 'low';
  description: string;
}

interface Section {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  notes: Note[];
  flashcards: Flashcard[];
}

export default function LiveLecturePage() {
  const router = useRouter();
  
  // Core states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Smart features
  const [smartNotes, setSmartNotes] = useState<Note[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes' | 'flashcards' | 'keywords'>('transcript');
  const [notesViewMode, setNotesViewMode] = useState<'organized' | 'chronological'>('organized');
  
  // Enhanced transcript display states
  const [partialTranscript, setPartialTranscript] = useState<string>('');
  const [transcriptConfidence, setTranscriptConfidence] = useState<number>(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(0);
  const transcriptBufferRef = useRef<string>('');
  const lastProcessTimeRef = useRef<number>(0);
  
  // Simplified buffering
  const lastTranscriptTimeRef = useRef<number>(0);

  // Timer for session duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Test microphone access
  const testMicrophone = async () => {
    try {
      console.log('Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      console.log('Microphone access granted');
      console.log('Audio tracks:', stream.getAudioTracks().length);
      console.log('Audio track settings:', stream.getAudioTracks()[0]?.getSettings());
      
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone test failed:', error);
      return false;
    }
  };

  // Start new section
  const startNewSection = (title: string) => {
    const newSection: Section = {
      id: `section_${Date.now()}`,
      title,
      startTime: Date.now(),
      notes: [],
      flashcards: []
    };
    setSections(prev => [...prev, newSection]);
    setCurrentSection(newSection);
    return newSection;
  };

  // Generate smart notes using AI with fallback
  const generateSmartNotes = async (text: string) => {
    try {
      // First try AI generation
      const response = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          context: currentSection?.title || 'General Lecture',
          type: 'smart_notes'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.notes && Array.isArray(result.notes) && result.notes.length > 0) {
          const newNotes: Note[] = result.notes.map((note: any, index: number) => ({
            id: `note_${Date.now()}_${index}`,
            content: note.content,
            title: note.title,
            timestamp: Date.now(),
            type: note.type || 'key_point',
            importance: note.importance || 'medium',
            confidence: note.confidence || 'medium',
            concept: note.concept,
            subconcepts: note.subconcepts || []
          }));
          
          setSmartNotes(prev => [...prev, ...newNotes]);
          
          // Add to current section
          if (currentSection) {
            setCurrentSection(prev => prev ? {
              ...prev,
              notes: [...prev.notes, ...newNotes]
            } : null);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error generating smart notes:', error);
    }

    // Fallback: Generate basic notes from any text, even if very short or unclear
    try {
      const fallbackNotes = generateFallbackNotes(text);
      if (fallbackNotes.length > 0) {
        setSmartNotes(prev => [...prev, ...fallbackNotes]);
        
        if (currentSection) {
          setCurrentSection(prev => prev ? {
            ...prev,
            notes: [...prev.notes, ...fallbackNotes]
          } : null);
        }
      }
    } catch (error) {
      console.error('Error generating fallback notes:', error);
    }
  };

  // Fallback note generation for poor audio
  const generateFallbackNotes = (text: string): Note[] => {
    const notes: Note[] = [];
    
    // Clean and split text
    const cleanText = text.trim().replace(/[^\w\s.,!?-]/g, '');
    const words = cleanText.split(/\s+/).filter(w => w.length > 2);
    
    if (words.length === 0) return notes;
    
    // Only create notes if we have meaningful content
    if (cleanText.length < 20) return notes;
    
    // Try to create one meaningful note
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length > 0) {
      // Create a single, clean note
      const meaningfulText = sentences.slice(0, 1).join('. ').trim();
      if (meaningfulText && meaningfulText.length > 15) {
        notes.push({
          id: `fallback_${Date.now()}_0`,
          content: `• ${meaningfulText}`,
          title: 'Lecture Content',
          timestamp: Date.now(),
          type: 'key_point',
          importance: 'medium',
          confidence: 'low'
        });
      }
    }
    
    return notes;
  };

  // Generate flashcards using AI
  const generateFlashcards = async (text: string) => {
    try {
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          context: currentSection?.title || 'General Lecture',
          count: 2 // Generate 2 flashcards per chunk
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.flashcards && Array.isArray(result.flashcards)) {
          const newFlashcards: Flashcard[] = result.flashcards.map((card: any, index: number) => ({
            id: `card_${Date.now()}_${index}`,
            front: card.front,
            back: card.back,
            timestamp: Date.now(),
            category: currentSection?.title || 'General'
          }));
          
          setFlashcards(prev => [...prev, ...newFlashcards]);
          
          // Add to current section
          if (currentSection) {
            setCurrentSection(prev => prev ? {
              ...prev,
              flashcards: [...prev.flashcards, ...newFlashcards]
            } : null);
          }
        }
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
    }
  };

  // Extract keywords
  const extractKeywords = async (text: string) => {
    try {
      const response = await fetch('/api/extract-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.keywords && Array.isArray(result.keywords)) {
          setKeywords(prev => {
            const newKeywords = result.keywords.filter((kw: Keyword) => 
              !prev.some(existing => existing.term === kw.term)
            );
            return [...prev, ...newKeywords];
          });
        }
      }
    } catch (error) {
      console.error('Error extracting keywords:', error);
    }
  };

  // Process audio chunks with Deepgram
  const processAudioChunks = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log('No audio chunks to process');
      return;
    }

    console.log(`Processing ${audioChunksRef.current.length} audio chunks`);

    try {
      setConnectionStatus('connecting');
      
      // Combine audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      console.log(`Audio blob size: ${audioBlob.size} bytes`);
      audioChunksRef.current = [];

      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      console.log(`Base64 audio length: ${base64Audio.length}`);

      // Send to Deepgram API
      console.log('Sending to Deepgram API...');
      const response = await fetch('/api/transcribe-deepgram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transcribe',
          audioData: base64Audio
        })
      });

      console.log('Deepgram response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Deepgram API error:', errorText);
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      console.log('Deepgram result:', result);
      
      if (result.success && result.transcript) {
        const newTranscript = result.transcript.trim();
        const isFinal = result.isFinal || false;
        const confidence = result.confidence || 0;
        const speaker = result.speaker;
        
        if (newTranscript) {
          console.log(`Transcript (${isFinal ? 'FINAL' : 'PARTIAL'}, conf: ${confidence.toFixed(2)}):`, newTranscript);
          
          const now = Date.now();
          lastTranscriptTimeRef.current = now;
          
          // Process transcript with AI recovery if needed
          const processedTranscript = await processTranscript(newTranscript, confidence);
          
          // Always add transcript to display
          setTranscript(prev => prev + ' ' + processedTranscript);
          transcriptBufferRef.current += ' ' + processedTranscript;
          
          // Update live display info
          setPartialTranscript(newTranscript);
          setTranscriptConfidence(confidence);
          setCurrentSpeaker(speaker);
          
          setConnectionStatus('connected');
          
          // Process for notes generation (both partial and final)
          const now2 = Date.now();
          if (now2 - lastProcessTimeRef.current > 10000 || transcriptBufferRef.current.length > 300) {
            await processTranscriptBuffer();
            lastProcessTimeRef.current = now2;
          }
        }
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Process accumulated transcript for smart features
  const processTranscriptBuffer = async () => {
    if (transcriptBufferRef.current.length < 50) return; // Lower threshold
    
    const text = transcriptBufferRef.current;
    console.log('Processing transcript buffer:', text);
    
    // Don't clear the buffer yet, just process it
    // transcriptBufferRef.current = '';
    
    // Generate notes if we have meaningful content
    if (text.length > 50) {
      console.log('Generating smart notes...');
      await generateSmartNotes(text);
    }
    
    // Generate flashcards and keywords if we have decent text
    if (text.length > 100) {
      console.log('Generating flashcards and keywords...');
      await generateFlashcards(text);
      await extractKeywords(text);
    }
  };

  // Reconstruct transcript to fix incomplete words and grammar
  const reconstructTranscript = async (text: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/reconstruct-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          context: currentSection?.title || 'General Lecture'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.reconstructedText) {
          return result.reconstructedText;
        }
      }
    } catch (error) {
      console.error('Error reconstructing transcript:', error);
    }
    
    return text; // Return original if reconstruction fails
  };

  // Simplified transcript processing
  const processTranscript = async (text: string, confidence: number) => {
    // If confidence is low, use AI to improve the transcript
    if (confidence < 0.7) {
      console.log('Low confidence transcript, applying AI recovery...');
      const improvedText = await reconstructTranscript(text);
      return improvedText || text;
    }
    return text;
  };

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Test microphone first
      const micWorking = await testMicrophone();
      if (!micWorking) {
        throw new Error('Microphone access denied or not available');
      }

      // Get audio stream with lecture-optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Higher sample rate for better quality
          channelCount: 1 // Mono for better Deepgram performance
        }
      });

      streamRef.current = stream;

      // Set up MediaRecorder with optimal settings for Deepgram
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000 // Higher bitrate for better quality
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Audio chunk received: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        } else {
          console.log('Empty audio chunk received');
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudioChunks();
      };

      // Start recording with smaller chunks for better real-time performance
      const chunkSize = 250; // 250ms chunks for optimal Deepgram performance
      mediaRecorder.start(chunkSize);
      setIsRecording(true);
      sessionStartRef.current = Date.now();
      setSessionDuration(0);

      // Start first section
      startNewSection('Introduction');

      // Process audio chunks more frequently for better real-time performance
      intervalRef.current = setInterval(async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start(chunkSize);
        }
      }, chunkSize);

      console.log('Recording started');
      setIsLoading(false);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to start recording');
      setIsLoading(false);
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (isPaused) {
      // Resume
      if (mediaRecorderRef.current && streamRef.current) {
        mediaRecorderRef.current.start(2000);
        setIsPaused(false);
      }
    } else {
      // Pause
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsPaused(true);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setConnectionStatus('disconnected');
    console.log('Recording stopped');
  };

  // Create new section
  const createNewSection = () => {
    const title = prompt('Enter section title:') || `Section ${sections.length + 1}`;
    startNewSection(title);
  };

  // Export notes in professional format
  const exportNotes = () => {
    const exportDate = new Date();
    const dateStr = exportDate.toLocaleDateString();
    const timeStr = exportDate.toLocaleTimeString();
    
    // Group notes by concept for professional organization
    const notesByConcept = smartNotes.reduce((acc, note) => {
      const concept = note.concept || 'General';
      if (!acc[concept]) acc[concept] = [];
      acc[concept].push(note);
      return acc;
    }, {} as Record<string, Note[]>);

    // Create professional markdown content
    let markdownContent = `# Lecture Notes\n\n`;
    markdownContent += `**Date:** ${dateStr}\n`;
    markdownContent += `**Time:** ${timeStr}\n`;
    markdownContent += `**Duration:** ${formatTime(sessionDuration)}\n`;
    markdownContent += `**Total Notes:** ${smartNotes.length}\n\n`;
    
    markdownContent += `---\n\n`;

    // Add transcript
    if (transcript) {
      markdownContent += `## Live Transcript\n\n`;
      markdownContent += `${transcript}\n\n`;
      markdownContent += `---\n\n`;
    }

    // Add organized notes by concept
    markdownContent += `## Study Notes\n\n`;
    
    Object.entries(notesByConcept).forEach(([concept, notes]) => {
      markdownContent += `### ${concept}\n\n`;
      
      notes.forEach(note => {
        if (note.title) {
          markdownContent += `#### ${note.title}\n\n`;
        }
        
        // Convert markdown to plain text for export
        const plainContent = note.content
          .replace(/\*\*(.*?)\*\*/g, '**$1**')
          .replace(/\*(.*?)\*/g, '*$1*')
          .replace(/`(.*?)`/g, '`$1`');
        
        markdownContent += `${plainContent}\n\n`;
        
        if (note.subconcepts && note.subconcepts.length > 0) {
          markdownContent += `**Related Topics:** ${note.subconcepts.join(', ')}\n\n`;
        }
      });
      
      markdownContent += `---\n\n`;
    });

    // Add flashcards
    if (flashcards.length > 0) {
      markdownContent += `## Flashcards\n\n`;
      flashcards.forEach((card, index) => {
        markdownContent += `### Card ${index + 1}\n\n`;
        markdownContent += `**Q:** ${card.front}\n\n`;
        markdownContent += `**A:** ${card.back}\n\n`;
        if (card.category) {
          markdownContent += `**Category:** ${card.category}\n\n`;
        }
      });
      markdownContent += `---\n\n`;
    }

    // Add keywords
    if (keywords.length > 0) {
      markdownContent += `## Key Terms\n\n`;
      keywords.forEach(keyword => {
        markdownContent += `- **${keyword.term}**: ${keyword.description}\n`;
      });
      markdownContent += `\n---\n\n`;
    }

    // Add sections overview
    if (sections.length > 0) {
      markdownContent += `## Lecture Sections\n\n`;
      sections.forEach((section, index) => {
        markdownContent += `### ${index + 1}. ${section.title}\n\n`;
        markdownContent += `- **Notes:** ${section.notes.length}\n`;
        markdownContent += `- **Flashcards:** ${section.flashcards.length}\n`;
        markdownContent += `- **Duration:** ${formatTime(Math.floor((Date.now() - section.startTime) / 1000))}\n\n`;
      });
    }

    markdownContent += `\n---\n\n`;
    markdownContent += `*Generated by Live Lecture Assistant*\n`;
    markdownContent += `*Export Date: ${exportDate.toISOString()}*\n`;

    // Create and download file
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-notes-${dateStr.replace(/\//g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced markdown renderer for clean, readable text
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm font-mono border border-gray-600">$1</code>')
      .replace(/^• (.*$)/gm, '<div class="flex items-start my-2"><span class="text-blue-400 mr-3 mt-1 text-sm">•</span><span class="flex-1">$1</span></div>')
      .replace(/^  - (.*$)/gm, '<div class="flex items-start my-1 ml-6"><span class="text-gray-400 mr-3 mt-1 text-xs">-</span><span class="flex-1 text-sm">$1</span></div>')
      .replace(/^(\d+)\. (.*$)/gm, '<div class="flex items-start my-2"><span class="text-blue-400 mr-3 mt-1 font-semibold text-sm">$1.</span><span class="flex-1">$2</span></div>')
      .replace(/^> (.*$)/gm, '<div class="bg-blue-500/10 border-l-4 border-blue-400 pl-4 py-2 my-3 italic text-gray-300 rounded-r">$1</div>')
      .replace(/^---$/gm, '<div class="my-4 border-t border-gray-600"></div>')
      .replace(/\n\n/g, '</p><p class="my-3">')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/, '<p class="my-2">$1</p>');
  };


  // Get emoji for note type
  const getNoteTypeEmoji = (type: string) => {
    const emojis = {
      key_point: '🔑',
      definition: '📖',
      example: '💡',
      concept: '🧠'
    };
    return emojis[type as keyof typeof emojis] || '📝';
  };

  // Get emoji for keyword type
  const getKeywordTypeEmoji = (type: string) => {
    const emojis = {
      concept: '🧠',
      person: '👤',
      place: '📍',
      technical: '⚙️',
      formula: '📐',
      method: '🔬'
    };
    return emojis[type as keyof typeof emojis] || '🔑';
  };

  // Get difficulty color for flashcards
  const getDifficultyColor = (difficulty?: string) => {
    const colors = {
      easy: 'text-green-400 bg-green-500/20 border-green-500/30',
      medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      hard: 'text-red-400 bg-red-500/20 border-red-500/30'
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Live Lecture Assistant
              </h1>
              <p className="text-gray-300">
                Real-time transcription with AI-powered smart notes
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Session Duration */}
              <div className="text-white text-lg font-mono">
                {formatTime(sessionDuration)}
              </div>
              
              {/* Connection Status */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {connectionStatus === 'connected' ? '● Connected' :
                 connectionStatus === 'connecting' ? '● Connecting' :
                 '● Disconnected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isLoading}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              {isLoading ? 'Starting...' : '🎤 Start Lecture'}
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={togglePause}
                className={`px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg ${
                  isPaused 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              
              <button
                onClick={createNewSection}
                className="px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                📝 New Section
              </button>
              
              <button
                onClick={stopRecording}
                className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                ⏹️ Stop
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-xl mb-6 backdrop-blur-sm">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Panel - Transcript */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                📝 Live Transcript
              </h2>
              <div className="flex items-center space-x-4">
                {currentSpeaker && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-400">Speaker {currentSpeaker}</span>
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  {transcript.split(' ').length} words
                  {transcriptConfidence > 0 && (
                    <span className="ml-2 text-xs">
                      ({Math.round(transcriptConfidence * 100)}% conf)
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="h-96 overflow-y-auto bg-black/20 rounded-xl p-4 border border-white/10">
              {transcript ? (
                <div className="text-gray-200 leading-relaxed">
                  <div className="whitespace-pre-wrap">{transcript}</div>
                  {partialTranscript && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="text-gray-400 text-sm italic">
                        Live: {partialTranscript}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 italic">Transcript will appear here...</p>
              )}
            </div>
          </div>

          {/* Right Panel - Smart Features */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'transcript', label: '📝 Notes', count: smartNotes.length },
                { id: 'flashcards', label: '🃏 Cards', count: flashcards.length },
                { id: 'keywords', label: '🔑 Keywords', count: keywords.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              ))}
            </div>

            {/* Notes View Mode Toggle */}
            {activeTab === 'transcript' && smartNotes.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setNotesViewMode('organized')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    notesViewMode === 'organized'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  📚 Organized
                </button>
                <button
                  onClick={() => setNotesViewMode('chronological')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    notesViewMode === 'chronological'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  ⏰ Chronological
                </button>
              </div>
            )}

            {/* Tab Content */}
            <div className="h-96 overflow-y-auto">
              {activeTab === 'transcript' && (
                <div className="space-y-6">
                  {smartNotes.length > 0 ? (
                    <div className="prose prose-invert max-w-none">
                      {notesViewMode === 'organized' ? (
                        /* Organized by type */
                        ['key_point', 'definition', 'example', 'concept'].map(type => {
                          const typeNotes = smartNotes.filter(note => note.type === type);
                          if (typeNotes.length === 0) return null;
                          
                          return (
                            <div key={type} className="mb-8">
                              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/20">
                                <span className="text-2xl">{getNoteTypeEmoji(type)}</span>
                                <h3 className="text-lg font-semibold text-white capitalize">
                                  {type.replace('_', ' ')}s
                                </h3>
                                <span className="text-sm text-gray-400">
                                  {typeNotes.length} {typeNotes.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                              
                              <div className="space-y-4">
                                {typeNotes.map((note, index) => (
                                  <div key={note.id} className="relative">
                                    {/* Confidence indicator */}
                                    {note.confidence && (
                                      <div className="absolute -left-6 top-1">
                                        <span className={`text-xs ${
                                          note.confidence === 'high' ? 'text-green-400' :
                                          note.confidence === 'medium' ? 'text-yellow-400' :
                                          'text-red-400'
                                        }`}>
                                          {note.confidence === 'high' ? '✓' : note.confidence === 'medium' ? '~' : '?'}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Note content */}
                                    <div className="text-gray-200 leading-relaxed">
                                      {note.title && (
                                        <h4 className="text-white font-medium mb-2 text-sm">
                                          {note.title}
                                        </h4>
                                      )}
                                      
                                      {note.concept && (
                                        <div className="text-xs text-blue-400 mb-2">
                                          📚 {note.concept}
                                        </div>
                                      )}
                                      
                                      <div 
                                        className="text-sm"
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                                      />
                                      
                                      {note.subconcepts && note.subconcepts.length > 0 && (
                                        <div className="mt-2">
                                          <div className="text-xs text-gray-400 mb-1">Related topics:</div>
                                          <div className="flex flex-wrap gap-1">
                                            {note.subconcepts.map((subconcept, idx) => (
                                              <span key={idx} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                                {subconcept}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="text-xs text-gray-500 mt-2">
                                        {new Date(note.timestamp).toLocaleTimeString()}
                                      </div>
                                    </div>
                                    
                                    {/* Separator between notes */}
                                    {index < typeNotes.length - 1 && (
                                      <div className="my-4 border-t border-white/10"></div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        /* Chronological view - clean flowing text */
                        <div className="space-y-6">
                          {smartNotes
                            .sort((a, b) => a.timestamp - b.timestamp)
                            .map((note, index) => (
                              <div key={note.id} className="relative">
                                {/* Confidence indicator */}
                                {note.confidence && (
                                  <div className="absolute -left-6 top-1">
                                    <span className={`text-xs ${
                                      note.confidence === 'high' ? 'text-green-400' :
                                      note.confidence === 'medium' ? 'text-yellow-400' :
                                      'text-red-400'
                                    }`}>
                                      {note.confidence === 'high' ? '✓' : note.confidence === 'medium' ? '~' : '?'}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Note content */}
                                <div className="text-gray-200 leading-relaxed">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{getNoteTypeEmoji(note.type)}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(note.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  
                                  <div 
                                    className="text-sm"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                                  />
                                </div>
                                
                                {/* Separator between notes */}
                                {index < smartNotes.length - 1 && (
                                  <div className="my-6 border-t border-white/10"></div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <p className="text-gray-400 italic">
                        Smart notes will appear here...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'flashcards' && (
                <div className="space-y-4">
                  {flashcards.length > 0 ? (
                    flashcards.map(card => (
                      <div key={card.id} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {card.category && (
                              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                                {card.category}
                              </span>
                            )}
                            {card.difficulty && (
                              <span className={`text-xs px-2 py-1 rounded-full border ${getDifficultyColor(card.difficulty)}`}>
                                {card.difficulty}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(card.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-blue-500/10 rounded-lg p-3 border-l-4 border-blue-400">
                            <div className="text-sm text-blue-300 mb-1">🎯 Question</div>
                            <div 
                              className="font-medium text-white"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(card.front) }}
                            />
                          </div>
                          <div className="bg-green-500/10 rounded-lg p-3 border-l-4 border-green-400">
                            <div className="text-sm text-green-300 mb-1">💡 Answer</div>
                            <div 
                              className="text-gray-200 text-sm"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(card.back) }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🃏</div>
                      <p className="text-gray-400 italic">
                        Flashcards will appear here...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'keywords' && (
                <div className="space-y-3">
                  {keywords.length > 0 ? (
                    keywords.map((keyword, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        keyword.importance === 'high' ? 'border-red-400 bg-red-500/10' :
                        keyword.importance === 'medium' ? 'border-yellow-400 bg-yellow-500/10' :
                        'border-blue-400 bg-blue-500/10'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getKeywordTypeEmoji(keyword.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{keyword.term}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                keyword.type === 'concept' ? 'bg-blue-500/20 text-blue-400' :
                                keyword.type === 'person' ? 'bg-green-500/20 text-green-400' :
                                keyword.type === 'place' ? 'bg-purple-500/20 text-purple-400' :
                                keyword.type === 'technical' ? 'bg-orange-500/20 text-orange-400' :
                                keyword.type === 'formula' ? 'bg-red-500/20 text-red-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {keyword.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300">{keyword.description}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔑</div>
                      <p className="text-gray-400 italic">
                        Keywords will appear here...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sections Overview */}
        {sections.length > 0 && (
          <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📚 Lecture Sections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map(section => (
                <div key={section.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="font-medium text-white mb-2">{section.title}</h4>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>Notes: {section.notes.length}</div>
                    <div>Cards: {section.flashcards.length}</div>
                    <div>Duration: {formatTime(Math.floor((Date.now() - section.startTime) / 1000))}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Button */}
        {transcript && (
          <div className="text-center mt-8">
            <button
              onClick={exportNotes}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              📥 Export Notes & Flashcards
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-colors backdrop-blur-sm border border-gray-500/30"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}