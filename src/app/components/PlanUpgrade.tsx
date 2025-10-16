"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

interface PlanUpgradeProps {
  currentPlan: string;
  onUpgrade: (plan: string, billing: 'monthly' | 'yearly') => void;
}

interface PlanConfig {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  popular?: boolean;
  color: string;
}

const PLANS: Record<string, PlanConfig> = {
  free: {
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'USD',
    features: [
      '5 quiz generations per month',
      'Basic AI models',
      'Standard support',
      'PDF export'
    ],
    color: 'gray'
  },
  professional: {
    name: 'Professional',
    description: 'For serious learners and educators',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    currency: 'USD',
    features: [
      'Unlimited quiz generations',
      'Advanced AI models',
      'Priority support',
      'Export to PDF/Word',
      'Custom branding',
      'Analytics dashboard'
    ],
    color: 'green'
  },
  mastery: {
    name: 'Mastery',
    description: 'Advanced features for power users',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    currency: 'USD',
    features: [
      'Everything in Professional',
      '3D interactive quizzes',
      'Video integration',
      'Advanced analytics',
      'API access',
      'Custom themes'
    ],
    popular: true,
    color: 'blue'
  },
  innovation: {
    name: 'Innovation',
    description: 'Enterprise-grade solution',
    monthlyPrice: 39.99,
    yearlyPrice: 399.99,
    currency: 'USD',
    features: [
      'Everything in Mastery',
      'Custom AI training',
      'White-label solution',
      'Dedicated support',
      'Custom integrations',
      'Advanced security'
    ],
    color: 'purple'
  }
};

export default function PlanUpgrade({ currentPlan, onUpgrade }: PlanUpgradeProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handlePlanSelect = (plan: string) => {
    if (plan === currentPlan) return;
    setSelectedPlan(plan);
  };

  const handleUpgrade = () => {
    if (selectedPlan && selectedPlan !== currentPlan) {
      onUpgrade(selectedPlan, billing);
    }
  };

  const getPlanColor = (color: string) => {
    const colors = {
      gray: 'from-gray-600 to-gray-700',
      green: 'from-green-600 to-emerald-600',
      blue: 'from-blue-600 to-cyan-600',
      purple: 'from-purple-600 to-pink-600'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getPlanBorderColor = (color: string) => {
    const colors = {
      gray: 'border-gray-500/30',
      green: 'border-green-500/30',
      blue: 'border-blue-500/30',
      purple: 'border-purple-500/30'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getPlanHoverColor = (color: string) => {
    const colors = {
      gray: 'hover:border-gray-400/50',
      green: 'hover:border-green-400/50',
      blue: 'hover:border-blue-400/50',
      purple: 'hover:border-purple-400/50'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            Unlock powerful features and take your learning to the next level
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billing === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
              Yearly
              <span className="ml-1 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrentPlan = key === currentPlan;
            const isSelected = selectedPlan === key;
            const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const yearlyDiscount = billing === 'yearly' && plan.monthlyPrice > 0 
              ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)
              : 0;

            return (
              <div
                key={key}
                className={`relative bg-black/20 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-200 cursor-pointer ${
                  isCurrentPlan
                    ? 'border-green-500/50 bg-green-900/10'
                    : isSelected
                    ? `border-purple-500/50 ${getPlanHoverColor(plan.color)}`
                    : `${getPlanBorderColor(plan.color)} ${getPlanHoverColor(plan.color)}`
                }`}
                onClick={() => handlePlanSelect(key)}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">
                      {plan.currency} {price}
                    </span>
                    <span className="text-gray-400 ml-1">
                      /{billing === 'yearly' ? 'year' : 'month'}
                    </span>
                    {yearlyDiscount > 0 && (
                      <div className="text-green-400 text-sm font-semibold">
                        Save {yearlyDiscount}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-300">
                      <span className="text-green-400 mr-2 mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    isCurrentPlan
                      ? 'bg-green-600/20 text-green-300 border border-green-500/30 cursor-not-allowed'
                      : isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                      : `bg-gradient-to-r ${getPlanColor(plan.color)} text-white hover:opacity-90`
                  }`}
                  disabled={isCurrentPlan}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCurrentPlan) {
                      handleUpgrade();
                    }
                  }}
                >
                  {isCurrentPlan ? 'Current Plan' : isSelected ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && selectedPlan !== currentPlan && (
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Selected: {PLANS[selectedPlan].name} Plan
                </h3>
                <p className="text-gray-300">
                  {PLANS[selectedPlan].currency} {billing === 'yearly' ? PLANS[selectedPlan].yearlyPrice : PLANS[selectedPlan].monthlyPrice}
                  /{billing === 'yearly' ? 'year' : 'month'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold transition-all"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-300 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Is there a free trial?</h4>
              <p className="text-gray-300 text-sm">
                We offer a free plan with basic features. Paid plans come with a 7-day money-back guarantee.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-300 text-sm">
                We accept all major credit cards, PayPal, bank transfers, and cryptocurrency.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-300 text-sm">
                Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
