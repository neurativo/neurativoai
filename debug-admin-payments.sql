-- Debug admin payments API issue
-- Check if user_payments table exists and has data

-- Check if user_payments table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'user_payments';

-- Check user_payments table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_payments' 
ORDER BY ordinal_position;

-- Check if there are any payments in user_payments
SELECT 
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_payments,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_payments
FROM user_payments;

-- Check recent payments
SELECT 
    id,
    user_id,
    status,
    amount,
    currency,
    method,
    created_at
FROM user_payments 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if subscription_plans table exists (needed for join)
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'subscription_plans';

-- Check subscription_plans data
SELECT id, name FROM subscription_plans ORDER BY id;
