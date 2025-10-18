import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

interface ReceiptScanResult {
  transactionReference?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  bankDetails?: {
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
  };
  binanceDetails?: {
    binanceId?: string;
  };
  confidence: number;
  extractedText: string;
  validationStatus: 'valid' | 'invalid' | 'unclear';
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId, receiptImageUrl } = await request.json();

    if (!paymentId || !receiptImageUrl) {
      return NextResponse.json({ 
        error: 'Payment ID and receipt image URL are required' 
      }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('user_payments')
      .select(`
        *,
        subscription_plans!inner(name, monthly_price, yearly_price)
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ 
        error: 'Payment not found' 
      }, { status: 404 });
    }

    // AI Receipt Scanning Logic
    const scanResult = await scanReceiptWithAI(receiptImageUrl, payment);

    // Store AI analysis results
    const { error: updateError } = await supabase
      .from('user_payments')
      .update({
        ai_analysis: scanResult,
        ai_confidence: scanResult.confidence,
        ai_status: scanResult.validationStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error updating payment with AI analysis:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      analysis: scanResult 
    });

  } catch (error) {
    console.error('AI receipt scanner error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function scanReceiptWithAI(receiptImageUrl: string, payment: any): Promise<ReceiptScanResult> {
  // This is a mock implementation - in production, you'd use:
  // - OpenAI Vision API
  // - Google Cloud Vision API
  // - AWS Textract
  // - Or a specialized OCR service

  try {
    // Mock AI analysis - replace with actual AI service
    const mockAnalysis: ReceiptScanResult = {
      transactionReference: extractTransactionReference(receiptImageUrl),
      amount: extractAmount(receiptImageUrl),
      currency: extractCurrency(receiptImageUrl),
      paymentMethod: extractPaymentMethod(receiptImageUrl),
      bankDetails: extractBankDetails(receiptImageUrl),
      binanceDetails: extractBinanceDetails(receiptImageUrl),
      confidence: calculateConfidence(receiptImageUrl, payment),
      extractedText: await extractTextFromImage(receiptImageUrl),
      validationStatus: 'unclear',
      recommendations: []
    };

    // Validate against submitted payment
    const validation = validatePayment(mockAnalysis, payment);
    mockAnalysis.validationStatus = validation.status;
    mockAnalysis.recommendations = validation.recommendations;

    return mockAnalysis;

  } catch (error) {
    console.error('AI scanning error:', error);
    return {
      confidence: 0,
      extractedText: '',
      validationStatus: 'invalid',
      recommendations: ['Failed to process receipt image']
    };
  }
}

function extractTransactionReference(imageUrl: string): string | undefined {
  // Mock implementation - replace with actual OCR
  // Look for patterns like: "Ref: 12345", "Transaction ID: ABC123", etc.
  return 'MOCK_REF_' + Math.random().toString(36).substr(2, 9);
}

function extractAmount(imageUrl: string): number | undefined {
  // Mock implementation - replace with actual OCR
  // Look for currency amounts in the image
  return 5.99; // Mock amount
}

function extractCurrency(imageUrl: string): string | undefined {
  // Mock implementation - replace with actual OCR
  return 'USD';
}

function extractPaymentMethod(imageUrl: string): string | undefined {
  // Mock implementation - replace with actual OCR
  return 'bank';
}

function extractBankDetails(imageUrl: string): any {
  // Mock implementation - replace with actual OCR
  return {
    accountNumber: '1234567890',
    accountName: 'Neurativo Official',
    bankName: 'Commercial Bank'
  };
}

function extractBinanceDetails(imageUrl: string): any {
  // Mock implementation - replace with actual OCR
  return {
    binanceId: 'MOCK_BINANCE_123'
  };
}

function calculateConfidence(imageUrl: string, payment: any): number {
  // Mock implementation - replace with actual confidence calculation
  return Math.random() * 0.4 + 0.6; // 60-100% confidence
}

async function extractTextFromImage(imageUrl: string): Promise<string> {
  // Mock implementation - replace with actual OCR
  return `Mock extracted text from receipt image: ${imageUrl}`;
}

function validatePayment(analysis: ReceiptScanResult, payment: any): { status: 'valid' | 'invalid' | 'unclear', recommendations: string[] } {
  const recommendations: string[] = [];
  let validCount = 0;
  let totalChecks = 0;

  // Check transaction reference match
  if (analysis.transactionReference && payment.transaction_reference) {
    totalChecks++;
    if (analysis.transactionReference.toLowerCase().includes(payment.transaction_reference.toLowerCase()) ||
        payment.transaction_reference.toLowerCase().includes(analysis.transactionReference.toLowerCase())) {
      validCount++;
    } else {
      recommendations.push('Transaction reference mismatch - verify manually');
    }
  }

  // Check amount match
  if (analysis.amount && payment.amount) {
    totalChecks++;
    const expectedAmount = payment.currency === 'LKR' ? 
      payment.amount * 300 : // Convert USD to LKR (approximate)
      payment.amount;
    
    if (Math.abs(analysis.amount - expectedAmount) < 0.01) {
      validCount++;
    } else {
      recommendations.push(`Amount mismatch - Expected: ${expectedAmount}, Found: ${analysis.amount}`);
    }
  }

  // Check currency match
  if (analysis.currency && payment.currency) {
    totalChecks++;
    if (analysis.currency === payment.currency) {
      validCount++;
    } else {
      recommendations.push(`Currency mismatch - Expected: ${payment.currency}, Found: ${analysis.currency}`);
    }
  }

  // Check payment method match
  if (analysis.paymentMethod && payment.method) {
    totalChecks++;
    if (analysis.paymentMethod === payment.method) {
      validCount++;
    } else {
      recommendations.push(`Payment method mismatch - Expected: ${payment.method}, Found: ${analysis.paymentMethod}`);
    }
  }

  // Determine validation status
  let status: 'valid' | 'invalid' | 'unclear';
  if (totalChecks === 0) {
    status = 'unclear';
    recommendations.push('Unable to extract payment details from receipt');
  } else if (validCount === totalChecks) {
    status = 'valid';
    recommendations.push('All details match - payment appears valid');
  } else if (validCount === 0) {
    status = 'invalid';
    recommendations.push('No matching details found - payment likely invalid');
  } else {
    status = 'unclear';
    recommendations.push('Partial match - manual review recommended');
  }

  return { status, recommendations };
}
