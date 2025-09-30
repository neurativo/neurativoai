// OpenAI GPT-4o-mini-realtime-preview transcription service
// Real-time audio processing with WebSocket streaming

export interface OpenAIRealtimeConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface RealtimeTranscript {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp: number;
}

export class OpenAIRealtimeService {
  private websocket: WebSocket | null = null;
  private isConnected: boolean = false;
  private isStreaming: boolean = false;
  private config: OpenAIRealtimeConfig;
  private onTranscriptCallback: ((transcript: RealtimeTranscript) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private sessionId: string | null = null;
  private audioBuffer: Blob[] = [];
  private lastProcessedTime: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sessionStartTime: number = 0;
  private maxSessionDuration: number = 30 * 60 * 1000; // 30 minutes
  private transcriptCache: RealtimeTranscript[] = [];
  private lastCacheTime: number = 0;
  private cacheInterval: number = 2 * 60 * 1000; // Cache every 2 minutes
  private isPaused: boolean = false;

  constructor(config: OpenAIRealtimeConfig) {
    this.config = {
      model: 'gpt-4o-mini-realtime-preview-2024-12-17',
      temperature: 0.1,
      maxTokens: 4096,
      ...config
    };
  }

  async startStreaming(
    onTranscript: (transcript: RealtimeTranscript) => void,
    onError: ((error: Error) => void) | null = null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Starting OpenAI Realtime streaming...');
        this.onTranscriptCallback = onTranscript;
        this.onErrorCallback = onError;
        this.isStreaming = true;

        // Connect to OpenAI Realtime API (now includes ephemeral key generation)
        this.connectWebSocket()
          .then(() => {
            console.log('OpenAI Realtime streaming started');
            resolve();
          })
          .catch((error) => {
            console.error('Failed to connect to OpenAI Realtime:', error);
            reject(error);
          });

      } catch (error) {
        console.error('Error starting OpenAI Realtime streaming:', error);
        reject(error);
      }
    });
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // First, get an ephemeral key from our backend
        console.log('Requesting ephemeral key for OpenAI Realtime API...');
        const keyResponse = await fetch('/api/realtime-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.config.model
          })
        });

        if (!keyResponse.ok) {
          const errorData = await keyResponse.json();
          throw new Error(`Failed to get ephemeral key: ${errorData.error || 'Unknown error'}`);
        }

        const { ephemeralKey } = await keyResponse.json();
        console.log('Ephemeral key received, connecting to OpenAI Realtime API...');

        // Use the ephemeral key in the WebSocket URL
        const wsUrl = `wss://api.openai.com/v1/realtime?model=${this.config.model}&authorization=Bearer+${encodeURIComponent(ephemeralKey)}`;
        console.log('Connecting to OpenAI Realtime API:', wsUrl);
        
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('OpenAI Realtime WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.sessionId = this.generateSessionId();
          this.sessionStartTime = Date.now();
          
          // Send initial configuration
          this.sendConfiguration();
          
          // Start heartbeat to keep connection alive
          this.startHeartbeat();
          
          // Start session management
          this.startSessionManagement();
          
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing OpenAI Realtime message:', error);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('OpenAI Realtime WebSocket error:', error);
          this.isConnected = false;
          this.handleReconnection();
        };

        this.websocket.onclose = (event) => {
          console.log('OpenAI Realtime WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          
          // Handle different close codes
          if (event.code === 1000) {
            console.log('WebSocket closed normally');
          } else if (event.code === 1001) {
            console.log('WebSocket closed due to page navigation');
          } else if (event.code === 1006) {
            console.log('WebSocket closed abnormally, attempting reconnection');
            this.handleReconnection();
          } else if (event.code === 1011) {
            console.log('WebSocket closed due to server error, attempting reconnection');
            this.handleReconnection();
          } else if (event.code === 1012) {
            console.log('WebSocket closed due to service restart, attempting reconnection');
            this.handleReconnection();
          } else if (this.isStreaming) {
            this.handleReconnection();
          }
        };

      } catch (error) {
        console.error('Error connecting to OpenAI Realtime:', error);
        reject(error);
      }
    });
  }

  private sendConfiguration(): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    // First, send authentication
    const authMessage = {
      type: 'session.update',
      session: {
        modalities: ['audio'],
        instructions: `You are a real-time transcription assistant for live lectures. Your job is to:

1. Transcribe speech accurately in real-time
2. Remove filler words like "um", "ah", "like", "you know"
3. Add proper punctuation and sentence casing
4. Ignore background noise and irrelevant chatter
5. Focus on educational content and academic terminology
6. Output clean, readable text suitable for note-taking

Guidelines:
- Be concise but accurate
- Use proper academic formatting
- Maintain context across long lectures
- Handle technical terms and formulas correctly
- Provide clean, professional transcriptions`,
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: [],
        tool_choice: 'auto',
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxTokens
      },
      api_key: this.config.apiKey
    };

    this.websocket.send(JSON.stringify(authMessage));
    console.log('OpenAI Realtime configuration sent');
  }

  private handleMessage(message: any): void {
    console.log('OpenAI Realtime message:', message);

    switch (message.type) {
      case 'session.created':
        console.log('OpenAI Realtime session created:', message.session.id);
        this.sessionId = message.session.id;
        break;

      case 'session.updated':
        console.log('OpenAI Realtime session updated');
        break;

      case 'conversation.item.input_audio_buffer.committed':
        console.log('Audio buffer committed to OpenAI Realtime');
        break;

      case 'conversation.item.input_audio_buffer.speech_started':
        console.log('Speech started in OpenAI Realtime');
        break;

      case 'conversation.item.input_audio_buffer.speech_stopped':
        console.log('Speech stopped in OpenAI Realtime');
        break;

      case 'conversation.item.created':
        if (message.item?.type === 'message' && message.item?.role === 'assistant') {
          const content = message.item.content?.[0];
          if (content?.type === 'input_audio_transcription') {
            const transcript = content.transcript;
            if (transcript && transcript.trim()) {
              console.log('OpenAI Realtime transcript:', transcript);
              
              const cleanedTranscript = this.cleanTranscript(transcript);
              const finalTranscript = this.postProcessTranscript(cleanedTranscript);
              
              const transcriptData: RealtimeTranscript = {
                text: finalTranscript,
                isFinal: true,
                confidence: 0.95,
                timestamp: Date.now()
              };
              
              // Cache the transcript
              this.transcriptCache.push(transcriptData);
              
              // Auto-save cache periodically
              if (Date.now() - this.lastCacheTime > this.cacheInterval) {
                this.saveTranscriptCache();
                this.lastCacheTime = Date.now();
              }
              
              if (this.onTranscriptCallback) {
                this.onTranscriptCallback(transcriptData);
              }
            }
          }
        }
        break;

      case 'conversation.item.input_audio_buffer.speech_started':
        console.log('Speech started in OpenAI Realtime');
        break;

      case 'conversation.item.input_audio_buffer.speech_stopped':
        console.log('Speech stopped in OpenAI Realtime');
        break;

      case 'conversation.item.input_audio_buffer.committed':
        console.log('Audio buffer committed in OpenAI Realtime');
        break;

      case 'error':
        console.error('OpenAI Realtime error:', message.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error(message.error.message || 'OpenAI Realtime error'));
        }
        break;

      default:
        console.log('Unhandled OpenAI Realtime message type:', message.type);
    }
  }

  private cleanTranscript(text: string): string {
    // Remove filler words and clean up the transcript
    let cleaned = text
      .replace(/\b(um|uh|ah|like|you know|so|well|actually|basically|literally)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Add proper sentence casing
    cleaned = this.addSentenceCasing(cleaned);

    return cleaned;
  }

  private addSentenceCasing(text: string): string {
    // Split into sentences and capitalize first letter of each
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences
      .map(sentence => {
        if (sentence.trim()) {
          return sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase();
        }
        return sentence;
      })
      .join(' ');
  }

  private postProcessTranscript(text: string): string {
    // Additional post-processing for better quality
    let processed = text;
    
    // Fix common academic term misspellings
    const academicTerms: { [key: string]: string } = {
      'mitokondria': 'mitochondria',
      'photosintesis': 'photosynthesis',
      'photosintetic': 'photosynthetic',
      'mitokondrial': 'mitochondrial',
      'ribosom': 'ribosome',
      'ribosomal': 'ribosomal',
      'enzim': 'enzyme',
      'enzimatic': 'enzymatic',
      'kromosom': 'chromosome',
      'kromosomal': 'chromosomal',
      'nukleus': 'nucleus',
      'nuklear': 'nuclear',
      'sitoplasma': 'cytoplasm',
      'sitoplasmic': 'cytoplasmic',
      'membran': 'membrane',
      'membranous': 'membranous',
      'organel': 'organelle',
      'organellar': 'organellar',
      'vakuol': 'vacuole',
      'vakuolar': 'vacuolar',
      'klorofil': 'chlorophyll',
      'klorofilous': 'chlorophyllous',
      'kloroplast': 'chloroplast',
      'kloroplastic': 'chloroplastic'
    };
    
    // Replace misspelled terms
    Object.entries(academicTerms).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      processed = processed.replace(regex, correct);
    });
    
    // Fix common punctuation issues
    processed = processed
      .replace(/\s+([.!?])/g, '$1') // Remove spaces before punctuation
      .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Add space after punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return processed;
  }

  // Download transcript functionality
  downloadTranscript(): void {
    if (this.transcriptCache.length === 0) {
      console.log('No transcript data to download');
      return;
    }
    
    const fullTranscript = this.transcriptCache
      .map(t => t.text)
      .join(' ')
      .trim();
    
    if (!fullTranscript) {
      console.log('No transcript content to download');
      return;
    }
    
    const blob = new Blob([fullTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Transcript downloaded');
  }

  // Get current transcript cache
  getTranscriptCache(): RealtimeTranscript[] {
    return [...this.transcriptCache];
  }

  // Clear transcript cache
  clearTranscriptCache(): void {
    this.transcriptCache = [];
    console.log('Transcript cache cleared');
  }


  sendAudioChunk(audioChunk: Blob): void {
    if (this.isPaused) {
      console.log('Audio processing paused, skipping chunk');
      return;
    }

    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.log('OpenAI Realtime WebSocket not connected, buffering audio chunk');
      this.audioBuffer.push(audioChunk);
      return;
    }

    // Convert blob to base64 for OpenAI Realtime API
    this.blobToBase64(audioChunk).then(base64Audio => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'input_audio_buffer.append',
          audio: base64Audio
        };
        
        this.websocket.send(JSON.stringify(message));
        console.log(`Audio chunk sent to OpenAI Realtime: ${audioChunk.size} bytes`);
      }
    }).catch(error => {
      console.error('Error sending audio chunk to OpenAI Realtime:', error);
    });
  }


  pauseStreaming(): void {
    this.isPaused = true;
    console.log('OpenAI Realtime streaming paused');
  }

  resumeStreaming(): void {
    this.isPaused = false;
    console.log('OpenAI Realtime streaming resumed');
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data:audio/webm;base64, prefix
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private startHeartbeat(): void {
    // Send heartbeat every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        try {
          this.websocket.send(JSON.stringify({ type: 'ping' }));
          console.log('Heartbeat sent');
        } catch (error) {
          console.error('Heartbeat failed:', error);
          this.handleReconnection();
        }
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private startSessionManagement(): void {
    // Check session duration every minute
    setInterval(() => {
      if (this.isStreaming && this.sessionStartTime > 0) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        
        if (sessionDuration > this.maxSessionDuration) {
          console.log('Session duration limit reached, creating new session');
          this.createNewSession();
        }
      }
    }, 60000); // Check every minute
  }

  private async createNewSession(): Promise<void> {
    try {
      console.log('Creating new session...');
      
      // Save current transcript cache
      this.saveTranscriptCache();
      
      // Close current session
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'session.close' }));
        this.websocket.close(1000, 'Creating new session');
      }
      
      // Wait a moment before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new connection
      await this.connectWebSocket();
      
      console.log('New session created successfully');
    } catch (error) {
      console.error('Error creating new session:', error);
      this.handleReconnection();
    }
  }

  private saveTranscriptCache(): void {
    if (this.transcriptCache.length > 0) {
      console.log('Saving transcript cache:', this.transcriptCache.length, 'transcripts');
      // In a real implementation, you would save this to a database
      // For now, we'll just log it
      localStorage.setItem('transcript_cache', JSON.stringify(this.transcriptCache));
      this.transcriptCache = [];
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('Connection lost and max reconnection attempts reached. Please refresh the page.'));
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    // Show reconnecting message to user
    if (this.onErrorCallback) {
      this.onErrorCallback(new Error(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`));
    }
    
    setTimeout(() => {
      if (this.isStreaming) {
        this.connectWebSocket().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  stopStreaming(): void {
    console.log('Stopping OpenAI Realtime streaming...');
    
    this.isStreaming = false;
    this.isPaused = false;
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Save final transcript cache
    this.saveTranscriptCache();
    
    if (this.websocket) {
      if (this.websocket.readyState === WebSocket.OPEN) {
        // Send session close message
        this.websocket.send(JSON.stringify({ type: 'session.close' }));
        this.websocket.close(1000, 'Streaming stopped by user');
      }
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.sessionId = null;
    this.sessionStartTime = 0;
    this.onTranscriptCallback = null;
    this.onErrorCallback = null;
    this.audioBuffer = [];
    this.reconnectAttempts = 0;
    
    console.log('OpenAI Realtime streaming stopped and cleaned up');
  }

  isStreamingActive(): boolean {
    return this.isStreaming && this.isConnected;
  }

  getProvider(): string {
    return 'openai-realtime';
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}

// Factory function to create OpenAI Realtime service
export function createOpenAIRealtimeService(apiKey: string): OpenAIRealtimeService {
  return new OpenAIRealtimeService({ apiKey });
}
