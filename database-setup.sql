-- =====================================================
-- NEURATIVO USAGE TRACKING & CURRENCY SYSTEM SETUP
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- First, let's check the existing quizzes table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'quizzes';

-- 1. Create usage tracking tables
CREATE TABLE IF NOT EXISTS quiz_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quiz_id TEXT -- We'll add the foreign key constraint after checking the quizzes table structure
);

CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  access_granted BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_plan TEXT,
  new_plan TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'renewal')),
  payment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create currency preferences table
CREATE TABLE IF NOT EXISTS user_currency_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_currency TEXT NOT NULL DEFAULT 'USD',
  detected_currency TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create exchange rates cache table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'USD',
  rates JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_usage_user_id ON quiz_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_usage_created_at ON quiz_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON feature_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_changes_user_id ON plan_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_currency_user_id ON user_currency_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_created_at ON exchange_rates(created_at);

-- 5. Enable RLS
ALTER TABLE quiz_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_currency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for quiz_usage
CREATE POLICY "Users can view own quiz usage" ON quiz_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz usage" ON quiz_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. RLS Policies for file_uploads
CREATE POLICY "Users can view own file uploads" ON file_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own file uploads" ON file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. RLS Policies for feature_access_logs
CREATE POLICY "Users can view own feature access logs" ON feature_access_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feature access logs" ON feature_access_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. RLS Policies for plan_changes
CREATE POLICY "Users can view own plan changes" ON plan_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan changes" ON plan_changes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. RLS Policies for user_currency_preferences
CREATE POLICY "Users can view own currency preferences" ON user_currency_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own currency preferences" ON user_currency_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own currency preferences" ON user_currency_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 11. RLS Policies for exchange_rates (public read)
CREATE POLICY "Anyone can read exchange rates" ON exchange_rates
  FOR SELECT USING (true);

-- 12. Admin policies (service role can access all)
CREATE POLICY "Service role can access all quiz usage" ON quiz_usage
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all file uploads" ON file_uploads
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all feature access logs" ON feature_access_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all plan changes" ON plan_changes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all currency preferences" ON user_currency_preferences
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage exchange rates" ON exchange_rates
  FOR ALL USING (auth.role() = 'service_role');

-- 13. Insert initial exchange rates
INSERT INTO exchange_rates (base_currency, rates) VALUES (
  'USD',
  '{
    "USD": 1.0,
    "LKR": 325.50,
    "INR": 83.25,
    "EUR": 0.92,
    "GBP": 0.79,
    "CAD": 1.36,
    "AUD": 1.52,
    "JPY": 149.50,
    "SGD": 1.35,
    "MYR": 4.68,
    "THB": 35.85,
    "PHP": 55.75,
    "IDR": 15650.0,
    "VND": 24500.0,
    "PKR": 280.25,
    "BDT": 109.50,
    "NPR": 133.25,
    "MVR": 15.40
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- 14. Create function to get user usage stats
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  daily_quizzes INTEGER;
  monthly_quizzes INTEGER;
  daily_uploads INTEGER;
  monthly_uploads INTEGER;
  user_plan TEXT;
BEGIN
  -- Get user's current plan
  SELECT plan INTO user_plan FROM profiles WHERE id = user_uuid;
  
  -- Count today's quizzes
  SELECT COUNT(*) INTO daily_quizzes
  FROM quiz_usage
  WHERE user_id = user_uuid
    AND created_at >= CURRENT_DATE;
  
  -- Count this month's quizzes
  SELECT COUNT(*) INTO monthly_quizzes
  FROM quiz_usage
  WHERE user_id = user_uuid
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  -- Count today's uploads
  SELECT COUNT(*) INTO daily_uploads
  FROM file_uploads
  WHERE user_id = user_uuid
    AND created_at >= CURRENT_DATE;
  
  -- Count this month's uploads
  SELECT COUNT(*) INTO monthly_uploads
  FROM file_uploads
  WHERE user_id = user_uuid
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  -- Build result JSON
  result := json_build_object(
    'user_id', user_uuid,
    'plan', COALESCE(user_plan, 'free'),
    'usage', json_build_object(
      'dailyQuizzes', COALESCE(daily_quizzes, 0),
      'monthlyQuizzes', COALESCE(monthly_quizzes, 0),
      'dailyFileUploads', COALESCE(daily_uploads, 0),
      'monthlyFileUploads', COALESCE(monthly_uploads, 0)
    ),
    'last_updated', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create function to update exchange rates
CREATE OR REPLACE FUNCTION update_exchange_rates(new_rates JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO exchange_rates (base_currency, rates)
  VALUES ('USD', new_rates)
  ON CONFLICT (base_currency) DO UPDATE SET
    rates = new_rates,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Add foreign key constraint for quiz_usage (after checking quizzes table structure)
-- First run: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'quizzes';
-- Then uncomment the appropriate line below based on the quizzes.id column type:

-- If quizzes.id is UUID:
-- ALTER TABLE quiz_usage ADD CONSTRAINT quiz_usage_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;

-- If quizzes.id is TEXT:
-- ALTER TABLE quiz_usage ADD CONSTRAINT quiz_usage_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;

-- 17. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_usage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_exchange_rates(JSONB) TO service_role;

-- 17. Create view for admin usage analytics
CREATE OR REPLACE VIEW admin_usage_analytics AS
SELECT 
  p.id as user_id,
  p.email,
  p.plan,
  p.created_at as user_created_at,
  COALESCE(quizzes.daily_count, 0) as daily_quizzes,
  COALESCE(quizzes.monthly_count, 0) as monthly_quizzes,
  COALESCE(uploads.daily_count, 0) as daily_uploads,
  COALESCE(uploads.monthly_count, 0) as monthly_uploads,
  p.updated_at as last_activity
FROM profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as daily_count,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_count
  FROM quiz_usage
  GROUP BY user_id
) quizzes ON p.id = quizzes.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as daily_count,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_count
  FROM file_uploads
  GROUP BY user_id
) uploads ON p.id = uploads.user_id;

-- 18. Grant access to analytics view for admins
GRANT SELECT ON admin_usage_analytics TO authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your usage tracking and currency system is now ready.
-- The system will automatically track user activity and
-- provide real-time usage statistics for plan enforcement.
