import { NextRequest, NextResponse } from 'next/server';
import { paymentVerificationService } from '@/app/lib/paymentVerificationService';

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const success = await paymentVerificationService.verifyPaymentManually(paymentId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Payment verification triggered successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to trigger payment verification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Manual verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
