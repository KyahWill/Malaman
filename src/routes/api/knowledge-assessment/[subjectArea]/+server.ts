/**
 * API Route: Get Knowledge Assessment for Subject Area
 * GET /api/knowledge-assessment/[subjectArea]
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

    const { subjectArea } = params;

    // Get knowledge assessment for the subject area
    const assessment = await KnowledgeAssessmentService.getKnowledgeAssessment(subjectArea);

    if (!assessment) {
      return json({
        success: false,
        message: `No knowledge assessment found for ${subjectArea}`,
        data: null
      });
    }

    return json({
      success: true,
      data: assessment
    });

  } catch (err: any) {
    console.error('Error getting knowledge assessment:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, err.message || 'Failed to get knowledge assessment');
  }
};