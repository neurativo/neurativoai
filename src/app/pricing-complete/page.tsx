"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';
import PlanUpgrade from '@/app/components/PlanUpgrade';
import PaymentSubmission from '@/app/components/PaymentSubmission';
import RealtimePlanUpdater from '@/app/components/RealtimePlanUpdater';
import UsageTracker from '@/app/components/UsageTracker';

export default function CompletePricingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setLoading(false);
    };
    getUser();
  }, []);

  const handlePlanUpdate = (newPlan: string) => {
    setCurrentPlan(newPlan);
  };

  const handleUpgrade = (plan: string, billing: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setSelectedBilling(billing);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPlan('');
    setSelectedBilling('monthly');
    // Plan will be updated via realtime updates
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setSelectedPlan('');
    setSelectedBilling('monthly');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (showPaymentForm) {
    return (
      <PaymentSubmission
        plan={selectedPlan}
        billing={selectedBilling}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    );
  }

  return (
    <RealtimePlanUpdater userId={userId || ''} onPlanUpdate={handlePlanUpdate}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Navigation */}
        <nav className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Neurativo
              </h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">Pricing</span>
            </div>
            <div className="flex items-center gap-4">
              {userId && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">Current Plan:</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    currentPlan === 'mastery' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                    currentPlan === 'professional' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' :
                    currentPlan === 'innovation' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {currentPlan.toUpperCase()}
                  </span>
                </div>
              )}
              <a
                href="/dashboard"
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all"
              >
                Dashboard
              </a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pricing Plans */}
            <div className="lg:col-span-2">
              <PlanUpgrade
                currentPlan={currentPlan}
                onUpgrade={handleUpgrade}
              />
            </div>

            {/* Usage Tracker */}
            {userId && (
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Your Usage</h2>
                  <UsageTracker
                    userId={userId}
                    onUsageUpdate={(usage) => {
                      console.log('Usage updated:', usage);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black/20 backdrop-blur-sm border-t border-purple-500/20 px-6 py-8 mt-16">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-400 mb-4">
              Need help choosing a plan? Contact our support team.
            </p>
            <div className="flex justify-center gap-6">
              <a
                href="/support"
                className="text-purple-300 hover:text-purple-200 transition-colors"
              >
                Support
              </a>
              <a
                href="/terms"
                className="text-purple-300 hover:text-purple-200 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="text-purple-300 hover:text-purple-200 transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </footer>
      </div>
    </RealtimePlanUpdater>
  );
}
