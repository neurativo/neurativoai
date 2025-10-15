-- Simple admin bypass for RLS policies
-- Run this in your Supabase SQL Editor

-- 1. Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can access all payments" ON public.payments;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON public.profiles;

-- Allow service role to access all payments (for admin panel)
CREATE POLICY "Service role can access all payments" ON public.payments
    FOR ALL TO service_role USING (true);

-- Allow authenticated users to access their own payments
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Create a simple admin bypass for profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Allow service role to access all profiles (for admin panel)
CREATE POLICY "Service role can access all profiles" ON public.profiles
    FOR ALL TO service_role USING (true);

-- Allow users to access their own profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.profiles TO service_role;
