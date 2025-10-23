import { NextRequest, NextResponse } from 'next/server';
import { createSecureResponse, secureLog, securityHeaders } from '@/app/lib/secureApi';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const { id: studyPackId, sectionId } = params;
    
    // In a real implementation, you would fetch from database
    // For now, return a mock response
    const section = {
      id: sectionId,
      title: `Section ${sectionId}`,
      content: 'Section content would be loaded here',
      level: 1,
      wordCount: 0,
      isExamRelevant: false,
      topics: []
    };

    secureLog('Study pack section requested', { studyPackId, sectionId });

    return NextResponse.json(section, {
      headers: securityHeaders
    });
  } catch (error) {
    console.error('Error fetching study pack section:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section' },
      { status: 500, headers: securityHeaders }
    );
  }
}
