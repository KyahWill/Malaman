/**
 * Media Storage Service
 * Handles file uploads, storage management, and CDN integration
 */

import { supabase } from '$lib/supabase.js';
import type { FileObject } from '@supabase/storage-js';

export interface MediaUploadOptions {
  file: File;
  type: 'image' | 'video' | 'file';
  contentId?: string; // lesson or course ID for organization
  generateThumbnail?: boolean;
}

export interface MediaMetadata {
  filename: string;
  originalName: string;
  type: string;
  size: number;
  uploadedAt: string;
  contentId?: string;
  thumbnailUrl?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface StorageConfig {
  buckets: {
    media: {
      maxFileSize: number; // in bytes
      allowedTypes: string[];
    };
    thumbnails: {
      maxFileSize: number;
      allowedTypes: string[];
    };
  };
  cdnUrl?: string;
}

export class MediaStorageService {
  private static readonly STORAGE_CONFIG: StorageConfig = {
    buckets: {
      media: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedTypes: [
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
        ]
      },
      thumbnails: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    }
  };

  /**
   * Initialize storage buckets if they don't exist
   */
  static async initializeStorage(): Promise<void> {
    try {
      // Check if media bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }

      const existingBuckets = buckets?.map(b => b.name) || [];

      // Create media bucket if it doesn't exist
      if (!existingBuckets.includes('media')) {
        const { error: createError } = await supabase.storage.createBucket('media', {
          public: true,
          allowedMimeTypes: this.STORAGE_CONFIG.buckets.media.allowedTypes,
          fileSizeLimit: this.STORAGE_CONFIG.buckets.media.maxFileSize
        });

        if (createError) {
          console.error('Error creating media bucket:', createError);
        } else {
          console.log('Media bucket created successfully');
        }
      }

      // Create thumbnails bucket if it doesn't exist
      if (!existingBuckets.includes('thumbnails')) {
        const { error: createError } = await supabase.storage.createBucket('thumbnails', {
          public: true,
          allowedMimeTypes: this.STORAGE_CONFIG.buckets.thumbnails.allowedTypes,
          fileSizeLimit: this.STORAGE_CONFIG.buckets.thumbnails.maxFileSize
        });

        if (createError) {
          console.error('Error creating thumbnails bucket:', createError);
        } else {
          console.log('Thumbnails bucket created successfully');
        }
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File, type: 'image' | 'video' | 'file'): string | null {
    // Check file size
    const maxSize = this.STORAGE_CONFIG.buckets.media.maxFileSize;
    if (file.size > maxSize) {
      return `File size must be less than ${this.formatFileSize(maxSize)}`;
    }

    // Check file type
    const allowedTypes = this.STORAGE_CONFIG.buckets.media.allowedTypes;
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    // Type-specific validation
    if (type === 'image' && !file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      return 'Please select a video file';
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (dangerousExtensions.includes(fileExtension)) {
      return 'This file type is not allowed for security reasons';
    }

    return null;
  }

  /**
   * Generate storage path for file
   */
  static generateStoragePath(file: File, type: 'image' | 'video' | 'file', contentId?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    const folder = contentId ? `${type}s/${contentId}` : `${type}s`;
    return `${folder}/${timestamp}_${randomId}_${baseName}.${extension}`;
  }

  /**
   * Upload file to storage
   */
  static async uploadFile(options: MediaUploadOptions): Promise<{ url: string; metadata: MediaMetadata }> {
    const { file, type, contentId, generateThumbnail = false } = options;

    // Validate file
    const validationError = this.validateFile(file, type);
    if (validationError) {
      throw new Error(validationError);
    }

    // Generate storage path
    const storagePath = this.generateStoragePath(file, type, contentId);

    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      const metadata: MediaMetadata = {
        filename: data.path,
        originalName: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        contentId
      };

      // Generate thumbnail for images if requested
      if (generateThumbnail && type === 'image') {
        try {
          const thumbnailUrl = await this.generateThumbnail(file, data.path);
          metadata.thumbnailUrl = thumbnailUrl;
        } catch (thumbnailError) {
          console.warn('Thumbnail generation failed:', thumbnailError);
        }
      }

      // Get image dimensions for images
      if (type === 'image') {
        try {
          const dimensions = await this.getImageDimensions(file);
          metadata.dimensions = dimensions;
        } catch (dimensionError) {
          console.warn('Could not get image dimensions:', dimensionError);
        }
      }

      return {
        url: urlData.publicUrl,
        metadata
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for image
   */
  static async generateThumbnail(file: File, originalPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        // Calculate thumbnail dimensions (max 300x300, maintain aspect ratio)
        const maxSize = 300;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate thumbnail blob'));
            return;
          }

          try {
            // Generate thumbnail path
            const thumbnailPath = `thumbnails/${originalPath.replace(/\.[^/.]+$/, '_thumb.jpg')}`;

            // Upload thumbnail
            const { data, error } = await supabase.storage
              .from('thumbnails')
              .upload(thumbnailPath, blob, {
                cacheControl: '3600',
                upsert: true
              });

            if (error) {
              reject(new Error(`Thumbnail upload failed: ${error.message}`));
              return;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('thumbnails')
              .getPublicUrl(data.path);

            resolve(urlData.publicUrl);
          } catch (uploadError) {
            reject(uploadError);
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => reject(new Error('Failed to load image for thumbnail generation'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get image dimensions
   */
  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('media')
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      // Also try to delete thumbnail if it exists
      const thumbnailPath = `thumbnails/${filePath.replace(/\.[^/.]+$/, '_thumb.jpg')}`;
      await supabase.storage
        .from('thumbnails')
        .remove([thumbnailPath])
        .catch(() => {
          // Ignore thumbnail deletion errors
        });
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  /**
   * List files in storage
   */
  static async listFiles(folder?: string, limit = 100): Promise<FileObject[]> {
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .list(folder, {
          limit,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`List failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('List error:', error);
      throw error;
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(filePath: string): Promise<FileObject | null> {
    try {
      const folder = filePath.substring(0, filePath.lastIndexOf('/'));
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

      const { data, error } = await supabase.storage
        .from('media')
        .list(folder);

      if (error) {
        throw new Error(`Get file info failed: ${error.message}`);
      }

      return data?.find(file => file.name === fileName) || null;
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  }

  /**
   * Clean up orphaned files (files not referenced in database)
   */
  static async cleanupOrphanedFiles(): Promise<{ deleted: string[]; errors: string[] }> {
    const deleted: string[] = [];
    const errors: string[] = [];

    try {
      // This would require database queries to check which files are still referenced
      // Implementation would depend on how file references are stored in the database
      console.log('Cleanup orphaned files - implementation needed based on database schema');
      
      // Placeholder for actual implementation
      return { deleted, errors };
    } catch (error) {
      console.error('Cleanup error:', error);
      return { deleted, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
  }> {
    try {
      const files = await this.listFiles('', 1000); // Get more files for stats
      
      let totalSize = 0;
      const byType: Record<string, { count: number; size: number }> = {};

      for (const file of files) {
        totalSize += file.metadata?.size || 0;
        
        const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        if (!byType[extension]) {
          byType[extension] = { count: 0, size: 0 };
        }
        byType[extension].count++;
        byType[extension].size += file.metadata?.size || 0;
      }

      return {
        totalFiles: files.length,
        totalSize,
        byType
      };
    } catch (error) {
      console.error('Get storage stats error:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        byType: {}
      };
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get CDN URL for file (if CDN is configured)
   */
  static getCDNUrl(publicUrl: string): string {
    // If CDN is configured, replace the Supabase URL with CDN URL
    if (this.STORAGE_CONFIG.cdnUrl) {
      return publicUrl.replace(
        /https:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public/,
        this.STORAGE_CONFIG.cdnUrl
      );
    }
    return publicUrl;
  }
}