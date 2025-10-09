// Deepgram real-time transcription service
// Much more reliable than AssemblyAI for live streaming

export interface DeepgramConfig {
  apiKey: string;
  model?: string;
  language?: string;
  smartFormat?: boolean;
  punctuate?: boolean;
  diarize?: boolean;
  interimResults?: boolean;
}

export class DeepgramTranscriptionService {
  private websocket: WebSocket | null = null;
  private isConnected: boolean = false;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private config: DeepgramConfig;

  constructor(config: DeepgramConfig) {
    this.config = {
      model: 'nova-2',
      language: 'en',
      smartFormat: true,
      punctuate: true,
      diarize: false,
      interimResults: true,
      ...config
    };
  }

  async startStreaming(
    onTranscript: (transcript: string) => void,
    onError: ((error: Error) => void) | null = null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Starting Deepgram streaming transcription...');
        this.onTranscriptCallback = onTranscript;
        this.onErrorCallback = onError;

        // Build WebSocket URL with parameters
        const params = new URLSearchParams({
          model: this.config.model!,
          language: this.config.language!,
          smart_format: this.config.smartFormat!.toString(),
          punctuate: this.config.punctuate!.toString(),
          diarize: this.config.diarize!.toString(),
          interim_results: this.config.interimResults!.toString(),
          encoding: 'webm',
          sample_rate: '16000'
        });

        const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}&token=${this.config.apiKey}`;
        console.log('Connecting to Deepgram WebSocket...');

        this.websocket = new WebSocket(wsUrl);

        // Set authorization header after connection
        this.websocket.onopen = () => {
          console.log('Deepgram WebSocket connected successfully');
          this.isConnected = true;
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing Deepgram message:', error);
            if (this.onErrorCallback) {
              this.onErrorCallback(new Error('Failed to parse transcription response'));
            }
          }
        };

        this.websocket.onerror = (error) => {
          console.error('Deepgram WebSocket error:', error);
          this.isConnected = false;
          const errorMsg = 'Deepgram connection failed';
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error(errorMsg));
          }
          reject(new Error(errorMsg));
        };

        this.websocket.onclose = (event) => {
          console.log('Deepgram WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          
          if (event.code !== 1000 && this.onErrorCallback) {
            this.onErrorCallback(new Error(`WebSocket closed unexpectedly: ${event.reason}`));
          }
        };

      } catch (error) {
        console.error('Error starting Deepgram streaming:', error);
        const errorMsg = 'Failed to start Deepgram streaming';
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error(errorMsg));
        }
        reject(new Error(errorMsg));
      }
    });
  }

  private handleMessage(message: any): void {
    if (message.type === 'Results' && message.channel && message.channel.alternatives) {
      const transcript = message.channel.alternatives[0].transcript;
      
      if (transcript && transcript.trim()) {
        console.log('Deepgram transcript:', transcript);
        
        if (this.onTranscriptCallback) {
          this.onTranscriptCallback(transcript);
        }
      }
    }
  }

  sendAudioChunk(audioChunk: Blob): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.log('Deepgram WebSocket not connected, skipping audio chunk');
      return;
    }

    // Convert blob to ArrayBuffer and send immediately
    audioChunk.arrayBuffer().then(buffer => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(buffer);
        console.log(`Audio chunk sent to Deepgram: ${buffer.byteLength} bytes`);
      }
    }).catch(error => {
      console.error('Error sending audio chunk to Deepgram:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('Failed to send audio chunk'));
      }
    });
  }

  stopStreaming(): void {
    console.log('Stopping Deepgram streaming...');
    
    if (this.websocket) {
      if (this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close(1000, 'Streaming stopped by user');
      }
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.onTranscriptCallback = null;
    this.onErrorCallback = null;
  }

  isStreaming(): boolean {
    return this.isConnected && this.websocket?.readyState === WebSocket.OPEN;
  }

  getProvider(): string {
    return 'deepgram';
  }
}

// Factory function to create Deepgram service
export function createDeepgramService(apiKey: string): DeepgramTranscriptionService {
  return new DeepgramTranscriptionService({ apiKey });
}
