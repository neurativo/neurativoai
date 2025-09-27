// Real-time audio recording service for Live Lecture Assistant
// Handles microphone access, audio recording, and streaming to transcription services

export interface AudioRecorderConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  chunkSize: number; // in milliseconds
}

export interface AudioChunk {
  data: Blob;
  timestamp: number;
  duration: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private config: AudioRecorderConfig;
  private isRecording: boolean = false;
  private onChunkCallback: ((chunk: AudioChunk) => void) | null = null;
  private chunks: Blob[] = [];

  constructor(config: AudioRecorderConfig = {
    sampleRate: 44100,
    channels: 1,
    bitsPerSample: 16,
    chunkSize: 1000 // 1 second chunks
  }) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Request microphone access with more compatible constraints
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Remove specific sample rate and channel constraints for better compatibility
        }
      });

      console.log('Microphone access granted');

      // Create MediaRecorder with appropriate MIME type
      const mimeType = this.getSupportedMimeType();
      console.log('Using MIME type:', mimeType);
      
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType
        // Remove audioBitsPerSecond for better compatibility
      });

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.processChunk(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('Audio recording stopped');
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        throw new Error('MediaRecorder error occurred');
      };

      console.log('AudioRecorder initialized successfully');

    } catch (error) {
      console.error('Failed to initialize audio recorder:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Audio recording not supported in this browser. Please use a modern browser.');
      } else {
        throw new Error(`Microphone error: ${error.message}`);
      }
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // fallback
  }

  startRecording(onChunk: (chunk: AudioChunk) => void): void {
    if (!this.mediaRecorder || this.isRecording) {
      return;
    }

    this.onChunkCallback = onChunk;
    this.chunks = [];
    this.isRecording = true;

    // Start recording with time slices for real-time processing
    this.mediaRecorder.start(this.config.chunkSize);
    console.log('Audio recording started');
  }

  stopRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) {
      return;
    }

    this.isRecording = false;
    this.mediaRecorder.stop();
    this.onChunkCallback = null;
  }

  pauseRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) {
      return;
    }

    this.mediaRecorder.pause();
  }

  resumeRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) {
      return;
    }

    this.mediaRecorder.resume();
  }

  private processChunk(data: Blob): void {
    if (!this.onChunkCallback) return;

    console.log('Audio chunk received:', { size: data.size, type: data.type });
    
    const chunk: AudioChunk = {
      data,
      timestamp: Date.now(),
      duration: this.config.chunkSize
    };

    this.onChunkCallback(chunk);
  }

  cleanup(): void {
    this.stopRecording();
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    this.mediaRecorder = null;
    this.chunks = [];
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }

  getSupportedFormats(): string[] {
    const formats = [];
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      formats.push('audio/webm;codecs=opus');
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      formats.push('audio/webm');
    }
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      formats.push('audio/mp4');
    }
    if (MediaRecorder.isTypeSupported('audio/wav')) {
      formats.push('audio/wav');
    }
    return formats;
  }
}
