/**
 * API Route: Generate Personalized Assessment
 * POST /api/knowledge-assessment/personalized
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { KnowledgeAssessmentService } from '$lib/services/knowledgeAssessment.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { subjectArea } = await request.json();

    if (!subjectArea) {
      throw error(400, 'Subject area is required');
    }

    const studentId = locals.session.user.id;

    // Generate personalized assessment based on knowledge gaps
    const assessment = await KnowledgeAssessmentService.generatePersonalizedAssessment(
      studentId,
      subjectArea
    );

    return json({
      success: true,
      data: assessment
    });

  } catch (err: any) {
    console.error('Error generating personalized assessment:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, err.message || 'Failed to generate personalized assessment');
  }
};