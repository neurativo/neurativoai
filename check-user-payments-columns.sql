-- Check what columns exist in the user_payments table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_payments' 
ORDER BY ordinal_position;
