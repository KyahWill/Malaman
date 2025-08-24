/**
 * API Route: Assess Prerequisites for Content
 * POST /api/knowledge-assessment/prerequisites
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

    const { contentId, contentType } = await request.json();

    if (!contentId || !contentType) {
      throw error(400, 'Content ID and content type are required');
    }

    if (!['course', 'lesson'].includes(contentType)) {
      throw error(400, 'Content type must be "course" or "lesson"');
    }

    const studentId = locals.session.user.id;

    // Assess prerequisites
    const prerequisiteAssessment = await KnowledgeAssessmentService.assessPrerequisites(
      studentId,
      contentId,
      contentType
    );

    return json({
      success: true,
      data: prerequisiteAssessment
    });

  } catch (err: any) {
    console.error('Error assessing prerequisites:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, err.message || 'Failed to assess prerequisites');
  }
};