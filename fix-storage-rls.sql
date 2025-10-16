-- Fix storage RLS policies for payments bucket
-- Run this in your Supabase SQL Editor

-- 1. Make the payments bucket public for authenticated users
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payments';

-- 2. Create policy to allow authenticated users to upload to payments bucket
CREATE POLICY "Authenticated users can upload to payments" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'payments');

-- 3. Create policy to allow authenticated users to view their own files
CREATE POLICY "Users can view their own payment files" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'payments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Create policy to allow service role to access all files
CREATE POLICY "Service role can access all payment files" ON storage.objects
    FOR ALL TO service_role
    USING (bucket_id = 'payments');
