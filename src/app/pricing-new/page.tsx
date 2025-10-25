"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';
import { PRICING_CONFIG, USAGE_LIMITS } from '@/lib/usage-limits';

export default function NewPricingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (user) {
        setUserId(user.id);
        
        // Get user's current plan from subscription API
        let userPlan = 'free';
        try {
          const res = await fetch('/api/subscriptions', {
            headers: { Authorization: `Bearer ${session?.access_token}` }
          });
          if (res.ok) {
            const subData = await res.json();
            userPlan = subData?.currentPlan?.name?.toLowerCase() || 'free';
          }
        } catch (error) {
          console.error('Error fetching user plan:', error);
          userPlan = 'free';
        }
          
        setCurrentPlan(userPlan);
        
        // Get usage data
        try {
          const response = await fetch(`/api/user/usage-limits?userId=${user.id}`);
          const data = await response.json();
          setUsage(data);
        } catch (error) {
          console.error('Error fetching usage data:', error);
        }
      }
      
      setLoading(false);
    };
    
    getUserData();
  }, []);

  const handleUpgrade = async (plan: string) => {
    if (!userId) {
      alert('Please log in to upgrade your plan');
      return;
    }
    
    // For now, just show a message about payment integration
    alert(`Upgrade to ${plan} plan - Payment integration coming soon!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-6">
          Choose Your Learning Plan
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Unlock your potential with AI-powered learning. Start free and upgrade as you grow.
        </p>
      </div>

      {/* Current Usage Display */}
      {usage && (
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">Your Current Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{usage.usage.dailyQuizzes}</div>
                <div className="text-gray-300">Quizzes Today</div>
                <div className="text-sm text-gray-400">
                  {usage.remaining.dailyQuizzes === -1 ? 'Unlimited' : `${usage.remaining.dailyQuizzes} remaining`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{usage.usage.monthlyQuizzes}</div>
                <div className="text-gray-300">Quizzes This Month</div>
                <div className="text-sm text-gray-400">
                  {usage.remaining.monthlyQuizzes === -1 ? 'Unlimited' : `${usage.remaining.monthlyQuizzes} remaining`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{usage.user.plan}</div>
                <div className="text-gray-300">Current Plan</div>
                <div className="text-sm text-gray-400 capitalize">{usage.user.plan}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.values(PRICING_CONFIG).map((plan) => (
            <div
              key={plan.plan}
              className={`relative bg-black/20 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:scale-105 ${
                plan.plan === currentPlan
                  ? 'border-purple-500 shadow-2xl shadow-purple-500/20'
                  : plan.plan === 'professional'
                  ? 'border-blue-500 hover:border-blue-400'
                  : plan.plan === 'mastery'
                  ? 'border-green-500 hover:border-green-400'
                  : plan.plan === 'innovation'
                  ? 'border-yellow-500 hover:border-yellow-400'
                  : 'border-gray-500 hover:border-gray-400'
              }`}
            >
              {plan.plan === currentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Current Plan
                  </span>
                </div>
              )}
              
              {!plan.isAvailable && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Coming Soon
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2 capitalize">{plan.plan}</h3>
                <div className="text-4xl font-bold text-white mb-2">
                  ${plan.monthlyPrice}
                  <span className="text-lg text-gray-400">/month</span>
                </div>
                {plan.yearlyPrice > 0 && (
                  <div className="text-sm text-gray-400">
                    ${plan.yearlyPrice}/year (2 months free)
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.plan)}
                disabled={plan.plan === currentPlan || !plan.isAvailable}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  plan.plan === currentPlan
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : !plan.isAvailable
                    ? 'bg-yellow-600/20 text-yellow-300 cursor-not-allowed'
                    : plan.plan === 'free'
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : plan.plan === 'professional'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : plan.plan === 'mastery'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                {plan.plan === currentPlan
                  ? 'Current Plan'
                  : !plan.isAvailable
                  ? 'Coming Soon'
                  : plan.plan === 'free'
                  ? 'Get Started'
                  : 'Upgrade Now'
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Feature Comparison</h2>
        <div className="bg-black/20 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/20">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-900/50 to-blue-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-white font-semibold">Feature</th>
                {Object.values(PRICING_CONFIG).map((plan) => (
                  <th key={plan.plan} className="px-6 py-4 text-center text-white font-semibold capitalize">
                    {plan.plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/20">
              <tr>
                <td className="px-6 py-4 text-gray-300">Daily Quizzes</td>
                {Object.values(USAGE_LIMITS).map((limit) => (
                  <td key={limit.plan} className="px-6 py-4 text-center text-white">
                    {limit.dailyQuizzes === -1 ? 'Unlimited' : limit.dailyQuizzes}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-300">Monthly Quizzes</td>
                {Object.values(USAGE_LIMITS).map((limit) => (
                  <td key={limit.plan} className="px-6 py-4 text-center text-white">
                    {limit.monthlyQuizzes === -1 ? 'Unlimited' : limit.monthlyQuizzes}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-300">Quiz Types</td>
                {Object.values(USAGE_LIMITS).map((limit) => (
                  <td key={limit.plan} className="px-6 py-4 text-center text-white">
                    {limit.quizTypes.length} types
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-300">Max Questions per Quiz</td>
                {Object.values(USAGE_LIMITS).map((limit) => (
                  <td key={limit.plan} className="px-6 py-4 text-center text-white">
                    {limit.maxQuestionsPerQuiz}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-300">Live Lectures</td>
                {Object.values(USAGE_LIMITS).map((limit) => (
                  <td key={limit.plan} className="px-6 py-4 text-center">
                    {limit.canAccessLectures ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-300">Study Packs</td>
                {Object.values(USAGE_LIMITS).map((limit) => (
                  <td key={limit.plan} className="px-6 py-4 text-center">
                    {limit.canAccessStudyPacks ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-300">Data Export</td>
                {Object.values(USAGE_LIMITS).map((limit) => (
                  <td key={limit.plan} className="px-6 py-4 text-center">
                    {limit.canExportData ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-300">Priority Support</td>
                {Object.values(USAGE_LIMITS).map((limit) => (
                  <td key={limit.plan} className="px-6 py-4 text-center">
                    {limit.canAccessPrioritySupport ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
