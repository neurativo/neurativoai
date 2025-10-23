import { NextRequest, NextResponse } from 'next/server';
import { PDFExporter } from '../../lib/pdfExporter';
import { StudyPackMetadata, EnhancedNote, EnhancedFlashcard, EnhancedQuiz } from '../../lib/types/studyPack';

export async function POST(request: NextRequest) {
  try {
    const { metadata, notes, flashcards, quizzes, exportType } = await request.json();

    if (!metadata || !notes || !flashcards || !quizzes) {
      return NextResponse.json(
        { error: 'Missing required data for PDF export' },
        { status: 400 }
      );
    }

    const pdfExporter = new PDFExporter();
    let pdfBuffer: Buffer;

    try {
      switch (exportType) {
        case 'study-pack':
          pdfBuffer = await pdfExporter.generateStudyPackPDF(
            metadata as StudyPackMetadata,
            notes as EnhancedNote[],
            flashcards as EnhancedFlashcard[],
            quizzes as EnhancedQuiz[]
          );
          break;
        
        case 'revision-sheet':
          pdfBuffer = await pdfExporter.generateRevisionSheetPDF(
            metadata as StudyPackMetadata,
            notes as EnhancedNote[],
            flashcards as EnhancedFlashcard[]
          );
          break;
        
        case 'flashcards':
          pdfBuffer = await pdfExporter.generateFlashcardsPDF(
            flashcards as EnhancedFlashcard[]
          );
          break;
        
        default:
          return NextResponse.json(
            { error: 'Invalid export type' },
            { status: 400 }
          );
      }

      // Return PDF as base64 for client download
      const base64PDF = pdfBuffer.toString('base64');
      
      return NextResponse.json({
        success: true,
        pdf: base64PDF,
        filename: `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${exportType}.pdf`,
        size: pdfBuffer.length
      });

    } finally {
      await pdfExporter.close();
    }

  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
