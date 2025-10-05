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
  const [aiReconstructionEnabled, setAiReconstructionEnabled] = useState<boolean>(true);
  const [reconstructionFailures, setReconstructionFailures] = useState<number>(0);
  
  // Real-time confidence-aware buffer states
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [polishedTranscript, setPolishedTranscript] = useState<string>('');
  const [showRawTranscript, setShowRawTranscript] = useState<boolean>(false);
  const [lowConfidenceBuffer, setLowConfidenceBuffer] = useState<string>('');
  const [bufferTimeout, setBufferTimeout] = useState<NodeJS.Timeout | null>(null);
  
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
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Topic continuity watchdog
  const topicContextRef = useRef<string[]>([]);
  const lastTopicRef = useRef<string>('');

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
      console.log('Generating smart notes for corrected transcript:', text.substring(0, 100) + '...');
      
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
        console.log('Notes generation result:', result);
        
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
          
          console.log('Adding new notes:', newNotes.length);
          setSmartNotes(prev => {
            const updated = [...prev, ...newNotes];
            console.log('Total notes after adding:', updated.length);
            return updated;
          });
          
          // Add to current section
          if (currentSection) {
            setCurrentSection(prev => prev ? {
              ...prev,
              notes: [...prev.notes, ...newNotes]
            } : null);
          }
          return;
        } else {
          console.log('No notes generated from AI');
        }
      } else {
        console.error('Notes generation failed:', response.status);
      }
    } catch (error) {
      console.error('Error generating smart notes:', error);
    }

    // Fallback: Generate basic notes from any text, even if very short or unclear
    try {
      console.log('Generating fallback notes for text:', text.substring(0, 50) + '...');
      const fallbackNotes = generateFallbackNotes(text);
      console.log('Fallback notes generated:', fallbackNotes.length);
      
      if (fallbackNotes.length > 0) {
        setSmartNotes(prev => {
          const updated = [...prev, ...fallbackNotes];
          console.log('Total notes after fallback:', updated.length);
          return updated;
        });
        
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
      console.log('Generating flashcards for corrected transcript:', text.substring(0, 100) + '...');
      
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
        console.log('Flashcards generation result:', result);
        
        if (result.flashcards && Array.isArray(result.flashcards)) {
          const newFlashcards: Flashcard[] = result.flashcards.map((card: any, index: number) => ({
            id: `card_${Date.now()}_${index}`,
            front: card.front,
            back: card.back,
            timestamp: Date.now(),
            category: currentSection?.title || 'General'
          }));
          
          console.log('Adding new flashcards:', newFlashcards.length);
          setFlashcards(prev => {
            const updated = [...prev, ...newFlashcards];
            console.log('Total flashcards after adding:', updated.length);
            return updated;
          });
          
          // Add to current section
          if (currentSection) {
            setCurrentSection(prev => prev ? {
              ...prev,
              flashcards: [...prev.flashcards, ...newFlashcards]
            } : null);
          }
        }
      } else {
        console.error('Flashcards generation failed:', response.status);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
    }
  };

  // Extract keywords
  const extractKeywords = async (text: string) => {
    try {
      console.log('Extracting keywords for corrected transcript:', text.substring(0, 100) + '...');
      
      const response = await fetch('/api/extract-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          context: currentSection?.title || 'General Lecture'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Keywords extraction result:', result);
        
        if (result.keywords && Array.isArray(result.keywords)) {
          setKeywords(prev => {
            const newKeywords = result.keywords.filter((kw: Keyword) => 
              !prev.some(existing => existing.term === kw.term)
            );
            console.log('Adding new keywords:', newKeywords.length);
            return [...prev, ...newKeywords];
          });
        }
      } else {
        console.error('Keywords extraction failed:', response.status);
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
          console.log(`Raw transcript (${isFinal ? 'FINAL' : 'PARTIAL'}, conf: ${confidence.toFixed(2)}):`, newTranscript);
          console.log(`Buffer before: "${transcriptBufferRef.current}"`);
          
          const now = Date.now();
          lastTranscriptTimeRef.current = now;
          
          // Add to buffer for sentence completion
          transcriptBufferRef.current += ' ' + newTranscript;
          console.log(`Buffer after: "${transcriptBufferRef.current}"`);
          
          // Update live display info
          setPartialTranscript(newTranscript);
          setTranscriptConfidence(confidence);
          setCurrentSpeaker(speaker);
          
          setConnectionStatus('connected');
          
          // Clear any existing timeout
          if (flushTimeoutRef.current) {
            clearTimeout(flushTimeoutRef.current);
          }
          
          // Use confidence-aware buffer system
          handleLowConfidenceText(newTranscript, confidence);
          
          // Check topic continuity for final transcripts
          if (isFinal) {
            const topicFits = await checkTopicContinuity(newTranscript);
            if (!topicFits) {
              console.log('Topic continuity check failed - segment discarded');
              return;
            }
          }
          
          // Confidence-aware triggers for correction
          const needsCorrection = shouldTriggerCorrection(newTranscript, confidence, transcriptBufferRef.current);
          
          // Only add to main transcript when we have complete sentences, enough content, or need correction
          if (isFinal || newTranscript.endsWith('.') || newTranscript.endsWith('!') || newTranscript.endsWith('?') || transcriptBufferRef.current.length > 200 || needsCorrection) {
            // Process the accumulated buffer with AI reconstruction
            const processedText = await processTranscript(transcriptBufferRef.current, confidence);
            console.log(`Processed text: "${processedText}"`);
            
            // Add to both raw and polished transcripts
            setRawTranscript(prev => prev + ' ' + transcriptBufferRef.current);
            if (processedText) {
              setPolishedTranscript(prev => prev + ' ' + processedText);
            }
            
            // Clear buffer for next sentence
            transcriptBufferRef.current = '';
            
            // Process for notes generation
            const now2 = Date.now();
            if (now2 - lastProcessTimeRef.current > 10000) {
              await processTranscriptBuffer();
              lastProcessTimeRef.current = now2;
            }
          } else {
            // Set timeout to flush incomplete sentence after 4 seconds (longer for slow speech)
            flushTimeoutRef.current = setTimeout(() => {
              flushIncompleteSentence();
            }, 4000);
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
    if (transcriptBufferRef.current.length < 200) return; // Higher threshold for better content
    
    const text = transcriptBufferRef.current;
    console.log('Processing transcript buffer for smart features:', text);
    
    // Generate notes if we have meaningful content
    if (text.length > 200) {
      console.log('Generating smart notes...');
      await generateSmartNotes(text);
    }
    
    // Generate flashcards and keywords if we have decent text
    if (text.length > 400) {
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

  // Enhanced transcript processing with better reconstruction
  const processTranscript = async (text: string, confidence: number) => {
    // Skip AI reconstruction if disabled or too many failures
    if (!aiReconstructionEnabled || reconstructionFailures > 5) {
      console.log('AI reconstruction disabled, using original text');
      return text;
    }

    // Use AI reconstruction for any text longer than 10 characters
    if (text.length > 10) {
      console.log('Applying AI reconstruction to improve transcript...');
      try {
        const improvedText = await reconstructTranscript(text);
        console.log(`Original: "${text}"`);
        console.log(`Reconstructed: "${improvedText}"`);
        
        // More lenient similarity check for better reconstruction
        const similarity = calculateTextSimilarity(text, improvedText || '');
        console.log(`Text similarity: ${similarity.toFixed(2)}`);
        
        // Use reconstruction if it's reasonably similar (50% similarity) or if original is very fragmented
        if (similarity > 0.5 || text.split(' ').length < 5) {
          // Reset failure counter on success
          setReconstructionFailures(0);
          return improvedText;
        } else {
          console.log('Reconstruction too different, using original text');
          setReconstructionFailures(prev => prev + 1);
          return text;
        }
      } catch (error) {
        console.log('Reconstruction failed, using original text:', error);
        setReconstructionFailures(prev => prev + 1);
        return text;
      }
    }
    return text;
  };

  // Calculate text similarity to prevent over-reconstruction
  const calculateTextSimilarity = (original: string, reconstructed: string): number => {
    const origWords = original.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const reconWords = reconstructed.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    if (origWords.length === 0 || reconWords.length === 0) return 0;
    
    const commonWords = origWords.filter(word => reconWords.includes(word));
    const similarity = commonWords.length / Math.max(origWords.length, reconWords.length);
    
    return similarity;
  };

  // Enhanced confidence-aware triggers with filler detection
  const shouldTriggerCorrection = (newTranscript: string, confidence: number, buffer: string): boolean => {
    // Low confidence trigger (more sensitive for physics)
    if (confidence < 0.65) {
      console.log('Low confidence trigger:', confidence);
      return true;
    }
    
    // Filler word detection patterns
    const fillerPatterns = [
      /\b(uh|hmm|like|right|okay|you know|alright|so|um)\b/i, // Common fillers
      /\b(right|uh|um|okay|so)\b.*\b(right|uh|um|okay|so)\b/i, // Multiple filler words
      /\b\d+\b.*\b(right|uh|um|okay|so)\b/i, // Numbers followed by filler words
    ];
    
    for (const pattern of fillerPatterns) {
      if (pattern.test(newTranscript) || pattern.test(buffer)) {
        console.log('Filler word trigger:', pattern);
        return true;
      }
    }
    
    // Physics-specific broken patterns
    const physicsBrokenPatterns = [
      /\.\s*[A-Z][a-z]*\s*\./g, // Word. Word. pattern
      /\b\w+\s*\.\s*\w+\s*\.\s*\w+\s*\./g, // Multiple single words with periods
      /\b(equals|times|plus|minus|divided)\b.*\b(something|blank|missing)\b/i, // Incomplete equations
      /\b(F|E|V|P|K|G)\b.*\b(equals|times)\b.*\b(blank|missing|something)\b/i, // Incomplete physics equations
      /\b(this one's fun|oh yeah|right right)\b/i, // Colloquial physics expressions
    ];
    
    for (const pattern of physicsBrokenPatterns) {
      if (pattern.test(newTranscript) || pattern.test(buffer)) {
        console.log('Physics broken pattern trigger:', pattern);
        return true;
      }
    }
    
    // Too many stops in short text
    const stopCount = (newTranscript.match(/\./g) || []).length;
    if (stopCount > 2 && newTranscript.length < 50) {
      console.log('Too many stops trigger:', stopCount);
      return true;
    }
    
    // Physics equation detection and validation
    const equationPattern = /\b[A-Za-z]\s*=\s*.+|\b\d+\s*[A-Za-z]+|\b[A-Za-z]+\s*\^\d+/g;
    const equations = newTranscript.match(equationPattern);
    if (equations && equations.length > 0) {
      // Check if equations look incomplete or malformed
      const incompleteEquations = equations.filter(eq => 
        eq.includes('something') || eq.includes('blank') || eq.includes('missing') ||
        eq.length < 5 || !eq.includes('=')
      );
      
      if (incompleteEquations.length > 0) {
        console.log('Incomplete equation trigger:', incompleteEquations);
        return true;
      }
    }
    
    // Numbers that don't fit physics context
    const numberPattern = /\b\d+\b/g;
    const numbers = newTranscript.match(numberPattern);
    if (numbers && numbers.length > 0) {
      // Check if numbers make sense in physics context
      const contextWords = buffer.toLowerCase().split(/\s+/);
      const hasPhysicsContext = contextWords.some(word => 
        ['force', 'mass', 'energy', 'velocity', 'acceleration', 'momentum', 'equation', 'formula', 'law'].includes(word)
      );
      
      if (!hasPhysicsContext && numbers.some(num => parseInt(num) > 20)) {
        console.log('Suspicious number trigger:', numbers);
        return true;
      }
    }
    
    return false;
  };

  // Topic continuity watchdog
  const checkTopicContinuity = async (newSegment: string): Promise<boolean> => {
    if (topicContextRef.current.length === 0) {
      topicContextRef.current.push(newSegment);
      lastTopicRef.current = newSegment;
      return true;
    }

    // Get last 3 sentences for context
    const context = topicContextRef.current.slice(-3).join(' ');
    
    try {
      const response = await fetch('/api/check-topic-continuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newSegment,
          context,
          lastTopic: lastTopicRef.current
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.fitsContext) {
          topicContextRef.current.push(newSegment);
          lastTopicRef.current = newSegment;
          return true;
        } else {
          console.log('Topic continuity check failed - segment discarded');
          return false;
        }
      }
    } catch (error) {
      console.error('Error checking topic continuity:', error);
    }

    // Fallback: simple keyword matching
    const contextWords = context.toLowerCase().split(/\s+/);
    const segmentWords = newSegment.toLowerCase().split(/\s+/);
    const commonWords = contextWords.filter(word => segmentWords.includes(word));
    const similarity = commonWords.length / Math.max(contextWords.length, segmentWords.length);
    
    if (similarity > 0.3) {
      topicContextRef.current.push(newSegment);
      lastTopicRef.current = newSegment;
      return true;
    }
    
    return false;
  };

  // Real-time confidence-aware buffer
  const handleLowConfidenceText = (text: string, confidence: number) => {
    if (confidence < 0.7) {
      setLowConfidenceBuffer(prev => prev + ' ' + text);
      
      // Clear existing timeout
      if (bufferTimeout) {
        clearTimeout(bufferTimeout);
      }
      
      // Set new timeout to process buffer after 500ms
      const timeout = setTimeout(async () => {
        if (lowConfidenceBuffer.trim().length > 0) {
          console.log('Processing low confidence buffer:', lowConfidenceBuffer);
          const processedText = await processTranscript(lowConfidenceBuffer, 0.5);
          if (processedText) {
            setRawTranscript(prev => prev + ' ' + processedText);
            setPolishedTranscript(prev => prev + ' ' + processedText);
          }
          setLowConfidenceBuffer('');
        }
      }, 500);
      
      setBufferTimeout(timeout);
    } else {
      // High confidence - process immediately
      setRawTranscript(prev => prev + ' ' + text);
      processTranscript(text, confidence).then(processedText => {
        if (processedText) {
          setPolishedTranscript(prev => prev + ' ' + processedText);
        }
      });
    }
  };

  // Flush incomplete sentences after timeout
  const flushIncompleteSentence = async () => {
    if (transcriptBufferRef.current.trim().length > 0) {
      console.log('Flushing incomplete sentence:', transcriptBufferRef.current);
      const processedText = await processTranscript(transcriptBufferRef.current, 0.5);
      console.log(`Flushed text: "${processedText}"`);
      setTranscript(prev => prev + ' ' + processedText);
      transcriptBufferRef.current = '';
    }
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

      // Start recording with much larger chunks for better sentence completion
      const chunkSize = 3000; // 3 second chunks for much better sentence fragments
      mediaRecorder.start(chunkSize);
      setIsRecording(true);
      sessionStartRef.current = Date.now();
      setSessionDuration(0);

      // Start first section
      startNewSection('Introduction');

      // Process audio chunks every 3 seconds
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
    
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
    
    // Flush any remaining incomplete sentence
    flushIncompleteSentence();
    
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

  // Enhanced markdown renderer for clean, readable text with physics equation highlighting
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm font-mono border border-gray-600">$1</code>')
      // Highlight physics equations
      .replace(/([A-Za-z]\s*=\s*[^<\n]+)/g, '<span class="text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-400/30 font-mono text-sm">$1</span>')
      // Highlight Greek letters
      .replace(/([αβγδεζηθικλμνξοπρστυφχψω])/g, '<span class="text-purple-300 font-mono font-bold">$1</span>')
      // Highlight physics constants
      .replace(/\b(c|G|h|k|e|m_e|m_p|N_A)\b/g, '<span class="text-green-300 font-mono font-bold">$1</span>')
      // Highlight physics units
      .replace(/\b(m\/s|kg|N|J|W|V|A|Ω|Hz|Pa|K)\b/g, '<span class="text-yellow-300 font-mono text-sm">$1</span>')
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
      concept: '🧠',
      equation: '⚡',
      law: '⚖️'
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAiReconstructionEnabled(!aiReconstructionEnabled)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    aiReconstructionEnabled 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  AI: {aiReconstructionEnabled ? 'ON' : 'OFF'}
                </button>
                {reconstructionFailures > 0 && (
                  <span className="text-xs text-yellow-400">
                    Failures: {reconstructionFailures}
                  </span>
                )}
              </div>
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
            
            {/* Transcript Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowRawTranscript(false)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  !showRawTranscript
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                🤍 Polished
              </button>
              <button
                onClick={() => setShowRawTranscript(true)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  showRawTranscript
                    ? 'bg-gray-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                🩶 Raw
              </button>
            </div>

            <div className="h-96 overflow-y-auto bg-black/20 rounded-xl p-4 border border-white/10">
              {showRawTranscript ? (
                // Raw transcript (gray)
                <div className="text-gray-400 leading-relaxed">
                  <div className="whitespace-pre-wrap">{rawTranscript || 'Raw transcript will appear here...'}</div>
                  {lowConfidenceBuffer && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="text-yellow-400 text-sm italic">
                        Buffering: {lowConfidenceBuffer}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Polished transcript (white)
                <div className="text-white leading-relaxed">
                  <div className="whitespace-pre-wrap">{polishedTranscript || 'Polished transcript will appear here...'}</div>
                  {partialTranscript && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="text-blue-300 text-sm italic">
                        Processing: {partialTranscript}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Smart Features */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            {/* Debug Info */}
            <div className="text-xs text-gray-400 mb-2">
              Debug: Notes: {smartNotes.length}, Cards: {flashcards.length}, Keywords: {keywords.length}
            </div>
            
            {/* Test Button */}
            <button
              onClick={() => {
                console.log('Testing note generation...');
                generateSmartNotes('This is a test of artificial intelligence and machine learning concepts for debugging purposes.');
              }}
              className="mb-4 px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30"
            >
              Test Note Generation
            </button>

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
                        ['key_point', 'definition', 'example', 'concept', 'equation', 'law'].map(type => {
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