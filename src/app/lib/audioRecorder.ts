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
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create MediaRecorder with appropriate MIME type
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType,
        audioBitsPerSecond: this.config.sampleRate * this.config.channels * this.config.bitsPerSample
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
      };

    } catch (error) {
      console.error('Failed to initialize audio recorder:', error);
      throw new Error('Microphone access denied or not available');
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
