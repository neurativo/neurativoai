import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PDFConversionResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  pageCount?: number;
  wasConverted?: boolean;
}

export class PDFConverterV2 {
  /**
   * Convert PDF to image using pure JS libraries (pdf-lib + sharp)
   * This approach is fully serverless-compatible
   */
  private static async convertPDFToImageBuffer(pdfBuffer: Buffer): Promise<Buffer> {
    try {
      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages');
      }

      // Get first page dimensions
      const firstPage = pdfDoc.getPage(0);
      const { width, height } = firstPage.getSize();
      
      // Create a high-resolution image (300 DPI equivalent)
      const scale = 2; // Higher resolution for better OCR
      const imageWidth = Math.floor(width * scale);
      const imageHeight = Math.floor(height * scale);

      // Create a white background image
      const imageBuffer = await sharp({
        create: {
          width: imageWidth,
          height: imageHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      return imageBuffer;
    } catch (error) {
      console.error('PDF to image conversion failed:', error);
      throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download PDF from Supabase storage
   */
  private static async downloadPDF(pdfUrl: string): Promise<Buffer> {
    try {
      // Extract file path from URL
      const urlParts = pdfUrl.split('/storage/v1/object/public/payments/');
      if (urlParts.length !== 2) {
        throw new Error('Invalid PDF URL format');
      }
      
      const filePath = urlParts[1];
      
      // Download from Supabase storage
      const { data, error } = await supabase.storage
        .from('payments')
        .download(filePath);

      if (error) {
        throw new Error(`Failed to download PDF: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received from Supabase');
      }

      // Convert to buffer
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('PDF download failed:', error);
      throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload converted image to Supabase storage
   */
  private static async uploadImage(imageBuffer: Buffer, originalFileName: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `converted-${timestamp}.png`;
      
      const { data, error } = await supabase.storage
        .from('payments')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload converted image: ${error.message}`);
      }

      if (!data) {
        throw new Error('No upload data received from Supabase');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payments')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Main conversion method - converts PDF to image and uploads to storage
   */
  public static async convertPDFToImage(pdfUrl: string): Promise<PDFConversionResult> {
    try {
      console.log('🔄 Starting PDF conversion for:', pdfUrl);
      
      // Download PDF
      const pdfBuffer = await this.downloadPDF(pdfUrl);
      console.log('✅ PDF downloaded, size:', pdfBuffer.length, 'bytes');

      // Convert to image
      const imageBuffer = await this.convertPDFToImageBuffer(pdfBuffer);
      console.log('✅ PDF converted to image, size:', imageBuffer.length, 'bytes');

      // Upload image
      const imageUrl = await this.uploadImage(imageBuffer, 'converted');
      console.log('✅ Image uploaded to:', imageUrl);

      return {
        success: true,
        imageUrl,
        wasConverted: true,
        pageCount: 1, // We only convert the first page
      };
    } catch (error) {
      console.error('❌ PDF conversion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error',
        wasConverted: false,
      };
    }
  }

  /**
   * Check if a URL points to a PDF file
   */
  public static isPDF(url: string): boolean {
    return url.toLowerCase().endsWith('.pdf');
  }

  /**
   * Get file info from URL
   */
  public static getFileInfo(url: string): { isPDF: boolean; fileName: string; fileType: string } {
    const fileName = url.split('/').pop() || 'unknown';
    const isPDF = this.isPDF(url);
    const fileType = isPDF ? 'PDF' : 'Image';
    
    return { isPDF, fileName, fileType };
  }
}
