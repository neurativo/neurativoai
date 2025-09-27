// AI Service for Live Lecture Assistant
// Handles all AI-powered features for real-time lecture processing

export interface AIServiceConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class AILectureService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  // Real-time note generation
  async generateLiveNotes(transcript: string): Promise<string[]> {
    const prompt = `
    Generate concise, structured notes from this lecture transcript. Follow these guidelines:
    
    1. Use bullet points (max 6 per section)
    2. Bold key terms using **term**
    3. Bold formulas using **formula**
    4. Keep explanations student-friendly and concise
    5. Focus on exam-relevant content
    6. Remove filler words and casual chatter
    
    Transcript: "${transcript}"
    
    Return only the notes, one per line, starting with "•":
    `;

    const response = await this.callAI(prompt);
    return this.parseNotes(response);
  }

  // Section title generation
  async generateSectionTitle(transcript: string): Promise<string> {
    const prompt = `
    Generate a concise, descriptive title for this lecture section based on the content.
    The title should capture the main topic being discussed.
    
    Transcript: "${transcript.slice(-500)}" // Last 500 chars for context
    
    Return only the title, no quotes or extra text:
    `;

    return await this.callAI(prompt);
  }

  // Key terms extraction
  async extractKeyTerms(transcript: string): Promise<string[]> {
    const prompt = `
    Extract the most important key terms, concepts, and definitions from this lecture transcript.
    Focus on terms that would be important for exams.
    
    Transcript: "${transcript}"
    
    Return only the terms, one per line, no numbering:
    `;

    const response = await this.callAI(prompt);
    return response.split('\n').filter(term => term.trim().length > 0);
  }

  // Formula extraction
  async extractFormulas(transcript: string): Promise<string[]> {
    const prompt = `
    Extract all mathematical formulas, equations, and scientific expressions from this lecture transcript.
    Include both the formula and its name/description.
    
    Transcript: "${transcript}"
    
    Return only the formulas, one per line, in the format: "Name: Formula"
    `;

    const response = await this.callAI(prompt);
    return response.split('\n').filter(formula => formula.trim().length > 0);
  }

  // Flashcard generation
  async generateFlashcard(concept: string, context: string): Promise<{ front: string; back: string }> {
    const prompt = `
    Create a flashcard for this concept. The question should be clear and exam-style.
    The answer should be concise but complete.
    
    Concept: "${concept}"
    Context: "${context}"
    
    Format:
    Question: [Your question here]
    Answer: [Your answer here]
    `;

    const response = await this.callAI(prompt);
    return this.parseFlashcard(response);
  }

  // Quiz question generation
  async generateQuizQuestions(lectureContent: string, count: number = 5): Promise<any[]> {
    const prompt = `
    Generate ${count} multiple-choice quiz questions based on this lecture content.
    Each question should:
    1. Test understanding, not memorization
    2. Have 4 options (A, B, C, D)
    3. Include 1 correct answer and 3 plausible distractors
    4. Include a brief explanation for the correct answer
    
    Lecture Content: "${lectureContent}"
    
    Format each question as:
    Q1. [Question text]
    A. [Option A]
    B. [Option B] 
    C. [Option C]
    D. [Option D]
    Correct: [Letter]
    Explanation: [Brief explanation]
    
    ---
    `;

    const response = await this.callAI(prompt);
    return this.parseQuizQuestions(response);
  }

  // Section break detection
  async shouldCreateSection(transcript: string, previousSections: any[]): Promise<boolean> {
    const prompt = `
    Analyze this lecture transcript to determine if a new section should be created.
    Look for:
    1. Topic changes
    2. Significant pauses (indicated by "..." or long gaps)
    3. Slide transitions (phrases like "moving on to", "next topic", "now let's discuss")
    4. Subject matter shifts
    
    Current transcript: "${transcript.slice(-300)}"
    Previous sections: ${previousSections.length}
    
    Return only "YES" or "NO":
    `;

    const response = await this.callAI(prompt);
    return response.trim().toUpperCase() === 'YES';
  }

  // Instant explanation for highlights
  async generateInstantExplanation(highlightedText: string, context: string): Promise<string> {
    const prompt = `
    Provide a clear, concise explanation of this highlighted text in the context of the lecture.
    Keep it simple and student-friendly.
    
    Highlighted text: "${highlightedText}"
    Context: "${context}"
    
    Provide a brief explanation (2-3 sentences):
    `;

    return await this.callAI(prompt);
  }

  // Contextual Q&A
  async generateContextualAnswer(question: string, context: string): Promise<string> {
    const prompt = `
    Answer this student question based on the lecture context provided.
    Be helpful and accurate, referring to the lecture content when possible.
    
    Student Question: "${question}"
    Lecture Context: "${context}"
    
    Provide a clear, helpful answer:
    `;

    return await this.callAI(prompt);
  }

  // Quick revision sheet generation
  async generateQuickRevisionSheet(lectureContent: string): Promise<any> {
    const prompt = `
    Create a quick revision sheet from this lecture content.
    Include:
    1. Key points (5-7 most important)
    2. Essential formulas
    3. Key definitions
    4. Main concepts
    
    Format as JSON:
    {
      "keyPoints": ["point1", "point2", ...],
      "formulas": ["formula1", "formula2", ...],
      "definitions": ["term: definition", ...],
      "concepts": ["concept1", "concept2", ...]
    }
    
    Lecture Content: "${lectureContent}"
    `;

    const response = await this.callAI(prompt);
    return JSON.parse(response);
  }

  // Detailed notes generation
  async generateDetailedNotes(sections: any[]): Promise<any> {
    const prompt = `
    Create detailed, structured notes from these lecture sections.
    Organize by headings and subheadings.
    Include examples, formulas, and explanations.
    
    Sections: ${JSON.stringify(sections)}
    
    Format as JSON:
    {
      "title": "Lecture Title",
      "sections": [
        {
          "heading": "Section Title",
          "content": "Detailed content...",
          "examples": ["example1", "example2"],
          "formulas": ["formula1", "formula2"]
        }
      ]
    }
    `;

    const response = await this.callAI(prompt);
    return JSON.parse(response);
  }

  // Core AI API call
  private async callAI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant specialized in helping university students with lecture notes, flashcards, and study materials. Always provide clear, concise, and exam-focused content.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    }
  }

  // Helper methods for parsing responses
  private parseNotes(response: string): string[] {
    return response
      .split('\n')
      .filter(line => line.trim().startsWith('•'))
      .map(line => line.trim());
  }

  private parseFlashcard(response: string): { front: string; back: string } {
    const lines = response.split('\n');
    let front = '';
    let back = '';

    for (const line of lines) {
      if (line.startsWith('Question:')) {
        front = line.replace('Question:', '').trim();
      } else if (line.startsWith('Answer:')) {
        back = line.replace('Answer:', '').trim();
      }
    }

    return { front, back };
  }

  private parseQuizQuestions(response: string): any[] {
    const questions = [];
    const questionBlocks = response.split('---').filter(block => block.trim());

    for (const block of questionBlocks) {
      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length < 6) continue;

      const question = {
        question: '',
        options: [],
        correctAnswer: 0,
        explanation: ''
      };

      let currentOption = '';
      for (const line of lines) {
        if (line.match(/^Q\d+\./)) {
          question.question = line.replace(/^Q\d+\.\s*/, '').trim();
        } else if (line.match(/^[A-D]\./)) {
          currentOption = line.replace(/^[A-D]\.\s*/, '').trim();
          question.options.push(currentOption);
        } else if (line.startsWith('Correct:')) {
          const correctLetter = line.replace('Correct:', '').trim();
          question.correctAnswer = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
        } else if (line.startsWith('Explanation:')) {
          question.explanation = line.replace('Explanation:', '').trim();
        }
      }

      if (question.question && question.options.length === 4) {
        questions.push(question);
      }
    }

    return questions;
  }
}

// Factory function for creating AI service
export function createAILectureService(): AILectureService {
  return new AILectureService({
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o-mini'
  });
}
