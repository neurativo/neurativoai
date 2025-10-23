// PDF Text Extractor using pdf2json
// Pure Node.js solution that works perfectly in serverless environments

import PDFParser from "pdf2json";

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
    console.log('Starting PDF extraction with pdf2json (pure Node.js)...');
    console.log('Buffer size:', buffer.length, 'bytes');
    
    return new Promise<PDFExtractionResult>((resolve, reject) => {
      try {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", (err: any) => {
          console.error("[PDF2JSON ERROR]", err.parserError || err);
          reject(new Error(`PDF parsing failed: ${err.parserError || err}`));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          try {
            console.log('PDF2JSON parsed successfully:', {
              pages: pdfData.Pages?.length || 0
            });

            const pages = pdfData.Pages.map((page: any, i: number) => {
              if (!page.Texts || page.Texts.length === 0) {
                console.warn(`Page ${i + 1} has no text content`);
                return `--- PAGE ${i + 1} ---\n[No text content found]`;
              }
              
              const text = page.Texts.map((t: any) => {
                if (!t.R || !t.R[0] || !t.R[0].T) {
                  return '';
                }
                
                try {
                  return decodeURIComponent(t.R[0].T);
                } catch (error) {
                  // If decodeURIComponent fails, try alternative decoding or return as-is
                  console.warn('Failed to decode text:', t.R[0].T, error);
                  try {
                    // Try unescape as fallback
                    return unescape(t.R[0].T);
                  } catch (e2) {
                    // Return as-is if all decoding fails
                    return t.R[0].T || '';
                  }
                }
              }).filter(text => text.trim().length > 0).join(" ");
              
              return `[PAGE BREAK]\n${text}`;
            });

            const fullText = pages.join("\n\n");
            
            console.log('PDF text extracted successfully:', {
              pages: pdfData.Pages.length,
              textLength: fullText.length
            });
            console.log('Raw text preview (first 200 chars):', fullText.substring(0, 200));

            resolve({
              text: fullText,
              numPages: pdfData.Pages.length,
              info: { pages: pdfData.Pages.length },
              success: true
            });
          } catch (e) {
            console.error("[PDF2JSON PARSE ERROR]", e);
            reject(new Error(`Failed to parse PDF data: ${e}`));
          }
        });

        pdfParser.parseBuffer(buffer);
      } catch (err) {
        console.error("[PDF2JSON INIT ERROR]", err);
        reject(new Error(`Failed to initialize PDF parser: ${err}`));
      }
    });

  } catch (err) {
    console.error('[PDF Extract Error with pdf2json]', err);
    
    // Fallback to pdf-parse if pdf2json fails
    try {
      console.log('Attempting fallback with pdf-parse...');
      const pdfParse = await import('pdf-parse');
      const data = await (pdfParse as any).default(buffer);
      
      console.log('PDF-parse fallback successful:', {
        pages: data.numpages,
        textLength: data.text.length
      });
      
      return {
        text: data.text,
        numPages: data.numpages,
        info: { pages: data.numpages },
        success: true
      };
    } catch (fallbackError) {
      console.error('[PDF Extract Fallback Error]', fallbackError);
      return { 
        text: "", 
        numPages: 0, 
        info: {},
        success: false,
        error: err instanceof Error ? err.message : 'Unknown PDF extraction error'
      };
    }
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
    .replace(/\[PAGE BREAK\]\s*\n/g, "\n\n[PAGE BREAK]\n\n"); // Normalize page markers

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
