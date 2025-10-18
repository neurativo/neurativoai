-- =====================================================
-- DATABASE SETUP VERIFICATION SCRIPT
-- =====================================================
-- Run this to verify your database setup is complete

-- 1. Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('subscription_plans', 'user_payments', 'user_subscriptions', 'profiles') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_plans', 'user_payments', 'user_subscriptions', 'profiles');

-- 2. Check subscription plans data
SELECT 
    'subscription_plans' as table,
    count(*) as total_plans,
    string_agg(name, ', ') as plan_names
FROM subscription_plans;

-- 3. Check storage bucket
SELECT 
    'storage_bucket' as component,
    CASE 
        WHEN count(*) > 0 THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM storage.buckets 
WHERE id = 'payments';

-- 4. Check RLS policies
SELECT 
    'rls_policies' as component,
    count(*) as total_policies,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename IN ('user_payments', 'user_subscriptions', 'subscription_plans');

-- 5. Check storage policies
SELECT 
    'storage_policies' as component,
    count(*) as total_policies,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 6. Test function availability
SELECT 
    'functions' as component,
    count(*) as total_functions,
    string_agg(proname, ', ') as function_names
FROM pg_proc 
WHERE proname IN ('get_user_current_plan', 'deactivate_expired_subscriptions', 'update_updated_at_column');

-- 7. Check indexes
SELECT 
    'indexes' as component,
    count(*) as total_indexes,
    string_agg(indexname, ', ') as index_names
FROM pg_indexes 
WHERE tablename IN ('user_payments', 'user_subscriptions', 'subscription_plans');

-- 8. Summary
SELECT 
    'SETUP SUMMARY' as status,
    CASE 
        WHEN (
            (SELECT count(*) FROM subscription_plans) > 0 AND
            (SELECT count(*) FROM storage.buckets WHERE id = 'payments') > 0 AND
            (SELECT count(*) FROM pg_policies WHERE tablename IN ('user_payments', 'user_subscriptions')) > 0
        ) 
        THEN '✅ DATABASE SETUP COMPLETE' 
        ELSE '❌ SETUP INCOMPLETE - CHECK ABOVE' 
    END as result;
