/**
 * API endpoint for updating roadmap based on assessment performance
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getRoadmapService } from '$lib/services/roadmapService.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const body = await request.json();
    const { studentId, assessmentId, passed, score } = body;
    const currentUser = locals.session.user;

    // Authorization check
    if (currentUser.role === 'student' && currentUser.id !== studentId) {
      throw error(403, 'You can only update your own roadmap');
    }

    // Validate input
    if (!studentId || !assessmentId) {
      throw error(400, 'Student ID and assessment ID are required');
    }

    if (typeof passed !== 'boolean') {
      throw error(400, 'Passed status must be a boolean');
    }

    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw error(400, 'Score must be a number between 0 and 100');
    }

    // Update roadmap based on assessment performance
    const roadmapService = getRoadmapService();
    const updatedRoadmap = await roadmapService.updateRoadmapForAssessment(
      studentId,
      assessmentId,
      passed,
      score
    );

    if (!updatedRoadmap) {
      return json({
        success: true,
        message: 'No active roadmap found to update',
        roadmap: null
      });
    }

    return json({
      success: true,
      roadmap: updatedRoadmap,
      metadata: {
        updatedAt: updatedRoadmap.updated_at,
        assessmentPassed: passed,
        score,
        pathLength: updatedRoadmap.roadmap_data.learning_path.length,
        adjustmentMade: true
      }
    });

  } catch (err) {
    console.error('Failed to update roadmap progress:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, 'Failed to update roadmap progress');
  }
};