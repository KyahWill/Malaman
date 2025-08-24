/**
 * API Route: Get Student Knowledge Profile
 * GET /api/knowledge-assessment/profile/[studentId]
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { KnowledgeAssessmentService } from '$lib/services/knowledgeAssessment.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { studentId } = params;

    // Students can only access their own profile, instructors/admins can access any
    if (locals.session.user.id !== studentId && !['instructor', 'admin'].includes(locals.session.user.role || '')) {
      throw error(403, 'Insufficient permissions');
    }

    // Get knowledge profile
    const knowledgeProfile = await KnowledgeAssessmentService.getStudentKnowledgeProfile(studentId);

    // Get knowledge gaps
    const knowledgeGaps = await KnowledgeAssessmentService.getStudentKnowledgeGaps(studentId);

    return json({
      success: true,
      data: {
        knowledge_profile: knowledgeProfile,
        knowledge_gaps: knowledgeGaps,
        has_profile: !!knowledgeProfile,
        gap_count: knowledgeGaps.length
      }
    });

  } catch (err: any) {
    console.error('Error getting knowledge profile:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, err.message || 'Failed to get knowledge profile');
  }
};