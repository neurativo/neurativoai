-- Fix RLS policies for profiles table to allow admin access
-- The admin panel needs to access the profiles table to manage users

-- First, check if profiles table has RLS enabled
-- If it does, we need to add policies for admin access

-- Policy: Allow service role to access all profiles (for API operations)
CREATE POLICY "Service role can access profiles" ON profiles
FOR ALL USING (auth.role() = 'service_role');

-- Policy: Allow admins to view all profiles
CREATE POLICY "Admins can view profiles" ON profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.is_active = true
    )
);

-- Policy: Allow admins to update profiles (for user management)
CREATE POLICY "Admins can update profiles" ON profiles
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.is_active = true
    )
);

-- Policy: Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);
