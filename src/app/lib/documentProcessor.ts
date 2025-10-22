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
      
      // Calculate total words
      const totalWords = this.countWords(content);
      
      // Filter for exam-relevant content
      const relevantSections = await this.filterExamRelevantContent(sections, totalWords);

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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Use pdf-parse for reliable multi-page extraction
      console.log('=== DOCUMENT PROCESSOR: Attempting to import pdf-extractor ===');
      
      let extractPDFText, normalizeText, validatePageExtraction;
      try {
        const pdfExtractor = await import('@/lib/pdf-extractor');
        extractPDFText = pdfExtractor.extractPDFText;
        normalizeText = pdfExtractor.normalizeText;
        validatePageExtraction = pdfExtractor.validatePageExtraction;
        console.log('=== PDF-EXTRACTOR IMPORTED SUCCESSFULLY ===');
      } catch (importError) {
        console.error('=== PDF-EXTRACTOR IMPORT FAILED ===', importError);
        throw new Error(`Failed to import pdf-extractor: ${importError}`);
      }
      
      console.log('=== DOCUMENT PROCESSOR: Starting PDF processing with pdf-parse ===');
      const result = await extractPDFText(buffer);
      
      console.log('PDF extraction result:', {
        success: result.success,
        pages: result.numPages,
        textLength: result.text.length,
        hasPageMarkers: result.text.includes('[PAGE BREAK]'),
        error: result.error
      });
      
      if (!result.success) {
        console.error('PDF extraction failed:', result.error);
        throw new Error(result.error || 'PDF extraction failed');
      }
      
      console.log('PDF extraction successful:', {
        pages: result.numPages,
        textLength: result.text.length,
        hasPageMarkers: result.text.includes('[PAGE BREAK]')
      });
      
      // Validate page extraction
      const isValid = validatePageExtraction(result.numPages, result.text);
      if (!isValid) {
        console.warn('Page extraction validation failed - PDF may be scanned');
      }
      
      // Normalize the text for better section detection
      const normalizedText = normalizeText(result.text);
      
      console.log('PDF processing completed:', {
        originalLength: result.text.length,
        normalizedLength: normalizedText.length,
        pages: result.numPages
      });
      
      return {
        content: normalizedText,
        pages: result.numPages
      };
      
    } catch (error) {
      console.error('Error parsing PDF with pdf-parse:', error);
      console.error('PDF parsing error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Fallback: try to extract basic text without PDF parsing
      try {
        console.log('Attempting fallback PDF processing...');
        const arrayBuffer = await file.arrayBuffer();
        const fallbackContent = await this.fallbackPDFProcessing(Buffer.from(arrayBuffer));
        return {
          content: fallbackContent,
          pages: 1 // Estimate 1 page for fallback
        };
      } catch (fallbackError) {
        console.error('Fallback PDF processing also failed:', fallbackError);
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async fallbackPDFProcessing(buffer: Buffer): Promise<string> {
    // Simple fallback: try to extract text using basic string operations
    // This is a very basic implementation that might work for some PDFs
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 100000)); // Limit to first 100KB
    
    // Try to extract readable text by filtering out binary data
    const readableText = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (readableText.length > 50) {
      return readableText;
    } else {
      return 'PDF content could not be extracted. Please try with a different PDF file.';
    }
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
    console.log('Content length:', content.length);
    console.log('Total pages:', totalPages);
    console.log('First 500 characters:', content.substring(0, 500));
    
    const sections: DocumentSection[] = [];
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    console.log('Total lines after filtering:', lines.length);
    console.log('First 10 lines:', lines.slice(0, 10));
    
    let currentSection: Partial<DocumentSection> | null = null;
    let sectionCounter = 0;
    let currentPage = 1;
    const wordsPerPage = Math.ceil(this.countWords(content) / totalPages);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Handle page breaks
      if (line.startsWith('[PAGE BREAK]')) {
        console.log('Found page break, current page:', currentPage + 1);
        currentPage++;
        
        // Save current section if it has content
        if (currentSection && currentSection.content) {
          sections.push({
            id: `section_${sectionCounter++}`,
            title: currentSection.title || `Page ${currentPage - 1} Content`,
            level: currentSection.level || 2,
            content: currentSection.content.trim(),
            pageNumber: currentPage - 1,
            wordCount: this.countWords(currentSection.content),
            isExamRelevant: false,
            topics: []
          });
        }
        
        // Start new section for new page
        currentSection = {
          title: `Page ${currentPage} Content`,
          level: 1,
          content: '',
          pageNumber: currentPage
        };
        continue;
      }
      
      // Detect section headers (improved heuristic)
      if (this.isSectionHeader(line)) {
        console.log('Found section header:', line);
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
          pageNumber: currentPage
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      } else {
        // Start first section if none exists
        currentSection = {
          title: 'Introduction',
          level: 1,
          content: line,
          pageNumber: currentPage
        };
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
    
    // If no sections were created, create sections by splitting content
    if (sections.length === 0) {
      console.log('No sections detected, creating sections by content splitting...');
      
      // Try to split by page breaks first
      const pageSections = content.split('[PAGE BREAK]').filter(p => p.trim().length > 0);
      console.log('Page sections found:', pageSections.length);
      
      if (pageSections.length > 1) {
        // Create sections based on pages
        pageSections.forEach((pageContent, index) => {
          const cleanContent = pageContent.trim();
          if (cleanContent.length > 50) {
            sections.push({
              id: `page_section_${index + 1}`,
              title: `Page ${index + 1} Content`,
              level: 1,
              content: cleanContent,
              pageNumber: index + 1,
              wordCount: this.countWords(cleanContent),
              isExamRelevant: false,
              topics: []
            });
          }
        });
      }
      
      // If still no sections, try paragraph splitting
      if (sections.length === 0) {
        console.log('No page sections, trying paragraph splitting...');
        const wordsPerSection = Math.max(200, Math.ceil(this.countWords(content) / 5)); // At least 5 sections
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
        
        console.log('Creating sections from paragraphs:', paragraphs.length);
        
        let currentSection: Partial<DocumentSection> | null = null;
        let sectionCounter = 0;
        
        for (let i = 0; i < paragraphs.length; i++) {
          const paragraph = paragraphs[i].trim();
          
          if (!currentSection) {
            currentSection = {
              title: `Topic ${sectionCounter + 1}`,
              level: 1,
              content: paragraph,
              pageNumber: 1,
              wordCount: this.countWords(paragraph)
            };
          } else {
            currentSection.content = (currentSection.content || '') + '\n\n' + paragraph;
            currentSection.wordCount = this.countWords(currentSection.content);
          }
          
          // If section is long enough or this is the last paragraph, finalize it
          if ((currentSection.wordCount || 0) >= wordsPerSection || i === paragraphs.length - 1) {
            sections.push({
              id: `auto_section_${sectionCounter++}`,
              title: currentSection.title || 'Untitled Section',
              level: currentSection.level || 1,
              content: (currentSection.content || '').trim(),
              pageNumber: currentSection.pageNumber || 1,
              wordCount: currentSection.wordCount || 0,
              isExamRelevant: false,
              topics: []
            });
            currentSection = null;
          }
        }
      }
      
      // If still no sections, create one big section
      if (sections.length === 0) {
        console.log('Still no sections, creating single large section...');
        sections.push({
          id: 'section_0',
          title: 'Document Content',
          level: 1,
          content: content.trim(),
          pageNumber: 1,
          wordCount: this.countWords(content),
          isExamRelevant: false,
          topics: []
        });
      }
    }
    
    console.log(`Structured content into ${sections.length} sections`);
    return sections;
  }

  private isSectionHeader(line: string): boolean {
    // More aggressive heuristic to detect section headers
    const headerPatterns = [
      /^Chapter\s+\d+/i,
      /^Section\s+\d+/i,
      /^\d+\.\s+[A-Z]/,
      /^[A-Z][A-Z\s]+$/,
      /^#{1,6}\s+/,
      /^\*\*.*\*\*$/,
      /^__.*__$/,
      /^[A-Z][a-z].*:$/,  // Title followed by colon
      /^\d+\.\s+[A-Za-z]/, // Numbered list items
      /^[A-Z][a-z].*[.!?]$/, // Title ending with punctuation
      /^[A-Z][a-z].*$/, // Any title case line
      /^\d+\./, // Any numbered line
      /^[A-Z][A-Za-z\s]{2,}$/ // All caps or title case with at least 3 chars
    ];
    
    // More lenient checks
    const isShort = line.length < 150;
    const isTitleCase = /^[A-Z][a-z]/.test(line);
    const hasNumbers = /\d/.test(line);
    const isAllCaps = /^[A-Z\s]+$/.test(line);
    const isStandalone = line.length > 5 && line.length < 100;
    
    return headerPatterns.some(pattern => pattern.test(line)) && 
           (isShort || isTitleCase || hasNumbers || isAllCaps || isStandalone);
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

  private async filterExamRelevantContent(sections: DocumentSection[], totalWords: number): Promise<DocumentSection[]> {
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
    
    // For small documents, be more flexible with section length requirements
    const isSmallDocument = totalWords < 100;
    const minLength = isSmallDocument ? 10 : this.config.minSectionLength;
    
    const filteredSections = relevantSections.filter(section => 
      section.isExamRelevant && section.wordCount >= minLength
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
