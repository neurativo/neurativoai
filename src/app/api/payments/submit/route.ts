import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { 
      plan, 
      billing, 
      amount, 
      currency, 
      paymentMethod, 
      transactionId, 
      notes, 
      proofUrl
    } = await request.json();
    
    // Validate required fields
    if (!plan || !billing || !amount || !currency || !paymentMethod || !transactionId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate payment method
    if (!['bank', 'binance'].includes(paymentMethod)) {
      return NextResponse.json({ 
        error: 'Invalid payment method. Must be "bank" or "binance"' 
      }, { status: 400 });
    }

    // Validate billing
    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json({ 
        error: 'Invalid billing period' 
      }, { status: 400 });
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid authentication' 
      }, { status: 401 });
    }

    // Try to get plan details from subscription_plans table (new system)
    let planData: { id: string; name: string; monthly_price: number; yearly_price: number } | null = null;
    const { data: newPlanData, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, monthly_price, yearly_price')
      .eq('name', plan)
      .single();

    if (planError || !newPlanData) {
      // Fallback to old system - use hardcoded pricing
      const PRICING_CONFIG = {
        'free': { monthly_price: 0, yearly_price: 0 },
        'professional': { monthly_price: 5.99, yearly_price: 59.99 },
        'mastery': { monthly_price: 12.99, yearly_price: 129.99 },
        'innovation': { monthly_price: 24.99, yearly_price: 249.99 }
      };
      
      const oldPlanData = PRICING_CONFIG[plan as keyof typeof PRICING_CONFIG];
      if (!oldPlanData) {
        return NextResponse.json({ 
          error: 'Invalid plan' 
        }, { status: 400 });
      }
      
      planData = {
        id: plan, // Use plan name as ID for old system
        name: plan,
        monthly_price: oldPlanData.monthly_price,
        yearly_price: oldPlanData.yearly_price
      };
    } else {
      planData = newPlanData;
    }

    if (!planData) {
      return NextResponse.json({ 
        error: 'Invalid plan' 
      }, { status: 400 });
    }

    // Validate amount matches plan pricing
    // Note: The frontend already handles currency conversion, so we validate against the base USD price
    const expectedAmount = billing === 'yearly' ? planData.yearly_price : planData.monthly_price;
    
    // For LKR, the frontend sends the converted amount, so we need to convert our expected amount
    let expectedAmountInCurrency = expectedAmount;
    if (currency === 'LKR') {
      expectedAmountInCurrency = Math.round(expectedAmount * 300);
    }
    
    if (Math.abs(amount - expectedAmountInCurrency) > 0.01) { // Allow small floating point differences
      return NextResponse.json({ 
        error: `Amount mismatch. Expected ${currency} ${expectedAmountInCurrency} for ${plan} ${billing}` 
      }, { status: 400 });
    }

    // Try to create payment in new user_payments table first
    let payment: any = null;
    
    try {
      const paymentData = {
        user_id: user.id,
        plan_id: planData.id,
        method: paymentMethod,
        amount: amount,
        currency,
        transaction_reference: transactionId,
        proof_url: proofUrl,
        status: 'pending',
        admin_note: notes || null
      };

      const { data: newPayment, error: newPaymentError } = await supabase
        .from('user_payments')
        .insert(paymentData)
        .select()
        .single();

      if (newPaymentError) {
        console.error('Error creating payment in new system:', newPaymentError);
        throw newPaymentError;
      }
      
      payment = newPayment;
      console.log('Payment created successfully in new system:', payment.id);

      // AI Analysis during submission
      if (proofUrl) {
        try {
          const aiAnalysis = await analyzePaymentWithAI(proofUrl, payment, planData);
          
          // Update payment with AI analysis
          const { error: updateError } = await supabase
            .from('user_payments')
            .update({
              ai_analysis: aiAnalysis,
              ai_confidence: aiAnalysis.confidence,
              ai_status: aiAnalysis.validationStatus,
              fraud_score: aiAnalysis.fraudScore,
              auto_approved: aiAnalysis.autoApproved,
              status: aiAnalysis.autoApproved ? 'approved' : 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id);

          if (updateError) {
            console.error('Error updating payment with AI analysis:', updateError);
          } else {
            console.log('Payment updated with AI analysis:', aiAnalysis);
          }
        } catch (aiError) {
          console.error('AI analysis failed during submission:', aiError);
          // Continue with manual review if AI fails
        }
      }
    } catch (newSystemError) {
      console.log('New payment system not available, falling back to old system:', newSystemError);
      
      // Fallback to old payments table
      const oldPaymentData = {
        user_id: user.id,
        plan: plan,
        method: paymentMethod,
        amount_cents: Math.round(amount * 100),
        currency: currency,
        transaction_reference: transactionId, // Fixed: use transaction_reference instead of transaction_id
        proof_url: proofUrl,
        status: 'pending',
        admin_note: notes || null
      };

      const { data: oldPayment, error: oldPaymentError } = await supabase
        .from('payments')
        .insert(oldPaymentData)
        .select()
        .single();

      if (oldPaymentError) {
        console.error('Error creating payment in old system:', oldPaymentError);
        return NextResponse.json({ 
          error: 'Failed to create payment record',
          details: oldPaymentError.message,
          code: oldPaymentError.code
        }, { status: 500 });
      }
      
      payment = oldPayment;
      console.log('Payment created successfully in old system:', payment.id);
    }

    console.log('Payment created:', payment?.id);

    return NextResponse.json({ 
      success: true,
      paymentId: payment?.id,
      message: 'Payment submitted successfully'
    });

  } catch (error) {
    console.error('Payment submission error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Comprehensive AI Analysis with Fraud Detection
async function analyzePaymentWithAI(imageUrl: string, payment: any, planData: any) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Calculate image hash for duplicate detection
  const imageHash = await calculateImageHash(imageUrl);
  
  // Check for duplicate image usage
  const supabase = getSupabaseServer();
  const { data: duplicateCheck } = await supabase
    .from('user_payments')
    .select('id, user_id, created_at')
    .eq('image_hash', imageHash)
    .neq('id', payment.id);

  // Check for duplicate transaction reference
  const { data: duplicateRef } = await supabase
    .from('user_payments')
    .select('id, user_id, created_at')
    .eq('transaction_reference', payment.transaction_reference)
    .neq('id', payment.id);

  // Prepare comprehensive prompt for OpenAI
  const prompt = `
Analyze this payment receipt image with FRAUD DETECTION focus:

EXPECTED PAYMENT:
- Plan: ${planData.name}
- Amount: ${payment.amount} ${payment.currency}
- Method: ${payment.method}
- Reference: ${payment.transaction_reference}

FRAUD DETECTION TASKS:
1. Extract transaction details (reference, amount, currency, method)
2. Check for image manipulation signs (watermarks, inconsistent fonts, blur edits)
3. Verify EXIF metadata consistency
4. Analyze receipt authenticity (format, bank details, etc.)
5. Cross-reference with expected payment details

RESPOND WITH JSON:
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
  "fraudIndicators": {
    "imageManipulation": boolean,
    "inconsistentFonts": boolean,
    "blurredEdits": boolean,
    "watermarkDetection": boolean,
    "exifInconsistency": boolean
  },
  "receiptAuthenticity": {
    "formatConsistency": boolean,
    "bankDetailsMatch": boolean,
    "amountConsistency": boolean
  },
  "analysis": "detailed analysis of findings",
  "riskScore": 0.0 to 1.0
}

Be extremely thorough in fraud detection analysis.
`;

  try {
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
        max_tokens: 1500,
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

    const parsed = JSON.parse(content);
    
    // Calculate fraud score based on multiple factors
    const fraudScore = calculateFraudScore(parsed, duplicateCheck || [], duplicateRef || [], payment);
    
    // Determine auto-approval based on confidence and fraud score
    const autoApproved = parsed.confidence > 0.85 && fraudScore < 0.3;
    const needsReview = parsed.confidence >= 0.6 && parsed.confidence <= 0.85;
    const lowConfidence = parsed.confidence < 0.6;

    return {
      transactionReference: parsed.transactionReference,
      amount: parsed.amount,
      currency: parsed.currency,
      paymentMethod: parsed.paymentMethod,
      bankDetails: parsed.bankDetails || {},
      binanceDetails: parsed.binanceDetails || {},
      confidence: parsed.confidence || 0.5,
      extractedText: parsed.extractedText || '',
      fraudIndicators: parsed.fraudIndicators || {},
      receiptAuthenticity: parsed.receiptAuthenticity || {},
      fraudScore: fraudScore,
      autoApproved: autoApproved,
      needsReview: needsReview,
      lowConfidence: lowConfidence,
      validationStatus: autoApproved ? 'valid' : (lowConfidence ? 'invalid' : 'unclear'),
      recommendations: generateRecommendations(parsed, fraudScore, duplicateCheck || [], duplicateRef || [], payment),
      imageHash: imageHash,
      analysis: parsed.analysis || ''
    };

  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      transactionReference: undefined,
      amount: undefined,
      currency: undefined,
      paymentMethod: undefined,
      bankDetails: {},
      binanceDetails: {},
      confidence: 0,
      fraudScore: 1.0,
      autoApproved: false,
      needsReview: false,
      lowConfidence: true,
      validationStatus: 'invalid',
      recommendations: ['AI analysis failed - manual review required'],
      extractedText: '',
      fraudIndicators: {},
      receiptAuthenticity: {}
    };
  }
}

// Calculate image hash for duplicate detection
async function calculateImageHash(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    return crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');
  } catch (error) {
    console.error('Error calculating image hash:', error);
    return crypto.createHash('sha256').update(imageUrl).digest('hex');
  }
}

// Calculate comprehensive fraud score
function calculateFraudScore(aiAnalysis: any, duplicateCheck: any[], duplicateRef: any[], payment: any): number {
  let fraudScore = 0;
  
  // Base fraud indicators from AI
  if (aiAnalysis.fraudIndicators) {
    if (aiAnalysis.fraudIndicators.imageManipulation) fraudScore += 0.3;
    if (aiAnalysis.fraudIndicators.inconsistentFonts) fraudScore += 0.2;
    if (aiAnalysis.fraudIndicators.blurredEdits) fraudScore += 0.2;
    if (aiAnalysis.fraudIndicators.watermarkDetection) fraudScore += 0.3;
    if (aiAnalysis.fraudIndicators.exifInconsistency) fraudScore += 0.2;
  }
  
  // Duplicate image usage
  if (duplicateCheck && duplicateCheck.length > 0) {
    fraudScore += 0.4; // High risk for reused images
  }
  
  // Duplicate transaction reference
  if (duplicateRef && duplicateRef.length > 0) {
    fraudScore += 0.5; // Very high risk for reused transaction IDs
  }
  
  // Receipt authenticity issues
  if (aiAnalysis.receiptAuthenticity) {
    if (!aiAnalysis.receiptAuthenticity.formatConsistency) fraudScore += 0.1;
    if (!aiAnalysis.receiptAuthenticity.bankDetailsMatch) fraudScore += 0.2;
    if (!aiAnalysis.receiptAuthenticity.amountConsistency) fraudScore += 0.3;
  }
  
  // Amount mismatch
  if (aiAnalysis.amount && aiAnalysis.amount !== 0) {
    const expectedAmount = aiAnalysis.currency === 'LKR' && payment.currency === 'USD' ? 
      payment.amount * 300 : payment.amount;
    const tolerance = Math.max(expectedAmount * 0.05, 0.01);
    
    if (Math.abs(aiAnalysis.amount - expectedAmount) > tolerance) {
      fraudScore += 0.2;
    }
  }
  
  return Math.min(fraudScore, 1.0); // Cap at 1.0
}

// Generate detailed recommendations
function generateRecommendations(aiAnalysis: any, fraudScore: number, duplicateCheck: any[], duplicateRef: any[], payment: any): string[] {
  const recommendations: string[] = [];
  
  if (fraudScore > 0.7) {
    recommendations.push('🚨 HIGH FRAUD RISK - Immediate manual review required');
  } else if (fraudScore > 0.4) {
    recommendations.push('⚠️ MEDIUM FRAUD RISK - Detailed review recommended');
  }
  
  if (duplicateCheck && duplicateCheck.length > 0) {
    recommendations.push(`🚫 DUPLICATE IMAGE DETECTED - Same receipt used by ${duplicateCheck.length} other user(s)`);
  }
  
  if (duplicateRef && duplicateRef.length > 0) {
    recommendations.push(`🚫 DUPLICATE TRANSACTION ID - Reference ${aiAnalysis.transactionReference} already used`);
  }
  
  if (aiAnalysis.fraudIndicators?.imageManipulation) {
    recommendations.push('🔍 IMAGE MANIPULATION DETECTED - Receipt may be edited');
  }
  
  if (aiAnalysis.fraudIndicators?.inconsistentFonts) {
    recommendations.push('🔍 INCONSISTENT FONTS - Receipt format appears suspicious');
  }
  
  if (aiAnalysis.amount && aiAnalysis.amount !== 0) {
    const expectedAmount = aiAnalysis.currency === 'LKR' && payment.currency === 'USD' ? 
      payment.amount * 300 : payment.amount;
    const tolerance = Math.max(expectedAmount * 0.05, 0.01);
    
    if (Math.abs(aiAnalysis.amount - expectedAmount) > tolerance) {
      recommendations.push(`💰 AMOUNT MISMATCH - Expected: ${payment.amount} ${payment.currency}, Found: ${aiAnalysis.amount} ${aiAnalysis.currency}`);
    }
  }
  
  if (aiAnalysis.confidence > 0.85 && fraudScore < 0.3) {
    recommendations.push('✅ HIGH CONFIDENCE - Auto-approval recommended');
  } else if (aiAnalysis.confidence >= 0.6) {
    recommendations.push('👀 MEDIUM CONFIDENCE - Admin review recommended');
  } else {
    recommendations.push('❌ LOW CONFIDENCE - Manual verification required');
  }
  
  return recommendations;
}
