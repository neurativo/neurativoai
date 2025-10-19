import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface PDFConversionResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  pageCount?: number;
}

export class PDFConverter {
  private static async downloadPDF(pdfUrl: string): Promise<string> {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    
    // Use /tmp directory for serverless environments
    const tempDir = process.env.VERCEL ? '/tmp' : join(process.cwd(), 'temp', 'pdfs');
    
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
    
    const pdfPath = join(tempDir, `temp_${Date.now()}.pdf`);
    const fs = await import('fs');
    await fs.promises.writeFile(pdfPath, Buffer.from(buffer));
    
    return pdfPath;
  }

  private static async convertPDFToImageFile(pdfPath: string): Promise<string> {
    // Use /tmp directory for serverless environments
    const outputDir = process.env.VERCEL ? '/tmp' : join(process.cwd(), 'temp', 'images');
    
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = join(outputDir, `converted_${Date.now()}.png`);
    
    try {
      // Try using pdf2pic first (more reliable)
      const pdf2pic = await import('pdf2pic');
      const convertFromPath = pdf2pic.default.fromPath(pdfPath, {
        density: 300,
        saveFilename: `converted_${Date.now()}`,
        savePath: outputDir,
        format: 'png',
        width: 2000,
        height: 2000
      });
      
      const result = await convertFromPath(1); // Convert first page
      
      if (result && result.path) {
        return result.path;
      }
      
      throw new Error('pdf2pic conversion failed');
      
    } catch (pdf2picError) {
      console.log('pdf2pic failed, trying ImageMagick...', pdf2picError);
      
      try {
        // Fallback to ImageMagick
        const command = `magick "${pdfPath}[0]" "${outputPath}"`;
        await execAsync(command);
        
        if (existsSync(outputPath)) {
          return outputPath;
        }
        
        throw new Error('ImageMagick conversion failed');
        
      } catch (imagemagickError) {
        console.log('ImageMagick failed, trying Ghostscript...', imagemagickError);
        
        try {
          // Fallback to Ghostscript
          const gsCommand = `gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r300 -sOutputFile="${outputPath}" "${pdfPath}"`;
          await execAsync(gsCommand);
          
          if (existsSync(outputPath)) {
            return outputPath;
          }
          
          throw new Error('Ghostscript conversion failed');
          
        } catch (gsError) {
          throw new Error(`All PDF conversion methods failed. pdf2pic: ${pdf2picError}, ImageMagick: ${imagemagickError}, Ghostscript: ${gsError}`);
        }
      }
    }
  }

  private static async uploadToSupabase(imagePath: string): Promise<string> {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const fs = await import('fs');
    const imageBuffer = await fs.promises.readFile(imagePath);
    
    const fileName = `converted_${Date.now()}.png`;
    const { data, error } = await supabase.storage
      .from('payments')
      .upload(`converted/${fileName}`, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Failed to upload converted image: ${error.message}`);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('payments')
      .getPublicUrl(data.path);
    
    return publicUrl;
  }

  private static async cleanup(tempFiles: string[]): Promise<void> {
    const fs = await import('fs');
    
    for (const file of tempFiles) {
      try {
        if (existsSync(file)) {
          await fs.promises.unlink(file);
        }
      } catch (error) {
        console.warn(`Failed to cleanup file ${file}:`, error);
      }
    }
    
    // Clean up temp directories if empty
    const tempDirs = new Set(tempFiles.map(f => dirname(f)));
    
    for (const dir of tempDirs) {
      try {
        if (existsSync(dir) && dir !== process.cwd()) {
          const files = await fs.promises.readdir(dir);
          if (files.length === 0) {
            await fs.promises.rmdir(dir);
          }
        }
      } catch (error) {
        console.warn(`Failed to cleanup directory ${dir}:`, error);
      }
    }
  }

  public static async convertPDFToImage(pdfUrl: string): Promise<PDFConversionResult> {
    const tempFiles: string[] = [];
    
    try {
      console.log('📄 Starting PDF to image conversion for:', pdfUrl);
      
      // Download PDF
      const pdfPath = await this.downloadPDF(pdfUrl);
      tempFiles.push(pdfPath);
      
      // Convert to image
      const imagePath = await this.convertPDFToImageFile(pdfPath);
      tempFiles.push(imagePath);
      
      // Upload to Supabase
      const imageUrl = await this.uploadToSupabase(imagePath);
      
      console.log('✅ PDF converted successfully:', imageUrl);
      
      return {
        success: true,
        imageUrl,
        pageCount: 1
      };
      
    } catch (error) {
      console.error('❌ PDF conversion failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
      
    } finally {
      // Cleanup temp files
      await this.cleanup(tempFiles);
    }
  }
}
