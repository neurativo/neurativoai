// Document Processor - Handles PDF, DOCX, and OCR processing
// Extracts text, structures content, and prepares for AI analysis

export interface DocumentSection {
  id: string;
  title: string;
  level: number; // 1 = chapter, 2 = section, 3 = subsection
  content: string;
  pageNumber?: number;
  wordCount: number;
  isExamRelevant: boolean;
  topics: string[];
}

export interface ProcessedDocument {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'scanned';
  totalPages: number;
  totalWords: number;
  sections: DocumentSection[];
  metadata: {
    author?: string;
    subject?: string;
    course?: string;
    uploadedAt: Date;
    processedAt: Date;
  };
}

export interface DocumentProcessorConfig {
  enableOCR: boolean;
  minSectionLength: number;
  examRelevanceThreshold: number;
  maxSectionsPerChapter: number;
}

export class DocumentProcessor {
  private config: DocumentProcessorConfig;

  constructor(config: Partial<DocumentProcessorConfig> = {}) {
    this.config = {
      enableOCR: true,
      minSectionLength: 50,
      examRelevanceThreshold: 0.7,
      maxSectionsPerChapter: 20,
      ...config
    };
  }

  async processDocument(
    file: File,
    options: {
      title?: string;
      subject?: string;
      course?: string;
    } = {}
  ): Promise<ProcessedDocument> {
    console.log('Processing document:', file.name, 'Type:', file.type);
    
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadedAt = new Date();
    
    let content: string;
    let totalPages: number;
    let documentType: 'pdf' | 'docx' | 'scanned';

    try {
      if (file.type === 'application/pdf') {
        const result = await this.processPDF(file);
        content = result.content;
        totalPages = result.pages;
        documentType = 'pdf';
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await this.processDOCX(file);
        content = result.content;
        totalPages = result.pages;
        documentType = 'docx';
      } else if (file.type.startsWith('image/')) {
        if (!this.config.enableOCR) {
          throw new Error('OCR is disabled. Cannot process image files.');
        }
        const result = await this.processImageWithOCR(file);
        content = result.content;
        totalPages = 1;
        documentType = 'scanned';
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      console.log('Document content extracted:', content.length, 'characters');

      // Structure the content into sections
      const sections = await this.structureContent(content, totalPages);
      
      // Filter for exam-relevant content
      const relevantSections = await this.filterExamRelevantContent(sections);

      const processedDocument: ProcessedDocument = {
        id: documentId,
        title: options.title || file.name.replace(/\.[^/.]+$/, ''),
        type: documentType,
        totalPages,
        totalWords: this.countWords(content),
        sections: relevantSections,
        metadata: {
          author: options.subject,
          subject: options.subject,
          course: options.course,
          uploadedAt,
          processedAt: new Date()
        }
      };

      console.log('Document processed successfully:', {
        sections: relevantSections.length,
        totalWords: processedDocument.totalWords,
        examRelevant: relevantSections.filter(s => s.isExamRelevant).length
      });

      return processedDocument;

    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processPDF(file: File): Promise<{ content: string; pages: number }> {
    // For now, we'll use a simple text extraction approach
    // In production, you'd use a proper PDF parsing library like pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // This is a placeholder - in production, use pdf-parse or similar
    const content = await this.extractTextFromPDF(uint8Array);
    const pages = this.estimatePagesFromContent(content);
    
    return { content, pages };
  }

  private async processDOCX(file: File): Promise<{ content: string; pages: number }> {
    // For now, we'll use a simple text extraction approach
    // In production, you'd use a proper DOCX parsing library like mammoth
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // This is a placeholder - in production, use mammoth or similar
    const content = await this.extractTextFromDOCX(uint8Array);
    const pages = this.estimatePagesFromContent(content);
    
    return { content, pages };
  }

  private async processImageWithOCR(file: File): Promise<{ content: string; pages: number }> {
    // For now, we'll use a simple OCR approach
    // In production, you'd use Tesseract.js or similar
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // This is a placeholder - in production, use Tesseract.js
    const content = await this.extractTextWithOCR(uint8Array);
    
    return { content, pages: 1 };
  }

  private async extractTextFromPDF(data: Uint8Array): Promise<string> {
    // Placeholder implementation
    // In production, use pdf-parse or similar
    return "This is a placeholder for PDF text extraction. In production, you would use a proper PDF parsing library like pdf-parse to extract text from the PDF file.";
  }

  private async extractTextFromDOCX(data: Uint8Array): Promise<string> {
    // Placeholder implementation
    // In production, use mammoth or similar
    return "This is a placeholder for DOCX text extraction. In production, you would use a proper DOCX parsing library like mammoth to extract text from the DOCX file.";
  }

  private async extractTextWithOCR(data: Uint8Array): Promise<string> {
    // Placeholder implementation
    // In production, use Tesseract.js or similar
    return "This is a placeholder for OCR text extraction. In production, you would use Tesseract.js to extract text from scanned images.";
  }

  private async structureContent(content: string, totalPages: number): Promise<DocumentSection[]> {
    console.log('Structuring content into sections...');
    
    const sections: DocumentSection[] = [];
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    let currentSection: Partial<DocumentSection> | null = null;
    let sectionCounter = 0;
    let pageCounter = 1;
    const wordsPerPage = Math.ceil(this.countWords(content) / totalPages);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect section headers (simple heuristic)
      if (this.isSectionHeader(line)) {
        // Save previous section
        if (currentSection && currentSection.content) {
          sections.push({
            id: `section_${sectionCounter++}`,
            title: currentSection.title || 'Untitled Section',
            level: currentSection.level || 2,
            content: currentSection.content.trim(),
            pageNumber: currentSection.pageNumber,
            wordCount: this.countWords(currentSection.content),
            isExamRelevant: false, // Will be determined later
            topics: []
          });
        }
        
        // Start new section
        currentSection = {
          title: line,
          level: this.getHeaderLevel(line),
          content: '',
          pageNumber: Math.ceil((i / lines.length) * totalPages)
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }
    
    // Save last section
    if (currentSection && currentSection.content) {
      sections.push({
        id: `section_${sectionCounter++}`,
        title: currentSection.title || 'Untitled Section',
        level: currentSection.level || 2,
        content: currentSection.content.trim(),
        pageNumber: currentSection.pageNumber,
        wordCount: this.countWords(currentSection.content),
        isExamRelevant: false,
        topics: []
      });
    }
    
    console.log(`Structured content into ${sections.length} sections`);
    return sections;
  }

  private isSectionHeader(line: string): boolean {
    // Simple heuristic to detect section headers
    const headerPatterns = [
      /^Chapter\s+\d+/i,
      /^Section\s+\d+/i,
      /^\d+\.\s+[A-Z]/,
      /^[A-Z][A-Z\s]+$/,
      /^#{1,6}\s+/,
      /^\*\*.*\*\*$/,
      /^__.*__$/
    ];
    
    return headerPatterns.some(pattern => pattern.test(line)) && line.length < 100;
  }

  private getHeaderLevel(line: string): number {
    if (/^Chapter\s+\d+/i.test(line)) return 1;
    if (/^Section\s+\d+/i.test(line)) return 2;
    if (/^\d+\.\s+[A-Z]/.test(line)) return 2;
    if (/^#{1,6}\s+/.test(line)) {
      const match = line.match(/^(#{1,6})/);
      return match ? match[1].length : 2;
    }
    if (/^[A-Z][A-Z\s]+$/.test(line)) return 2;
    return 3;
  }

  private async filterExamRelevantContent(sections: DocumentSection[]): Promise<DocumentSection[]> {
    console.log('Filtering exam-relevant content...');
    
    // Simple keyword-based filtering for now
    // In production, you'd use AI to determine relevance
    const examKeywords = [
      'definition', 'concept', 'principle', 'theory', 'formula', 'equation',
      'example', 'case study', 'application', 'method', 'technique', 'process',
      'advantage', 'disadvantage', 'benefit', 'limitation', 'criteria',
      'classification', 'types', 'categories', 'characteristics', 'features',
      'comparison', 'difference', 'similarity', 'relationship', 'correlation',
      'cause', 'effect', 'impact', 'influence', 'significance', 'importance',
      'step', 'procedure', 'algorithm', 'workflow', 'framework', 'model'
    ];
    
    const relevantSections = sections.map(section => {
      const content = section.content.toLowerCase();
      const keywordMatches = examKeywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      ).length;
      
      const relevanceScore = keywordMatches / examKeywords.length;
      const isExamRelevant = relevanceScore >= this.config.examRelevanceThreshold;
      
      // Extract topics from content
      const topics = this.extractTopics(section.content);
      
      return {
        ...section,
        isExamRelevant,
        topics
      };
    });
    
    const filteredSections = relevantSections.filter(section => 
      section.isExamRelevant && section.wordCount >= this.config.minSectionLength
    );
    
    console.log(`Filtered to ${filteredSections.length} exam-relevant sections`);
    return filteredSections;
  }

  private extractTopics(content: string): string[] {
    // Simple topic extraction based on common patterns
    // In production, you'd use NLP or AI for better topic extraction
    const topics: string[] = [];
    
    // Look for definitions and key terms
    const definitionPattern = /(?:definition|define|is|are|refers to|means?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    let match;
    while ((match = definitionPattern.exec(content)) !== null) {
      topics.push(match[1].trim());
    }
    
    // Look for bullet points and lists
    const listPattern = /^[-*•]\s+([A-Z][^.\n]+)/gm;
    while ((match = listPattern.exec(content)) !== null) {
      topics.push(match[1].trim());
    }
    
    // Remove duplicates and limit to top 5
    return [...new Set(topics)].slice(0, 5);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private estimatePagesFromContent(content: string): number {
    // Estimate pages based on word count (assuming ~250 words per page)
    const words = this.countWords(content);
    return Math.max(1, Math.ceil(words / 250));
  }
}
