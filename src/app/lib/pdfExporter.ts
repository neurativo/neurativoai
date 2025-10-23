import puppeteer from 'puppeteer';
import { EnhancedFlashcard, EnhancedNote, EnhancedQuiz, StudyPackMetadata } from './types/studyPack';

export class PDFExporter {
  private browser: puppeteer.Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate a professional PDF study pack
   */
  async generateStudyPackPDF(
    metadata: StudyPackMetadata,
    notes: EnhancedNote[],
    flashcards: EnhancedFlashcard[],
    quizzes: EnhancedQuiz[]
  ): Promise<Buffer> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Failed to initialize PDF generator');
    }

    const page = await this.browser.newPage();
    
    try {
      const html = this.generateStudyPackHTML(metadata, notes, flashcards, quizzes);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(metadata.title),
        footerTemplate: this.getFooterTemplate(),
        preferCSSPageSize: true
      });

      return pdf;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate a quick revision sheet PDF
   */
  async generateRevisionSheetPDF(
    metadata: StudyPackMetadata,
    notes: EnhancedNote[],
    flashcards: EnhancedFlashcard[]
  ): Promise<Buffer> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Failed to initialize PDF generator');
    }

    const page = await this.browser.newPage();
    
    try {
      const html = this.generateRevisionSheetHTML(metadata, notes, flashcards);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(`${metadata.title} - Quick Revision`),
        footerTemplate: this.getFooterTemplate(),
        preferCSSPageSize: true
      });

      return pdf;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate flashcards PDF for printing
   */
  async generateFlashcardsPDF(flashcards: EnhancedFlashcard[]): Promise<Buffer> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Failed to initialize PDF generator');
    }

    const page = await this.browser.newPage();
    
    try {
      const html = this.generateFlashcardsHTML(flashcards);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        preferCSSPageSize: true
      });

      return pdf;
    } finally {
      await page.close();
    }
  }

  private generateStudyPackHTML(
    metadata: StudyPackMetadata,
    notes: EnhancedNote[],
    flashcards: EnhancedFlashcard[],
    quizzes: EnhancedQuiz[]
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title}</title>
    <style>
        ${this.getCSS()}
    </style>
</head>
<body>
    <div class="container">
        <!-- Cover Page -->
        <div class="cover-page">
            <div class="cover-content">
                <h1 class="cover-title">${metadata.title}</h1>
                <p class="cover-subtitle">Comprehensive Study Materials</p>
                <div class="cover-stats">
                    <div class="stat">
                        <span class="stat-number">${metadata.totalSections}</span>
                        <span class="stat-label">Sections</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${metadata.totalFlashcards}</span>
                        <span class="stat-label">Flashcards</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${metadata.totalNotes}</span>
                        <span class="stat-label">Notes</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${metadata.totalQuizzes}</span>
                        <span class="stat-label">Quizzes</span>
                    </div>
                </div>
                <div class="cover-meta">
                    <p><strong>Estimated Study Time:</strong> ${metadata.estimatedStudyTime} minutes</p>
                    <p><strong>Difficulty:</strong> ${metadata.difficulty}</p>
                    <p><strong>Generated:</strong> ${metadata.createdAt.toLocaleDateString()}</p>
                </div>
            </div>
        </div>

        <!-- Table of Contents -->
        <div class="page-break">
            <h2 class="section-title">Table of Contents</h2>
            <div class="toc">
                <div class="toc-section">
                    <h3>Study Notes</h3>
                    <ul>
                        ${notes.map(note => `<li><a href="#note-${note.id}">${note.title}</a></li>`).join('')}
                    </ul>
                </div>
                <div class="toc-section">
                    <h3>Flashcards</h3>
                    <p>${flashcards.length} flashcards covering key concepts</p>
                </div>
                <div class="toc-section">
                    <h3>Quizzes</h3>
                    <ul>
                        ${quizzes.map(quiz => `<li><a href="#quiz-${quiz.id}">${quiz.title}</a></li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <!-- Study Notes -->
        ${notes.map(note => this.generateNoteHTML(note)).join('')}

        <!-- Flashcards Summary -->
        <div class="page-break">
            <h2 class="section-title">Flashcards Summary</h2>
            <div class="flashcards-grid">
                ${flashcards.map(card => this.generateFlashcardHTML(card)).join('')}
            </div>
        </div>

        <!-- Quizzes -->
        ${quizzes.map(quiz => this.generateQuizHTML(quiz)).join('')}
    </div>
</body>
</html>`;
  }

  private generateRevisionSheetHTML(
    metadata: StudyPackMetadata,
    notes: EnhancedNote[],
    flashcards: EnhancedFlashcard[]
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title} - Quick Revision</title>
    <style>
        ${this.getRevisionCSS()}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${metadata.title} - Quick Revision</h1>
            <p class="subtitle">Key concepts and formulas for last-minute review</p>
        </div>

        <!-- Key Concepts -->
        <div class="section">
            <h2>Key Concepts</h2>
            <div class="concepts-grid">
                ${notes.map(note => 
                  note.content.summary.keyConcepts.map(concept => 
                    `<div class="concept-card">${concept}</div>`
                  ).join('')
                ).join('')}
            </div>
        </div>

        <!-- Important Definitions -->
        <div class="section">
            <h2>Important Definitions</h2>
            <div class="definitions">
                ${notes.map(note => 
                  Object.entries(note.content.importantTopics.definitions).map(([term, definition]) => 
                    `<div class="definition">
                        <strong>${term}:</strong> ${definition}
                    </div>`
                  ).join('')
                ).join('')}
            </div>
        </div>

        <!-- Formulas -->
        <div class="section">
            <h2>Formulas & Equations</h2>
            <div class="formulas">
                ${notes.map(note => 
                  note.content.importantTopics.formulas?.map(formula => 
                    `<div class="formula">${formula}</div>`
                  ).join('') || ''
                ).join('')}
            </div>
        </div>

        <!-- Quick Flashcards -->
        <div class="section">
            <h2>Quick Review Questions</h2>
            <div class="quick-questions">
                ${flashcards.slice(0, 20).map(card => 
                  `<div class="question-card">
                    <div class="question">${card.front}</div>
                    <div class="answer">${card.back}</div>
                  </div>`
                ).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private generateFlashcardsHTML(flashcards: EnhancedFlashcard[]): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flashcards</title>
    <style>
        ${this.getFlashcardsCSS()}
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">Flashcards</h1>
        <div class="flashcards-grid">
            ${flashcards.map(card => `
                <div class="flashcard">
                    <div class="card-front">
                        <div class="card-header">
                            <span class="difficulty ${card.difficulty}">${card.difficulty}</span>
                            <span class="type">${card.type}</span>
                        </div>
                        <div class="card-content">
                            <h3>${card.front}</h3>
                        </div>
                    </div>
                    <div class="card-back">
                        <div class="card-content">
                            <h3>Answer:</h3>
                            <p>${card.back}</p>
                            ${card.explanation ? `<p class="explanation"><strong>Explanation:</strong> ${card.explanation}</p>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  private generateNoteHTML(note: EnhancedNote): string {
    return `
<div class="page-break" id="note-${note.id}">
    <h2 class="section-title">${note.title}</h2>
    
    <div class="note-meta">
        <span class="difficulty ${note.level}">${note.level}</span>
        <span class="time">${note.estimatedTime} min</span>
        <span class="tags">${note.tags.join(', ')}</span>
    </div>

    <div class="note-content">
        <h3>Key Concepts</h3>
        <ul class="concepts-list">
            ${note.content.summary.keyConcepts.map(concept => `<li>${concept}</li>`).join('')}
        </ul>

        <h3>Learning Outcomes</h3>
        <ul class="outcomes-list">
            ${note.content.summary.learningOutcomes.map(outcome => `<li>${outcome}</li>`).join('')}
        </ul>

        ${Object.keys(note.content.importantTopics.definitions).length > 0 ? `
        <h3>Definitions</h3>
        <div class="definitions">
            ${Object.entries(note.content.importantTopics.definitions).map(([term, definition]) => 
                `<div class="definition">
                    <strong>${term}:</strong> ${definition}
                </div>`
            ).join('')}
        </div>
        ` : ''}

        ${note.content.importantTopics.principles.length > 0 ? `
        <h3>Principles</h3>
        <ul class="principles-list">
            ${note.content.importantTopics.principles.map(principle => `<li>${principle}</li>`).join('')}
        </ul>
        ` : ''}

        ${note.content.examples.length > 0 ? `
        <h3>Examples</h3>
        <div class="examples">
            ${note.content.examples.map(example => `
                <div class="example">
                    <h4>${example.title}</h4>
                    <p>${example.description}</p>
                    ${example.code ? `<pre class="code"><code>${example.code}</code></pre>` : ''}
                    <p class="explanation"><strong>Explanation:</strong> ${example.explanation}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${note.content.examTips.length > 0 ? `
        <h3>Exam Tips</h3>
        <ul class="exam-tips">
            ${note.content.examTips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
        ` : ''}
    </div>
</div>`;
  }

  private generateFlashcardHTML(card: EnhancedFlashcard): string {
    return `
<div class="flashcard-summary">
    <div class="card-header">
        <span class="difficulty ${card.difficulty}">${card.difficulty}</span>
        <span class="type">${card.type}</span>
    </div>
    <div class="card-content">
        <div class="front">
            <strong>Q:</strong> ${card.front}
        </div>
        <div class="back">
            <strong>A:</strong> ${card.back}
        </div>
    </div>
</div>`;
  }

  private generateQuizHTML(quiz: EnhancedQuiz): string {
    return `
<div class="page-break" id="quiz-${quiz.id}">
    <h2 class="section-title">${quiz.title}</h2>
    
    <div class="quiz-meta">
        <span class="questions">${quiz.totalQuestions} questions</span>
        <span class="time">${quiz.estimatedTime} min</span>
        <span class="difficulty ${quiz.difficulty}">${quiz.difficulty}</span>
        <span class="points">${quiz.totalPoints} points</span>
    </div>

    <div class="quiz-questions">
        ${quiz.questions.map((question, index) => `
            <div class="question">
                <h4>Question ${index + 1}</h4>
                <p class="question-text">${question.question}</p>
                ${question.options && question.options.length > 0 ? `
                    <ul class="options">
                        ${question.options.map(option => `<li>${option}</li>`).join('')}
                    </ul>
                ` : ''}
                <div class="answer">
                    <strong>Answer:</strong> ${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                </div>
                <div class="explanation">
                    <strong>Explanation:</strong> ${question.explanation}
                </div>
            </div>
        `).join('')}
    </div>
</div>`;
  }

  private getHeaderTemplate(title: string): string {
    return `
    <div style="font-size: 10px; padding: 0 15mm; width: 100%; text-align: center; color: #666;">
        <span>${title}</span>
    </div>`;
  }

  private getFooterTemplate(): string {
    return `
    <div style="font-size: 10px; padding: 0 15mm; width: 100%; text-align: center; color: #666;">
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`;
  }

  private getCSS(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        .page-break {
            page-break-before: always;
        }

        .page-break:first-child {
            page-break-before: avoid;
        }

        .cover-page {
            text-align: center;
            padding: 100px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: -20px -20px 0 -20px;
        }

        .cover-title {
            font-size: 3em;
            margin-bottom: 20px;
            font-weight: 300;
        }

        .cover-subtitle {
            font-size: 1.2em;
            margin-bottom: 40px;
            opacity: 0.9;
        }

        .cover-stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 40px 0;
        }

        .stat {
            text-align: center;
        }

        .stat-number {
            display: block;
            font-size: 2em;
            font-weight: bold;
        }

        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }

        .cover-meta {
            margin-top: 40px;
            text-align: left;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
        }

        .cover-meta p {
            margin: 10px 0;
            font-size: 0.9em;
        }

        .section-title {
            font-size: 2em;
            color: #2c3e50;
            margin-bottom: 20px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }

        .toc {
            margin: 20px 0;
        }

        .toc-section {
            margin: 20px 0;
        }

        .toc-section h3 {
            color: #34495e;
            margin-bottom: 10px;
        }

        .toc-section ul {
            list-style: none;
            padding-left: 20px;
        }

        .toc-section li {
            margin: 5px 0;
        }

        .toc-section a {
            color: #3498db;
            text-decoration: none;
        }

        .note-meta {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .difficulty {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }

        .difficulty.beginner {
            background: #d4edda;
            color: #155724;
        }

        .difficulty.intermediate {
            background: #fff3cd;
            color: #856404;
        }

        .difficulty.advanced {
            background: #f8d7da;
            color: #721c24;
        }

        .time, .tags {
            padding: 4px 8px;
            background: #e9ecef;
            border-radius: 4px;
            font-size: 0.8em;
        }

        .note-content h3 {
            color: #2c3e50;
            margin: 25px 0 15px 0;
            font-size: 1.3em;
        }

        .concepts-list, .outcomes-list, .principles-list, .exam-tips {
            list-style: none;
            padding-left: 0;
        }

        .concepts-list li, .outcomes-list li, .principles-list li, .exam-tips li {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
        }

        .concepts-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #27ae60;
            font-weight: bold;
        }

        .outcomes-list li:before {
            content: "🎯";
            position: absolute;
            left: 0;
        }

        .principles-list li:before {
            content: "💡";
            position: absolute;
            left: 0;
        }

        .exam-tips li:before {
            content: "💡";
            position: absolute;
            left: 0;
            color: #f39c12;
        }

        .definitions {
            margin: 15px 0;
        }

        .definition {
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-left: 4px solid #3498db;
        }

        .examples {
            margin: 15px 0;
        }

        .example {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }

        .example h4 {
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .code {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }

        .explanation {
            margin-top: 10px;
            font-style: italic;
            color: #6c757d;
        }

        .flashcards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .flashcard-summary {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            background: #f8f9fa;
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .card-content .front, .card-content .back {
            margin: 8px 0;
        }

        .quiz-meta {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .questions, .time, .points {
            padding: 4px 8px;
            background: #e9ecef;
            border-radius: 4px;
            font-size: 0.8em;
        }

        .quiz-questions {
            margin: 20px 0;
        }

        .question {
            margin: 25px 0;
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            background: #f8f9fa;
        }

        .question h4 {
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .question-text {
            margin-bottom: 15px;
            font-weight: 500;
        }

        .options {
            list-style: none;
            padding-left: 0;
            margin: 10px 0;
        }

        .options li {
            margin: 5px 0;
            padding-left: 20px;
            position: relative;
        }

        .options li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #6c757d;
        }

        .answer, .explanation {
            margin: 10px 0;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }

        .answer {
            background: #d4edda;
            border-left: 4px solid #28a745;
        }

        .explanation {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
        }

        @media print {
            .page-break {
                page-break-before: always;
            }
            
            .cover-page {
                margin: 0;
            }
        }
    `;
  }

  private getRevisionCSS(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3498db;
        }

        .header h1 {
            font-size: 2.5em;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #7f8c8d;
            font-size: 1.1em;
        }

        .section {
            margin: 30px 0;
            page-break-inside: avoid;
        }

        .section h2 {
            font-size: 1.8em;
            color: #2c3e50;
            margin-bottom: 20px;
            background: #ecf0f1;
            padding: 10px 15px;
            border-radius: 5px;
        }

        .concepts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }

        .concept-card {
            background: #3498db;
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
        }

        .definitions {
            margin: 20px 0;
        }

        .definition {
            margin: 10px 0;
            padding: 12px;
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            border-radius: 0 5px 5px 0;
        }

        .formulas {
            margin: 20px 0;
        }

        .formula {
            margin: 15px 0;
            padding: 15px;
            background: #2d3748;
            color: #e2e8f0;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
            text-align: center;
        }

        .quick-questions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .question-card {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            background: #f8f9fa;
        }

        .question {
            font-weight: 500;
            margin-bottom: 10px;
            color: #2c3e50;
        }

        .answer {
            color: #27ae60;
            font-weight: 500;
        }
    `;
  }

  private getFlashcardsCSS(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .title {
            text-align: center;
            font-size: 2.5em;
            color: #2c3e50;
            margin-bottom: 30px;
        }

        .flashcards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .flashcard {
            border: 2px solid #e9ecef;
            border-radius: 12px;
            overflow: hidden;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }

        .difficulty {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }

        .difficulty.easy {
            background: #d4edda;
            color: #155724;
        }

        .difficulty.medium {
            background: #fff3cd;
            color: #856404;
        }

        .difficulty.hard {
            background: #f8d7da;
            color: #721c24;
        }

        .type {
            padding: 4px 8px;
            background: #e9ecef;
            border-radius: 12px;
            font-size: 0.8em;
            color: #6c757d;
        }

        .card-content {
            padding: 20px;
        }

        .card-content h3 {
            margin-bottom: 15px;
            color: #2c3e50;
        }

        .card-content p {
            margin: 10px 0;
        }

        .explanation {
            margin-top: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            font-style: italic;
            color: #6c757d;
        }

        @media print {
            .flashcard {
                page-break-inside: avoid;
                margin-bottom: 20px;
            }
        }
    `;
  }
}
