'use client';

import { useState, useRef } from 'react';

export default function DebugAudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [transcript, setTranscript] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const testMicrophone = async () => {
    try {
      addLog('Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      addLog('Microphone access granted');
      addLog(`Audio tracks: ${stream.getAudioTracks().length}`);
      addLog(`Audio track settings: ${JSON.stringify(stream.getAudioTracks()[0]?.getSettings())}`);
      
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      addLog(`Microphone test failed: ${error}`);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      addLog('Starting recording...');
      
      const micWorking = await testMicrophone();
      if (!micWorking) {
        throw new Error('Microphone access denied');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      streamRef.current = stream;
      setAudioChunks([]);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          addLog(`Audio chunk received: ${event.data.size} bytes`);
          setAudioChunks(prev => [...prev, event.data]);
        } else {
          addLog('Empty audio chunk received');
        }
      };

      mediaRecorder.onstop = async () => {
        addLog('Recording stopped, processing audio...');
        await processAudio();
      };

      const chunkSize = 250;
      mediaRecorder.start(chunkSize);
      setIsRecording(true);
      addLog(`Recording started with ${chunkSize}ms chunks`);

    } catch (error) {
      addLog(`Recording error: ${error}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addLog('Recording stopped');
    }
  };

  const processAudio = async () => {
    if (audioChunks.length === 0) {
      addLog('No audio chunks to process');
      return;
    }

    try {
      addLog(`Processing ${audioChunks.length} audio chunks`);
      
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      addLog(`Audio blob size: ${audioBlob.size} bytes`);

      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      addLog(`Base64 audio length: ${base64Audio.length}`);

      addLog('Sending to Deepgram API...');
      const response = await fetch('/api/transcribe-deepgram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transcribe',
          audioData: base64Audio
        })
      });

      addLog(`Deepgram response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Deepgram API error: ${errorText}`);
        return;
      }

      const result = await response.json();
      addLog(`Deepgram result: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success && result.transcript) {
        setTranscript(result.transcript);
        addLog(`Transcript received: ${result.transcript}`);
      } else {
        addLog('No transcript received');
      }

    } catch (error) {
      addLog(`Audio processing error: ${error}`);
    }
  };

  const testDeepgramAPI = async () => {
    try {
      addLog('Testing Deepgram API...');
      const response = await fetch('/api/test-deepgram');
      const result = await response.json();
      addLog(`Deepgram API test result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      addLog(`Deepgram API test error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Audio Debug Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={testDeepgramAPI}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                Test Deepgram API
              </button>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full px-4 py-2 rounded-lg ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              
              <button
                onClick={processAudio}
                disabled={audioChunks.length === 0}
                className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white rounded-lg"
              >
                Process Audio ({audioChunks.length} chunks)
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Status</h3>
              <div className="text-sm text-gray-300">
                <div>Recording: {isRecording ? 'Yes' : 'No'}</div>
                <div>Audio Chunks: {audioChunks.length}</div>
                <div>Transcript: {transcript ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Transcript</h2>
            <div className="bg-black/20 rounded-xl p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              {transcript ? (
                <p className="text-white">{transcript}</p>
              ) : (
                <p className="text-gray-400 italic">No transcript yet...</p>
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Debug Logs</h2>
          <div className="bg-black/20 rounded-xl p-4 max-h-[300px] overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm text-gray-300 font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
