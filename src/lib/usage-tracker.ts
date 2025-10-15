import { getSupabaseServer } from './supabase';

export interface UsageStats {
  userId: string;
  plan: string;
  dailyQuizzes: number;
  monthlyQuizzes: number;
  dailyFileUploads: number;
  monthlyFileUploads: number;
  lastQuizDate: string;
  lastFileUploadDate: string;
}

export class UsageTracker {
  public static async getUserUsage(userId: string): Promise<UsageStats | null> {
    const supabase = getSupabaseServer();
    
    try {
      // Get user's current plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single();
        
      if (!profile) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      
      // Count today's quizzes
      const { count: dailyQuizzes } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);
        
      // Count this month's quizzes
      const { count: monthlyQuizzes } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${thisMonth}-01T00:00:00.000Z`);
        
      // Count today's file uploads (if you have a file uploads table)
      const { count: dailyFileUploads } = await supabase
        .from('file_uploads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);
        
      // Count this month's file uploads
      const { count: monthlyFileUploads } = await supabase
        .from('file_uploads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${thisMonth}-01T00:00:00.000Z`);
        
      // Get last quiz date
      const { data: lastQuiz } = await supabase
        .from('quizzes')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      // Get last file upload date
      const { data: lastFileUpload } = await supabase
        .from('file_uploads')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      return {
        userId,
        plan: profile.plan || 'free',
        dailyQuizzes: dailyQuizzes || 0,
        monthlyQuizzes: monthlyQuizzes || 0,
        dailyFileUploads: dailyFileUploads || 0,
        monthlyFileUploads: monthlyFileUploads || 0,
        lastQuizDate: lastQuiz?.created_at || '',
        lastFileUploadDate: lastFileUpload?.created_at || '',
      };
    } catch (error) {
      console.error('Error getting user usage:', error);
      return null;
    }
  }
  
  static async canUserCreateQuiz(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    dailyRemaining: number;
    monthlyRemaining: number;
  }> {
    const usage = await this.getUserUsage(userId);
    if (!usage) {
      return { allowed: false, reason: 'User not found', dailyRemaining: 0, monthlyRemaining: 0 };
    }
    
    const { getUserLimits, getRemainingQuizzes } = await import('./usage-limits');
    const limits = getUserLimits(usage.plan);
    const remaining = getRemainingQuizzes(usage.plan, usage.dailyQuizzes, usage.monthlyQuizzes);
    
    // Check daily limit
    if (limits.dailyQuizzes !== -1 && usage.dailyQuizzes >= limits.dailyQuizzes) {
      return {
        allowed: false,
        reason: `Daily quiz limit reached (${limits.dailyQuizzes} quizzes per day)`,
        dailyRemaining: remaining.dailyRemaining,
        monthlyRemaining: remaining.monthlyRemaining,
      };
    }
    
    // Check monthly limit
    if (limits.monthlyQuizzes !== -1 && usage.monthlyQuizzes >= limits.monthlyQuizzes) {
      return {
        allowed: false,
        reason: `Monthly quiz limit reached (${limits.monthlyQuizzes} quizzes per month)`,
        dailyRemaining: remaining.dailyRemaining,
        monthlyRemaining: remaining.monthlyRemaining,
      };
    }
    
    return {
      allowed: true,
      dailyRemaining: remaining.dailyRemaining,
      monthlyRemaining: remaining.monthlyRemaining,
    };
  }
  
  static async canUserAccessFeature(userId: string, feature: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const usage = await this.getUserUsage(userId);
    if (!usage) {
      return { allowed: false, reason: 'User not found' };
    }
    
    const { canUserAccessFeature } = await import('./usage-limits');
    
    // Map feature names to UsageLimits keys
    const featureMap: Record<string, keyof import('./usage-limits').UsageLimits> = {
      'lectures': 'canAccessLectures',
      'study_packs': 'canAccessStudyPacks',
      'export_data': 'canExportData',
      'advanced_features': 'canUseAdvancedFeatures',
      'custom_quizzes': 'canCreateCustomQuizzes',
      'analytics': 'canAccessAnalytics',
      'ai_features': 'canUseAIFeatures',
      'priority_support': 'canAccessPrioritySupport',
    };
    
    const limitKey = featureMap[feature];
    if (!limitKey) {
      return { allowed: false, reason: 'Unknown feature' };
    }
    
    const allowed = canUserAccessFeature(usage.plan, limitKey);
    
    return {
      allowed,
      reason: allowed ? undefined : `${feature} is not available in your ${usage.plan} plan`,
    };
  }
  
  static async canUserUploadFile(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    remaining: number;
  }> {
    const usage = await this.getUserUsage(userId);
    if (!usage) {
      return { allowed: false, reason: 'User not found', remaining: 0 };
    }
    
    const { getUserLimits } = await import('./usage-limits');
    const limits = getUserLimits(usage.plan);
    
    if (limits.maxFileUploads === -1) {
      return { allowed: true, remaining: -1 };
    }
    
    const remaining = Math.max(0, limits.maxFileUploads - usage.monthlyFileUploads);
    
    if (usage.monthlyFileUploads >= limits.maxFileUploads) {
      return {
        allowed: false,
        reason: `Monthly file upload limit reached (${limits.maxFileUploads} files per month)`,
        remaining: 0,
      };
    }
    
    return { allowed: true, remaining };
  }
  
  static async recordQuizCreation(userId: string, quizType: string): Promise<boolean> {
    const supabase = getSupabaseServer();
    
    try {
      // Record the quiz creation
      const { error } = await supabase
        .from('quizzes')
        .insert({
          user_id: userId,
          quiz_type: quizType,
          created_at: new Date().toISOString(),
        });
        
      if (error) {
        console.error('Error recording quiz creation:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error recording quiz creation:', error);
      return false;
    }
  }
  
  static async recordFileUpload(userId: string, fileType: string): Promise<boolean> {
    const supabase = getSupabaseServer();
    
    try {
      // Record the file upload
      const { error } = await supabase
        .from('file_uploads')
        .insert({
          user_id: userId,
          file_type: fileType,
          created_at: new Date().toISOString(),
        });
        
      if (error) {
        console.error('Error recording file upload:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error recording file upload:', error);
      return false;
    }
  }
}
