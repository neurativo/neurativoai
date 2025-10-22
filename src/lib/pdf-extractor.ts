// PDF Text Extractor using pdfjs-dist directly
// Handles multi-page PDFs properly in serverless environments

export interface PDFExtractionResult {
  text: string;
  numPages: number;
  info: any;
  success: boolean;
  error?: string;
}

export async function extractPDFText(buffer: Buffer): Promise<PDFExtractionResult> {
  try {
    console.log('=== PDF EXTRACTION START ===');
    console.log('Starting PDF extraction with pdfjs-dist (serverless compatible)...');
    console.log('Buffer size:', buffer.length, 'bytes');
    
    // Use pdfjs-dist which is serverless compatible
    const pdfjsLib = await import('pdfjs-dist');
    
    console.log('pdfjs-dist loaded successfully');
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      useSystemFonts: true,
      disableFontFace: false,
      disableRange: false,
      disableStream: false
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    console.log('PDF loaded successfully:', {
      pages: numPages
    });
    
    // Extract text from all pages
    let fullText = '';
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      fullText += pageText + '\n\n';
    }
    
    console.log('PDF text extracted successfully:', {
      pages: numPages,
      textLength: fullText.length
    });
    console.log('Raw text preview (first 200 chars):', fullText.substring(0, 200));

    // Create structured text with page markers
    // Since pdfjs-dist doesn't provide page breaks, we'll split the text by pages manually
    const pages: string[] = [];
    const wordsPerPage = Math.ceil(fullText.split(/\s+/).length / numPages);
    const words = fullText.split(/\s+/);
    
    for (let i = 0; i < numPages; i++) {
      const startWord = i * wordsPerPage;
      const endWord = Math.min((i + 1) * wordsPerPage, words.length);
      const pageText = words.slice(startWord, endWord).join(' ').trim();
      if (pageText) {
        pages.push(pageText);
      }
    }
    
    console.log('Pages created from text splitting:', pages.length);
    
    const structured = pages
      .map((pageText, i) => `--- PAGE ${i + 1} ---\n${pageText}`)
      .join("\n\n");

    console.log('Structured text created:', {
      totalLength: structured.length,
      pageMarkers: (structured.match(/--- PAGE \d+ ---/g) || []).length
    });

    return {
      text: structured,
      numPages: pages.length,
      info: { pages: numPages },
      success: true
    };

  } catch (err) {
    console.error('[PDF Extract Error]', err);
    return { 
      text: "", 
      numPages: 0, 
      info: {},
      success: false,
      error: err instanceof Error ? err.message : 'Unknown PDF extraction error'
    };
  }
}

// Text normalization function
export function normalizeText(text: string): string {
  console.log('Normalizing text...');
  console.log('Original length:', text.length);
  
  let normalized = text
    .replace(/\r\n/g, "\n")           // Normalize line endings
    .replace(/\n{3,}/g, "\n\n")       // Reduce multiple newlines
    .replace(/\s{3,}/g, " ")          // Reduce multiple spaces
    .replace(/-{3,}\s*PAGE\s*\d+\s*-{3,}/g, "\n\n[PAGE BREAK]\n\n"); // Normalize page markers

  console.log('Text normalized:', {
    newLength: normalized.length,
    pageBreaks: (normalized.match(/\[PAGE BREAK\]/g) || []).length
  });

  return normalized;
}

// Heuristic check for page markers
export function validatePageExtraction(numPages: number, text: string): boolean {
  const hasPageMarkers = text.includes("[PAGE BREAK]");
  const expectedPages = numPages > 1;
  
  if (expectedPages && !hasPageMarkers) {
    console.warn("Page markers missing — PDF may be scanned or flattened.");
    return false;
  }
  
  return true;
}
