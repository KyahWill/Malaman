/**
 * API Route: Analyze Knowledge Assessment Results
 * POST /api/knowledge-assessment/analyze
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

    const { assessmentId, attemptId } = await request.json();

    if (!assessmentId || !attemptId) {
      throw error(400, 'Assessment ID and attempt ID are required');
    }

    const studentId = locals.session.user.id;

    // Analyze knowledge gaps from the assessment attempt
    const knowledgeGaps = await KnowledgeAssessmentService.analyzeKnowledgeGaps(
      studentId,
      assessmentId,
      attemptId
    );

    return json({
      success: true,
      data: {
        knowledge_gaps: knowledgeGaps,
        gap_count: knowledgeGaps.length,
        analysis_timestamp: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error('Error analyzing knowledge assessment:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, err.message || 'Failed to analyze knowledge assessment');
  }
};