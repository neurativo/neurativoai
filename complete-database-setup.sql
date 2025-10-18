-- =====================================================
-- COMPLETE DATABASE SETUP - PAYMENT & PLAN SYSTEM
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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload to payments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view payment files" ON storage.objects;

-- Create comprehensive RLS policies for storage
CREATE POLICY "Allow authenticated users to upload payment files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'payments' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'pdf'))
    );

CREATE POLICY "Allow authenticated users to view payment files" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'payments' 
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR auth.role() = 'service_role'
        )
    );

CREATE POLICY "Allow service role full access to payment files" ON storage.objects
    FOR ALL TO service_role
    USING (bucket_id = 'payments');

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions for storage
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO service_role;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;

-- =====================================================
-- 2. ADDITIONAL RLS POLICIES FOR ADMIN ACCESS
-- =====================================================

-- Create admin policies for user_payments (admin can see all)
CREATE POLICY "Admin can view all payments" ON user_payments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can update all payments" ON user_payments
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create admin policies for user_subscriptions
CREATE POLICY "Admin can view all subscriptions" ON user_subscriptions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can update all subscriptions" ON user_subscriptions
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 3. CREATE ADMIN USER (if needed)
-- =====================================================

-- Create admin profile for the first admin user
-- Replace 'your-admin-user-id' with the actual user ID from auth.users
-- You can find this in the Supabase dashboard under Authentication > Users

/*
INSERT INTO profiles (id, email, display_name, role, created_at)
VALUES (
    'your-admin-user-id', -- Replace with actual user ID
    'admin@neurativo.com',
    'Admin User',
    'admin',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();
*/

-- =====================================================
-- 4. VERIFY DATABASE SETUP
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

-- Check storage policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check RLS policies for payment tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('user_payments', 'user_subscriptions', 'subscription_plans')
ORDER BY tablename, policyname;

-- =====================================================
-- 5. TEST DATA (OPTIONAL)
-- =====================================================

-- Insert a test payment (replace with actual user ID)
/*
INSERT INTO user_payments (user_id, plan_id, method, amount, currency, transaction_reference, status)
VALUES (
    'your-test-user-id', -- Replace with actual user ID
    (SELECT id FROM subscription_plans WHERE name = 'Professional'),
    'bank',
    5.99,
    'USD',
    'TEST123456',
    'pending'
);
*/

-- =====================================================
-- 6. CLEANUP OLD TABLES (OPTIONAL - UNCOMMENT IF READY)
-- =====================================================

-- Only run these if you're sure you want to remove the old tables
-- Make sure to backup any important data first!

/*
-- Drop old tables
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
*/

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Your database is now ready for the new payment and plan system!
-- The system will automatically use the new tables and fall back to old ones if needed.
