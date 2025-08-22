/**
 * API endpoint to unblock student progress (instructor/admin override)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ProgressionControlService } from '$lib/services/progressionControl.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication and authorization
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    // Only instructors and admins can unblock progress
    if (!['instructor', 'admin'].includes(locals.session.user.user_metadata?.role)) {
      throw error(403, 'Insufficient permissions');
    }

    const { studentId, contentId, contentType } = await request.json();

    if (!studentId || !contentId || !contentType) {
      throw error(400, 'Student ID, content ID, and content type are required');
    }

    if (!['lesson', 'course'].includes(contentType)) {
      throw error(400, 'Invalid content type for unblocking');
    }

    await ProgressionControlService.unblockProgress(studentId, contentId, contentType);

    return json({ success: true });
  } catch (err: any) {
    console.error('Error unblocking progress:', err);
    throw error(500, err.message || 'Failed to unblock progress');
  }
};