import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const { studyPack } = await request.json();
    if (!studyPack) {
      return NextResponse.json({ error: 'Missing studyPack' }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const addPageWithText = (title: string, content: string) => {
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();
      page.drawText(title, { x: 40, y: height - 60, size: 18, font, color: rgb(0.2, 0.2, 0.2) });

      const lines = content.split('\n');
      let y = height - 90;
      for (const line of lines) {
        page.drawText(line, { x: 40, y, size: 11, font, color: rgb(0, 0, 0) });
        y -= 16;
        if (y < 60) {
          y = height - 60;
        }
      }
    };

    // Title page
    addPageWithText(studyPack.title || 'Study Pack', `Generated at: ${new Date(studyPack.generatedAt || Date.now()).toLocaleString()}`);

    // Notes
    if (Array.isArray(studyPack.detailedNotes)) {
      for (const note of studyPack.detailedNotes) {
        addPageWithText(`Notes: ${note.title || ''}`, String(note.content || ''));
      }
    }

    // Flashcards
    if (Array.isArray(studyPack.flashcardDeck)) {
      for (const card of studyPack.flashcardDeck) {
        addPageWithText(`Flashcard: ${card.front || ''}`, `Back: ${String(card.back || '')}`);
      }
    }

    // Quizzes
    if (Array.isArray(studyPack.quizBank)) {
      for (const quiz of studyPack.quizBank) {
        const questionsText = (quiz.questions || []).map((q: any, idx: number) => `${idx + 1}. ${q.question}`).join('\n');
        addPageWithText(`Quiz: ${quiz.title || ''}`, questionsText);
      }
    }

    // Quick Revision
    if (studyPack.quickRevisionSheet) {
      addPageWithText('Quick Revision', String(studyPack.quickRevisionSheet));
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="study-pack.pdf"'
      }
    });

  } catch (error) {
    console.error('Failed to export study pack PDF:', error);
    return NextResponse.json({ error: 'Failed to export study pack' }, { status: 500 });
  }
}


