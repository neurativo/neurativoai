-- =====================================================
-- QUICK FIX: Foreign Key Constraint Issue
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to fix the foreign key issue

-- 1. First, check the quizzes table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quizzes' 
ORDER BY ordinal_position;

-- 2. Drop the quiz_usage table if it exists (to recreate it properly)
DROP TABLE IF EXISTS quiz_usage CASCADE;

-- 3. Recreate quiz_usage table without the foreign key constraint first
CREATE TABLE quiz_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quiz_id TEXT -- We'll add the foreign key constraint after checking the quizzes table structure
);

-- 4. Create other tables
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

CREATE TABLE IF NOT EXISTS user_currency_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_currency TEXT NOT NULL DEFAULT 'USD',
  detected_currency TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'USD',
  rates JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_quiz_usage_user_id ON quiz_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_usage_created_at ON quiz_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON feature_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_changes_user_id ON plan_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_currency_user_id ON user_currency_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_created_at ON exchange_rates(created_at);

-- 6. Enable RLS
ALTER TABLE quiz_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_currency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS policies
CREATE POLICY "Users can view own quiz usage" ON quiz_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz usage" ON quiz_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own file uploads" ON file_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own file uploads" ON file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feature access logs" ON feature_access_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feature access logs" ON feature_access_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own plan changes" ON plan_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan changes" ON plan_changes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own currency preferences" ON user_currency_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own currency preferences" ON user_currency_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own currency preferences" ON user_currency_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read exchange rates" ON exchange_rates
  FOR SELECT USING (true);

-- 8. Insert initial exchange rates
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

-- 9. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 10. Now try to add the foreign key constraint
-- This will work if quizzes.id is TEXT, or fail with a clear error if it's UUID
DO $$
BEGIN
    -- Try to add the foreign key constraint
    ALTER TABLE quiz_usage ADD CONSTRAINT quiz_usage_quiz_id_fkey 
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint added successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
        RAISE NOTICE 'Please check the quizzes table structure and adjust the quiz_id column type accordingly';
END $$;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- The usage tracking system is now ready.
-- If the foreign key constraint failed, you can either:
-- 1. Change quiz_id to UUID if quizzes.id is UUID
-- 2. Or leave it as TEXT if quizzes.id is TEXT
