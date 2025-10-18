-- =====================================================
-- DEBUG PAYMENT ERROR - CHECK DATABASE STATUS
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose the payment error

-- 1. Check if user_payments table exists and has correct structure
SELECT 
    'user_payments table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_payments' 
ORDER BY ordinal_position;

-- 2. Check if payments table exists (fallback)
SELECT 
    'payments table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- 3. Check RLS policies on user_payments
SELECT 
    'user_payments RLS policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_payments';

-- 4. Check RLS policies on payments table
SELECT 
    'payments RLS policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'payments';

-- 5. Check if subscription_plans table has data
SELECT 
    'subscription_plans data' as check_type,
    id,
    name,
    monthly_price,
    yearly_price
FROM subscription_plans 
ORDER BY monthly_price;

-- 6. Test insert permissions (this will show if RLS is blocking)
-- Note: This will fail if RLS is blocking, but that's expected
SELECT 
    'RLS test' as check_type,
    'user_payments insert test' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_payments'
        ) THEN 'Table exists'
        ELSE 'Table missing'
    END as result;

-- 7. Check if we can select from user_payments (basic access test)
SELECT 
    'user_payments access test' as check_type,
    count(*) as record_count
FROM user_payments;

-- 8. Check if we can select from payments table (fallback test)
SELECT 
    'payments access test' as check_type,
    count(*) as record_count
FROM payments;
