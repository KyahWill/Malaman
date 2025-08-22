/**
 * API endpoint to get blocked content for a student (instructor/admin only)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ProgressionControlService } from '$lib/services/progressionControl.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication and authorization
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { studentId } = params;
    if (!studentId) {
      throw error(400, 'Student ID is required');
    }

    // Students can only view their own blocked content
    // Instructors and admins can view any student's blocked content
    const userRole = locals.session.user.user_metadata?.role;
    if (userRole === 'student' && locals.session.user.id !== studentId) {
      throw error(403, 'Can only view your own blocked content');
    } else if (!['student', 'instructor', 'admin'].includes(userRole)) {
      throw error(403, 'Insufficient permissions');
    }

    const blockedContent = await ProgressionControlService.getBlockedContent(studentId);

    return json(blockedContent);
  } catch (err: any) {
    console.error('Error getting blocked content:', err);
    throw error(500, err.message || 'Failed to get blocked content');
  }
};