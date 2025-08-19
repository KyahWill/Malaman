/**
 * Media Statistics API Endpoint
 * Provides storage usage statistics
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaStorageService } from '$lib/services/mediaStorage.js';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Check authentication (admin only for stats)
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    // For now, allow all authenticated users to see stats
    // In production, you might want to restrict this to admins
    
    // Get storage statistics
    const stats = await MediaStorageService.getStorageStats();

    return json({
      success: true,
      stats: {
        ...stats,
        totalSizeFormatted: MediaStorageService.formatFileSize(stats.totalSize),
        byTypeFormatted: Object.entries(stats.byType).reduce((acc, [type, data]) => {
          acc[type] = {
            ...data,
            sizeFormatted: MediaStorageService.formatFileSize(data.size)
          };
          return acc;
        }, {} as Record<string, any>)
      }
    });

  } catch (err) {
    console.error('Get storage stats error:', err);
    
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    
    throw error(500, 'Failed to get storage statistics');
  }
};