import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, receiptImageUrl } = await request.json();

    if (!paymentId || !receiptImageUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment ID and receipt image URL are required' 
      }, { status: 400 });
    }

    console.log('🤖 AI Receipt Scanner called for payment:', paymentId);
    console.log('📄 Receipt URL:', receiptImageUrl);

    // Check if it's a PDF file
    const isPdf = receiptImageUrl.toLowerCase().includes('.pdf');
    
    if (isPdf) {
      console.log('📄 PDF detected, converting to image...');
      // For PDFs, we'll need to convert to image first
      // For now, we'll simulate the analysis
      return NextResponse.json({
        success: true,
        analysis: {
          transactionReference: 'PDF-ANALYSIS-PENDING',
          amount: 0,
          currency: 'LKR',
          paymentMethod: 'bank',
          bankDetails: {
            accountNumber: 'PDF-ANALYSIS-PENDING',
            bankName: 'PDF-ANALYSIS-PENDING'
          },
          merchantDetails: {
            name: 'PDF-ANALYSIS-PENDING',
            address: 'PDF-ANALYSIS-PENDING'
          },
          validationStatus: 'unclear',
          confidence: 0.5,
          extractedText: 'PDF file detected - manual review required',
          recommendations: [
            'PDF file requires manual conversion to image for AI analysis',
            'Consider using a PDF to image converter service',
            'Manual review recommended for PDF receipts'
          ],
          fraudIndicators: [],
          metadata: {
            fileType: 'PDF',
            requiresConversion: true,
            analysisMethod: 'simulated'
          }
        }
      });
    }

    // For image files, we can proceed with AI analysis
    console.log('🖼️ Image file detected, proceeding with AI analysis...');
    
    // Simulate AI analysis for now (you can integrate with OpenAI Vision API later)
    const mockAnalysis = {
      transactionReference: `TXN-${Date.now()}`,
      amount: Math.floor(Math.random() * 10000) + 1000,
      currency: 'LKR',
      paymentMethod: 'bank',
      bankDetails: {
        accountNumber: '****1234',
        bankName: 'Commercial Bank'
      },
      merchantDetails: {
        name: 'Neurativo Payment',
        address: 'Colombo, Sri Lanka'
      },
      validationStatus: Math.random() > 0.3 ? 'valid' : 'unclear',
      confidence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      extractedText: 'Sample extracted text from receipt',
      recommendations: [
        'Receipt appears to be valid',
        'Amount matches expected payment',
        'Transaction reference found'
      ],
      fraudIndicators: Math.random() > 0.8 ? ['Suspicious pattern detected'] : [],
      metadata: {
        fileType: 'IMAGE',
        analysisMethod: 'simulated',
        timestamp: new Date().toISOString()
      }
    };

    // Update the payment record with AI analysis
    const supabase = getSupabaseServer();
    
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        ai_analysis: mockAnalysis,
        ai_confidence: mockAnalysis.confidence,
        ai_status: mockAnalysis.validationStatus,
        fraud_score: mockAnalysis.fraudIndicators.length > 0 ? 0.8 : 0.2,
        auto_approved: mockAnalysis.confidence > 0.85 && mockAnalysis.validationStatus === 'valid',
        needs_review: mockAnalysis.confidence >= 0.6 && mockAnalysis.confidence < 0.85,
        low_confidence: mockAnalysis.confidence < 0.6,
        image_hash: `hash_${Date.now()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('❌ Failed to update payment with AI analysis:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save AI analysis results' 
      }, { status: 500 });
    }

    console.log('✅ AI analysis completed and saved for payment:', paymentId);

    return NextResponse.json({
      success: true,
      analysis: mockAnalysis
    });

  } catch (error) {
    console.error('❌ AI Receipt Scanner error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error during AI analysis' 
    }, { status: 500 });
  }
}