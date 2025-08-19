/**
 * Media List API Endpoint
 * Lists files in storage with filtering options
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaStorageService } from '$lib/services/mediaStorage.js';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const folder = url.searchParams.get('folder') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // List files
    const files = await MediaStorageService.listFiles(folder, limit);

    return json({
      success: true,
      files,
      count: files.length
    });

  } catch (err) {
    console.error('List files error:', err);
    
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    
    throw error(500, 'Failed to list files');
  }
};