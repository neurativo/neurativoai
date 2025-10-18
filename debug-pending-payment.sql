-- Debug pending payment detection
-- Replace with your actual user ID

-- Check if payment exists in user_payments table
SELECT 
    up.id,
    up.user_id,
    up.status,
    up.plan_id,
    sp.name as plan_name,
    up.created_at
FROM user_payments up
LEFT JOIN subscription_plans sp ON up.plan_id = sp.id
WHERE up.user_id = (SELECT id FROM auth.users LIMIT 1) -- Replace with actual user ID
ORDER BY up.created_at DESC;

-- Check if payment exists in old payments table
SELECT 
    id,
    user_id,
    plan,
    status,
    created_at
FROM payments 
WHERE user_id = (SELECT id FROM auth.users LIMIT 1) -- Replace with actual user ID
ORDER BY created_at DESC;

-- Check what plans exist in subscription_plans
SELECT id, name FROM subscription_plans ORDER BY id;
