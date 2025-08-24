/**
 * API endpoint for generating alternative learning paths
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdaptiveRoadmapService } from '$lib/services/adaptiveRoadmapService.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { studentId, currentContentId, strugglingTopics } = await request.json();

    if (!studentId || !currentContentId || !strugglingTopics || !Array.isArray(strugglingTopics)) {
      throw error(400, 'Student ID, current content ID, and struggling topics array are required');
    }

    // Verify access permissions
    const userRole = locals.session.user.user_metadata?.role || 'student';
    if (userRole !== 'instructor' && userRole !== 'admin' && studentId !== locals.session.user.id) {
      throw error(403, 'Access denied');
    }

    // Generate alternative learning paths
    const adaptiveService = getAdaptiveRoadmapService();
    const alternativePaths = await adaptiveService.generateAlternativePaths(
      studentId,
      currentContentId,
      strugglingTopics
    );

    return json({
      success: true,
      student_id: studentId,
      current_content_id: currentContentId,
      struggling_topics: strugglingTopics,
      alternative_paths: alternativePaths,
      paths_count: alternativePaths.length
    });

  } catch (err) {
    console.error('Error generating alternative paths:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    throw error(500, 'Failed to generate alternative learning paths');
  }
};

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const studentId = url.searchParams.get('studentId');
    const contentId = url.searchParams.get('contentId');

    if (!studentId || !contentId) {
      throw error(400, 'Student ID and content ID are required');
    }

    // Verify access permissions
    const userRole = locals.session.user.user_metadata?.role || 'student';
    if (userRole !== 'instructor' && userRole !== 'admin' && studentId !== locals.session.user.id) {
      throw error(403, 'Access denied');
    }

    // For GET request, we'll return any existing alternative paths
    // This could be expanded to query a database table storing alternative paths
    return json({
      success: true,
      message: 'Use POST endpoint to generate new alternative paths',
      student_id: studentId,
      content_id: contentId
    });

  } catch (err) {
    console.error('Error in alternative paths endpoint:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    throw error(500, 'Failed to process request');
  }
};