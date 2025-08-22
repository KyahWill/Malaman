/**
 * API endpoint to block student progress (instructor/admin only)
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

    // Only instructors and admins can block progress
    if (!['instructor', 'admin'].includes(locals.session.user.user_metadata?.role)) {
      throw error(403, 'Insufficient permissions');
    }

    const { studentId, assessmentId, reason } = await request.json();

    if (!studentId || !assessmentId || !reason) {
      throw error(400, 'Student ID, assessment ID, and reason are required');
    }

    await ProgressionControlService.blockProgress(studentId, assessmentId, reason);

    return json({ success: true });
  } catch (err: any) {
    console.error('Error blocking progress:', err);
    throw error(500, err.message || 'Failed to block progress');
  }
};