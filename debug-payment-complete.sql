-- =====================================================
-- COMPLETE PAYMENT DEBUG - SINGLE TABLE RESULTS
-- =====================================================
-- Run this in Supabase SQL Editor to get all diagnostic info in one table

SELECT 
    '1. user_payments table exists' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_payments') 
        THEN 'YES' 
        ELSE 'NO' 
    END as result,
    'Critical - Table must exist' as importance
UNION ALL
SELECT 
    '2. payments table exists (fallback)',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') 
        THEN 'YES' 
        ELSE 'NO' 
    END,
    'Important - Fallback table'
UNION ALL
SELECT 
    '3. user_payments has correct columns',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_payments' 
            AND column_name IN ('id', 'user_id', 'plan_id', 'method', 'amount', 'currency', 'status')
        ) 
        THEN 'YES' 
        ELSE 'NO' 
    END,
    'Critical - Must have all required columns'
UNION ALL
SELECT 
    '4. subscription_plans has data',
    CASE 
        WHEN EXISTS (SELECT 1 FROM subscription_plans) 
        THEN CONCAT('YES (', (SELECT count(*) FROM subscription_plans), ' plans)')
        ELSE 'NO' 
    END,
    'Critical - Must have plan data'
UNION ALL
SELECT 
    '5. user_payments RLS enabled',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE c.relname = 'user_payments' 
            AND n.nspname = 'public' 
            AND c.relrowsecurity = true
        ) 
        THEN 'YES' 
        ELSE 'NO' 
    END,
    'Important - RLS status'
UNION ALL
SELECT 
    '6. user_payments insert policy exists',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_payments' 
            AND cmd = 'INSERT'
        ) 
        THEN 'YES' 
        ELSE 'NO' 
    END,
    'Critical - Must allow inserts'
UNION ALL
SELECT 
    '7. Can select from user_payments',
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_payments LIMIT 1) 
        THEN CONCAT('YES (', (SELECT count(*) FROM user_payments), ' records)')
        ELSE 'NO' 
    END,
    'Important - Access test'
UNION ALL
SELECT 
    '8. Can select from payments (fallback)',
    CASE 
        WHEN EXISTS (SELECT 1 FROM payments LIMIT 1) 
        THEN CONCAT('YES (', (SELECT count(*) FROM payments), ' records)')
        ELSE 'NO' 
    END,
    'Important - Fallback access'
UNION ALL
SELECT 
    '9. Professional plan exists',
    CASE 
        WHEN EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Professional') 
        THEN CONCAT('YES (ID: ', (SELECT id FROM subscription_plans WHERE name = 'Professional'), ')')
        ELSE 'NO' 
    END,
    'Critical - Plan must exist'
UNION ALL
SELECT 
    '10. Professional plan pricing',
    CASE 
        WHEN EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Professional') 
        THEN CONCAT('Monthly: $', (SELECT monthly_price FROM subscription_plans WHERE name = 'Professional'), ', Yearly: $', (SELECT yearly_price FROM subscription_plans WHERE name = 'Professional'))
        ELSE 'NO DATA' 
    END,
    'Important - Pricing verification'
ORDER BY 
    check_item;
