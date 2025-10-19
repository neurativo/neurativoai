import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import OpenAI from 'openai';
import { PDFConverterV2 } from '@/lib/pdf-converter-v2';

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
    let imageUrl = receiptImageUrl;
    
    if (isPdf) {
      console.log('📄 PDF detected, converting to image...');
      
      try {
        // Convert PDF to image using improved converter
        const conversionResult = await PDFConverterV2.convertPDFToImage(receiptImageUrl);
        
        if (!conversionResult.success) {
          throw new Error(conversionResult.error || 'PDF conversion failed');
        }
        
        imageUrl = conversionResult.imageUrl!;
        console.log('✅ PDF converted to image:', imageUrl);
        
      } catch (conversionError) {
        console.error('❌ PDF conversion failed:', conversionError);
        
        // Fallback for PDF conversion failure
        const fallbackAnalysis = {
          transactionReference: 'PDF-CONVERSION-FAILED',
          amount: 0,
          currency: 'LKR',
          paymentMethod: 'bank',
          bankDetails: {
            accountNumber: 'PDF-CONVERSION-FAILED',
            bankName: 'PDF-CONVERSION-FAILED'
          },
          merchantDetails: {
            name: 'PDF-CONVERSION-FAILED',
            address: 'PDF-CONVERSION-FAILED'
          },
          validationStatus: 'unclear',
          confidence: 0.1,
          extractedText: 'PDF conversion failed - manual review required',
          recommendations: [
            'PDF conversion to image failed',
            'Please convert PDF to image format manually (PNG, JPEG, GIF, WebP)',
            'Take a screenshot of the PDF and upload as image',
            'Use online PDF to image converter tools',
            'Manual review required for PDF receipts'
          ],
          fraudIndicators: [],
          metadata: {
            fileType: 'PDF',
            analysisMethod: 'conversion_failed',
            error: conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'
          }
        };

        await updatePaymentWithAnalysis(paymentId, fallbackAnalysis);
        
        return NextResponse.json({
          success: true,
          analysis: fallbackAnalysis
        });
      }
    }

    // For image files (or converted PDFs), proceed with AI analysis
    console.log('🖼️ Processing image for AI analysis:', imageUrl);
    
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
                  url: imageUrl
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
      const analysis = parseOpenAIResponse(analysisText, isPdf, imageUrl !== receiptImageUrl);
      
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
function parseOpenAIResponse(analysisText: string, isPdf: boolean, wasConverted: boolean = false) {
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
      isPdf && wasConverted ? 'PDF converted to image and analyzed' : 
      isPdf ? 'PDF analysis completed' : 'Image analysis completed',
      confidence > 0.7 ? 'High confidence analysis' : 'Low confidence analysis',
      fraudIndicators.length > 0 ? 'Fraud indicators detected' : 'No fraud indicators'
    ],
    fraudIndicators: fraudIndicators,
    metadata: {
      fileType: isPdf ? 'PDF' : 'IMAGE',
      analysisMethod: 'openai_vision',
      timestamp: new Date().toISOString(),
      rawResponse: analysisText,
      wasConverted: wasConverted
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