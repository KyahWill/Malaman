/**
 * API endpoint for handling assessment failures and triggering adaptive roadmap adjustments
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdaptiveRoadmapService } from '$lib/services/adaptiveRoadmapService.js';
import { supabase } from '$lib/supabase.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { assessmentId, attemptId } = await request.json();

    if (!assessmentId || !attemptId) {
      throw error(400, 'Assessment ID and attempt ID are required');
    }

    // Get the assessment attempt details
    const { data: attempt, error: attemptError } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('assessment_id', assessmentId)
      .single();

    if (attemptError) {
      console.error('Failed to get assessment attempt:', attemptError);
      throw error(500, 'Failed to retrieve assessment attempt');
    }

    if (!attempt) {
      throw error(404, 'Assessment attempt not found');
    }

    // Verify the user owns this attempt or is an instructor
    const userRole = locals.session.user.user_metadata?.role || 'student';
    if (userRole !== 'instructor' && userRole !== 'admin' && attempt.student_id !== locals.session.user.id) {
      throw error(403, 'Access denied');
    }

    // Only process failed attempts
    if (attempt.passed) {
      return json({
        success: true,
        message: 'Assessment was passed, no adaptive adjustments needed',
        roadmap: null
      });
    }

    // Trigger adaptive roadmap adjustment
    const adaptiveService = getAdaptiveRoadmapService();
    const adjustedRoadmap = await adaptiveService.handleAssessmentFailure(
      attempt.student_id,
      assessmentId,
      attempt
    );

    return json({
      success: true,
      message: 'Adaptive roadmap adjustments applied successfully',
      roadmap: adjustedRoadmap,
      adjustments_applied: true
    });

  } catch (err) {
    console.error('Error in adaptive assessment failure handler:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    throw error(500, 'Failed to process adaptive adjustments');
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

    // Get learning patterns for the student
    const adaptiveService = getAdaptiveRoadmapService();
    const patterns = await adaptiveService.detectLearningPatterns(studentId);

    return json({
      success: true,
      student_id: studentId,
      learning_patterns: patterns,
      pattern_count: patterns.length
    });

  } catch (err) {
    console.error('Error getting learning patterns:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    throw error(500, 'Failed to retrieve learning patterns');
  }
};