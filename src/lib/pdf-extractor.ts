// PDF Text Extractor using pdf-parse
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
    console.log('Starting PDF extraction with pdf-parse...');
    console.log('Buffer size:', buffer.length, 'bytes');
    
    // Use require for better compatibility
    const pdfParse = require("pdf-parse");
    
    console.log('pdf-parse loaded successfully:', typeof pdfParse);
    
    const data = await pdfParse(buffer, {
      // Options for better text extraction
      max: 0, // No page limit
    });

    console.log('PDF parsed successfully:', {
      pages: data.numpages,
      textLength: data.text.length,
      info: data.info
    });
    console.log('Raw text preview (first 200 chars):', data.text.substring(0, 200));

    // Split by page breaks and add page markers
    const pages = data.text.split(/\f/).filter(Boolean);
    console.log('Pages detected after splitting:', pages.length);
    
    // Create structured text with page markers
    const structured = pages
      .map((pageText, i) => {
        const cleanText = pageText.trim();
        return cleanText ? `--- PAGE ${i + 1} ---\n${cleanText}` : '';
      })
      .filter(Boolean)
      .join("\n\n");

    console.log('Structured text created:', {
      totalLength: structured.length,
      pageMarkers: (structured.match(/--- PAGE \d+ ---/g) || []).length
    });

    return {
      text: structured,
      numPages: pages.length,
      info: data.info,
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
