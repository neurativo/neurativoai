-- =====================================================
-- TEST PAYMENT INSERT - DEBUG THE EXACT ERROR
-- =====================================================
-- Run this in Supabase SQL Editor to test payment insertion

-- Test 1: Try to insert a test payment (this will show the exact error)
INSERT INTO user_payments (
    user_id,
    plan_id,
    method,
    amount,
    currency,
    transaction_reference,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- dummy user ID
    2, -- Professional plan ID
    'bank',
    5.99,
    'USD',
    'TEST123',
    'pending'
);

-- Test 2: Check what happens when we try to select
SELECT * FROM user_payments WHERE transaction_reference = 'TEST123';

-- Test 3: Check if we can insert into the old payments table
INSERT INTO payments (
    user_id,
    plan,
    method,
    amount_cents,
    currency,
    transaction_id,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'professional',
    'bank',
    599,
    'USD',
    'TEST123',
    'pending'
);
