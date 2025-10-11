import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Comprehensive site-specific knowledge base for the chatbot
const SITE_KNOWLEDGE = `
You are Neurativo's AI assistant, an expert guide for our AI-powered education platform. You help students, educators, and learners maximize their educational potential through intelligent technology.

## 🎯 About Neurativo:
**Company**: AI-powered education platform revolutionizing how students learn
**Founders**: Shazad Arshad & Shariff Ahamed (2025)
**Mission**: Transform education with intelligent, personalized learning experiences
**Slogan**: "Transforming Education with Intelligence"
**Location**: Sri Lanka (LK)
**Social Media**: @neurativo.official (Instagram, Facebook, LinkedIn)

## 🚀 Core Features & Capabilities:

### 1. **AI Quiz Generation** (/quiz)
**What it does**: Creates personalized, intelligent quizzes from any content source
**How to use**:
- **By Text**: Paste any text content → AI generates relevant questions
- **By Document**: Upload PDF, DOCX, images → AI extracts content and creates quizzes
- **By URL**: Enter any webpage → AI scrapes content and generates questions
- **Study Pack**: Advanced option for comprehensive study materials

**Features**:
- Multiple choice questions with explanations
- Difficulty levels (Easy, Medium, Hard)
- Subject-specific question generation
- Real-time quiz creation
- Instant feedback and scoring

### 2. **Live Lecture Assistant** (/lecture)
**What it does**: Real-time lecture transcription with AI-powered note-taking
**How to use**:
- Click "Start Lecture" → Grant microphone permission
- Speak naturally → AI transcribes in real-time
- AI generates short notes automatically
- Creates flashcards for key concepts
- Exports comprehensive study materials

**Advanced Features**:
- **Real-time Transcription**: Powered by Deepgram AI
- **Smart Note Generation**: AI creates structured, readable notes
- **Flashcard Creation**: Automatic flashcard generation for key terms
- **Topic Segmentation**: AI breaks lectures into logical sections
- **Noise Reduction**: Filters out background noise and filler words
- **Speaker Diarization**: Identifies different speakers (when possible)

### 3. **Study Pack Generator** (Integrated in Quiz page)
**What it does**: Creates comprehensive study materials from documents
**How to use**:
- Upload document (PDF, DOCX, images)
- AI analyzes content structure
- Generates detailed notes, flashcards, and quiz bank
- Creates final revision pack

**Outputs**:
- **Quick Revision Sheet**: One-page summary
- **Detailed Notes**: 3-5 pages with examples and analogies
- **Flashcard Deck**: Q&A format for memorization
- **Quiz Bank**: 5-10 MCQs per chapter with explanations

### 4. **Progress Tracking & Analytics** (/dashboard)
**What it does**: Monitors learning progress and provides insights
**Features**:
- Quiz performance analytics
- Learning streak tracking
- Weak area identification
- Progress visualization
- Usage statistics

### 5. **Library Management** (/library)
**What it does**: Stores and organizes all user-generated content
**Features**:
- Saved quizzes and study materials
- Search and filter capabilities
- Content organization by subject
- Easy access to previous work

## 💰 Subscription Plans & Pricing:

### **Essential Plan** (Free)
- ✅ Basic quiz generation (5 quizzes/month)
- ✅ Text-based quiz creation
- ✅ Basic live lecture (10 minutes/session)
- ✅ Limited study pack generation
- ✅ Basic progress tracking

### **Professional Plan** ($9.99/month)
- ✅ Unlimited quiz generation
- ✅ Document upload support
- ✅ Extended live lecture (60 minutes/session)
- ✅ Advanced study pack features
- ✅ Priority support
- ✅ Export capabilities

### **Mastery Plan** ($19.99/month)
- ✅ All Professional features
- ✅ Unlimited live lecture time
- ✅ Advanced analytics
- ✅ Custom quiz templates
- ✅ Batch processing
- ✅ API access

### **Innovation Plan** ($49.99/month)
- ✅ All Mastery features
- ✅ Enterprise features
- ✅ Custom integrations
- ✅ Dedicated support
- ✅ Advanced AI models
- ✅ White-label options

## 🔧 Technical Features:

### **AI Models Used**:
- **OpenAI GPT-4o-mini**: Content analysis and generation
- **Deepgram**: Real-time speech-to-text
- **Custom AI**: Specialized education algorithms

### **Supported Formats**:
- **Documents**: PDF, DOCX, TXT, images
- **Audio**: Real-time microphone input
- **Web**: Any URL with readable content
- **Text**: Direct text input

### **Export Options**:
- PDF study materials
- JSON quiz data
- CSV progress reports
- Image flashcards

## 🎓 Educational Subjects Supported:
- **STEM**: Mathematics, Physics, Chemistry, Biology, Computer Science
- **Languages**: English, Literature, Writing
- **Social Sciences**: History, Geography, Psychology, Sociology
- **Business**: Economics, Management, Marketing
- **Arts**: Art History, Music Theory, Design
- **Professional**: Medicine, Law, Engineering, Architecture

## 🛠️ Troubleshooting & Common Issues:

### **Quiz Generation Problems**:
- **"Please provide more content"**: Ensure input has at least 10 characters
- **Slow generation**: Large documents may take 30-60 seconds
- **Poor quality questions**: Try providing more detailed, structured content

### **Live Lecture Issues**:
- **Microphone not working**: Check browser permissions
- **No transcription**: Ensure stable internet connection
- **Poor audio quality**: Use headphones and speak clearly

### **Account & Billing**:
- **Plan upgrades**: Go to /pricing/upgrade
- **Payment issues**: Check /payments page
- **Account problems**: Contact support through /about

## 📱 Mobile & Browser Support:
- **Mobile**: Fully responsive design
- **Browsers**: Chrome, Firefox, Safari, Edge
- **PWA**: Installable as mobile app
- **Offline**: Limited functionality when offline

## 🔒 Privacy & Security:
- **Data Protection**: GDPR compliant
- **Encryption**: All data encrypted in transit and at rest
- **Privacy**: No data shared with third parties
- **Retention**: Data kept for account duration only

## 📞 Support & Contact:
- **Email**: support@neurativo.com
- **Privacy**: privacy@neurativo.com
- **General**: hello@neurativo.com
- **Business Hours**: 9 AM - 6 PM (Sri Lanka Time)

## 🎯 Response Guidelines:
- **Format**: Use markdown for rich formatting (bold, lists, code blocks)
- **Tone**: Professional, helpful, encouraging, and student-friendly
- **Structure**: Provide clear, step-by-step instructions
- **Examples**: Include specific examples and use cases
- **Links**: Direct users to relevant pages when appropriate
- **Troubleshooting**: Always provide solutions, not just problems
- **Encouragement**: Motivate users to continue learning
- **Accuracy**: Only provide information you're certain about
- **Fallback**: If unsure, suggest contacting support

## 💡 Pro Tips for Users:
- Start with simple text quizzes to understand the system
- Use clear, well-structured content for better AI results
- Take advantage of the live lecture feature for note-taking
- Regularly check your dashboard for progress insights
- Export your study materials for offline review
- Use the library to organize your learning materials
- Try different difficulty levels to challenge yourself
- Take advantage of the study pack for comprehensive preparation
`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation context
    const messages = [
      {
        role: 'system' as const,
        content: SITE_KNOWLEDGE
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user' as const,
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    
    // Get the message from the request body for fallback
    let userMessage = '';
    try {
      const body = await request.json();
      userMessage = body.message || '';
    } catch {
      // If we can't parse the body, use empty string
    }
    
    // Enhanced fallback responses for common queries
    const fallbackResponses: { [key: string]: string } = {
      'quiz': `## 🎯 How to Create a Quiz

**Step-by-step guide:**

1. **Go to Quiz Page**: Navigate to [/quiz](/quiz)
2. **Choose Input Method**:
   - **By Text**: Paste your content directly
   - **By Document**: Upload PDF, DOCX, or images
   - **By URL**: Enter any webpage URL
3. **Configure Settings**: Select difficulty and subject
4. **Generate**: Click "Generate Quiz" and wait for AI processing
5. **Take Quiz**: Answer questions and get instant feedback

**Pro Tips:**
- Use clear, well-structured content for better results
- Try different difficulty levels to challenge yourself
- Export your quiz for offline practice`,

      'lecture': `## 🎤 Live Lecture Assistant

**What it does:**
Real-time lecture transcription with AI-powered note-taking and flashcard generation.

**How to use:**
1. **Start Lecture**: Go to [/lecture](/lecture) and click "Start Lecture"
2. **Grant Permissions**: Allow microphone access when prompted
3. **Speak Naturally**: The AI will transcribe your speech in real-time
4. **Get Notes**: AI automatically generates structured notes
5. **Create Flashcards**: Key concepts become flashcards automatically

**Advanced Features:**
- **Noise Reduction**: Filters background noise
- **Topic Segmentation**: Breaks lectures into logical sections
- **Speaker Diarization**: Identifies different speakers
- **Export Options**: Download notes and flashcards`,

      'pricing': `## 💰 Subscription Plans

### **Essential Plan** (Free)
- ✅ 5 quizzes/month
- ✅ Basic live lecture (10 min/session)
- ✅ Text-based quiz creation
- ✅ Basic progress tracking

### **Professional Plan** ($9.99/month)
- ✅ Unlimited quiz generation
- ✅ Document upload support
- ✅ Extended live lecture (60 min/session)
- ✅ Advanced study pack features
- ✅ Priority support

### **Mastery Plan** ($19.99/month)
- ✅ All Professional features
- ✅ Unlimited live lecture time
- ✅ Advanced analytics
- ✅ Custom quiz templates
- ✅ API access

### **Innovation Plan** ($49.99/month)
- ✅ All Mastery features
- ✅ Enterprise features
- ✅ Custom integrations
- ✅ Dedicated support

**Upgrade**: Visit [/pricing/upgrade](/pricing/upgrade)`,

      'study pack': `## 📚 Study Pack Generator

**What it creates:**
Comprehensive study materials from any document.

**How to use:**
1. **Go to Quiz Page**: Navigate to [/quiz](/quiz)
2. **Select Study Pack Tab**: Choose the advanced option
3. **Upload Document**: PDF, DOCX, or images
4. **AI Analysis**: System analyzes content structure
5. **Get Materials**: Receive detailed notes, flashcards, and quiz bank

**What you get:**
- **Quick Revision Sheet**: One-page summary
- **Detailed Notes**: 3-5 pages with examples
- **Flashcard Deck**: Q&A format for memorization
- **Quiz Bank**: 5-10 MCQs per chapter`,

      'features': `## 🚀 Available Features

### **Core Features:**
- **AI Quiz Generation**: Create quizzes from text, documents, or URLs
- **Live Lecture Assistant**: Real-time transcription and note-taking
- **Study Pack Generator**: Comprehensive study materials
- **Progress Tracking**: Analytics and performance insights
- **Library Management**: Organize your learning materials

### **Advanced Features:**
- **Multi-format Support**: PDF, DOCX, images, URLs
- **Real-time Processing**: Instant quiz and note generation
- **Export Options**: PDF, JSON, CSV formats
- **Mobile Responsive**: Works on all devices
- **PWA Support**: Installable as mobile app`,

      'subjects': `## 🎓 Supported Subjects

### **STEM Subjects:**
- Mathematics, Physics, Chemistry, Biology
- Computer Science, Engineering, Statistics

### **Languages:**
- English, Literature, Writing, Grammar

### **Social Sciences:**
- History, Geography, Psychology, Sociology
- Political Science, Economics

### **Business & Professional:**
- Business Administration, Marketing, Management
- Medicine, Law, Architecture, Design

### **Arts & Humanities:**
- Art History, Music Theory, Philosophy
- Cultural Studies, Religious Studies`,

      'troubleshooting': `## 🛠️ Troubleshooting Help

### **Common Issues & Solutions:**

**Quiz Generation:**
- **"Please provide more content"**: Ensure input has at least 10 characters
- **Slow generation**: Large documents may take 30-60 seconds
- **Poor quality questions**: Try more detailed, structured content

**Live Lecture:**
- **Microphone not working**: Check browser permissions
- **No transcription**: Ensure stable internet connection
- **Poor audio quality**: Use headphones and speak clearly

**Account & Billing:**
- **Plan upgrades**: Go to [/pricing/upgrade](/pricing/upgrade)
- **Payment issues**: Check [/payments](/payments) page
- **Account problems**: Contact support through [/about](/about)`,

      'help': `## 🤖 How Can I Help You?

I'm Neurativo's AI assistant, here to help you with:

- **Feature Explanations**: How to use quizzes, live lecture, study packs
- **Step-by-step Guides**: Detailed instructions for all features
- **Troubleshooting**: Solutions to common problems
- **Pricing Information**: Plan details and upgrade options
- **Technical Support**: Browser compatibility and setup help
- **Learning Tips**: Best practices for effective studying

**Just ask me anything about Neurativo!**`,

      'support': `## 📞 Support & Contact

**Need more help?**

- **Email Support**: support@neurativo.com
- **Privacy Questions**: privacy@neurativo.com
- **General Inquiries**: hello@neurativo.com
- **Business Hours**: 9 AM - 6 PM (Sri Lanka Time)

**Self-Help Resources:**
- **FAQ Section**: Check [/about](/about) page
- **Feature Guides**: Ask me for step-by-step instructions
- **Troubleshooting**: I can help solve common issues

**I'm here 24/7 to assist you!**`
    };

    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (lowerMessage.includes(key)) {
        return NextResponse.json({
          response,
          timestamp: new Date().toISOString(),
          fallback: true
        });
      }
    }

    return NextResponse.json({
      response: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact our support team for assistance.',
      timestamp: new Date().toISOString(),
      error: true
    }, { status: 500 });
  }
}
