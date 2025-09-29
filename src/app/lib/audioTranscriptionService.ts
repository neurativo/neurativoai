// Audio Transcription Service
// Handles real-time audio to text conversion using various APIs

export interface TranscriptionConfig {
  provider: 'openai' | 'google' | 'azure' | 'assemblyai' | 'deepgram';
  apiKey: string;
  language?: string;
  model?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  timestamp?: number;
}

export class AudioTranscriptionService {
  private config: TranscriptionConfig;

  constructor(config: TranscriptionConfig) {
    this.config = config;
  }

  // Main transcription method
  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    switch (this.config.provider) {
      case 'openai':
        return await this.transcribeWithOpenAI(audioBlob);
      case 'google':
        return await this.transcribeWithGoogle(audioBlob);
      case 'azure':
        return await this.transcribeWithAzure(audioBlob);
      case 'assemblyai':
        return await this.transcribeWithAssemblyAI(audioBlob);
      case 'deepgram':
        return await this.transcribeWithDeepgram(audioBlob);
      default:
        throw new Error(`Unsupported transcription provider: ${this.config.provider}`);
    }
  }

  getProvider(): string {
    return this.config.provider;
  }

  // OpenAI Whisper API
  private async transcribeWithOpenAI(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', this.config.model || 'whisper-1');
      formData.append('language', this.config.language || 'en');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.text,
        confidence: 0.9, // OpenAI doesn't provide confidence scores
        language: this.config.language || 'en'
      };
    } catch (error) {
      console.error('OpenAI transcription error:', error);
      throw error;
    }
  }

  // Google Speech-to-Text API
  private async transcribeWithGoogle(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);
      
      const requestBody = {
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: this.config.language || 'en-US',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true
        },
        audio: {
          content: base64Audio
        }
      };

      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.results?.[0]?.alternatives?.[0];
      
      if (!result) {
        throw new Error('No transcription result from Google API');
      }

      return {
        text: result.transcript,
        confidence: result.confidence || 0.8,
        language: this.config.language || 'en-US'
      };
    } catch (error) {
      console.error('Google transcription error:', error);
      throw error;
    }
  }

  // Azure Cognitive Services Speech API
  private async transcribeWithAzure(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      // Azure requires specific audio format and authentication
      const accessToken = await this.getAzureAccessToken();
      
      const response = await fetch(
        `https://${this.config.apiKey}.cognitiveservices.azure.com/stt/speech/recognition/conversation/cognitiveservices/v1?language=${this.config.language || 'en-US'}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'audio/wav',
            'Accept': 'application/json'
          },
          body: audioBlob
        }
      );

      if (!response.ok) {
        throw new Error(`Azure API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.DisplayText || data.NBest?.[0]?.Display || '',
        confidence: data.NBest?.[0]?.Confidence || 0.8,
        language: this.config.language || 'en-US'
      };
    } catch (error) {
      console.error('Azure transcription error:', error);
      throw error;
    }
  }

  // AssemblyAI API (Real-time streaming)
  private async transcribeWithAssemblyAI(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log('Starting AssemblyAI streaming transcription...', { blobSize: audioBlob.size, type: audioBlob.type });
      
      // For now, fall back to batch processing for individual chunks
      // Real-time streaming will be implemented in the StreamingTranscriptionService
      return await this.transcribeWithAssemblyAIBatch(audioBlob);
      
    } catch (error) {
      console.error('AssemblyAI transcription error:', error);
      throw error;
    }
  }

  // AssemblyAI Batch API (fallback for individual chunks)
  private async transcribeWithAssemblyAIBatch(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log('Using AssemblyAI batch API for chunk...', { blobSize: audioBlob.size, type: audioBlob.type });
      
      // Step 1: Upload audio file to AssemblyAI
      const uploadFormData = new FormData();
      uploadFormData.append('file', audioBlob, 'audio.webm');
      
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': this.config.apiKey,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`AssemblyAI upload failed: ${errorData.error || uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.upload_url;
      console.log('Audio uploaded to AssemblyAI:', audioUrl);

      // Step 2: Start transcription
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_detection: true,
          punctuate: true,
          format_text: true,
        }),
      });

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        throw new Error(`AssemblyAI transcription failed: ${errorData.error || transcriptResponse.statusText}`);
      }

      const transcriptData = await transcriptResponse.json();
      const transcriptId = transcriptData.id;
      console.log('Transcription started with ID:', transcriptId);

      // Step 3: Poll for completion (with timeout)
      const maxAttempts = 10; // 10 seconds max for faster processing
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms for faster response
        
        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            'Authorization': this.config.apiKey,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check transcription status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        console.log('Transcription status:', statusData.status);

        if (statusData.status === 'completed') {
          console.log('AssemblyAI transcription completed:', statusData);
          return {
            text: statusData.text || '',
            confidence: statusData.confidence || 0.8,
            language: statusData.language_code || 'en',
            timestamp: Date.now()
          };
        } else if (statusData.status === 'error') {
          throw new Error(`Transcription failed: ${statusData.error}`);
        }

        attempts++;
      }

      throw new Error('Transcription timeout - took too long to complete');
      
    } catch (error) {
      console.error('AssemblyAI batch transcription error:', error);
      throw error;
    }
  }

  // Deepgram API (Real-time streaming)
  private async transcribeWithDeepgram(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log('Starting Deepgram transcription...', { blobSize: audioBlob.size, type: audioBlob.type });
      
      // Convert blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Call Deepgram API
      const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.apiKey}`,
          'Content-Type': 'audio/webm'
        },
        body: arrayBuffer
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Deepgram API error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0.8;

      console.log('Deepgram transcription completed:', { transcript, confidence });

      return {
        text: transcript,
        confidence: confidence,
        language: 'en',
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Deepgram transcription error:', error);
      throw error;
    }
  }

  // Helper methods
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:audio/webm;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async getAzureAccessToken(): Promise<string> {
    // Azure requires OAuth token for authentication
    const response = await fetch('https://api.cognitive.microsoft.com/sts/v1.0/issueToken', {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.config.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Azure token error: ${response.status}`);
    }

    return await response.text();
  }
}

// Factory function for creating transcription service
export function createTranscriptionService(provider: 'openai' | 'google' | 'azure' | 'assemblyai' | 'deepgram'): AudioTranscriptionService {
  // For client-side usage, we don't need the API key here since we use the /api/transcribe route
  // The API key validation happens on the server-side in the API route
  const apiKey = 'client-side-placeholder'; // This won't be used for client-side calls
  
  console.log(`Creating transcription service for ${provider} (client-side)`);
  
  return new AudioTranscriptionService({
    provider,
    apiKey,
    language: 'en-US',
    model: provider === 'openai' ? 'whisper-1' : undefined
  });
}

// Server-side factory function for API routes
export function createServerTranscriptionService(provider: 'openai' | 'google' | 'azure' | 'assemblyai' | 'deepgram'): AudioTranscriptionService {
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || '';
  
  console.log(`Creating transcription service for ${provider} (server-side)`, { 
    hasApiKey: !!apiKey, 
    keyLength: apiKey.length 
  });
  
  if (!apiKey) {
    throw new Error(`API key not found for ${provider}. Please check your environment variables.`);
  }
  
  return new AudioTranscriptionService({
    provider,
    apiKey,
    language: 'en-US',
    model: provider === 'openai' ? 'whisper-1' : undefined
  });
}

// Real-time streaming transcription for continuous audio using AssemblyAI WebSocket
export class StreamingTranscriptionService {
  private apiKey: string;
  private websocket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private isRecording: boolean = false;
  private isConnected: boolean = false;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private sessionId: string | null = null;
  private audioBuffer: Blob[] = [];
  private lastChunkTime: number = 0;
  private sendTimer: NodeJS.Timeout | null = null;
  private totalAudioDuration: number = 0; // Track total audio duration in ms

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async startStreaming(
    onTranscript: (transcript: string) => void,
    onError: ((error: Error) => void) | null = null
  ): Promise<void> {
    try {
      console.log('Starting AssemblyAI streaming transcription...');
      this.onTranscriptCallback = onTranscript;
      this.onErrorCallback = onError;

      // Connect to AssemblyAI streaming WebSocket
      await this.connectWebSocket();

      // Get microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // AssemblyAI requires 16kHz
        }
      });

      // Set up MediaRecorder for continuous recording
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.audioStream, { 
        mimeType,
        audioBitsPerSecond: 16000 // 16kHz sample rate
      });

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.websocket && this.isConnected) {
          // Add chunk to buffer
          this.audioBuffer.push(event.data);
          
          // Estimate audio duration based on sample rate and data size
          // For 16kHz, 16-bit audio: 1 second = 32,000 bytes
          // So 1ms = 32 bytes
          const estimatedDuration = Math.max(500, (event.data.size / 32) * 1000); // At least 500ms
          this.totalAudioDuration += estimatedDuration;
          
          console.log('Audio chunk received:', {
            size: event.data.size,
            estimatedDuration: Math.round(estimatedDuration),
            totalDuration: Math.round(this.totalAudioDuration),
            bufferChunks: this.audioBuffer.length
          });
          
          // Clear existing timer
          if (this.sendTimer) {
            clearTimeout(this.sendTimer);
          }
          
          // Only send if we have accumulated at least 1000ms of audio
          if (this.totalAudioDuration >= 1000) {
            this.sendBufferedAudio();
          } else {
            // Set fallback timer to send after 2 seconds regardless
            this.sendTimer = setTimeout(() => {
              if (this.audioBuffer.length > 0) {
                this.sendBufferedAudio();
              }
            }, 2000);
          }
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('Streaming transcription stopped');
        
        // Clear timer
        if (this.sendTimer) {
          clearTimeout(this.sendTimer);
          this.sendTimer = null;
        }
        
        // Send any remaining buffered audio
        if (this.audioBuffer.length > 0 && this.websocket && this.isConnected) {
          try {
            const combinedBlob = new Blob(this.audioBuffer, { type: 'audio/webm' });
            const arrayBuffer = await combinedBlob.arrayBuffer();
            if (arrayBuffer.byteLength > 0) {
              this.websocket.send(arrayBuffer);
              console.log('Final audio chunk sent:', arrayBuffer.byteLength, 'bytes');
            }
          } catch (error) {
            console.error('Error sending final audio chunk:', error);
          }
        }
        
        this.disconnectWebSocket();
      };

      // Initialize timing and duration tracking
      this.lastChunkTime = Date.now();
      this.audioBuffer = [];
      this.totalAudioDuration = 0;
      
      // Start recording with chunks that meet AssemblyAI requirements (50-1000ms)
      this.mediaRecorder.start(500); // 500ms chunks - within AssemblyAI's 50-1000ms range
      this.isRecording = true;

      console.log('AssemblyAI streaming transcription started');
    } catch (error) {
      console.error('Failed to start streaming transcription:', error);
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // AssemblyAI streaming WebSocket v3 endpoint with basic settings
        // Advanced configuration will be sent as messages after connection
        const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&encoding=pcm_s16le&token=${this.apiKey}`;
        console.log('Connecting to AssemblyAI v3 WebSocket:', wsUrl.replace(this.apiKey, '***'));
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = (event) => {
          console.log('WebSocket connected to AssemblyAI v3');
          this.isConnected = true;
          
          // Send configuration messages after connection
          const configs = [
            {
              type: 'UpdateConfiguration',
              keyterms_prompt: [
                'lecture', 'professor', 'student', 'university', 'course', 'study', 'exam', 'assignment',
                'mathematics', 'physics', 'chemistry', 'biology', 'history', 'literature', 'research',
                'analysis', 'theory', 'concept', 'formula', 'equation', 'definition', 'example',
                'problem', 'solution', 'chapter', 'section', 'topic', 'subject', 'class', 'lesson'
              ]
            },
            {
              type: 'UpdateConfiguration',
              format_turns: true,
              end_of_turn_confidence_threshold: 0.3,
              min_end_of_turn_silence_when_confident: 600,
              max_turn_silence: 2000
            }
          ];
          
          configs.forEach(config => {
            this.websocket!.send(JSON.stringify(config));
          });
          
          console.log('Configuration messages sent');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('AssemblyAI WebSocket v3 message:', data);

            if (data.type === 'Begin') {
              this.sessionId = data.id;
              console.log('AssemblyAI v3 session started:', this.sessionId);
            } else if (data.type === 'Turn') {
              if (data.transcript && this.onTranscriptCallback) {
                console.log('Turn transcript:', data.transcript);
                console.log('Turn details:', { 
                  end_of_turn: data.end_of_turn, 
                  confidence: data.end_of_turn_confidence,
                  turn_order: data.turn_order 
                });
                this.onTranscriptCallback(data.transcript);
              }
            } else if (data.type === 'Termination') {
              console.log('AssemblyAI v3 session terminated');
              this.isConnected = false;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('WebSocket connection failed'));
          }
          reject(new Error('WebSocket connection failed'));
        };

        this.websocket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
        };

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        reject(error);
      }
    });
  }

  private disconnectWebSocket(): void {
    if (this.websocket) {
      // Send termination message for v3 API
      if (this.isConnected) {
        this.websocket.send(JSON.stringify({ type: 'Terminate' }));
      }
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
  }

  async stopStreaming(): Promise<void> {
    console.log('Stopping AssemblyAI streaming transcription...');
    
    // Clear timer
    if (this.sendTimer) {
      clearTimeout(this.sendTimer);
      this.sendTimer = null;
    }
    
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    this.disconnectWebSocket();
    console.log('AssemblyAI streaming transcription stopped');
  }

  private async sendBufferedAudio(): Promise<void> {
    if (this.audioBuffer.length === 0 || !this.websocket || !this.isConnected) {
      return;
    }

    try {
      // Combine buffered chunks
      const combinedBlob = new Blob(this.audioBuffer, { type: 'audio/webm' });
      const arrayBuffer = await combinedBlob.arrayBuffer();
      
      if (arrayBuffer.byteLength > 0) {
        this.websocket.send(arrayBuffer);
        console.log('Audio chunk sent to AssemblyAI v3:', {
          bytes: arrayBuffer.byteLength,
          estimatedDuration: Math.round(this.totalAudioDuration),
          chunks: this.audioBuffer.length
        });
        
        // Clear buffer and reset duration
        this.audioBuffer = [];
        this.totalAudioDuration = 0;
      }
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
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
}
