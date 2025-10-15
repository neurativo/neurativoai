-- Test if payments table exists and check its structure
-- Run this in your Supabase SQL Editor

-- Check if payments table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'payments'
) as table_exists;

-- If table exists, show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any payments in the table
SELECT COUNT(*) as payment_count FROM public.payments;

-- Show recent payments if any exist
SELECT * FROM public.payments 
ORDER BY created_at DESC 
LIMIT 5;
