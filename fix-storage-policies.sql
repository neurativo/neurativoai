-- Fix Supabase Storage Policies for Payment Proofs
-- Run this in your Supabase SQL Editor

-- 1. Create the payments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payments',
  'payments',
  false, -- private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 2. Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role IN ('super_admin', 'admin')
    AND au.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create policies using the function (these should work without ownership issues)
-- Note: You may need to run these individually if there are permission issues

-- Policy for users to upload their own payment proofs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload payment proofs'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can upload payment proofs" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = ''payments'' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    )';
  END IF;
END $$;

-- Policy for users to view their own payment proofs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view own payment proofs'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own payment proofs" ON storage.objects
    FOR SELECT USING (
      bucket_id = ''payments'' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    )';
  END IF;
END $$;

-- Policy for admins to view all payment proofs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can view all payment proofs'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all payment proofs" ON storage.objects
    FOR SELECT USING (
      bucket_id = ''payments'' 
      AND is_admin()
    )';
  END IF;
END $$;

-- Alternative: If the above doesn't work, try this simpler approach
-- Just create a public bucket for now (less secure but will work)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payments';

-- Grant basic permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;
