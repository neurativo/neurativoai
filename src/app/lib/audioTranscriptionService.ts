// Audio Transcription Service
// Handles real-time audio to text conversion using various APIs

export interface TranscriptionConfig {
  provider: 'openai' | 'google' | 'azure' | 'assemblyai';
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
      default:
        throw new Error(`Unsupported transcription provider: ${this.config.provider}`);
    }
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
      // Upload audio file first
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': this.config.apiKey,
        },
        body: audioBlob
      });

      if (!uploadResponse.ok) {
        throw new Error(`AssemblyAI upload error: ${uploadResponse.status}`);
      }

      const { upload_url } = await uploadResponse.json();

      // Start transcription
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_code: this.config.language || 'en_us',
          punctuate: true,
          format_text: true
        })
      });

      if (!transcriptResponse.ok) {
        throw new Error(`AssemblyAI transcription error: ${transcriptResponse.status}`);
      }

      const { id } = await transcriptResponse.json();

      // Poll for completion
      let result;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: {
            'Authorization': this.config.apiKey,
          }
        });
        result = await statusResponse.json();
      } while (result.status === 'processing');

      if (result.status === 'error') {
        throw new Error(`AssemblyAI processing error: ${result.error}`);
      }

      return {
        text: result.text,
        confidence: result.confidence || 0.8,
        language: this.config.language || 'en_us'
      };
    } catch (error) {
      console.error('AssemblyAI transcription error:', error);
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
export function createTranscriptionService(provider: 'openai' | 'google' | 'azure' | 'assemblyai'): AudioTranscriptionService {
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || '';
  
  return new AudioTranscriptionService({
    provider,
    apiKey,
    language: 'en-US',
    model: provider === 'openai' ? 'whisper-1' : undefined
  });
}

// Real-time streaming transcription for continuous audio
export class StreamingTranscriptionService {
  private transcriptionService: AudioTranscriptionService;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private onTranscriptionCallback?: (result: TranscriptionResult) => void;

  constructor(transcriptionService: AudioTranscriptionService) {
    this.transcriptionService = transcriptionService;
  }

  async startStreaming(onTranscription: (result: TranscriptionResult) => void): Promise<void> {
    this.onTranscriptionCallback = onTranscription;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.processAudioChunk(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Process every second
      this.isRecording = true;
    } catch (error) {
      console.error('Error starting audio stream:', error);
      throw error;
    }
  }

  async stopStreaming(): Promise<void> {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  private async processAudioChunk(audioChunk: Blob): Promise<void> {
    try {
      const result = await this.transcriptionService.transcribeAudio(audioChunk);
      if (this.onTranscriptionCallback) {
        this.onTranscriptionCallback(result);
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }
}
