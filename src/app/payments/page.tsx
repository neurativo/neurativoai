"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/app/lib/supabaseClient';
import CryptoPaymentForm from '@/app/components/CryptoPaymentForm';

interface Payment {
  id: string;
  txId: string;
  amount: number;
  amountUsd: number;
  status: string;
  confirmationCount: number;
  requiredConfirmations: number;
  createdAt: string;
  verifiedAt: string;
  expiresAt: string;
  paymentMethod: {
    name: string;
    symbol: string;
    network: string;
  };
  plan: {
    name: string;
    key: string;
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const supabase = getSupabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUser(user);
      loadPayments(user.id);
    } else {
      setLoading(false);
    }
  };

  const loadPayments = async (userId: string) => {
    try {
      const response = await fetch('/api/crypto-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_user_payments',
          userId
        })
      });

      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verifying': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'verifying': return 'Verifying';
      case 'failed': return 'Failed';
      case 'rejected': return 'Rejected';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number, symbol: string) => {
    return `${amount.toFixed(8)} ${symbol}`;
  };

  const handlePaymentSubmitted = (payment: any) => {
    setShowPaymentForm(false);
    if (user) {
      loadPayments(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to view your payments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Payments</h1>
          <p className="mt-2 text-gray-600">Track your cryptocurrency payments and subscriptions</p>
        </div>

        {/* Payment Form Toggle */}
        <div className="mb-8">
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showPaymentForm ? 'Hide Payment Form' : 'Make New Payment'}
          </button>
        </div>

        {/* Payment Form */}
        {showPaymentForm && (
          <div className="mb-8">
            <CryptoPaymentForm
              onPaymentSubmitted={handlePaymentSubmitted}
              onError={(error) => console.error('Payment error:', error)}
            />
          </div>
        )}

        {/* Payments List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
              <p className="text-gray-600">Make your first cryptocurrency payment to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.txId.substring(0, 20)}...
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.paymentMethod.symbol} - {payment.paymentMethod.network}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatAmount(payment.amount, payment.paymentMethod.symbol)}
                        </div>
                        {payment.amountUsd && (
                          <div className="text-sm text-gray-500">${payment.amountUsd.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.confirmationCount}/{payment.requiredConfirmations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.plan.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Status Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                Pending
              </span>
              <span className="text-sm text-gray-600">Payment submitted, waiting for verification</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Verifying
              </span>
              <span className="text-sm text-gray-600">Checking blockchain for confirmations</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Confirmed
              </span>
              <span className="text-sm text-gray-600">Payment verified and approved</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Failed
              </span>
              <span className="text-sm text-gray-600">Payment verification failed</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Rejected
              </span>
              <span className="text-sm text-gray-600">Payment rejected by admin</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                Expired
              </span>
              <span className="text-sm text-gray-600">Payment expired (24 hours)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
