-- Storage Setup Migration
-- Sets up storage buckets and RLS policies for media management

-- Enable storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";

-- Create storage policies for media bucket
-- Allow authenticated users to upload files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600, -- 100MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for media bucket

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to view all media files (public bucket)
CREATE POLICY "Anyone can view media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Allow users to update their own uploaded files
-- Note: This requires tracking file ownership, which would be implemented
-- in the application layer or through additional metadata
CREATE POLICY "Users can update their own media files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'media' AND
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own uploaded files
-- Note: Similar to update, this requires ownership tracking
CREATE POLICY "Users can delete their own media files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' AND
    auth.role() = 'authenticated'
  );

-- RLS Policies for thumbnails bucket

-- Allow authenticated users to upload thumbnails
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' AND
    auth.role() = 'authenticated'
  );

-- Allow anyone to view thumbnails (public bucket)
CREATE POLICY "Anyone can view thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

-- Allow users to update thumbnails
CREATE POLICY "Users can update thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'thumbnails' AND
    auth.role() = 'authenticated'
  );

-- Allow users to delete thumbnails
CREATE POLICY "Users can delete thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'thumbnails' AND
    auth.role() = 'authenticated'
  );

-- Create a table to track media file metadata and ownership
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID, -- Reference to lesson, course, etc.
  content_type TEXT, -- 'lesson', 'course', etc.
  thumbnail_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on media_files table
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_files table
CREATE POLICY "Users can view media files they have access to" ON media_files
  FOR SELECT USING (
    -- Users can see their own uploads
    uploaded_by = auth.uid() OR
    -- Users can see files in courses they're enrolled in
    -- (This would need to be expanded based on enrollment logic)
    true -- For now, allow all authenticated users to see metadata
  );

CREATE POLICY "Authenticated users can insert media files" ON media_files
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update their own media files" ON media_files
  FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own media files" ON media_files
  FOR DELETE USING (uploaded_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_content ON media_files(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON media_files
  FOR EACH ROW
  EXECUTE FUNCTION update_media_files_updated_at();

-- Create a function to clean up storage when media_files record is deleted
CREATE OR REPLACE FUNCTION cleanup_media_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the main file from storage
  PERFORM storage.delete_object('media', OLD.storage_path);
  
  -- Delete thumbnail if it exists
  IF OLD.thumbnail_path IS NOT NULL THEN
    PERFORM storage.delete_object('thumbnails', OLD.thumbnail_path);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to cleanup storage on record deletion
CREATE TRIGGER cleanup_media_storage_trigger
  AFTER DELETE ON media_files
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_media_storage();

-- Grant necessary permissions
GRANT ALL ON media_files TO authenticated;
GRANT ALL ON media_files TO service_role;