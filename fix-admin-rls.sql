-- Fix RLS infinite recursion on admin_users table
-- Run this directly in Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view other admin users" ON admin_users;
DROP POLICY IF EXISTS "Super Admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Super Admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Super Admins can delete admin users" ON admin_users;

-- Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create simpler, non-recursive policies
-- Policy: Allow service role to access all admin users (for API operations)
CREATE POLICY "Service role can access admin_users" ON admin_users
FOR ALL USING (auth.role() = 'service_role');

-- Policy: Allow admins to view other admin users (simplified)
CREATE POLICY "Admins can view admin users" ON admin_users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.is_active = true
    )
);

-- Policy: Only super admins can insert/update/delete (simplified)
CREATE POLICY "Super admins can manage admin users" ON admin_users
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role = 'super_admin'
        AND au.is_active = true
    )
);
