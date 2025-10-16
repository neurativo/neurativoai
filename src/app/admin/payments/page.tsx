"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface Payment {
  id: string;
  user_id: string;
  plan: string;
  method: string;
  amount_cents: number;
  currency: string;
  proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_name: string;
  amount: number;
}

export default function PaymentVerification() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();
  
  // We'll use API routes instead of direct Supabase calls

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('admin');
    if (!adminData) {
      router.push('/admin/login');
      return;
    }

    setAdmin(JSON.parse(adminData));
    loadPayments();
  }, [router]);

  const loadPayments = async () => {
    try {
      console.log('Loading payments from API...');
      
      const response = await fetch('/api/admin/payments');
      const data = await response.json();
      
      if (response.ok) {
        console.log('Payments loaded successfully:', data.payments);
        setPayments(data.payments || []);
      } else {
        console.error('Error loading payments:', data.error);
        setPayments([]);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  const updatePaymentStatus = async (paymentId: string, status: 'approved' | 'rejected', note?: string) => {
    setUpdating(paymentId);
    try {
      const response = await fetch('/api/admin/payments', {
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
        console.error('Error updating payment:', data.error);
        alert('Failed to update payment status');
        return;
      }

      // Reload payments
      await loadPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment status');
    } finally {
      setUpdating(null);
    }
  };

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

  if (!admin) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Payment Verification
            </h1>
            <p className="text-gray-300 mt-1">Review and approve payment requests</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/admin/dashboard"
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-all duration-200 hover:border-purple-400/50"
            >
              ← Back to Dashboard
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:border-red-400/50"
            >
              Logout
            </button>
          </div>
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
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-purple-500/10 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                        {payment.user_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        payment.plan === 'Mastery' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' :
                        payment.plan === 'Professional' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' :
                        'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
                      }`}>
                        {payment.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.method === 'proof_upload' 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                          : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
                      }`}>
                        {payment.method === 'proof_upload' ? 'Proof Upload' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'approved' 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                          : payment.status === 'pending'
                          ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {payment.proof_url && (
                          <a
                            href={payment.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:text-blue-200 transition-all"
                          >
                            View Proof
                          </a>
                        )}
                        {payment.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updatePaymentStatus(payment.id, 'approved')}
                              disabled={updating === payment.id}
                              className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded text-green-300 hover:text-green-200 transition-all disabled:opacity-50"
                            >
                              {updating === payment.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => {
                                const note = prompt('Rejection reason (optional):');
                                updatePaymentStatus(payment.id, 'rejected', note || undefined);
                              }}
                              disabled={updating === payment.id}
                              className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:text-red-200 transition-all disabled:opacity-50"
                            >
                              {updating === payment.id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {payment.status !== 'pending' && (
                          <span className="text-gray-400 text-sm">
                            {payment.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <div className="text-xl text-gray-300 mb-2">No payments found</div>
            <div className="text-gray-400">No payment requests to review at the moment.</div>
          </div>
        )}
      </div>
    </div>
  );
}
