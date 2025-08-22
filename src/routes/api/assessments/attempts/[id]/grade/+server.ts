import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AssessmentAttemptService, AssessmentService } from '$lib/services/database.js';
import { requireAuth } from '$lib/middleware/auth.js';
import type { AssessmentAnswer } from '$lib/types/database.js';

export const POST: RequestHandler = async (event) => {
  try {
    const { params, request } = event;
    const { id: attemptId } = params;
    
    // Require instructor authentication
    const session = await requireAuth(event, { requiredRoles: ['instructor'] });
    
    const { question_grades } = await request.json();

    // Get the assessment attempt
    const attempt = await AssessmentAttemptService.getById(attemptId);
    if (!attempt) {
      return json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    // Get the assessment to verify instructor ownership
    const assessment = await AssessmentService.getById(attempt.assessment_id);
    if (!assessment) {
      return json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Verify instructor has access to this assessment
    // This would typically check if the instructor owns the course/lesson
    // For now, we'll allow any instructor to grade
    
    // Update the attempt with manual grades
    const updatedAnswers: AssessmentAnswer[] = attempt.answers.map(answer => {
      const grade = question_grades.find((g: any) => g.question_id === answer.question_id);
      if (grade) {
        return {
          ...answer,
          is_correct: grade.is_correct,
          points_earned: grade.points_earned,
          feedback: grade.feedback || answer.feedback
        };
      }
      return answer;
    });

    // Recalculate total score
    const totalPointsEarned = updatedAnswers.reduce((sum, answer) => sum + answer.points_earned, 0);
    const totalPoints = assessment.questions.reduce((sum, question) => sum + question.points, 0);
    const newScore = totalPoints > 0 ? Math.round((totalPointsEarned / totalPoints) * 100) : 0;
    const passed = newScore >= assessment.minimum_passing_score;

    // Update the attempt in the database
    const updatedAttempt = await AssessmentAttemptService.update(attemptId, {
      answers: updatedAnswers,
      score: newScore,
      points_earned: totalPointsEarned,
      passed,
      // Update feedback if provided
      feedback: attempt.feedback ? {
        ...attempt.feedback,
        overall_feedback: `Manually graded by instructor. ${attempt.feedback.overall_feedback}`
      } : {
        overall_feedback: 'Manually graded by instructor.',
        strengths: [],
        areas_for_improvement: [],
        recommended_resources: [],
        next_steps: passed ? 'You may proceed to the next content.' : 'Please review the feedback and consider retaking the assessment.'
      }
    });

    return json({
      success: true,
      updated_attempt: updatedAttempt,
      message: 'Assessment graded successfully'
    });
  } catch (error) {
    console.error('Error grading assessment:', error);
    return json(
      { error: 'Failed to grade assessment' },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async (event) => {
  try {
    const { params } = event;
    const { id: attemptId } = params;
    
    // Require instructor authentication
    const session = await requireAuth(event, { requiredRoles: ['instructor'] });
    
    // Get the assessment attempt
    const attempt = await AssessmentAttemptService.getById(attemptId);
    if (!attempt) {
      return json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    // Get the assessment details
    const assessment = await AssessmentService.getById(attempt.assessment_id);
    if (!assessment) {
      return json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Filter for essay questions that need grading
    const essayQuestions = assessment.questions.filter(q => q.type === 'essay');
    const essayAnswers = attempt.answers.filter(answer => 
      essayQuestions.some(q => q.id === answer.question_id)
    );

    return json({
      attempt_id: attemptId,
      assessment_title: assessment.title,
      student_id: attempt.student_id,
      submitted_at: attempt.submitted_at,
      essay_questions: essayQuestions.map(question => {
        const answer = essayAnswers.find(a => a.question_id === question.id);
        return {
          question,
          answer: answer || null,
          needs_grading: !answer?.is_correct && answer?.points_earned === 0
        };
      }),
      current_score: attempt.score,
      total_points: attempt.total_points,
      points_earned: attempt.points_earned
    });
  } catch (error) {
    console.error('Error fetching grading data:', error);
    return json(
      { error: 'Failed to fetch grading data' },
      { status: 500 }
    );
  }
};