-- Check all payments in both tables
-- This will help us see if the payment was created at all

-- Check user_payments table
SELECT 'user_payments' as table_name, COUNT(*) as count FROM user_payments;
SELECT 'user_payments' as table_name, * FROM user_payments ORDER BY created_at DESC LIMIT 5;

-- Check old payments table  
SELECT 'payments' as table_name, COUNT(*) as count FROM payments;
SELECT 'payments' as table_name, * FROM payments ORDER BY created_at DESC LIMIT 5;

-- Check if there are any users
SELECT 'users' as table_name, COUNT(*) as count FROM auth.users;
SELECT 'users' as table_name, id, email FROM auth.users LIMIT 3;