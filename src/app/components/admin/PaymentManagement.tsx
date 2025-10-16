"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

interface Payment {
  id: string;
  user_id: string;
  plan: string;
  method: string;
  amount_cents: number;
  currency: string;
  transaction_reference: string | null;
  proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface PaymentDetailsModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (paymentId: string, status: 'approved' | 'rejected', note?: string) => void;
  updating: string | null;
}

function PaymentDetailsModal({ payment, isOpen, onClose, onUpdateStatus, updating }: PaymentDetailsModalProps) {
  const [rejectionNote, setRejectionNote] = useState('');
  const [approvalNote, setApprovalNote] = useState('');

  if (!isOpen || !payment) return null;

  const handleApprove = () => {
    onUpdateStatus(payment.id, 'approved', approvalNote || undefined);
    setApprovalNote('');
  };

  const handleReject = () => {
    onUpdateStatus(payment.id, 'rejected', rejectionNote || undefined);
    setRejectionNote('');
  };

  const amount = payment.amount_cents / 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-purple-500/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Payment Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Payment Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Payment ID</label>
                  <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded">{payment.id}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">User ID</label>
                  <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded">{payment.user_id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Plan</label>
                    <span className={`block px-3 py-1 text-xs font-semibold rounded-full ${
                      payment.plan === 'mastery' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                      payment.plan === 'professional' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' :
                      payment.plan === 'innovation' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {payment.plan}
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Amount</label>
                    <p className="text-white font-semibold">{payment.currency} {amount.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Method</label>
                    <span className="block px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                      {payment.method.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Status</label>
                    <span className={`block px-3 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'approved' ? 'bg-green-600 text-white' :
                      payment.status === 'pending' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {payment.transaction_reference && (
                  <div>
                    <label className="text-sm text-gray-400">Transaction Reference</label>
                    <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded break-all">
                      {payment.transaction_reference}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-gray-400">Created</label>
                  <p className="text-white text-sm">{new Date(payment.created_at).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Updated</label>
                  <p className="text-white text-sm">{new Date(payment.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* User Information & Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">User Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <p className="text-white">{payment.user_email || 'Loading...'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Name</label>
                  <p className="text-white">{payment.user_name || 'Loading...'}</p>
                </div>
              </div>

              {/* Proof Document */}
              {payment.proof_url && (
                <div>
                  <label className="text-sm text-gray-400">Payment Proof</label>
                  <div className="mt-2">
                    <a
                      href={payment.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 transition-all"
                    >
                      📄 View Proof Document
                    </a>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {payment.admin_note && (
                <div>
                  <label className="text-sm text-gray-400">Admin Notes</label>
                  <p className="text-white text-sm bg-gray-800 p-3 rounded mt-1">{payment.admin_note}</p>
                </div>
              )}

              {/* Actions */}
              {payment.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <div>
                    <label className="text-sm text-gray-400">Approval Note (Optional)</label>
                    <textarea
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      placeholder="Add a note for the user..."
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Rejection Reason (Optional)</label>
                    <textarea
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="Reason for rejection..."
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={updating === payment.id}
                      className="flex-1 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 hover:text-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating === payment.id ? 'Processing...' : '✅ Approve Payment'}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={updating === payment.id}
                      className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating === payment.id ? 'Processing...' : '❌ Reject Payment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/payments-complete');
      const data = await response.json();
      
      if (response.ok) {
        setPayments(data.payments || []);
      } else {
        setError(data.error || 'Failed to load payments');
      }
    } catch (error) {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: 'approved' | 'rejected', note?: string) => {
    setUpdating(paymentId);
    try {
      const response = await fetch('/api/admin/payments-complete', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          status,
          adminNote: note
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment');
      }

      // Reload payments
      await loadPayments();
      setShowDetailsModal(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error updating payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to update payment');
    } finally {
      setUpdating(null);
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const filteredPayments = payments.filter(payment => 
    filter === 'all' || payment.status === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading payments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Payment Management
            </h1>
            <p className="text-gray-300 mt-1">Review and manage payment requests</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadPayments}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-all duration-200 hover:border-purple-400/50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-400">⚠️</span>
            <span className="text-red-300">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-6 bg-black/10 backdrop-blur-sm border-b border-purple-500/20">
        <div className="flex gap-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === filterType
                  ? 'bg-purple-600/30 border border-purple-500/50 text-purple-300'
                  : 'bg-gray-600/20 border border-gray-500/30 text-gray-300 hover:bg-gray-600/30'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)} 
              ({payments.filter(p => filterType === 'all' || p.status === filterType).length})
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="p-6">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/20 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-purple-500/20">
              <thead className="bg-gradient-to-r from-purple-900/50 to-blue-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Transaction Ref
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-black/10 divide-y divide-purple-500/10">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-purple-500/10 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                        {payment.user_email || `User ${payment.user_id.slice(0, 8)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        payment.plan === 'mastery' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                        payment.plan === 'professional' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' :
                        payment.plan === 'innovation' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {payment.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                      {payment.currency} {(payment.amount_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                        {payment.method.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.transaction_reference ? (
                        <div className="text-xs text-gray-300 font-mono bg-gray-800 px-2 py-1 rounded max-w-32 truncate" title={payment.transaction_reference}>
                          {payment.transaction_reference}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No reference</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'approved' ? 'bg-green-600 text-white' :
                        payment.status === 'pending' ? 'bg-yellow-600 text-white' :
                        'bg-red-600 text-white'
                      }`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:text-blue-200 transition-all"
                        >
                          👁️ Details
                        </button>
                        {payment.proof_url && (
                          <a
                            href={payment.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded text-green-300 hover:text-green-200 transition-all"
                          >
                            📄 Proof
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPayments.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <div className="text-xl text-gray-300 mb-2">No payments found</div>
            <div className="text-gray-400">No payment requests match your current filter.</div>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        payment={selectedPayment}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPayment(null);
        }}
        onUpdateStatus={updatePaymentStatus}
        updating={updating}
      />
    </div>
  );
}
