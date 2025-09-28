// Payment Verification Service
// Handles automatic verification of crypto payments using background jobs

import { createClient } from '@supabase/supabase-js';
import { blockchainVerificationService } from './blockchainVerificationService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PaymentVerificationJob {
  id: string;
  paymentId: string;
  txId: string;
  symbol: string;
  toAddress: string;
  requiredConfirmations: number;
  maxAttempts: number;
  currentAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  nextRunAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentVerificationService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly RETRY_DELAY = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ATTEMPTS = 5;

  constructor() {
    this.start();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Payment verification service started');
    
    // Run immediately
    this.processPayments();
    
    // Then run every 2 minutes
    this.intervalId = setInterval(() => {
      this.processPayments();
    }, 2 * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Payment verification service stopped');
  }

  private async processPayments() {
    try {
      // Get pending payments that need verification
      const { data: payments, error } = await supabase
        .from('crypto_payments')
        .select(`
          id,
          tx_id,
          to_address,
          status,
          verification_attempts,
          required_confirmations,
          last_verification_at,
          expires_at,
          crypto_payment_methods (
            symbol,
            network,
            explorer_api_url,
            explorer_api_key
          )
        `)
        .in('status', ['pending', 'verifying'])
        .lt('verification_attempts', this.MAX_ATTEMPTS)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(this.BATCH_SIZE);

      if (error) {
        console.error('Error fetching payments for verification:', error);
        return;
      }

      if (!payments || payments.length === 0) {
        return;
      }

      console.log(`Processing ${payments.length} payments for verification`);

      // Process each payment
      for (const payment of payments) {
        await this.verifyPayment(payment);
      }
    } catch (error) {
      console.error('Error in payment verification process:', error);
    }
  }

  private async verifyPayment(payment: any) {
    try {
      console.log(`Verifying payment ${payment.id} (${payment.tx_id})`);

      // Update status to verifying
      await supabase
        .from('crypto_payments')
        .update({
          status: 'verifying',
          verification_attempts: payment.verification_attempts + 1,
          last_verification_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      // Verify with blockchain
      const verificationResult = await blockchainVerificationService.verifyPayment(
        payment.crypto_payment_methods.symbol,
        payment.tx_id,
        payment.to_address
      );

      // Record verification attempt
      await supabase
        .from('crypto_payment_verifications')
        .insert({
          payment_id: payment.id,
          verification_type: 'automatic',
          status: verificationResult.success ? 'success' : 'failed',
          explorer_response: verificationResult.rawData,
          error_message: verificationResult.error
        });

      if (!verificationResult.success) {
        console.log(`Verification failed for payment ${payment.id}: ${verificationResult.error}`);
        
        // Check if we should mark as failed
        if (payment.verification_attempts >= this.MAX_ATTEMPTS - 1) {
          await supabase
            .from('crypto_payments')
            .update({ status: 'failed' })
            .eq('id', payment.id);
        } else {
          // Reset to pending for retry
          await supabase
            .from('crypto_payments')
            .update({ status: 'pending' })
            .eq('id', payment.id);
        }
        return;
      }

      // Update payment with verification results
      const updateData: any = {
        confirmation_count: verificationResult.confirmationCount,
        block_height: verificationResult.blockHeight,
        block_hash: verificationResult.blockHash,
        gas_fee: verificationResult.gasFee
      };

      if (verificationResult.confirmed) {
        updateData.status = 'confirmed';
        updateData.verified_at = new Date().toISOString();
        
        // If this is a plan payment, activate the subscription
        if (payment.plan_id) {
          await this.activateSubscription(payment.user_id, payment.plan_id);
        }
        
        console.log(`Payment ${payment.id} confirmed successfully`);
      } else {
        updateData.status = 'pending'; // Will be retried
        console.log(`Payment ${payment.id} needs more confirmations: ${verificationResult.confirmationCount}/${verificationResult.requiredConfirmations}`);
      }

      await supabase
        .from('crypto_payments')
        .update(updateData)
        .eq('id', payment.id);

    } catch (error) {
      console.error(`Error verifying payment ${payment.id}:`, error);
      
      // Mark as failed after max attempts
      if (payment.verification_attempts >= this.MAX_ATTEMPTS - 1) {
        await supabase
          .from('crypto_payments')
          .update({ status: 'failed' })
          .eq('id', payment.id);
      }
    }
  }

  private async activateSubscription(userId: string, planId: string) {
    try {
      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        console.error('Error fetching plan:', planError);
        return;
      }

      // Create or update subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (subError) {
        console.error('Error activating subscription:', subError);
      } else {
        console.log(`Subscription activated for user ${userId} with plan ${plan.name}`);
      }
    } catch (error) {
      console.error('Error in activateSubscription:', error);
    }
  }

  // Manual verification trigger
  async verifyPaymentManually(paymentId: string): Promise<boolean> {
    try {
      const { data: payment, error } = await supabase
        .from('crypto_payments')
        .select(`
          id,
          tx_id,
          to_address,
          status,
          verification_attempts,
          required_confirmations,
          crypto_payment_methods (
            symbol,
            network,
            explorer_api_url,
            explorer_api_key
          )
        `)
        .eq('id', paymentId)
        .single();

      if (error || !payment) {
        console.error('Payment not found:', error);
        return false;
      }

      await this.verifyPayment(payment);
      return true;
    } catch (error) {
      console.error('Manual verification failed:', error);
      return false;
    }
  }

  // Get verification statistics
  async getVerificationStats() {
    try {
      const { data: stats, error } = await supabase
        .from('crypto_payments')
        .select('status, verification_attempts')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        throw error;
      }

      const statusCounts = stats.reduce((acc: any, payment: any) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {});

      const avgAttempts = stats.reduce((sum: number, payment: any) => 
        sum + payment.verification_attempts, 0) / stats.length;

      return {
        totalPayments: stats.length,
        statusBreakdown: statusCounts,
        averageAttempts: avgAttempts || 0,
        last24Hours: true
      };
    } catch (error) {
      console.error('Error getting verification stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const paymentVerificationService = new PaymentVerificationService();
