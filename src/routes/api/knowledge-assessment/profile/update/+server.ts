/**
 * API Route: Update Knowledge Profile
 * POST /api/knowledge-assessment/profile/update
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { KnowledgeAssessmentService } from '$lib/services/knowledgeAssessment.js';
import { AssessmentAttemptService } from '$lib/services/database.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { assessmentAttemptIds, knowledgeGaps } = await request.json();

    if (!assessmentAttemptIds || !Array.isArray(assessmentAttemptIds)) {
      throw error(400, 'Assessment attempt IDs are required');
    }

    const studentId = locals.session.user.id;

    // Get assessment attempts
    const assessmentResults = [];
    for (const attemptId of assessmentAttemptIds) {
      const attempt = await AssessmentAttemptService.getById(attemptId);
      if (attempt && attempt.student_id === studentId) {
        assessmentResults.push(attempt);
      }
    }

    if (assessmentResults.length === 0) {
      throw error(400, 'No valid assessment attempts found');
    }

    // Update knowledge profile
    const knowledgeProfile = await KnowledgeAssessmentService.updateKnowledgeProfile(
      studentId,
      assessmentResults,
      knowledgeGaps || []
    );

    return json({
      success: true,
      data: {
        knowledge_profile: knowledgeProfile,
        updated_at: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error('Error updating knowledge profile:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, err.message || 'Failed to update knowledge profile');
  }
};