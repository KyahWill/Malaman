import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AssessmentAttemptService } from '$lib/services/database.js';
import { requireAuth } from '$lib/middleware/auth.js';

export const GET: RequestHandler = async (event) => {
  try {
    const { params } = event;
    const { id: attemptId } = params;
    
    // Require authentication
    const session = await requireAuth(event);
    
    const attempt = await AssessmentAttemptService.getById(attemptId);
    if (!attempt) {
      return json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    // Check permissions - students can only view their own attempts
    if (session.user.role === 'student' && attempt.student_id !== session.user.id) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Instructors and admins can view any attempt (with additional checks in a real implementation)

    return json(attempt);
  } catch (error) {
    console.error('Error fetching assessment attempt:', error);
    return json(
      { error: 'Failed to fetch assessment attempt' },
      { status: 500 }
    );
  }
};