// Usage limits configuration for different plans
export interface UsageLimits {
  plan: string;
  dailyQuizzes: number;
  monthlyQuizzes: number;
  quizTypes: string[];
  maxQuestionsPerQuiz: number;
  maxQuizDuration: number; // in minutes
  canAccessLectures: boolean;
  canAccessStudyPacks: boolean;
  canExportData: boolean;
  canUseAdvancedFeatures: boolean;
  maxQuizAttempts: number;
  canCreateCustomQuizzes: boolean;
  canAccessAnalytics: boolean;
  canUseAIFeatures: boolean;
  maxFileUploads: number; // per month
  canAccessPrioritySupport: boolean;
}

export const USAGE_LIMITS: Record<string, UsageLimits> = {
  free: {
    plan: 'free',
    dailyQuizzes: 3,
    monthlyQuizzes: 50,
    quizTypes: ['mcq', 'true_false'],
    maxQuestionsPerQuiz: 10,
    maxQuizDuration: 15,
    canAccessLectures: false,
    canAccessStudyPacks: false,
    canExportData: false,
    canUseAdvancedFeatures: false,
    maxQuizAttempts: 2,
    canCreateCustomQuizzes: false,
    canAccessAnalytics: false,
    canUseAIFeatures: false,
    maxFileUploads: 0,
    canAccessPrioritySupport: false,
  },
  professional: {
    plan: 'professional',
    dailyQuizzes: 15,
    monthlyQuizzes: 300,
    quizTypes: ['mcq', 'true_false', 'fill_blank', 'matching'],
    maxQuestionsPerQuiz: 25,
    maxQuizDuration: 45,
    canAccessLectures: true,
    canAccessStudyPacks: true,
    canExportData: true,
    canUseAdvancedFeatures: true,
    maxQuizAttempts: 5,
    canCreateCustomQuizzes: true,
    canAccessAnalytics: true,
    canUseAIFeatures: true,
    maxFileUploads: 10,
    canAccessPrioritySupport: false,
  },
  mastery: {
    plan: 'mastery',
    dailyQuizzes: 50,
    monthlyQuizzes: 1000,
    quizTypes: ['mcq', 'true_false', 'fill_blank', 'matching', 'essay', 'coding'],
    maxQuestionsPerQuiz: 50,
    maxQuizDuration: 90,
    canAccessLectures: true,
    canAccessStudyPacks: true,
    canExportData: true,
    canUseAdvancedFeatures: true,
    maxQuizAttempts: 10,
    canCreateCustomQuizzes: true,
    canAccessAnalytics: true,
    canUseAIFeatures: true,
    maxFileUploads: 50,
    canAccessPrioritySupport: true,
  },
  innovation: {
    plan: 'innovation',
    dailyQuizzes: -1, // unlimited
    monthlyQuizzes: -1, // unlimited
    quizTypes: ['mcq', 'true_false', 'fill_blank', 'matching', 'essay', 'coding', 'simulation', 'vr'],
    maxQuestionsPerQuiz: 100,
    maxQuizDuration: 180,
    canAccessLectures: true,
    canAccessStudyPacks: true,
    canExportData: true,
    canUseAdvancedFeatures: true,
    maxQuizAttempts: -1, // unlimited
    canCreateCustomQuizzes: true,
    canAccessAnalytics: true,
    canUseAIFeatures: true,
    maxFileUploads: -1, // unlimited
    canAccessPrioritySupport: true,
  },
};

// Pricing configuration with profit margins
export interface PricingConfig {
  plan: string;
  monthlyPrice: number;
  yearlyPrice: number;
  costPerUser: number; // our cost
  profitMargin: number; // percentage
  features: string[];
  isAvailable: boolean;
  maxUsers?: number; // for enterprise plans
}

export const PRICING_CONFIG: Record<string, PricingConfig> = {
  free: {
    plan: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    costPerUser: 0.30, // minimal server costs
    profitMargin: 0,
    features: [
      '3 quizzes per day',
      '50 quizzes per month',
      'MCQ & True/False only',
      'Basic AI features',
      'Community support'
    ],
    isAvailable: true,
  },
  professional: {
    plan: 'professional',
    monthlyPrice: 5.99,
    yearlyPrice: 59.99, // 2 months free
    costPerUser: 1.50, // server + AI costs
    profitMargin: 75.0, // 75% profit margin
    features: [
      '15 quizzes per day',
      '300 quizzes per month',
      'All quiz types',
      'Live lectures access',
      'Study pack generator',
      'Data export',
      'Advanced analytics',
      'Email support'
    ],
    isAvailable: true,
  },
  mastery: {
    plan: 'mastery',
    monthlyPrice: 12.99,
    yearlyPrice: 129.99, // 2 months free
    costPerUser: 2.50, // higher server + AI costs
    profitMargin: 80.8, // 80.8% profit margin
    features: [
      '50 quizzes per day',
      '1000 quizzes per month',
      'All quiz types + coding',
      'Unlimited lectures',
      'Advanced study packs',
      'Full analytics suite',
      'Custom quiz creation',
      'Priority support',
      'API access'
    ],
    isAvailable: true,
  },
  innovation: {
    plan: 'innovation',
    monthlyPrice: 24.99,
    yearlyPrice: 249.99, // 2 months free
    costPerUser: 4.00, // premium server + AI costs
    profitMargin: 84.0, // 84% profit margin
    features: [
      'Unlimited quizzes',
      'All quiz types + VR',
      'Unlimited everything',
      'White-label options',
      'Custom integrations',
      'Dedicated support',
      'Advanced AI features',
      'Enterprise features'
    ],
    isAvailable: true, // Now available
  },
};

// Helper functions
export function getUserLimits(plan: string): UsageLimits {
  // Map old plan names to new plan structure
  const planMapping: Record<string, string> = {
    'special': 'innovation', // Map special plan to innovation plan
    'premium': 'professional', // Map premium to professional if it exists
    'basic': 'free', // Map basic to free if it exists
  };
  
  const mappedPlan = planMapping[plan] || plan;
  return USAGE_LIMITS[mappedPlan] || USAGE_LIMITS.free;
}

export function getPricing(plan: string): PricingConfig {
  // Map old plan names to new plan structure
  const planMapping: Record<string, string> = {
    'special': 'innovation', // Map special plan to innovation plan
    'premium': 'professional', // Map premium to professional if it exists
    'basic': 'free', // Map basic to free if it exists
  };
  
  const mappedPlan = planMapping[plan] || plan;
  return PRICING_CONFIG[mappedPlan] || PRICING_CONFIG.free;
}

export function canUserAccessFeature(userPlan: string, feature: keyof UsageLimits): boolean {
  const limits = getUserLimits(userPlan);
  return limits[feature] as boolean;
}

export function getRemainingQuizzes(userPlan: string, dailyUsed: number, monthlyUsed: number): {
  dailyRemaining: number;
  monthlyRemaining: number;
} {
  const limits = getUserLimits(userPlan);
  
  const dailyRemaining = limits.dailyQuizzes === -1 
    ? -1 
    : Math.max(0, limits.dailyQuizzes - dailyUsed);
    
  const monthlyRemaining = limits.monthlyQuizzes === -1 
    ? -1 
    : Math.max(0, limits.monthlyQuizzes - monthlyUsed);
    
  return { dailyRemaining, monthlyRemaining };
}

export function isQuizTypeAllowed(userPlan: string, quizType: string): boolean {
  const limits = getUserLimits(userPlan);
  return limits.quizTypes.includes(quizType);
}

export function getMaxQuestionsForPlan(userPlan: string): number {
  const limits = getUserLimits(userPlan);
  return limits.maxQuestionsPerQuiz;
}
