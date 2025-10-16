"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

interface PaymentSubmissionProps {
  plan: string;
  billing: 'monthly' | 'yearly';
  onSuccess: () => void;
  onCancel: () => void;
}

interface PricingConfig {
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
}

const PLAN_CONFIGS: Record<string, PricingConfig> = {
  professional: {
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    currency: 'USD',
    features: [
      'Unlimited quiz generations',
      'Advanced AI models',
      'Priority support',
      'Export to PDF/Word',
      'Custom branding'
    ]
  },
  mastery: {
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    currency: 'USD',
    features: [
      'Everything in Professional',
      '3D interactive quizzes',
      'Video integration',
      'Analytics dashboard',
      'API access'
    ]
  },
  innovation: {
    monthlyPrice: 39.99,
    yearlyPrice: 399.99,
    currency: 'USD',
    features: [
      'Everything in Mastery',
      'Custom AI training',
      'White-label solution',
      'Dedicated support',
      'Custom integrations'
    ]
  }
};

export default function PaymentSubmission({ plan, billing, onSuccess, onCancel }: PaymentSubmissionProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'upload' | 'processing' | 'success'>('form');
  const [formData, setFormData] = useState({
    paymentMethod: '',
    transactionId: '',
    notes: ''
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const config = PLAN_CONFIGS[plan];
  const price = billing === 'yearly' ? config.yearlyPrice : config.monthlyPrice;

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Upload proof file if provided
      let proofUrl: string | null = null;
      if (proofFile) {
        const supabase = getSupabaseBrowser();
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payments')
          .upload(fileName, proofFile);

        if (uploadError) {
          console.warn('File upload failed:', uploadError);
          // Continue without proof
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('payments')
            .getPublicUrl(fileName);
          proofUrl = publicUrl;
        }
      }

      // Submit payment
      const response = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billing,
          amount: price,
          currency: config.currency,
          paymentMethod: formData.paymentMethod,
          transactionId: formData.transactionId,
          notes: formData.notes,
          proofUrl
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment submission failed');
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Payment submission error:', err);
      setError(err instanceof Error ? err.message : 'Payment submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('File must be an image (JPEG, PNG, GIF) or PDF');
        return;
      }
      setProofFile(file);
      setError(null);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md w-full border border-white/20">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Submitted!</h2>
          <p className="text-gray-300 mb-4">
            Your payment for <span className="font-semibold text-purple-300">{plan}</span> plan has been submitted for review.
          </p>
          <p className="text-sm text-gray-400">
            You'll receive an email confirmation once approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Complete Your Upgrade
          </h1>
          <p className="text-gray-300">
            Upgrade to <span className="font-semibold text-purple-300">{plan}</span> plan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Plan Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Plan:</span>
                <span className="text-white font-semibold capitalize">{plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Billing:</span>
                <span className="text-white font-semibold capitalize">{billing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Amount:</span>
                <span className="text-white font-semibold text-lg">
                  {config.currency} {price}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-3">Features Included:</h4>
              <ul className="space-y-2">
                {config.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Payment Information</h3>
            
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                >
                  <option value="">Select payment method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Credit/Debit Card</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                  placeholder="Enter your transaction ID"
                  required
                  className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Proof (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Upload receipt, screenshot, or proof of payment (max 10MB)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional information..."
                  rows={3}
                  className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
