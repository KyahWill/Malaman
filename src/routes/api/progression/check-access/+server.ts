/**
 * API endpoint to check content access permissions
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ProgressionControlService } from '$lib/services/progressionControl.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { contentId, contentType } = await request.json();

    if (!contentId || !contentType) {
      throw error(400, 'Content ID and type are required');
    }

    if (!['lesson', 'course', 'assessment'].includes(contentType)) {
      throw error(400, 'Invalid content type');
    }

    const studentId = locals.session.user.id;
    const accessResult = await ProgressionControlService.canAccessContent(
      studentId,
      contentId,
      contentType as 'lesson' | 'course' | 'assessment'
    );

    return json(accessResult);
  } catch (err: any) {
    console.error('Error checking content access:', err);
    throw error(500, err.message || 'Failed to check content access');
  }
};