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
  try {
    // Use OpenAI Vision API for receipt analysis
    const analysis = await analyzeReceiptWithOpenAI(receiptImageUrl, payment);
    
    // Validate against submitted payment
    const validation = validatePayment(analysis, payment);
    
    return {
      ...analysis,
      validationStatus: validation.status,
      recommendations: validation.recommendations
    };

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

async function analyzeReceiptWithOpenAI(imageUrl: string, payment: any) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Prepare the prompt for OpenAI Vision
  const prompt = `
Analyze this payment receipt image and extract the following information:

1. Transaction Reference/ID (look for: Ref, Transaction ID, Reference, etc.)
2. Amount paid (look for currency amounts)
3. Currency (USD, LKR, etc.)
4. Payment method (Bank Transfer, Binance, etc.)
5. Bank details if visible (Account Number, Account Name, Bank Name)
6. Binance ID if visible

Expected payment details:
- Plan: ${payment.subscription_plans?.name || 'Unknown'}
- Amount: ${payment.amount} ${payment.currency}
- Method: ${payment.method}
- Reference: ${payment.transaction_reference}

Please respond with a JSON object containing:
{
  "transactionReference": "extracted reference or null",
  "amount": number or null,
  "currency": "extracted currency or null", 
  "paymentMethod": "extracted method or null",
  "bankDetails": {
    "accountNumber": "extracted account number or null",
    "accountName": "extracted account name or null", 
    "bankName": "extracted bank name or null"
  },
  "binanceDetails": {
    "binanceId": "extracted binance ID or null"
  },
  "confidence": 0.0 to 1.0,
  "extractedText": "all text visible in the image",
  "analysis": "brief analysis of what you found"
}

Be very careful with amount matching - consider currency conversion if needed.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    // Parse the JSON response from OpenAI
    const parsed = JSON.parse(content);
    
    return {
      transactionReference: parsed.transactionReference,
      amount: parsed.amount,
      currency: parsed.currency,
      paymentMethod: parsed.paymentMethod,
      bankDetails: parsed.bankDetails || {},
      binanceDetails: parsed.binanceDetails || {},
      confidence: parsed.confidence || 0.5,
      extractedText: parsed.extractedText || '',
      validationStatus: 'unclear' as const,
      recommendations: []
    };
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', parseError);
    console.log('Raw response:', content);
    
    // Fallback: try to extract basic info from text
    return {
      transactionReference: undefined,
      amount: undefined,
      currency: undefined,
      paymentMethod: undefined,
      bankDetails: {},
      binanceDetails: {},
      confidence: 0.3,
      extractedText: content,
      validationStatus: 'unclear' as const,
      recommendations: ['AI response could not be parsed - manual review required']
    };
  }
}

// Removed mock functions - now using OpenAI Vision API directly

function validatePayment(analysis: ReceiptScanResult, payment: any): { status: 'valid' | 'invalid' | 'unclear', recommendations: string[] } {
  const recommendations: string[] = [];
  let validCount = 0;
  let totalChecks = 0;

  // Check transaction reference match (more flexible matching)
  if (analysis.transactionReference && payment.transaction_reference) {
    totalChecks++;
    const aiRef = analysis.transactionReference.toLowerCase().replace(/[^a-z0-9]/g, '');
    const paymentRef = payment.transaction_reference.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (aiRef.includes(paymentRef) || paymentRef.includes(aiRef) || aiRef === paymentRef) {
      validCount++;
    } else {
      recommendations.push(`Transaction reference mismatch - Expected: ${payment.transaction_reference}, Found: ${analysis.transactionReference}`);
    }
  }

  // Check amount match with proper currency conversion
  if (analysis.amount && payment.amount) {
    totalChecks++;
    
    // Convert amounts to same currency for comparison
    let expectedAmount = payment.amount;
    let foundAmount = analysis.amount;
    
    // If currencies are different, convert to USD for comparison
    if (analysis.currency && payment.currency && analysis.currency !== payment.currency) {
      if (analysis.currency === 'LKR' && payment.currency === 'USD') {
        // Convert LKR to USD (approximate rate: 1 USD = 300 LKR)
        foundAmount = analysis.amount / 300;
      } else if (analysis.currency === 'USD' && payment.currency === 'LKR') {
        // Convert USD to LKR
        expectedAmount = payment.amount / 300;
      }
    }
    
    // Allow 5% tolerance for currency conversion and rounding
    const tolerance = Math.max(expectedAmount * 0.05, 0.01);
    
    if (Math.abs(foundAmount - expectedAmount) <= tolerance) {
      validCount++;
    } else {
      recommendations.push(`Amount mismatch - Expected: ${payment.amount} ${payment.currency}, Found: ${analysis.amount} ${analysis.currency || 'unknown'}`);
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
