/**
 * API endpoint to update student progress
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ProgressionControlService } from '$lib/services/progressionControl.js';
import type { ProgressUpdate } from '$lib/services/progressionControl.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const progressData = await request.json();

    if (!progressData.content_id || !progressData.content_type || !progressData.status) {
      throw error(400, 'Content ID, type, and status are required');
    }

    if (!['lesson', 'course', 'assessment'].includes(progressData.content_type)) {
      throw error(400, 'Invalid content type');
    }

    if (!['not_started', 'in_progress', 'completed', 'blocked'].includes(progressData.status)) {
      throw error(400, 'Invalid status');
    }

    const progressUpdate: ProgressUpdate = {
      student_id: locals.session.user.id,
      content_id: progressData.content_id,
      content_type: progressData.content_type,
      status: progressData.status,
      completion_percentage: progressData.completion_percentage,
      time_spent: progressData.time_spent,
      score: progressData.score
    };

    const unlockedContent = await ProgressionControlService.updateProgress(progressUpdate);

    return json({
      success: true,
      unlockedContent
    });
  } catch (err: any) {
    console.error('Error updating progress:', err);
    throw error(500, err.message || 'Failed to update progress');
  }
};