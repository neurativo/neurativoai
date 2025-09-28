"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/app/lib/supabaseClient';

interface PaymentMethod {
  id: string;
  name: string;
  symbol: string;
  network: string;
  depositAddress: string;
  minAmount: number;
  maxAmount?: number;
  confirmationBlocks: number;
}

interface CryptoPaymentFormProps {
  planId?: string;
  onPaymentSubmitted?: (payment: any) => void;
  onError?: (error: string) => void;
}

export default function CryptoPaymentForm({ 
  planId, 
  onPaymentSubmitted, 
  onError 
}: CryptoPaymentFormProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [txId, setTxId] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/crypto-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_payment_methods' })
      });

      const data = await response.json();
      if (data.success) {
        setPaymentMethods(data.methods);
        if (data.methods.length > 0) {
          setSelectedMethod(data.methods[0]);
        }
      } else {
        setError('Failed to load payment methods');
      }
    } catch (err) {
      setError('Failed to load payment methods');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !txId.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to submit payment');
        return;
      }

      const response = await fetch('/api/crypto-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_payment',
          userId: user.id,
          paymentMethodId: selectedMethod.id,
          txId: txId.trim(),
          fromAddress: fromAddress.trim() || undefined,
          planId
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Payment submitted successfully! Verification in progress...');
        setTxId('');
        setFromAddress('');
        onPaymentSubmitted?.(data.payment);
      } else {
        setError(data.error || 'Failed to submit payment');
        onError?.(data.error || 'Failed to submit payment');
      }
    } catch (err) {
      const errorMessage = 'Failed to submit payment';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Crypto Payment</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Cryptocurrency
          </label>
          <select
            value={selectedMethod?.id || ''}
            onChange={(e) => {
              const method = paymentMethods.find(m => m.id === e.target.value);
              setSelectedMethod(method || null);
            }}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a cryptocurrency</option>
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name} ({method.symbol}) - {method.network}
              </option>
            ))}
          </select>
        </div>

        {/* Deposit Address Display */}
        {selectedMethod && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send to this address:
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 bg-white border rounded text-sm font-mono break-all">
                {selectedMethod.depositAddress}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(selectedMethod.depositAddress)}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Minimum: {selectedMethod.minAmount} {selectedMethod.symbol}
              {selectedMethod.maxAmount && ` | Maximum: ${selectedMethod.maxAmount} ${selectedMethod.symbol}`}
            </p>
            <p className="text-xs text-gray-600">
              Required confirmations: {selectedMethod.confirmationBlocks}
            </p>
          </div>
        )}

        {/* Transaction ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction ID (TxID)
          </label>
          <input
            type="text"
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="Enter your transaction hash/ID"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-600 mt-1">
            This is the unique identifier for your transaction on the blockchain
          </p>
        </div>

        {/* From Address Input (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Address (Optional)
          </label>
          <input
            type="text"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="Enter the address you sent from (optional)"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-600 mt-1">
            Helps with verification if provided
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedMethod || !txId.trim()}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment'}
        </button>
      </form>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How to Pay:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Select your preferred cryptocurrency above</li>
          <li>Send the exact amount to the deposit address shown</li>
          <li>Wait for the required number of confirmations</li>
          <li>Copy your transaction ID and paste it in the form</li>
          <li>Click "Submit Payment" to start verification</li>
        </ol>
        <p className="text-xs text-blue-700 mt-3">
          <strong>Note:</strong> Payments are automatically verified using blockchain explorers. 
          This process usually takes a few minutes to complete.
        </p>
      </div>
    </div>
  );
}
