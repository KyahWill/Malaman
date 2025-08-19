/**
 * Media Upload API Endpoint
 * Handles file uploads with validation and processing
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaStorageService } from '$lib/services/mediaStorage.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'image' | 'video' | 'file';
    const contentId = formData.get('contentId') as string | null;
    const generateThumbnail = formData.get('generateThumbnail') === 'true';

    if (!file) {
      throw error(400, 'No file provided');
    }

    if (!type || !['image', 'video', 'file'].includes(type)) {
      throw error(400, 'Invalid or missing file type');
    }

    // Upload file
    const result = await MediaStorageService.uploadFile({
      file,
      type,
      contentId: contentId || undefined,
      generateThumbnail
    });

    return json({
      success: true,
      url: result.url,
      metadata: result.metadata
    });

  } catch (err) {
    console.error('Upload error:', err);
    
    if (err instanceof Error) {
      // Handle known errors
      if (err.message.includes('File size')) {
        throw error(413, err.message);
      }
      if (err.message.includes('not allowed')) {
        throw error(415, err.message);
      }
      throw error(500, err.message);
    }
    
    throw error(500, 'Upload failed');
  }
};