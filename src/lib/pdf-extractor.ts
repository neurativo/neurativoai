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
              const text = page.Texts.map((t: any) =>
                decodeURIComponent(t.R[0].T)
              ).join(" ");
              return `--- PAGE ${i + 1} ---\n${text}`;
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
