-- Setup first admin user
-- Run this in your Supabase SQL Editor after running setup-admin-rls-policies.sql

-- 1. First, find your user ID from auth.users table
-- Replace 'your-email@example.com' with your actual email
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Insert yourself as a super admin (replace the UUID with your actual user ID)
-- You can get your user ID from the query above
INSERT INTO public.admin_users (user_id, email, role, is_active) 
VALUES (
    'your-user-id-here', -- Replace with your actual user ID from step 1
    'your-email@example.com', -- Replace with your actual email
    'super_admin',
    true
);

-- 3. Verify the admin user was created
SELECT * FROM public.admin_users;

-- 4. Test the admin functions
SELECT public.is_admin();
SELECT public.is_super_admin();
