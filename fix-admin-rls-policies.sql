-- Fix RLS policies for admin access to payments and users
-- Run this in your Supabase SQL Editor

-- 1. Fix payments table RLS policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;

-- Create new policies that work with admin system
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies - check if admin_users table exists
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can update payments" ON public.payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

-- 2. Fix profiles table RLS policies for admin access
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin policies for profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

-- 3. Alternative: If admin_users table doesn't exist, create a simple bypass
-- Uncomment these lines if the above policies don't work:

-- CREATE POLICY "Bypass RLS for service role" ON public.payments
--     FOR ALL TO service_role USING (true);

-- CREATE POLICY "Bypass RLS for service role" ON public.profiles
--     FOR ALL TO service_role USING (true);

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
