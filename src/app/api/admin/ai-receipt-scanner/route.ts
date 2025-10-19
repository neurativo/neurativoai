import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import OpenAI from 'openai';

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

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Check if it's a PDF file
    const isPdf = receiptImageUrl.toLowerCase().includes('.pdf');
    
    if (isPdf) {
      console.log('📄 PDF detected, attempting to process with OpenAI Vision...');
      
      try {
        // For PDFs, we'll try to process them directly with OpenAI Vision
        // OpenAI Vision can handle some PDFs, but for better results, convert to image first
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this payment receipt and extract the following information:
                  1. Transaction reference/ID
                  2. Amount paid
                  3. Currency
                  4. Payment method (bank transfer, etc.)
                  5. Bank details (account number, bank name)
                  6. Merchant details
                  7. Date of transaction
                  8. Any suspicious patterns or fraud indicators
                  
                  Please provide a detailed analysis with confidence scores. If this is a PDF and you cannot read it properly, indicate that manual review is needed.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: receiptImageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        });

        const analysisText = response.choices[0]?.message?.content || 'No analysis available';
        console.log('🤖 OpenAI analysis result:', analysisText);

        // Parse the analysis and create structured data
        const analysis = parseOpenAIResponse(analysisText, isPdf);
        
        // Update the payment record with AI analysis
        await updatePaymentWithAnalysis(paymentId, analysis);
        
        return NextResponse.json({
          success: true,
          analysis: analysis
        });

      } catch (error) {
        console.error('❌ OpenAI PDF analysis failed:', error);
        
        // Fallback for PDF analysis failure
        const fallbackAnalysis = {
          transactionReference: 'PDF-ANALYSIS-FAILED',
          amount: 0,
          currency: 'LKR',
          paymentMethod: 'bank',
          bankDetails: {
            accountNumber: 'PDF-ANALYSIS-FAILED',
            bankName: 'PDF-ANALYSIS-FAILED'
          },
          merchantDetails: {
            name: 'PDF-ANALYSIS-FAILED',
            address: 'PDF-ANALYSIS-FAILED'
          },
          validationStatus: 'unclear',
          confidence: 0.1,
          extractedText: 'PDF analysis failed - manual review required',
          recommendations: [
            'PDF file could not be processed by AI',
            'Manual review required for PDF receipts',
            'Consider converting PDF to image format'
          ],
          fraudIndicators: [],
          metadata: {
            fileType: 'PDF',
            analysisMethod: 'openai_failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        };

        await updatePaymentWithAnalysis(paymentId, fallbackAnalysis);
        
        return NextResponse.json({
          success: true,
          analysis: fallbackAnalysis
        });
      }
    }

    // For image files, proceed with AI analysis
    console.log('🖼️ Image file detected, proceeding with OpenAI Vision analysis...');
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this payment receipt image and extract the following information:
                1. Transaction reference/ID
                2. Amount paid
                3. Currency
                4. Payment method (bank transfer, etc.)
                5. Bank details (account number, bank name)
                6. Merchant details
                7. Date of transaction
                8. Any suspicious patterns or fraud indicators
                
                Please provide a detailed analysis with confidence scores.`
              },
              {
                type: "image_url",
                image_url: {
                  url: receiptImageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      const analysisText = response.choices[0]?.message?.content || 'No analysis available';
      console.log('🤖 OpenAI analysis result:', analysisText);

      // Parse the analysis and create structured data
      const analysis = parseOpenAIResponse(analysisText, false);
      
      // Update the payment record with AI analysis
      await updatePaymentWithAnalysis(paymentId, analysis);
      
      return NextResponse.json({
        success: true,
        analysis: analysis
      });

    } catch (error) {
      console.error('❌ OpenAI image analysis failed:', error);
      
      // Fallback for image analysis failure
      const fallbackAnalysis = {
        transactionReference: 'ANALYSIS-FAILED',
        amount: 0,
        currency: 'LKR',
        paymentMethod: 'bank',
        bankDetails: {
          accountNumber: 'ANALYSIS-FAILED',
          bankName: 'ANALYSIS-FAILED'
        },
        merchantDetails: {
          name: 'ANALYSIS-FAILED',
          address: 'ANALYSIS-FAILED'
        },
        validationStatus: 'unclear',
        confidence: 0.1,
        extractedText: 'Image analysis failed - manual review required',
        recommendations: [
          'Image could not be processed by AI',
          'Manual review required',
          'Check image quality and format'
        ],
        fraudIndicators: [],
        metadata: {
          fileType: 'IMAGE',
          analysisMethod: 'openai_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };

      await updatePaymentWithAnalysis(paymentId, fallbackAnalysis);
      
      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis
      });
    }

  } catch (error) {
    console.error('❌ AI Receipt Scanner error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error during AI analysis' 
    }, { status: 500 });
  }
}

// Helper function to parse OpenAI response into structured data
function parseOpenAIResponse(analysisText: string, isPdf: boolean) {
  console.log('🔍 Parsing OpenAI response...');
  
  // Extract key information using regex patterns
  const transactionRefMatch = analysisText.match(/(?:transaction|reference|id)[\s:]*([A-Za-z0-9\-_]+)/i);
  const amountMatch = analysisText.match(/(?:amount|total)[\s:]*([0-9,]+\.?[0-9]*)/i);
  const currencyMatch = analysisText.match(/(?:currency|currency)[\s:]*([A-Z]{3})/i);
  const bankMatch = analysisText.match(/(?:bank|account)[\s:]*([A-Za-z0-9\s\-_]+)/i);
  
  // Determine confidence based on extracted data quality
  let confidence = 0.5;
  if (transactionRefMatch && amountMatch) confidence += 0.3;
  if (bankMatch) confidence += 0.2;
  
  // Determine validation status
  let validationStatus = 'unclear';
  if (confidence > 0.8) validationStatus = 'valid';
  else if (confidence < 0.4) validationStatus = 'invalid';
  
  // Extract fraud indicators
  const fraudIndicators: string[] = [];
  if (analysisText.toLowerCase().includes('suspicious') || 
      analysisText.toLowerCase().includes('fraud') ||
      analysisText.toLowerCase().includes('unusual')) {
    fraudIndicators.push('Suspicious patterns detected');
  }
  
  return {
    transactionReference: transactionRefMatch?.[1] || 'NOT-FOUND',
    amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0,
    currency: currencyMatch?.[1] || 'LKR',
    paymentMethod: 'bank',
    bankDetails: {
      accountNumber: bankMatch?.[1] || 'NOT-FOUND',
      bankName: 'NOT-FOUND'
    },
    merchantDetails: {
      name: 'NOT-FOUND',
      address: 'NOT-FOUND'
    },
    validationStatus: validationStatus as 'valid' | 'invalid' | 'unclear',
    confidence: Math.min(confidence, 1.0),
    extractedText: analysisText,
    recommendations: [
      isPdf ? 'PDF analysis completed' : 'Image analysis completed',
      confidence > 0.7 ? 'High confidence analysis' : 'Low confidence analysis',
      fraudIndicators.length > 0 ? 'Fraud indicators detected' : 'No fraud indicators'
    ],
    fraudIndicators: fraudIndicators,
    metadata: {
      fileType: isPdf ? 'PDF' : 'IMAGE',
      analysisMethod: 'openai_vision',
      timestamp: new Date().toISOString(),
      rawResponse: analysisText
    }
  };
}

// Helper function to update payment with analysis results
async function updatePaymentWithAnalysis(paymentId: string, analysis: any) {
  const supabase = getSupabaseServer();
  
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      ai_analysis: analysis,
      ai_confidence: analysis.confidence,
      ai_status: analysis.validationStatus,
      fraud_score: analysis.fraudIndicators.length > 0 ? 0.8 : 0.2,
      auto_approved: analysis.confidence > 0.85 && analysis.validationStatus === 'valid',
      needs_review: analysis.confidence >= 0.6 && analysis.confidence < 0.85,
      low_confidence: analysis.confidence < 0.6,
      image_hash: `hash_${Date.now()}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentId);

  if (updateError) {
    console.error('❌ Failed to update payment with AI analysis:', updateError);
    throw new Error('Failed to save AI analysis results');
  }

  console.log('✅ AI analysis completed and saved for payment:', paymentId);
}