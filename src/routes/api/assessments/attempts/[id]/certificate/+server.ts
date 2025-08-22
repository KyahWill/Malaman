import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AssessmentAttemptService, AssessmentService } from '$lib/services/database.js';
import { requireAuth } from '$lib/middleware/auth.js';
import type { AssessmentRecord } from '$lib/types/database.js';

export const GET: RequestHandler = async (event) => {
  try {
    const { params } = event;
    const { id: attemptId } = params;
    
    // Require authentication
    const session = await requireAuth(event);
    
    // Get the assessment attempt
    const attempt = await AssessmentAttemptService.getById(attemptId);
    if (!attempt) {
      return json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    // Verify the user owns this attempt or is an instructor
    if (attempt.student_id !== session.user.id && session.user.role !== 'instructor') {
      return json({ error: 'Access denied' }, { status: 403 });
    }

    // Only generate certificates for passed attempts
    if (!attempt.passed) {
      return json({ error: 'Certificate only available for passed assessments' }, { status: 400 });
    }

    // Get the assessment details
    const assessment = await AssessmentService.getById(attempt.assessment_id);
    if (!assessment) {
      return json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Generate assessment record/certificate
    const certificate: AssessmentRecord = {
      id: crypto.randomUUID(),
      student_id: attempt.student_id,
      assessment_id: attempt.assessment_id,
      attempt_id: attemptId,
      score: attempt.score,
      passed: attempt.passed,
      completed_at: attempt.submitted_at,
      certificate_data: {
        assessment_title: assessment.title,
        questions_count: assessment.questions.length,
        time_spent: attempt.time_spent || 0,
        detailed_results: attempt.answers
      }
    };

    return json(certificate);
  } catch (error) {
    console.error('Error generating certificate:', error);
    return json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async (event) => {
  try {
    const { params, request } = event;
    const { id: attemptId } = params;
    
    // Require authentication
    const session = await requireAuth(event);
    
    const { format = 'json' } = await request.json();

    // Get the assessment attempt
    const attempt = await AssessmentAttemptService.getById(attemptId);
    if (!attempt) {
      return json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    // Verify the user owns this attempt
    if (attempt.student_id !== session.user.id) {
      return json({ error: 'Access denied' }, { status: 403 });
    }

    // Only generate certificates for passed attempts
    if (!attempt.passed) {
      return json({ error: 'Certificate only available for passed assessments' }, { status: 400 });
    }

    // Get the assessment details
    const assessment = await AssessmentService.getById(attempt.assessment_id);
    if (!assessment) {
      return json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (format === 'pdf') {
      // In a real implementation, this would generate a PDF certificate
      // For now, return a placeholder response
      return json({
        message: 'PDF certificate generation is not yet implemented',
        download_url: null,
        format: 'pdf'
      });
    }

    // Generate JSON certificate data
    const certificate: AssessmentRecord = {
      id: crypto.randomUUID(),
      student_id: attempt.student_id,
      assessment_id: attempt.assessment_id,
      attempt_id: attemptId,
      score: attempt.score,
      passed: attempt.passed,
      completed_at: attempt.submitted_at,
      certificate_data: {
        assessment_title: assessment.title,
        questions_count: assessment.questions.length,
        time_spent: attempt.time_spent || 0,
        detailed_results: attempt.answers
      }
    };

    return json({
      certificate,
      format: 'json',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
};