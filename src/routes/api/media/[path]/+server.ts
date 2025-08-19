/**
 * Media Management API Endpoint
 * Handles file operations like delete, info, etc.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaStorageService } from '$lib/services/mediaStorage.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const filePath = decodeURIComponent(params.path);
    
    // Get file info
    const fileInfo = await MediaStorageService.getFileInfo(filePath);
    
    if (!fileInfo) {
      throw error(404, 'File not found');
    }

    return json({
      success: true,
      file: fileInfo
    });

  } catch (err) {
    console.error('Get file info error:', err);
    
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    
    throw error(500, 'Failed to get file info');
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const filePath = decodeURIComponent(params.path);
    
    // Delete file
    await MediaStorageService.deleteFile(filePath);

    return json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (err) {
    console.error('Delete file error:', err);
    
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    
    throw error(500, 'Failed to delete file');
  }
};