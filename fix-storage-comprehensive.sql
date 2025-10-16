-- Comprehensive storage setup for payments bucket
-- Run this in your Supabase SQL Editor

-- 1. Create the payments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payments',
    'payments',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload to payments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload payment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view payment files" ON storage.objects;

-- 3. Create comprehensive RLS policies
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

-- 4. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO service_role;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;

-- 6. Test the setup (optional - you can run this to verify)
-- SELECT * FROM storage.buckets WHERE id = 'payments';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
