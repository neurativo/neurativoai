-- =====================================================
-- FIX PROFILES TABLE - ADD ROLE COLUMN
-- =====================================================
-- Run this first before the complete-database-setup-simplified.sql

-- Add role column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Update existing profiles to have 'user' role
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Create index on role column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'role';
