export interface RealtimeTranscript {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export interface WebSocketProxyConfig {
  proxyUrl: string;
  clientId?: string;
}

export class WebSocketProxyService {
  private websocket: WebSocket | null = null;
  private isConnected: boolean = false;
  private isStreaming: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private onTranscriptCallback: ((transcript: RealtimeTranscript) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private config: WebSocketProxyConfig;

  constructor(config: WebSocketProxyConfig) {
    this.config = {
      proxyUrl: '/api/realtime-proxy',
      ...config
    };
  }

  async startStreaming(
    onTranscript: (transcript: RealtimeTranscript) => void,
    onError: ((error: Error) => void) | null = null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Starting WebSocket proxy streaming...');
        this.onTranscriptCallback = onTranscript;
        this.onErrorCallback = onError;
        this.isStreaming = true;

        this.connectToProxy()
          .then(() => {
            console.log('WebSocket proxy streaming started');
            resolve();
          })
          .catch((error) => {
            console.error('Failed to connect to WebSocket proxy:', error);
            reject(error);
          });
      } catch (error) {
        console.error('Error starting WebSocket proxy streaming:', error);
        reject(error);
      }
    });
  }

  private async connectToProxy(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const clientId = this.config.clientId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const proxyUrl = `${this.config.proxyUrl}?clientId=${clientId}`;
        
        console.log('Connecting to WebSocket proxy:', proxyUrl);
        
        this.websocket = new WebSocket(proxyUrl, 'realtime');

        this.websocket.onopen = () => {
          console.log('WebSocket proxy connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing proxy message:', error);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket proxy error:', error);
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('WebSocket proxy connection error'));
          }
        };

        this.websocket.onclose = (event) => {
          console.log('WebSocket proxy closed:', event.code, event.reason);
          this.isConnected = false;
          
          if (this.isStreaming && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.handleReconnection();
          }
        };

      } catch (error) {
        console.error('Error connecting to WebSocket proxy:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: any): void {
    console.log('Proxy message received:', message.type);

    switch (message.type) {
      case 'conversation.item.created':
        if (message.item?.type === 'message' && message.item?.role === 'assistant') {
          const content = message.item.content?.[0];
          if (content?.type === 'input_audio_transcription') {
            const transcript = content.transcript;
            if (transcript && transcript.trim()) {
              console.log('Transcript received:', transcript);
              
              const transcriptData: RealtimeTranscript = {
                text: transcript,
                isFinal: true,
                confidence: 0.95,
                timestamp: Date.now()
              };
              
              if (this.onTranscriptCallback) {
                this.onTranscriptCallback(transcriptData);
              }
            }
          }
        }
        break;

      case 'conversation.item.input_audio_buffer.speech_started':
        console.log('Speech started');
        break;

      case 'conversation.item.input_audio_buffer.speech_stopped':
        console.log('Speech stopped');
        break;

      case 'conversation.item.input_audio_buffer.committed':
        console.log('Audio buffer committed');
        break;

      case 'error':
        console.error('Proxy error:', message.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error(message.error.message || 'Proxy error'));
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleReconnection(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.isStreaming) {
        this.connectToProxy().catch((error) => {
          console.error('Reconnection failed:', error);
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`));
          }
        });
      }
    }, delay);
  }

  sendAudioChunk(audioChunk: Blob): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket proxy not connected, buffering audio chunk');
      return;
    }

    // Convert blob to base64 for transmission
    this.blobToBase64(audioChunk).then(base64Audio => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'input_audio_buffer.append',
          audio: base64Audio
        };
        
        this.websocket.send(JSON.stringify(message));
        console.log(`Audio chunk sent to proxy: ${audioChunk.size} bytes`);
      }
    }).catch(error => {
      console.error('Error sending audio chunk to proxy:', error);
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  pauseStreaming(): void {
    console.log('WebSocket proxy streaming paused');
  }

  resumeStreaming(): void {
    console.log('WebSocket proxy streaming resumed');
  }

  stopStreaming(): void {
    console.log('Stopping WebSocket proxy streaming...');
    
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
    this.onTranscriptCallback = null;
    this.onErrorCallback = null;
    this.reconnectAttempts = 0;
    
    console.log('WebSocket proxy streaming stopped and cleaned up');
  }

  isStreamingActive(): boolean {
    return this.isStreaming && this.isConnected;
  }
}
