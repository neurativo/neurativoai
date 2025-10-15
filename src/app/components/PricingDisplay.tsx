"use client";

import { PricingWithCurrency } from '@/lib/currency';

interface PricingDisplayProps {
  pricing: PricingWithCurrency;
  isYearly: boolean;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  isPending?: boolean;
  onUpgrade?: (plan: string) => void;
}

export default function PricingDisplay({
  pricing,
  isYearly,
  isPopular = false,
  isCurrentPlan = false,
  isPending = false,
  onUpgrade
}: PricingDisplayProps) {
  const price = isYearly ? pricing.yearlyPrice : pricing.monthlyPrice;
  const priceFormatted = isYearly ? pricing.yearlyPriceFormatted : pricing.monthlyPriceFormatted;
  const monthlyEquivalent = isYearly ? pricing.yearlyPrice / 12 : pricing.monthlyPrice;

  return (
    <div className={`relative ${isPopular ? 'ring-2 ring-purple-500/50' : ''}`}>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-white/10 hover:border-gray-400/50 transition-colors duration-200 h-full">
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
          </div>
        )}
        
        <div className="relative z-10">
          <div className="text-center mb-6 sm:mb-8">
            <div className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border mb-4 sm:mb-6 ${
              isPopular 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
            }`}>
              <i className={`fas ${isPopular ? 'fa-crown' : 'fa-seedling'} mr-1.5 sm:mr-2`}></i>
              {pricing.plan.charAt(0).toUpperCase() + pricing.plan.slice(1)}
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              {pricing.plan === 'free' ? 'Essential' : 
               pricing.plan === 'professional' ? 'Professional' :
               pricing.plan === 'mastery' ? 'Mastery' : 'Innovation'}
            </h3>
            
            <div className="mb-2">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-400">
                {pricing.plan === 'free' ? 'Free' : priceFormatted}
              </div>
              {pricing.plan !== 'free' && (
                <div className="text-sm text-gray-400 mt-1">
                  {isYearly ? 'per year' : 'per month'}
                  {isYearly && (
                    <span className="ml-2 text-green-400">
                      (${monthlyEquivalent.toFixed(2)}/mo)
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6">
              {pricing.plan === 'free' ? 'Perfect for getting started' :
               pricing.plan === 'professional' ? 'Great for students and professionals' :
               pricing.plan === 'mastery' ? 'Perfect for power users' : 'For teams and enterprises'}
            </p>
          </div>
          
          {/* Features list would go here - keeping it simple for now */}
          <div className="text-center">
            {isCurrentPlan ? (
              <div className="px-6 py-3 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30">
                <i className="fas fa-check-circle mr-2"></i>
                Current Plan
              </div>
            ) : isPending ? (
              <div className="px-6 py-3 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30">
                <i className="fas fa-clock mr-2"></i>
                Pending Approval
              </div>
            ) : pricing.plan !== 'free' ? (
              <button
                onClick={() => onUpgrade?.(pricing.plan)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Upgrade to {pricing.plan.charAt(0).toUpperCase() + pricing.plan.slice(1)}
              </button>
            ) : (
              <div className="px-6 py-3 bg-gray-500/20 text-gray-300 rounded-lg border border-gray-500/30">
                <i className="fas fa-check mr-2"></i>
                Active
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
