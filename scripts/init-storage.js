#!/usr/bin/env node

/**
 * Storage Initialization Script
 * Sets up Supabase storage buckets and policies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeStorage() {
  console.log('🚀 Initializing Supabase Storage...');

  try {
    // List existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const bucketNames = existingBuckets?.map(b => b.name) || [];
    console.log('📦 Existing buckets:', bucketNames);

    // Create media bucket
    if (!bucketNames.includes('media')) {
      console.log('📁 Creating media bucket...');
      
      const { error: createMediaError } = await supabase.storage.createBucket('media', {
        public: true,
        allowedMimeTypes: [
          // Images
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          // Videos
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'video/x-msvideo',
          // Documents
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          // Archives
          'application/zip',
          'application/x-rar-compressed',
          'application/x-7z-compressed'
        ],
        fileSizeLimit: 100 * 1024 * 1024 // 100MB
      });

      if (createMediaError) {
        console.error('❌ Error creating media bucket:', createMediaError);
      } else {
        console.log('✅ Media bucket created successfully');
      }
    } else {
      console.log('✅ Media bucket already exists');
    }

    // Create thumbnails bucket
    if (!bucketNames.includes('thumbnails')) {
      console.log('📁 Creating thumbnails bucket...');
      
      const { error: createThumbError } = await supabase.storage.createBucket('thumbnails', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });

      if (createThumbError) {
        console.error('❌ Error creating thumbnails bucket:', createThumbError);
      } else {
        console.log('✅ Thumbnails bucket created successfully');
      }
    } else {
      console.log('✅ Thumbnails bucket already exists');
    }

    // Set up RLS policies for storage
    console.log('🔒 Setting up storage policies...');
    
    // Note: Storage policies are typically set up through SQL migrations
    // This is just a placeholder for the policy setup
    console.log('ℹ️  Storage policies should be set up through database migrations');
    console.log('ℹ️  See supabase/migrations/ for RLS policy setup');

    console.log('🎉 Storage initialization completed successfully!');

  } catch (error) {
    console.error('❌ Storage initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeStorage();