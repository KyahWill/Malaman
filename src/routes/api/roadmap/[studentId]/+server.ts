/**
 * API endpoint for getting a student's personalized roadmap
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getRoadmapService } from '$lib/services/roadmapService.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { studentId } = params;
    const currentUser = locals.session.user;

    // Authorization check
    if (currentUser.role === 'student' && currentUser.id !== studentId) {
      throw error(403, 'You can only access your own roadmap');
    }

    if (currentUser.role === 'instructor') {
      // Instructors can only view roadmaps of students in their courses
      // This would require additional database queries to verify enrollment
      // For now, we'll allow instructors to view any student roadmap
      // In production, add proper authorization logic here
    }

    // Get roadmap service and fetch roadmap with progress
    const roadmapService = getRoadmapService();
    const roadmap = await roadmapService.getRoadmapWithProgress(studentId);

    if (!roadmap) {
      return json({
        success: true,
        roadmap: null,
        message: 'No active roadmap found'
      });
    }

    return json({
      success: true,
      roadmap,
      metadata: {
        lastUpdated: roadmap.updated_at,
        pathLength: roadmap.roadmap_data.learning_path.length,
        totalTime: roadmap.roadmap_data.total_estimated_time,
        completedSteps: roadmap.roadmap_data.learning_path.filter(
          item => item.completion_status === 'completed'
        ).length
      }
    });

  } catch (err) {
    console.error('Failed to get roadmap:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, 'Failed to retrieve roadmap');
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { studentId } = params;
    const currentUser = locals.session.user;

    // Authorization check - only students can delete their own roadmaps
    if (currentUser.role !== 'student' || currentUser.id !== studentId) {
      throw error(403, 'You can only delete your own roadmap');
    }

    // Update roadmap status to paused (soft delete)
    const roadmapService = getRoadmapService();
    const success = await roadmapService.updateRoadmapStatus(studentId, 'paused');

    if (!success) {
      throw error(500, 'Failed to delete roadmap');
    }

    return json({
      success: true,
      message: 'Roadmap deleted successfully'
    });

  } catch (err) {
    console.error('Failed to delete roadmap:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }

    throw error(500, 'Failed to delete roadmap');
  }
};