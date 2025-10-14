"use client";

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string;
  plan: string;
  is_active: boolean;
  is_admin?: boolean;
  total_quizzes: number;
  total_payments: number;
}

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpgradePlan: (userId: string, newPlan: string) => void;
}

export default function UserDetailsModal({ user, isOpen, onClose, onUpgradePlan }: UserDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    if (user && isOpen) {
      loadUserDetails(user.id);
    }
  }, [user, isOpen]);

  const loadUserDetails = async (userId: string) => {
    setLoading(true);
    try {
      // In a real app, you'd fetch detailed user data here
      // For now, we'll use the basic user data
      setUserDetails(user);
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (newPlan: string) => {
    if (!user) return;
    
    try {
      await onUpgradePlan(user.id, newPlan);
      onClose();
    } catch (error) {
      console.error('Error upgrading plan:', error);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-purple-500/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                User Details
              </h2>
              <p className="text-gray-300 mt-1">{user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <div className="text-gray-300">Loading user details...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-sm font-medium text-purple-300 mb-2">Full Name</h3>
                  <p className="text-white">{user.full_name || 'Not provided'}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-sm font-medium text-purple-300 mb-2">Email</h3>
                  <p className="text-white">{user.email}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-sm font-medium text-purple-300 mb-2">Current Plan</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.plan === 'innovation' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' :
                      user.plan === 'mastery' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' :
                      user.plan === 'professional' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' :
                      'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
                    }`}>
                      {user.plan}
                    </span>
                    {user.is_admin && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-sm font-medium text-purple-300 mb-2">Status</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    user.is_active 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20 text-center">
                  <div className="text-2xl font-bold text-white">{user.total_quizzes}</div>
                  <div className="text-sm text-purple-300">Quizzes Created</div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20 text-center">
                  <div className="text-2xl font-bold text-white">{user.total_payments}</div>
                  <div className="text-sm text-purple-300">Payments Made</div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20 text-center">
                  <div className="text-2xl font-bold text-white">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                  </div>
                  <div className="text-sm text-purple-300">Last Activity</div>
                </div>
              </div>

              {/* Plan Upgrade */}
              <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
                <h3 className="text-lg font-medium text-white mb-4">Upgrade Plan</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['free', 'professional', 'mastery', 'innovation'].map((plan) => (
                    <button
                      key={plan}
                      onClick={() => handleUpgradePlan(plan)}
                      disabled={user.plan === plan}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        user.plan === plan
                          ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300 cursor-not-allowed'
                          : 'bg-black/30 hover:bg-black/50 border border-purple-500/30 hover:border-purple-400/50 text-white hover:text-purple-300'
                      }`}
                    >
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-sm font-medium text-purple-300 mb-2">Account Created</h3>
                  <p className="text-white">{new Date(user.created_at).toLocaleString()}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-sm font-medium text-purple-300 mb-2">Last Sign In</h3>
                  <p className="text-white">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-purple-500/20">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg transition-all duration-200 hover:border-gray-400/50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
