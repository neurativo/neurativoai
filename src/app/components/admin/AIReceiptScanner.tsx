"use client";

import { useState } from 'react';

interface Payment {
  id: string;
  user_id: string;
  plan_id: number;
  method: string;
  amount: number;
  currency: string;
  transaction_reference: string | null;
  proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  plan_name?: string;
  ai_analysis?: any;
  ai_confidence?: number;
  ai_status?: 'valid' | 'invalid' | 'unclear';
  fraud_score?: number;
  auto_approved?: boolean;
  needs_review?: boolean;
  low_confidence?: boolean;
  image_hash?: string;
  subscription_plans?: {
    id: number;
    name: string;
    monthly_price: number;
    yearly_price: number;
    features: string[];
  };
}

interface AIReceiptScannerProps {
  payment: Payment;
  onScanComplete: (result: any) => void;
  onClose: () => void;
}

interface AIAnalysis {
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

export default function AIReceiptScanner({ payment, onScanComplete, onClose }: AIReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!payment.proof_url) {
      setError('No receipt image available for scanning');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ai-receipt-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          receiptImageUrl: payment.proof_url
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
        onScanComplete(data.analysis);
      } else {
        setError(data.error || 'AI scanning failed');
      }
    } catch (err) {
      setError('Failed to scan receipt');
      console.error('AI scanning error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'invalid': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'unclear': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              🤖 AI Receipt Scanner
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-3">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Plan:</span>
                <span className="text-white ml-2">{payment.plan_name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-400">Amount:</span>
                <span className="text-white ml-2">${payment.amount} {payment.currency}</span>
              </div>
              <div>
                <span className="text-gray-400">Method:</span>
                <span className="text-white ml-2 capitalize">{payment.method}</span>
              </div>
              <div>
                <span className="text-gray-400">Reference:</span>
                <span className="text-white ml-2 font-mono">{payment.transaction_reference}</span>
              </div>
            </div>
          </div>

          {/* Receipt Image */}
          {payment.proof_url && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Receipt Image</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <img
                  src={payment.proof_url}
                  alt="Payment receipt"
                  className="max-w-full h-auto rounded border border-gray-600"
                  style={{ maxHeight: '300px' }}
                />
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {analysis && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">AI Analysis Results</h3>
              
              {/* Status and Confidence */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`p-3 rounded-lg border ${getStatusColor(analysis.validationStatus)}`}>
                  <div className="text-sm font-medium">Validation Status</div>
                  <div className="text-lg font-semibold capitalize">{analysis.validationStatus}</div>
                </div>
                <div className={`p-3 rounded-lg border border-gray-600 ${getConfidenceColor(analysis.confidence)}`}>
                  <div className="text-sm font-medium">AI Confidence</div>
                  <div className="text-lg font-semibold">{(analysis.confidence * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* Extracted Details */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="text-md font-medium text-white mb-3">Extracted Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {analysis.transactionReference && (
                    <div>
                      <span className="text-gray-400">Transaction Ref:</span>
                      <span className="text-white ml-2 font-mono">{analysis.transactionReference}</span>
                    </div>
                  )}
                  {analysis.amount && (
                    <div>
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white ml-2">{analysis.amount} {analysis.currency}</span>
                    </div>
                  )}
                  {analysis.paymentMethod && (
                    <div>
                      <span className="text-gray-400">Method:</span>
                      <span className="text-white ml-2 capitalize">{analysis.paymentMethod}</span>
                    </div>
                  )}
                  {analysis.bankDetails?.accountNumber && (
                    <div>
                      <span className="text-gray-400">Account:</span>
                      <span className="text-white ml-2 font-mono">{analysis.bankDetails.accountNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-md font-medium text-white mb-3">AI Recommendations</h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <i className="fas fa-lightbulb text-yellow-400 mr-2 mt-0.5"></i>
                      <span className="text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-400 mr-2"></i>
                <span className="text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning || !payment.proof_url}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isScanning ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Scanning...
                </>
              ) : (
                <>
                  <i className="fas fa-robot mr-2"></i>
                  Scan Receipt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
