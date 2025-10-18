"use client";

import { PricingWithCurrency } from '@/lib/currency';
import { USAGE_LIMITS } from '@/lib/usage-limits';

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
  // Safety checks for pricing object
  if (!pricing || !pricing.plan) {
    return null;
  }

  const price = isYearly ? (pricing.yearlyPrice || 0) : (pricing.monthlyPrice || 0);
  const priceFormatted = isYearly ? (pricing.yearlyPriceFormatted || '$0') : (pricing.monthlyPriceFormatted || '$0');
  const monthlyEquivalent = isYearly ? (pricing.yearlyPrice || 0) / 12 : (pricing.monthlyPrice || 0);
  const limits = USAGE_LIMITS[pricing.plan] || USAGE_LIMITS.free;

  const getPlanFeatures = (plan: string) => {
    switch (plan) {
      case 'free':
        return [
          `${limits.dailyQuizzes} quizzes per day`,
          `${limits.monthlyQuizzes} quizzes per month`,
          'MCQ & True/False only',
          'Basic AI features',
          'Community support'
        ];
      case 'professional':
        return [
          `${limits.dailyQuizzes} quizzes per day`,
          `${limits.monthlyQuizzes} quizzes per month`,
          'All quiz types',
          'Live lectures access',
          'Study pack generator',
          'Data export',
          'Advanced analytics',
          'Email support'
        ];
      case 'mastery':
        return [
          `${limits.dailyQuizzes} quizzes per day`,
          `${limits.monthlyQuizzes} quizzes per month`,
          'All quiz types + coding',
          'Unlimited lectures',
          'Advanced study packs',
          'Full analytics suite',
          'Custom quiz creation',
          'Priority support',
          'API access'
        ];
      case 'innovation':
        return [
          'Unlimited quizzes',
          'All quiz types + VR',
          'Unlimited everything',
          'White-label options',
          'Custom integrations',
          'Dedicated support',
          'Advanced AI features',
          'Enterprise features'
        ];
      default:
        return [];
    }
  };

  const features = getPlanFeatures(pricing.plan);

  return (
    <div className={`relative ${isPopular ? 'ring-2 ring-purple-500/50 sm:scale-105' : ''} transition-transform duration-200`}>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 hover:bg-white/10 hover:border-gray-400/50 transition-all duration-200 h-full shadow-xl hover:shadow-2xl">
        {isPopular && (
          <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">
              Most Popular
            </div>
          </div>
        )}
        
        <div className="relative z-10">
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <div className={`inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm font-medium border mb-3 sm:mb-4 lg:mb-6 ${
              isPopular 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
            }`}>
              <i className={`fas ${isPopular ? 'fa-crown' : 'fa-seedling'} mr-1 sm:mr-1.5 lg:mr-2 text-xs sm:text-sm`}></i>
              <span className="hidden sm:inline">{pricing.plan.charAt(0).toUpperCase() + pricing.plan.slice(1)}</span>
              <span className="sm:hidden">{pricing.plan.charAt(0).toUpperCase() + pricing.plan.slice(1).substring(0, 3)}</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 leading-tight">
              {pricing.plan === 'free' ? 'Essential' : 
               pricing.plan === 'professional' ? 'Professional' :
               pricing.plan === 'mastery' ? 'Mastery' : 'Innovation'}
            </h3>
            
            <div className="mb-2">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-400 leading-tight">
              {pricing.plan === 'free' ? 'Free' : priceFormatted}
            </div>
            {pricing.plan !== 'free' && (
              <div className="text-xs sm:text-sm text-gray-400 mt-1">
                <span className="block sm:inline">{isYearly ? 'per year' : 'per month'}</span>
                {isYearly && (
                  <span className="block sm:inline sm:ml-2 text-green-400">
                    ({pricing.currency} {monthlyEquivalent.toFixed(2)}/mo)
                  </span>
                )}
              </div>
            )}
            </div>
            
            <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-4 sm:mb-6 leading-relaxed">
              {pricing.plan === 'free' ? 'Perfect for getting started' :
               pricing.plan === 'professional' ? 'Great for students and professionals' :
               pricing.plan === 'mastery' ? 'Perfect for power users' : 'For teams and enterprises'}
            </p>
          </div>
          
          {/* Features List */}
          <div className="mb-6 sm:mb-8">
            <ul className="space-y-2 sm:space-y-3 text-left">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isPopular 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-600'
                  }`}>
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="text-center">
            {isCurrentPlan ? (
              <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 text-sm sm:text-base">
                <i className="fas fa-check-circle mr-1.5 sm:mr-2"></i>
                Current Plan
              </div>
            ) : isPending ? (
              <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30 text-sm sm:text-base">
                <i className="fas fa-clock mr-1.5 sm:mr-2"></i>
                Pending Approval
              </div>
            ) : pricing.plan !== 'free' ? (
              <button
                onClick={() => onUpgrade?.(pricing.plan)}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
              >
                Upgrade
              </button>
            ) : (
              <a
                href="/signup"
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 text-center block text-sm sm:text-base"
              >
                Get Started
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
