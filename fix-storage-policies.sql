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

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for users to upload their own payment proofs
CREATE POLICY "Users can upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create policy for users to view their own payment proofs
CREATE POLICY "Users can view own payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Create policy for admins to view all payment proofs
CREATE POLICY "Admins can view all payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payments' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role IN ('super_admin', 'admin')
    AND au.is_active = true
  )
);

-- 6. Create policy for users to update their own payment proofs
CREATE POLICY "Users can update own payment proofs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'payments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. Create policy for users to delete their own payment proofs
CREATE POLICY "Users can delete own payment proofs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'payments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
