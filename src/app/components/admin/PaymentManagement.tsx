"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';
import AIReceiptScanner from './AIReceiptScanner';

interface Payment {
  id: string;
  user_id: string;
  plan_id: number;
  method: string;
  amount: number;
  currency: string;
  transaction_reference: string | null;
  proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
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

interface PaymentDetailsModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (paymentId: string, status: 'approved' | 'rejected' | 'refunded', note?: string) => void;
  updating: string | null;
}

function PaymentDetailsModal({ payment, isOpen, onClose, onUpdateStatus, updating }: PaymentDetailsModalProps) {
  const [rejectionNote, setRejectionNote] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [refundNote, setRefundNote] = useState('');

  if (!isOpen || !payment) return null;

  const handleApprove = () => {
    onUpdateStatus(payment.id, 'approved', approvalNote || undefined);
    setApprovalNote('');
  };

  const handleReject = () => {
    onUpdateStatus(payment.id, 'rejected', rejectionNote || undefined);
    setRejectionNote('');
  };

  const handleRefund = () => {
    onUpdateStatus(payment.id, 'refunded', refundNote || undefined);
    setRefundNote('');
  };

  const amount = payment.amount;

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
                      (payment.plan_name || payment.subscription_plans?.name) === 'Mastery' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                      (payment.plan_name || payment.subscription_plans?.name) === 'Professional' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' :
                      (payment.plan_name || payment.subscription_plans?.name) === 'Innovation' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {payment.plan_name || payment.subscription_plans?.name || 'Unknown'}
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
                      payment.status === 'refunded' ? 'bg-orange-600 text-white' :
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
                  
                  <div>
                    <label className="text-sm text-gray-400">Refund Reason (Optional)</label>
                    <textarea
                      value={refundNote}
                      onChange={(e) => setRefundNote(e.target.value)}
                      placeholder="Reason for refund..."
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
                    <button
                      onClick={handleRefund}
                      disabled={updating === payment.id}
                      className="flex-1 px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg text-orange-300 hover:text-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating === payment.id ? 'Processing...' : '💰 Refund Payment'}
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
  const [showAIScanner, setShowAIScanner] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'refunded'>('all');
  const [aiFilter, setAiFilter] = useState<'all' | 'auto-approved' | 'needs-review' | 'low-confidence' | 'high-fraud'>('all');
  
  // Enhanced search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Bulk operations states
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'refund' | null>(null);
  const [bulkNote, setBulkNote] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setError(null);
      console.log('Loading payments from /api/admin/payments-complete...');
      const response = await fetch('/api/admin/payments-complete');
      const data = await response.json();
      
      console.log('Payments API response:', { status: response.status, data });
      
      if (response.ok) {
        setPayments(data.data || []);
        console.log('Payments loaded successfully:', data.data?.length || 0);
      } else {
        console.error('Failed to load payments:', data.error);
        setError(data.error || 'Failed to load payments');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: 'approved' | 'rejected' | 'refunded', note?: string) => {
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

  const clearAllFilters = () => {
    setSearchTerm('');
    setPlanFilter('all');
    setMethodFilter('all');
    setAmountMin('');
    setAmountMax('');
    setDateFrom('');
    setDateTo('');
    setFilter('all');
  };

  const exportPayments = async () => {
    try {
      // Build query parameters from current filters
      const params = new URLSearchParams();
      
      if (filter !== 'all') params.append('status', filter);
      if (planFilter !== 'all') params.append('plan', planFilter);
      if (methodFilter !== 'all') params.append('method', methodFilter);
      if (amountMin) params.append('amountMin', amountMin);
      if (amountMax) params.append('amountMax', amountMax);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/payments/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export payments');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `payments_export_${new Date().toISOString().split('T')[0]}.csv`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      setError(null);
      // You could add a success toast here if you have a toast system
      
    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : 'Failed to export payments');
    }
  };

  // Bulk operations functions
  const handleSelectPayment = (paymentId: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPayments.size === filteredPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filteredPayments.map(p => p.id)));
    }
  };

  const handleBulkAction = (action: 'approve' | 'reject' | 'refund') => {
    if (selectedPayments.size === 0) return;
    setBulkAction(action);
    setBulkNote('');
    setShowBulkModal(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedPayments.size === 0) return;

    setUpdating('bulk');
    try {
      const paymentIds = Array.from(selectedPayments);
      
      // Process each payment individually
      const promises = paymentIds.map(paymentId => 
        fetch('/api/admin/payments-complete', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId,
            status: bulkAction,
            adminNote: bulkNote || undefined
          }),
        })
      );

      const results = await Promise.allSettled(promises);
      
      // Check for any failures
      const failures = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.ok)
      );

      if (failures.length > 0) {
        console.warn(`${failures.length} payments failed to update`);
      }

      // Reload payments and clear selection
      await loadPayments();
      setSelectedPayments(new Set());
      setShowBulkModal(false);
      setBulkAction(null);
      setBulkNote('');

    } catch (error) {
      console.error('Bulk action error:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute bulk action');
    } finally {
      setUpdating(null);
    }
  };

  const filteredPayments = payments.filter(payment => {
    // Status filter
    const statusMatch = filter === 'all' || payment.status === filter;
    
    // AI filter
    const aiMatch = aiFilter === 'all' || 
      (aiFilter === 'auto-approved' && payment.auto_approved) ||
      (aiFilter === 'needs-review' && payment.needs_review) ||
      (aiFilter === 'low-confidence' && payment.low_confidence) ||
      (aiFilter === 'high-fraud' && payment.fraud_score && payment.fraud_score > 0.7);
    
    // Search term filter (user email, name, or transaction reference)
    const searchMatch = !searchTerm || 
      payment.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Plan filter
    const planMatch = planFilter === 'all' || (payment.plan_name || payment.subscription_plans?.name) === planFilter;
    
    // Method filter
    const methodMatch = methodFilter === 'all' || payment.method === methodFilter;
    
    // Amount range filter
    const amount = payment.amount;
    const amountMatch = (!amountMin || amount >= parseFloat(amountMin)) && 
                       (!amountMax || amount <= parseFloat(amountMax));
    
    // Date range filter
    const paymentDate = new Date(payment.created_at);
    const dateMatch = (!dateFrom || paymentDate >= new Date(dateFrom)) && 
                     (!dateTo || paymentDate <= new Date(dateTo));
    
    return statusMatch && aiMatch && searchMatch && planMatch && methodMatch && amountMatch && dateMatch;
  });

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
            {selectedPayments.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={updating === 'bulk'}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 hover:text-green-200 transition-all duration-200 hover:border-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Approve ({selectedPayments.size})
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={updating === 'bulk'}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-all duration-200 hover:border-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❌ Reject ({selectedPayments.size})
                </button>
                <button
                  onClick={() => handleBulkAction('refund')}
                  disabled={updating === 'bulk'}
                  className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg text-orange-300 hover:text-orange-200 transition-all duration-200 hover:border-orange-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💰 Refund ({selectedPayments.size})
                </button>
                <button
                  onClick={() => setSelectedPayments(new Set())}
                  className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-gray-200 transition-all duration-200"
                >
                  Clear Selection
                </button>
              </div>
            )}
            <button
              onClick={exportPayments}
              className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 hover:text-green-200 transition-all duration-200 hover:border-green-400/50"
            >
              📊 Export CSV
            </button>
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

      {/* Enhanced Search and Filters */}
      <div className="p-6 bg-black/10 backdrop-blur-sm border-b border-purple-500/20">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by user email, name, transaction reference, or payment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-3 rounded-lg transition-all ${
                showAdvancedFilters
                  ? 'bg-purple-600/30 border border-purple-500/50 text-purple-300'
                  : 'bg-gray-600/20 border border-gray-500/30 text-gray-300 hover:bg-gray-600/30'
              }`}
            >
              {showAdvancedFilters ? '🔽 Hide Filters' : '🔍 Advanced Filters'}
            </button>
            <button
              onClick={clearAllFilters}
              className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-all"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="mb-4">
          <div className="flex gap-3 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected', 'refunded'] as const).map((filterType) => (
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

        {/* AI Analysis Filter Pills */}
        <div className="mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400 font-medium">AI Analysis:</span>
            {([
              { key: 'all', label: 'All', icon: '🔍' },
              { key: 'auto-approved', label: 'Auto-Approved', icon: '🤖' },
              { key: 'needs-review', label: 'Needs Review', icon: '👀' },
              { key: 'low-confidence', label: 'Low Confidence', icon: '❌' },
              { key: 'high-fraud', label: 'High Fraud Risk', icon: '🚨' }
            ] as const).map((filterType) => (
              <button
                key={filterType.key}
                onClick={() => setAiFilter(filterType.key as any)}
                className={`px-3 py-2 rounded-lg transition-all text-sm ${
                  aiFilter === filterType.key
                    ? 'bg-purple-600/30 border border-purple-500/50 text-purple-300'
                    : 'bg-gray-600/20 border border-gray-500/30 text-gray-300 hover:bg-gray-600/30'
                }`}
              >
                <span className="mr-1">{filterType.icon}</span>
                {filterType.label}
                ({payments.filter(p => {
                  if (filterType.key === 'all') return true;
                  if (filterType.key === 'auto-approved') return p.auto_approved;
                  if (filterType.key === 'needs-review') return p.needs_review;
                  if (filterType.key === 'low-confidence') return p.low_confidence;
                  if (filterType.key === 'high-fraud') return p.fraud_score && p.fraud_score > 0.7;
                  return false;
                }).length})
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-black/20 rounded-lg border border-purple-500/20">
            {/* Plan Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Plan</label>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="professional">Professional</option>
                <option value="mastery">Mastery</option>
                <option value="innovation">Innovation</option>
              </select>
            </div>

            {/* Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
              >
                <option value="all">All Methods</option>
                <option value="bank">Bank Transfer</option>
                <option value="binance">Binance</option>
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/20 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Summary and Export */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {filteredPayments.length} of {payments.length} payments
            {(searchTerm || planFilter !== 'all' || methodFilter !== 'all' || amountMin || amountMax || dateFrom || dateTo) && 
              ' (filtered)'}
          </div>
          <button
            onClick={exportPayments}
            className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 hover:text-green-200 transition-all duration-200 hover:border-green-400/50 text-sm"
          >
            📊 Export Filtered Data
          </button>
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
                    <input
                      type="checkbox"
                      checked={selectedPayments.size === filteredPayments.length && filteredPayments.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500 focus:ring-2"
                    />
                  </th>
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
                      <input
                        type="checkbox"
                        checked={selectedPayments.has(payment.id)}
                        onChange={() => handleSelectPayment(payment.id)}
                        className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500 focus:ring-2"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                        {payment.user_email || `User ${payment.user_id.slice(0, 8)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        (payment.plan_name || payment.subscription_plans?.name) === 'Mastery' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                        (payment.plan_name || payment.subscription_plans?.name) === 'Professional' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' :
                        (payment.plan_name || payment.subscription_plans?.name) === 'Innovation' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {payment.plan_name || payment.subscription_plans?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                      {payment.currency} {payment.amount.toFixed(2)}
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
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'approved' ? 'bg-green-600 text-white' :
                          payment.status === 'pending' ? 'bg-yellow-600 text-white' :
                          payment.status === 'refunded' ? 'bg-orange-600 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          {payment.status.toUpperCase()}
                        </span>
                        {payment.ai_status && (
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              payment.ai_status === 'valid' ? 'bg-green-500/20 text-green-400' :
                              payment.ai_status === 'invalid' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              AI: {payment.ai_status}
                              {payment.ai_confidence && ` (${Math.round(payment.ai_confidence * 100)}%)`}
                            </span>
                            {payment.fraud_score !== undefined && (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                payment.fraud_score > 0.7 ? 'bg-red-500/20 text-red-400' :
                                payment.fraud_score > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                Fraud: {Math.round(payment.fraud_score * 100)}%
                              </span>
                            )}
                            {payment.auto_approved && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                                🤖 Auto-Approved
                              </span>
                            )}
                            {payment.needs_review && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-400">
                                👀 Needs Review
                              </span>
                            )}
                            {payment.low_confidence && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                                ❌ Low Confidence
                              </span>
                            )}
                          </div>
                        )}
                      </div>
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
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowAIScanner(true);
                            }}
                            className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-purple-300 hover:text-purple-200 transition-all"
                            title="AI Receipt Scanner"
                          >
                            🤖 AI Scan
                          </button>
                        )}
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

      {/* Bulk Action Modal */}
      {showBulkModal && bulkAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-purple-500/20 max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Bulk {bulkAction === 'approve' ? 'Approve' : bulkAction === 'reject' ? 'Reject' : 'Refund'} Payments
                </h2>
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkAction(null);
                    setBulkNote('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300">
                  You are about to <span className={`font-semibold ${bulkAction === 'approve' ? 'text-green-400' : 'text-red-400'}`}>
                    {bulkAction}
                  </span> {selectedPayments.size} payment{selectedPayments.size > 1 ? 's' : ''}.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {bulkAction === 'approve' ? 'Approval Note (Optional)' : 
                     bulkAction === 'reject' ? 'Rejection Reason (Optional)' : 
                     'Refund Reason (Optional)'}
                  </label>
                  <textarea
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                    placeholder={bulkAction === 'approve' ? 'Add a note for the users...' : 
                                bulkAction === 'reject' ? 'Reason for rejection...' :
                                'Reason for refund...'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkAction(null);
                      setBulkNote('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeBulkAction}
                    disabled={updating === 'bulk'}
                    className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      bulkAction === 'approve'
                        ? 'bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 hover:text-green-200'
                        : bulkAction === 'reject'
                        ? 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 hover:text-red-200'
                        : 'bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 hover:text-orange-200'
                    }`}
                  >
                    {updating === 'bulk' ? 'Processing...' : 
                     `${bulkAction === 'approve' ? '✅' : 
                       bulkAction === 'reject' ? '❌' : '💰'} ${bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)} ${selectedPayments.size} Payment${selectedPayments.size > 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Receipt Scanner Modal */}
      {showAIScanner && selectedPayment && (
        <AIReceiptScanner
          payment={selectedPayment}
          onScanComplete={(result) => {
            setAiAnalysis(result);
            // You can add logic here to auto-approve/reject based on AI confidence
            if (result.confidence > 0.8 && result.validationStatus === 'valid') {
              // Auto-approve high-confidence valid payments
              console.log('AI recommends auto-approval');
            }
          }}
          onClose={() => {
            setShowAIScanner(false);
            setSelectedPayment(null);
            setAiAnalysis(null);
          }}
        />
      )}
    </div>
  );
}
