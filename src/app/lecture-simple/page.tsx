'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleLiveLecturePage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Test microphone access
  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone test failed:', error);
      return false;
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

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      streamRef.current = stream;

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudioChunks();
      };

      // Start recording
      mediaRecorder.start(2000); // Record in 2-second chunks
      setIsRecording(true);

      // Process audio chunks every 2 seconds
      intervalRef.current = setInterval(async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start(2000);
        }
      }, 2000);

      console.log('Recording started');
      setIsLoading(false);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to start recording');
      setIsLoading(false);
    }
  };

  // Process audio chunks
  const processAudioChunks = async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      // Combine audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];

      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send to Deepgram API
      const response = await fetch('/api/transcribe-deepgram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'transcribe',
          audioData: base64Audio
        })
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      
      if (result.success && result.transcript) {
        const newTranscript = result.transcript.trim();
        if (newTranscript) {
          console.log('New transcript:', newTranscript);
          setTranscript(prev => prev + ' ' + newTranscript);
          
          // Generate simple notes
          generateNotes(newTranscript);
        }
      }

    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  // Generate simple notes
  const generateNotes = async (newText: string) => {
    try {
      // Simple note generation - extract key points
      const sentences = newText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      if (sentences.length > 0) {
        const keySentence = sentences[sentences.length - 1].trim();
        if (keySentence && !notes.includes(keySentence)) {
          setNotes(prev => [...prev, `• ${keySentence}`]);
        }
      }
    } catch (error) {
      console.error('Error generating notes:', error);
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
    console.log('Recording stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Live Lecture Assistant
          </h1>
          <p className="text-lg text-gray-600">
            Real-time transcription and note generation
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isLoading}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Starting...' : 'Start Lecture'}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
            >
              Stop Lecture
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Status */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            isRecording 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            {isRecording ? 'Recording...' : 'Stopped'}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transcript */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Live Transcript
            </h2>
            <div className="h-96 overflow-y-auto bg-gray-50 p-4 rounded border">
              {transcript ? (
                <p className="text-gray-700 leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-gray-500 italic">Transcript will appear here...</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Live Notes
            </h2>
            <div className="h-96 overflow-y-auto bg-gray-50 p-4 rounded border">
              {notes.length > 0 ? (
                <ul className="space-y-2">
                  {notes.map((note, index) => (
                    <li key={index} className="text-gray-700">
                      {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Notes will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
