/**
 * Media Cleanup API Endpoint
 * Handles cleanup of orphaned files
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaStorageService } from '$lib/services/mediaStorage.js';

export const POST: RequestHandler = async ({ locals }) => {
  try {
    // Check authentication and admin role
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    // TODO: Add admin role check when user roles are implemented
    // if (locals.session.user.role !== 'admin') {
    //   throw error(403, 'Admin access required');
    // }
    
    // Perform cleanup
    const result = await MediaStorageService.cleanupOrphanedFiles();

    return json({
      success: true,
      result: {
        deletedCount: result.deleted.length,
        deleted: result.deleted,
        errors: result.errors
      }
    });

  } catch (err) {
    console.error('Cleanup error:', err);
    
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    
    throw error(500, 'Cleanup failed');
  }
};