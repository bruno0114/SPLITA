-- FIX: Storage RLS for Group Images
-- This script allows members to upload images that start with 'group_' 
-- to the 'avatars' bucket to ensure Group Settings work correctly.

-- 1. Ensure the bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- 2. Drop existing restrictive policies if necessary (Optional, be careful)
-- DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 3. Policy: Allow authenticated users to upload files starting with 'group_'
-- Note: This is a balance between security and UX.
CREATE POLICY "Allow members to upload group assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] IS NULL AND -- Root level files
  name LIKE 'group_%'
);

-- 4. Policy: Allow owners to update/upsert their group assets
CREATE POLICY "Allow members to update group assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND name LIKE 'group_%');

-- 5. Policy: Allow public viewing
CREATE POLICY "Allow public viewing of avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
