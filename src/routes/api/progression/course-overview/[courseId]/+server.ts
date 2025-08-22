/**
 * API endpoint to get comprehensive course progress overview
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ProgressionControlService } from '$lib/services/progressionControl.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { courseId } = params;
    if (!courseId) {
      throw error(400, 'Course ID is required');
    }

    const studentId = locals.session.user.id;
    const progressOverview = await ProgressionControlService.getCourseProgressOverview(studentId, courseId);

    return json(progressOverview);
  } catch (err: any) {
    console.error('Error getting course progress overview:', err);
    throw error(500, err.message || 'Failed to get course progress overview');
  }
};