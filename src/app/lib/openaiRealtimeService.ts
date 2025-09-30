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
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private sessionId: string | null = null;
  private audioBuffer: Blob[] = [];
  private lastProcessedTime: number = 0;

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

        // Connect to OpenAI Realtime API
        this.connectWebSocket()
          .then(() => {
            console.log('OpenAI Realtime WebSocket connected');
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
    return new Promise((resolve, reject) => {
      try {
        // OpenAI Realtime API WebSocket URL
        const wsUrl = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;
        
        this.websocket = new WebSocket(wsUrl, [], {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        });

        this.websocket.onopen = () => {
          console.log('OpenAI Realtime WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.sessionId = this.generateSessionId();
          
          // Send initial configuration
          this.sendConfiguration();
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
          
          if (event.code !== 1000 && this.isStreaming) {
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

    const config = {
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
      }
    };

    this.websocket.send(JSON.stringify(config));
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
              
              if (this.onTranscriptCallback) {
                this.onTranscriptCallback({
                  text: this.cleanTranscript(transcript),
                  isFinal: true,
                  confidence: 0.95,
                  timestamp: Date.now()
                });
              }
            }
          }
        }
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

  sendAudioChunk(audioChunk: Blob): void {
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

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('Connection lost and max reconnection attempts reached'));
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
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
    this.onTranscriptCallback = null;
    this.onErrorCallback = null;
    this.audioBuffer = [];
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
