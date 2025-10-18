-- =====================================================
-- COMPLETE DATABASE SETUP - PAYMENT & PLAN SYSTEM (NO ROLE DEPENDENCY)
-- =====================================================
-- Run these scripts in order in your Supabase SQL Editor

-- =====================================================
-- 1. STORAGE SETUP FOR PAYMENT FILES
-- =====================================================

-- Create the payments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payments',
    'payments',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

-- =====================================================
-- 2. ADDITIONAL RLS POLICIES FOR ADMIN ACCESS (SERVICE ROLE ONLY)
-- =====================================================

-- Create admin policies for user_payments (service role can see all)
-- Note: Admin access will be handled through service role in the API
CREATE POLICY "Service role can manage all payments" ON user_payments
    FOR ALL TO service_role
    USING (true);

-- Create admin policies for user_subscriptions
CREATE POLICY "Service role can manage all subscriptions" ON user_subscriptions
    FOR ALL TO service_role
    USING (true);

-- =====================================================
-- 3. VERIFY DATABASE SETUP
-- =====================================================

-- Check if all tables exist and have data
SELECT 'subscription_plans' as table_name, count(*) as row_count 
FROM subscription_plans
UNION ALL
SELECT 'user_payments' as table_name, count(*) as row_count 
FROM user_payments
UNION ALL
SELECT 'user_subscriptions' as table_name, count(*) as row_count 
FROM user_subscriptions
UNION ALL
SELECT 'profiles' as table_name, count(*) as row_count 
FROM profiles;

-- Check what plans are available
SELECT id, name, monthly_price, yearly_price, daily_limit, monthly_limit
FROM subscription_plans 
ORDER BY monthly_price;

-- Check storage buckets
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'payments';

-- Check RLS policies for payment tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('user_payments', 'user_subscriptions', 'subscription_plans')
ORDER BY tablename, policyname;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Your database is now ready for the new payment and plan system!
-- Admin access will be handled through the service role in the API.
