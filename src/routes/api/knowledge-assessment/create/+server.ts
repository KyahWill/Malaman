/**
 * API Route: Create Initial Knowledge Assessment
 * POST /api/knowledge-assessment/create
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { KnowledgeAssessmentService } from '$lib/services/knowledgeAssessment.js';
import type { KnowledgeAssessmentConfig } from '$lib/services/knowledgeAssessment.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    // Only instructors and admins can create knowledge assessments
    if (!['instructor', 'admin'].includes(locals.session.user.role || '')) {
      throw error(403, 'Insufficient permissions');
    }

    const config: KnowledgeAssessmentConfig = await request.json();

    // Validate required fields
    if (!config.subject_area || !config.topics || config.topics.length === 0) {
      throw error(400, 'Subject area and topics are required');
    }

    if (!config.question_count || config.question_count < 1) {
      throw error(400, 'Question count must be at least 1');
    }

    // Set defaults
    config.difficulty_levels = config.difficulty_levels || ['beginner', 'intermediate', 'advanced'];
    config.time_limit = config.time_limit || 30;

    // Create the assessment
    const assessment = await KnowledgeAssessmentService.createInitialAssessment(config);

    return json({
      success: true,
      data: assessment
    });

  } catch (err: any) {
    console.error('Error creating knowledge assessment:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, err.message || 'Failed to create knowledge assessment');
  }
};