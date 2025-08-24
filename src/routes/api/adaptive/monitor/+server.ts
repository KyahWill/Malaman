/**
 * API endpoint for continuous monitoring and adaptive adjustments
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

    const { studentId, triggerType } = await request.json();

    if (!studentId) {
      throw error(400, 'Student ID is required');
    }

    // Verify access permissions
    const userRole = locals.session.user.user_metadata?.role || 'student';
    if (userRole !== 'instructor' && userRole !== 'admin' && studentId !== locals.session.user.id) {
      throw error(403, 'Access denied');
    }

    const adaptiveService = getAdaptiveRoadmapService();

    if (triggerType === 'continuous_monitoring') {
      // Trigger continuous monitoring and adjustment
      await adaptiveService.monitorAndAdjust(studentId);
      
      return json({
        success: true,
        message: 'Continuous monitoring completed',
        student_id: studentId,
        trigger_type: triggerType
      });
    } else {
      // Default: detect current learning patterns
      const patterns = await adaptiveService.detectLearningPatterns(studentId);
      
      return json({
        success: true,
        message: 'Learning patterns detected',
        student_id: studentId,
        patterns: patterns,
        pattern_count: patterns.length
      });
    }

  } catch (err) {
    console.error('Error in adaptive monitoring:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    throw error(500, 'Failed to process monitoring request');
  }
};

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const studentId = url.searchParams.get('studentId');
    if (!studentId) {
      throw error(400, 'Student ID is required');
    }

    // Verify access permissions
    const userRole = locals.session.user.user_metadata?.role || 'student';
    if (userRole !== 'instructor' && userRole !== 'admin' && studentId !== locals.session.user.id) {
      throw error(403, 'Access denied');
    }

    // Get current learning patterns
    const adaptiveService = getAdaptiveRoadmapService();
    const patterns = await adaptiveService.detectLearningPatterns(studentId);

    return json({
      success: true,
      student_id: studentId,
      learning_patterns: patterns,
      monitoring_status: 'active',
      last_check: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error getting monitoring status:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    throw error(500, 'Failed to get monitoring status');
  }
};