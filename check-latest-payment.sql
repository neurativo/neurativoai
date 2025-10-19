-- Check Latest Payment Submission
-- This query checks both old and new payment tables for the most recent payment

-- First, check if the new user_payments table exists and has data
SELECT 
    'NEW TABLE (user_payments)' as table_name,
    COUNT(*) as total_payments,
    MAX(created_at) as latest_payment_date
FROM user_payments
UNION ALL
-- Check the old payments table
SELECT 
    'OLD TABLE (payments)' as table_name,
    COUNT(*) as total_payments,
    MAX(created_at) as latest_payment_date
FROM payments;

-- Get the 5 most recent payments from both tables
SELECT 
    'NEW TABLE (user_payments)' as source,
    id,
    user_id,
    plan_id,
    method,
    amount,
    currency,
    transaction_reference,
    proof_url,
    status,
    created_at,
    updated_at
FROM user_payments
ORDER BY created_at DESC
LIMIT 5

UNION ALL

SELECT 
    'OLD TABLE (payments)' as source,
    id,
    user_id,
    plan as plan_id,
    method,
    amount_cents/100 as amount,
    currency,
    transaction_reference,
    proof_url,
    status,
    created_at,
    updated_at
FROM payments
ORDER BY created_at DESC
LIMIT 5;

-- Get the very latest payment from both tables combined
SELECT 
    source,
    id,
    user_id,
    plan_id,
    method,
    amount,
    currency,
    transaction_reference,
    proof_url,
    status,
    created_at
FROM (
    SELECT 
        'NEW TABLE' as source,
        id,
        user_id,
        plan_id,
        method,
        amount,
        currency,
        transaction_reference,
        proof_url,
        status,
        created_at
    FROM user_payments
    
    UNION ALL
    
    SELECT 
        'OLD TABLE' as source,
        id,
        user_id,
        plan as plan_id,
        method,
        amount_cents/100 as amount,
        currency,
        transaction_reference,
        proof_url,
        status,
        created_at
    FROM payments
) combined_payments
ORDER BY created_at DESC
LIMIT 10;
