-- Create usage tracking tables for plan limits

-- Table to track quiz creation
CREATE TABLE IF NOT EXISTS quiz_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Table to track file uploads
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track feature access attempts
CREATE TABLE IF NOT EXISTS feature_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  access_granted BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track plan upgrades and downgrades
CREATE TABLE IF NOT EXISTS plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_plan TEXT,
  new_plan TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'renewal')),
  payment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_usage_user_id ON quiz_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_usage_created_at ON quiz_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON feature_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_changes_user_id ON plan_changes(user_id);

-- Enable RLS
ALTER TABLE quiz_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_usage
CREATE POLICY "Users can view own quiz usage" ON quiz_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz usage" ON quiz_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for file_uploads
CREATE POLICY "Users can view own file uploads" ON file_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own file uploads" ON file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for feature_access_logs
CREATE POLICY "Users can view own feature access logs" ON feature_access_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feature access logs" ON feature_access_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for plan_changes
CREATE POLICY "Users can view own plan changes" ON plan_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan changes" ON plan_changes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies (service role can access all)
CREATE POLICY "Service role can access all quiz usage" ON quiz_usage
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all file uploads" ON file_uploads
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all feature access logs" ON feature_access_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all plan changes" ON plan_changes
  FOR ALL USING (auth.role() = 'service_role');
