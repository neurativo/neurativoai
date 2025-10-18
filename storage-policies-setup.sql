-- =====================================================
-- STORAGE POLICIES SETUP
-- =====================================================
-- Run this separately in Supabase SQL Editor
-- This handles storage policies that require special permissions

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload to payments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view payment files" ON storage.objects;

-- Create comprehensive RLS policies for storage
CREATE POLICY "Allow authenticated users to upload payment files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'payments' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'pdf'))
    );

CREATE POLICY "Allow authenticated users to view payment files" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'payments' 
        AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR auth.role() = 'service_role'
        )
    );

CREATE POLICY "Allow service role full access to payment files" ON storage.objects
    FOR ALL TO service_role
    USING (bucket_id = 'payments');

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions for storage
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO service_role;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
