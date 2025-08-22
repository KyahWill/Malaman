import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AssessmentAttemptService } from '$lib/services/database.js';
import { requireAuth } from '$lib/middleware/auth.js';

export const GET: RequestHandler = async (event) => {
  try {
    const { params } = event;
    const { id: assessmentId } = params;
    
    // Require student authentication
    const session = await requireAuth(event, { requiredRoles: ['student'] });
    
    const attempts = await AssessmentAttemptService.getByStudentAndAssessment(
      session.user.id,
      assessmentId
    );

    return json(attempts);
  } catch (error) {
    console.error('Error fetching assessment attempts:', error);
    return json(
      { error: 'Failed to fetch assessment attempts' },
      { status: 500 }
    );
  }
};