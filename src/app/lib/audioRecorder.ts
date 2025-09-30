// Enhanced Real-time audio recording service for Live Lecture Assistant
// Handles microphone access, audio recording, and streaming with robust error handling

export interface AudioRecorderConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  chunkSize: number; // in milliseconds
  maxChunkSize: number; // maximum chunk size in bytes
}

export interface AudioChunk {
  data: Blob;
  timestamp: number;
  duration: number;
  size: number;
}

export interface AudioRecorderError {
  type: 'permission' | 'format' | 'network' | 'unknown';
  message: string;
  code?: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private config: AudioRecorderConfig;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private onChunkCallback: ((chunk: AudioChunk) => void) | null = null;
  private onErrorCallback: ((error: AudioRecorderError) => void) | null = null;
  private chunks: Blob[] = [];
  private chunkTimer: NodeJS.Timeout | null = null;
  private lastChunkTime: number = 0;
  private totalDuration: number = 0;
  private isInitialized: boolean = false;

  constructor(config: AudioRecorderConfig = {
    sampleRate: 16000, // OpenAI Realtime prefers 16kHz
    channels: 1,
    bitsPerSample: 16,
    chunkSize: 200, // 200ms chunks for minimal latency
    maxChunkSize: 1024 * 1024 // 1MB max chunk size
  }) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing audio recorder...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Request microphone access with optimal constraints
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          latency: 0.01 // Low latency
        }
      });

      console.log('Microphone access granted');
      console.log('Audio stream settings:', {
        sampleRate: this.audioStream.getAudioTracks()[0]?.getSettings().sampleRate,
        channels: this.audioStream.getAudioTracks()[0]?.getSettings().channelCount,
        echoCancellation: this.audioStream.getAudioTracks()[0]?.getSettings().echoCancellation
      });

      // Set up MediaRecorder with optimal settings
      const mimeType = this.getOptimalMimeType();
      if (!mimeType) {
        throw new Error('No supported audio format found');
      }

      console.log('Using MIME type:', mimeType);

      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType,
        audioBitsPerSecond: this.config.sampleRate * this.config.bitsPerSample * this.config.channels
      });

      this.setupMediaRecorderEvents();
      this.isInitialized = true;
      console.log('AudioRecorder initialized successfully');

    } catch (error) {
      console.error('Audio recorder initialization error:', error);
      this.handleError(error as Error);
      throw error;
    }
  }

  private getOptimalMimeType(): string | null {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('Supported MIME type found:', mimeType);
        return mimeType;
      }
    }

    console.warn('No optimal MIME type found, using default');
    return null;
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.handleAudioChunk(event.data);
      }
    };

    this.mediaRecorder.onstart = () => {
      console.log('Audio recording started');
      this.isRecording = true;
      this.isPaused = false;
    };

    this.mediaRecorder.onstop = () => {
      console.log('Audio recording stopped');
      this.isRecording = false;
      this.isPaused = false;
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      this.handleError({
        type: 'format',
        message: 'Audio recording error',
        code: 'MEDIA_RECORDER_ERROR'
      });
    };
  }

  private handleAudioChunk(data: Blob): void {
    if (!this.isRecording || this.isPaused) return;

    // Check chunk size to prevent memory issues
    if (data.size > this.config.maxChunkSize) {
      console.warn('Audio chunk too large, splitting:', data.size);
      this.splitLargeChunk(data);
      return;
    }

    const now = Date.now();
    const duration = now - this.lastChunkTime;
    this.lastChunkTime = now;
    this.totalDuration += duration;

    const chunk: AudioChunk = {
      data,
      timestamp: now,
      duration,
      size: data.size
    };

    console.log('Audio chunk received:', {
      size: data.size,
      duration: duration,
      totalDuration: this.totalDuration,
      type: data.type
    });

    if (this.onChunkCallback) {
      this.onChunkCallback(chunk);
    }
  }

  private splitLargeChunk(data: Blob): void {
    // For very large chunks, we'll process them in smaller pieces
    const chunkSize = Math.floor(data.size / 2);
    const reader = new FileReader();
    
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const firstHalf = new Blob([arrayBuffer.slice(0, chunkSize)], { type: data.type });
      const secondHalf = new Blob([arrayBuffer.slice(chunkSize)], { type: data.type });
      
      this.handleAudioChunk(firstHalf);
      this.handleAudioChunk(secondHalf);
    };
    
    reader.readAsArrayBuffer(data);
  }

  startRecording(onChunk: (chunk: AudioChunk) => void, onError?: (error: AudioRecorderError) => void): void {
    if (!this.isInitialized) {
      throw new Error('AudioRecorder not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('Recording already in progress');
      return;
    }

    this.onChunkCallback = onChunk;
    this.onErrorCallback = onError;
    this.lastChunkTime = Date.now();
    this.totalDuration = 0;

    try {
      // Start recording with small chunks for real-time processing
      this.mediaRecorder?.start(this.config.chunkSize);
      
      // Set up chunk timer as backup
      this.chunkTimer = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
      }, this.config.chunkSize);

      console.log('Audio recording started with', this.config.chunkSize, 'ms chunks');
    } catch (error) {
      console.error('Error starting recording:', error);
      this.handleError(error as Error);
    }
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      console.log('Audio recording paused');
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      console.log('Audio recording resumed');
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.chunkTimer) {
      clearInterval(this.chunkTimer);
      this.chunkTimer = null;
    }

    this.isRecording = false;
    this.isPaused = false;
    console.log('Audio recording stopped');
  }

  private handleError(error: Error): void {
    console.error('AudioRecorder error:', error);
    
    let recorderError: AudioRecorderError = {
      type: 'unknown',
      message: error.message
    };

    // Categorize errors
    if (error.name === 'NotAllowedError') {
      recorderError = {
        type: 'permission',
        message: 'Microphone access denied. Please allow microphone access and try again.',
        code: 'PERMISSION_DENIED'
      };
    } else if (error.name === 'NotFoundError') {
      recorderError = {
        type: 'permission',
        message: 'No microphone found. Please connect a microphone and try again.',
        code: 'NO_MICROPHONE'
      };
    } else if (error.name === 'NotSupportedError') {
      recorderError = {
        type: 'format',
        message: 'Audio format not supported. Please try a different browser.',
        code: 'FORMAT_NOT_SUPPORTED'
      };
    } else if (error.message.includes('network') || error.message.includes('connection')) {
      recorderError = {
        type: 'network',
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    }

    if (this.onErrorCallback) {
      this.onErrorCallback(recorderError);
    }
  }

  // Test microphone access before starting
  async testMicrophone(): Promise<boolean> {
    try {
      console.log('Testing microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      console.log('Microphone test successful');
      return true;
    } catch (error) {
      console.error('Microphone test failed:', error);
      this.handleError(error as Error);
      return false;
    }
  }

  // Get current recording status
  getStatus(): { isRecording: boolean; isPaused: boolean; isInitialized: boolean } {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      isInitialized: this.isInitialized
    };
  }

  // Get audio stream info
  getAudioInfo(): { sampleRate: number; channels: number; mimeType: string } | null {
    if (!this.audioStream) return null;

    const track = this.audioStream.getAudioTracks()[0];
    const settings = track?.getSettings();
    const mimeType = this.mediaRecorder?.mimeType || 'unknown';

    return {
      sampleRate: settings?.sampleRate || this.config.sampleRate,
      channels: settings?.channelCount || this.config.channels,
      mimeType
    };
  }

  // Cleanup resources
  cleanup(): void {
    console.log('Cleaning up AudioRecorder...');
    
    this.stopRecording();
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => {
        track.stop();
        console.log('Audio track stopped');
      });
      this.audioStream = null;
    }

    this.mediaRecorder = null;
    this.isInitialized = false;
    this.isRecording = false;
    this.isPaused = false;
    this.chunks = [];
    
    if (this.chunkTimer) {
      clearInterval(this.chunkTimer);
      this.chunkTimer = null;
    }

    console.log('AudioRecorder cleanup completed');
  }
}