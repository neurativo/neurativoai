# Live Lecture Assistant - Transcription Setup Guide

## Overview

The Live Lecture Assistant supports multiple speech-to-text providers for real-time audio transcription. Choose the provider that best fits your needs and budget.

## Supported Providers

### 1. OpenAI Whisper (Recommended)

- **Best for**: High accuracy, multiple languages, easy setup
- **Cost**: $0.006 per minute
- **Setup**:
  ```bash
  # Add to your .env.local file
  OPENAI_API_KEY=your_openai_api_key_here
  ```

### 2. Google Speech-to-Text

- **Best for**: Enterprise use, advanced features
- **Cost**: $0.006 per 15 seconds
- **Setup**:
  ```bash
  # Add to your .env.local file
  GOOGLE_API_KEY=your_google_api_key_here
  ```

### 3. Azure Cognitive Services

- **Best for**: Microsoft ecosystem integration
- **Cost**: $1 per hour
- **Setup**:
  ```bash
  # Add to your .env.local file
  AZURE_API_KEY=your_azure_api_key_here
  ```

### 4. AssemblyAI

- **Best for**: Real-time streaming, advanced features
- **Cost**: $0.0003 per second
- **Setup**:
  ```bash
  # Add to your .env.local file
  ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
  ```

## Usage Examples

### Basic Usage (OpenAI)

```typescript
import { LiveLectureAssistant } from "@/app/lib/liveLectureAssistant";

const assistant = new LiveLectureAssistant("openai");
await assistant.startLecture();
```

### Using Different Providers

```typescript
// Google Speech-to-Text
const assistant = new LiveLectureAssistant("google");

// Azure Cognitive Services
const assistant = new LiveLectureAssistant("azure");

// AssemblyAI
const assistant = new LiveLectureAssistant("assemblyai");
```

### API Endpoint Usage

```typescript
// POST /api/transcribe
const formData = new FormData();
formData.append("audio", audioFile);
formData.append("provider", "openai");

const response = await fetch("/api/transcribe", {
  method: "POST",
  body: formData,
});

const result = await response.json();
```

## Configuration

### Environment Variables

Create a `.env.local` file in your Next.js project root:

```bash
# Choose your preferred provider
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
AZURE_API_KEY=your_azure_key
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Other required variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://www.neurativo.com
```

### Provider-Specific Setup

#### OpenAI Whisper

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to environment variables
3. No additional setup required

#### Google Speech-to-Text

1. Enable Speech-to-Text API in [Google Cloud Console](https://console.cloud.google.com/)
2. Create API key or service account
3. Add to environment variables

#### Azure Cognitive Services

1. Create Speech resource in [Azure Portal](https://portal.azure.com/)
2. Get subscription key
3. Add to environment variables

#### AssemblyAI

1. Sign up at [AssemblyAI](https://www.assemblyai.com/)
2. Get API key from dashboard
3. Add to environment variables

## Features by Provider

| Feature               | OpenAI | Google | Azure | AssemblyAI |
| --------------------- | ------ | ------ | ----- | ---------- |
| Real-time streaming   | ✅     | ✅     | ✅    | ✅         |
| Multiple languages    | ✅     | ✅     | ✅    | ✅         |
| Speaker diarization   | ❌     | ✅     | ✅    | ✅         |
| Custom vocabulary     | ❌     | ✅     | ✅    | ✅         |
| Punctuation           | ✅     | ✅     | ✅    | ✅         |
| Confidence scores     | ❌     | ✅     | ✅    | ✅         |
| Word-level timestamps | ❌     | ✅     | ✅    | ✅         |

## Cost Comparison (per hour of audio)

- **OpenAI Whisper**: ~$0.36
- **Google Speech-to-Text**: ~$14.40
- **Azure Cognitive Services**: $1.00
- **AssemblyAI**: ~$1.08

## Recommendations

### For Development/Testing

- **OpenAI Whisper**: Best balance of cost and quality
- Easy setup, good accuracy, reasonable pricing

### For Production/Enterprise

- **Google Speech-to-Text**: Best accuracy and features
- Advanced features like speaker diarization
- Higher cost but best quality

### For Real-time Streaming

- **AssemblyAI**: Optimized for streaming
- Real-time processing capabilities
- Good for live applications

### For Microsoft Ecosystem

- **Azure Cognitive Services**: Best integration
- If already using Azure services
- Good enterprise features

## Troubleshooting

### Common Issues

1. **API Key Not Found**

   - Check environment variable names
   - Ensure `.env.local` is in project root
   - Restart development server

2. **Transcription Errors**

   - Check API key validity
   - Verify provider is supported
   - Check audio format compatibility

3. **Audio Format Issues**
   - Supported formats: WebM, WAV, MP3, M4A
   - Recommended: WebM with Opus codec
   - Sample rate: 16kHz or 48kHz

### Audio Format Requirements

```typescript
// Recommended audio settings
const audioConstraints = {
  audio: {
    sampleRate: 48000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
  },
};
```

## Security Notes

- Never commit API keys to version control
- Use environment variables for all secrets
- Consider using a secrets management service for production
- Rotate API keys regularly
- Monitor usage and costs

## Support

For issues with specific providers:

- OpenAI: [OpenAI Help Center](https://help.openai.com/)
- Google: [Google Cloud Support](https://cloud.google.com/support)
- Azure: [Azure Support](https://azure.microsoft.com/support/)
- AssemblyAI: [AssemblyAI Support](https://www.assemblyai.com/help)
