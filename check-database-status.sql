-- Check database status for payment system
-- Run this in Supabase SQL Editor to see current state

-- Check if subscription_plans table exists and has data
SELECT 'subscription_plans table' as table_name, count(*) as row_count 
FROM subscription_plans;

-- Check if user_payments table exists and has data  
SELECT 'user_payments table' as table_name, count(*) as row_count 
FROM user_payments;

-- Check if user_subscriptions table exists and has data
SELECT 'user_subscriptions table' as table_name, count(*) as row_count 
FROM user_subscriptions;

-- Check what plans are available
SELECT id, name, monthly_price, yearly_price 
FROM subscription_plans 
ORDER BY monthly_price;

-- Check storage buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'payments';

-- Check storage policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
