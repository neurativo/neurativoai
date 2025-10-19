-- Debug plan lookup issue
-- Check what plans exist in subscription_plans table
SELECT id, name, monthly_price, yearly_price 
FROM subscription_plans 
ORDER BY name;

-- Check what plan names are in the payments table
SELECT DISTINCT plan, COUNT(*) as count
FROM payments 
WHERE created_at >= '2025-10-19'
ORDER BY plan;

-- Check the specific payment that failed
SELECT id, user_id, plan, status, created_at
FROM payments 
WHERE created_at >= '2025-10-19'
ORDER BY created_at DESC
LIMIT 5;
