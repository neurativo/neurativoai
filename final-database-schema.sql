-- =====================================================
-- FINAL DATABASE SCHEMA REVISION - PAYMENT & PLAN SYSTEM
-- =====================================================
-- This script implements the clean, normalized database structure
-- Run this in your Supabase SQL Editor

-- 1. Create subscription_plans table (master plan definitions)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,           -- 'Free', 'Professional', 'Mastery', 'Innovation'
  monthly_price NUMERIC NOT NULL,
  yearly_price NUMERIC NOT NULL,
  features TEXT[],
  daily_limit INT,
  monthly_limit INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create user_payments table (all payment submissions)
CREATE TABLE IF NOT EXISTS user_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id INT REFERENCES subscription_plans(id),
  method TEXT NOT NULL CHECK (method IN ('bank','binance')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'LKR',
  transaction_reference TEXT,       -- Bank ref number OR Binance hash
  proof_url TEXT,                   -- Optional receipt or screenshot
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create user_subscriptions table (subscription states only)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id INT REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active','inactive','expired')),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  payment_id UUID REFERENCES user_payments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Simplify profiles table (remove plan column)
ALTER TABLE profiles DROP COLUMN IF EXISTS plan;

-- 5. Insert default subscription plans
INSERT INTO subscription_plans (name, monthly_price, yearly_price, features, daily_limit, monthly_limit) VALUES
('Free', 0, 0, ARRAY[
  '3 quizzes per day',
  '50 quizzes per month', 
  'MCQ & True/False only',
  'Basic AI features',
  'Community support'
], 3, 50),

('Professional', 5.99, 59.99, ARRAY[
  '15 quizzes per day',
  '300 quizzes per month',
  'All quiz types',
  'Live lectures access',
  'Study pack generator',
  'Data export',
  'Advanced analytics',
  'Email support'
], 15, 300),

('Mastery', 12.99, 129.99, ARRAY[
  '50 quizzes per day',
  '1000 quizzes per month',
  'All quiz types + coding',
  'Unlimited lectures',
  'Advanced study packs',
  'Full analytics suite',
  'Custom quiz creation',
  'Priority support',
  'API access'
], 50, 1000),

('Innovation', 24.99, 249.99, ARRAY[
  'Unlimited quizzes',
  'All quiz types + VR',
  'Unlimited everything',
  'White-label options',
  'Custom integrations',
  'Dedicated support',
  'Advanced AI features',
  'Enterprise features'
], -1, -1);

-- 6. Enable RLS on all tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for user_payments
CREATE POLICY "Users can insert their own payments"
ON user_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payments"
ON user_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all payments"
ON user_payments FOR ALL
TO service_role USING (true);

-- 8. Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all subscriptions"
ON user_subscriptions FOR ALL
TO service_role USING (true);

-- 9. Create RLS policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT
USING (true);

CREATE POLICY "Service role can manage subscription plans"
ON subscription_plans FOR ALL
TO service_role USING (true);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_payments_user_id ON user_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_status ON user_payments(status);
CREATE INDEX IF NOT EXISTS idx_user_payments_created_at ON user_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON subscription_plans TO authenticated;
GRANT ALL ON user_payments TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON subscription_plans TO service_role;
GRANT ALL ON user_payments TO service_role;
GRANT ALL ON user_subscriptions TO service_role;

-- 12. Create function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_current_plan(user_uuid UUID)
RETURNS TABLE (
  plan_id INT,
  plan_name TEXT,
  status TEXT,
  end_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    us.status,
    us.end_date
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = user_uuid 
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to deactivate expired subscriptions
CREATE OR REPLACE FUNCTION deactivate_expired_subscriptions()
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE user_subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE end_date < NOW() 
    AND status = 'active';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_payments_updated_at
  BEFORE UPDATE ON user_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. Migrate existing data (if any)
-- This will help migrate from the old system to the new one
DO $$
DECLARE
  plan_record RECORD;
  user_record RECORD;
  subscription_record RECORD;
BEGIN
  -- Migrate existing subscriptions to new structure
  FOR subscription_record IN 
    SELECT DISTINCT user_id, plan, created_at 
    FROM subscriptions 
    WHERE status = 'active'
  LOOP
    -- Find the corresponding plan_id
    SELECT id INTO plan_record.id 
    FROM subscription_plans 
    WHERE LOWER(name) = LOWER(subscription_record.plan);
    
    IF plan_record.id IS NOT NULL THEN
      -- Create new subscription record
      INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, created_at)
      VALUES (
        subscription_record.user_id, 
        plan_record.id, 
        'active', 
        subscription_record.created_at,
        subscription_record.created_at
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  -- Migrate existing payments to new structure
  FOR user_record IN 
    SELECT DISTINCT user_id, plan, method, amount_cents, currency, transaction_reference, 
           proof_url, status, admin_note, created_at
    FROM payments
  LOOP
    -- Find the corresponding plan_id
    SELECT id INTO plan_record.id 
    FROM subscription_plans 
    WHERE LOWER(name) = LOWER(user_record.plan);
    
    IF plan_record.id IS NOT NULL THEN
      -- Create new payment record
      INSERT INTO user_payments (user_id, plan_id, method, amount, currency, 
                                transaction_reference, proof_url, status, admin_note, created_at)
      VALUES (
        user_record.user_id,
        plan_record.id,
        user_record.method,
        user_record.amount_cents / 100.0,
        user_record.currency,
        user_record.transaction_reference,
        user_record.proof_url,
        user_record.status,
        user_record.admin_note,
        user_record.created_at
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- 16. Clean up old tables (optional - uncomment if you want to remove old tables)
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;

-- 17. Verify the new structure
SELECT 'subscription_plans' as table_name, count(*) as record_count FROM subscription_plans
UNION ALL
SELECT 'user_payments' as table_name, count(*) as record_count FROM user_payments
UNION ALL
SELECT 'user_subscriptions' as table_name, count(*) as record_count FROM user_subscriptions;
