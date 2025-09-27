# 🎓 Live Lecture Assistant - Access Guide

## 🚀 How to Access the System

### **Option 1: Direct Navigation**
1. **Visit your website**: `https://www.neurativo.com`
2. **Click "Live Lecture"** in the main navigation bar
3. **Or click "Live Lecture"** in the user dropdown menu (if logged in)

### **Option 2: Direct URLs**
- **Main Interface**: `https://www.neurativo.com/lecture`
- **Setup Guide**: `https://www.neurativo.com/lecture/landing`
- **Revision Packs**: `https://www.neurativo.com/lecture/revision`

## 🔧 Setup Requirements

### **1. API Key Configuration**
You need at least one transcription provider API key in your environment variables:

```bash
# Add to your .env.local file (choose one or more)
OPENAI_API_KEY=sk-your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
AZURE_API_KEY=your_azure_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_key_here
```

### **2. Recommended Setup (OpenAI Whisper)**
- **Cost**: ~$0.36/hour
- **Setup**: Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Add to environment**: `OPENAI_API_KEY=sk-...`

## 🎯 Quick Start

### **Step 1: Access the System**
1. Go to `https://www.neurativo.com/lecture`
2. If no API keys are configured, you'll be redirected to the setup guide
3. Follow the setup instructions on the landing page

### **Step 2: Start a Live Lecture**
1. Click **"Start Lecture"** button
2. Allow microphone access when prompted
3. Begin speaking - the system will transcribe in real-time
4. Use controls as needed (pause, bookmark, highlight, Q&A)

### **Step 3: Generate Study Materials**
1. Click **"End Lecture"** when finished
2. Download your revision pack
3. Access flashcards, notes, and quiz questions

## 📱 Navigation Paths

### **Main Navigation Bar**
```
Home → Quiz → Live Lecture → Pricing → Library → About
```

### **User Dropdown Menu** (when logged in)
```
Dashboard → Live Lecture → Profile → Settings → Upgrade Plan
```

### **Mobile Menu**
Same as main navigation, accessible via hamburger menu

## 🎛️ System Features

### **Real-time Processing**
- ✅ **Live transcription** with multiple provider support
- ✅ **Automatic note generation** with key terms and formulas
- ✅ **Flashcard creation** for new concepts
- ✅ **Section detection** and title generation

### **Student Controls**
- ⏸️ **Pause/Resume** - Stop and restart transcription
- 🔖 **Bookmarks** - Mark important moments with notes
- ✨ **Highlights** - Get instant explanations for text
- ❓ **Q&A** - Ask questions during the lecture

### **Study Materials**
- 📝 **Quick Revision Sheet** - One-page exam prep
- 📚 **Detailed Notes** - 3-5 pages of structured content
- 🃏 **Flashcard Deck** - Export-ready for Anki
- 📊 **Quiz Bank** - Multiple-choice questions with explanations

## 🔍 Troubleshooting

### **"No API Keys Configured"**
- **Solution**: Add at least one transcription provider API key to your environment variables
- **Guide**: Visit `/lecture/landing` for detailed setup instructions

### **"Microphone Access Denied"**
- **Solution**: Allow microphone access in your browser
- **Check**: Browser permissions for the website

### **"Transcription Not Working"**
- **Solution**: Check API key validity and provider status
- **Fallback**: Try a different transcription provider

### **"Audio Quality Issues"**
- **Solution**: Use a good microphone in a quiet environment
- **Settings**: Ensure proper audio input levels

## 💡 Pro Tips

### **For Best Results**
1. **Use a good microphone** in a quiet environment
2. **Speak clearly** and at a moderate pace
3. **Use bookmarks** for important sections
4. **Highlight key terms** for instant explanations
5. **Ask questions** when you need clarification

### **Study Material Optimization**
1. **Review notes** immediately after the lecture
2. **Use flashcards** for spaced repetition
3. **Take practice quizzes** to test understanding
4. **Download materials** for offline study

## 🆘 Support

### **Setup Issues**
- Check the setup guide at `/lecture/landing`
- Verify API keys are correctly configured
- Ensure environment variables are loaded

### **Technical Issues**
- Check browser console for errors
- Verify microphone permissions
- Test with different transcription providers

### **Feature Questions**
- Review the landing page for feature explanations
- Check the documentation in `/TRANSCRIPTION_SETUP.md`
- Contact support if needed

## 🎓 Ready to Start?

1. **Visit**: `https://www.neurativo.com/lecture`
2. **Setup**: Add your API key
3. **Start**: Begin your first live lecture
4. **Learn**: Transform your lectures into study materials!

---

**Happy Learning! 🚀**
