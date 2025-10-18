-- Quick check for recent payments
-- Check both old and new payment tables

-- Check old payments table
SELECT 
    'old_payments' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM payments
UNION ALL
-- Check new user_payments table  
SELECT 
    'user_payments' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM user_payments;

-- Show recent payments from both tables
SELECT 
    'old_payments' as source,
    id,
    user_id,
    plan,
    status,
    amount_cents,
    created_at
FROM payments 
ORDER BY created_at DESC 
LIMIT 3

UNION ALL

SELECT 
    'user_payments' as source,
    id::text,
    user_id,
    plan_id::text,
    status,
    amount::text,
    created_at
FROM user_payments 
ORDER BY created_at DESC 
LIMIT 3;
