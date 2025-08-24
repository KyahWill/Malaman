import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AssessmentService, AssessmentAttemptService, StudentProgressService } from '$lib/services/database.js';
import type { AssessmentAnswer, AssessmentFeedback } from '$lib/types/database.js';
import { requireAuth } from '$lib/middleware/auth.js';

export const POST: RequestHandler = async (event) => {
  try {
    const { params, request } = event;
    const { id: assessmentId } = params;
    
    // Require student authentication
    const session = await requireAuth(event, { requiredRoles: ['student'] });
    
    const { answers, time_spent } = await request.json();

    // Get the assessment
    const assessment = await AssessmentService.getById(assessmentId);
    if (!assessment) {
      return json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check if student has reached max attempts
    const existingAttempts = await AssessmentAttemptService.getByStudentAndAssessment(
      session.user.id,
      assessmentId
    );

    if (assessment.max_attempts && existingAttempts.length >= assessment.max_attempts) {
      return json(
        { error: 'Maximum attempts reached for this assessment' },
        { status: 400 }
      );
    }

    // Get next attempt number
    const attemptNumber = await AssessmentAttemptService.getNextAttemptNumber(
      session.user.id,
      assessmentId
    );

    // Calculate score and validate answers
    const validatedAnswers: AssessmentAnswer[] = [];
    let totalPoints = 0;
    let pointsEarned = 0;

    for (const question of assessment.questions) {
      totalPoints += question.points;
      
      const answer = answers.find((a: AssessmentAnswer) => a.question_id === question.id);
      if (!answer) {
        // No answer provided
        validatedAnswers.push({
          question_id: question.id,
          student_answer: '',
          is_correct: false,
          points_earned: 0
        });
        continue;
      }

      // Validate answer based on question type
      let isCorrect = false;
      switch (question.type) {
        case 'multiple_choice':
        case 'true_false':
          isCorrect = answer.student_answer === question.correct_answer;
          break;
        
        case 'short_answer':
          const correctAnswers = Array.isArray(question.correct_answer) 
            ? question.correct_answer 
            : [question.correct_answer];
          isCorrect = correctAnswers.some(correct => 
            correct.toLowerCase().trim() === String(answer.student_answer).toLowerCase().trim()
          );
          break;
        
        case 'essay':
          // Essay questions require manual grading
          // For now, we'll mark as correct and award full points
          // In a real implementation, this would be handled by instructors
          isCorrect = true;
          break;
      }

      const earnedPoints = isCorrect ? question.points : 0;
      pointsEarned += earnedPoints;

      validatedAnswers.push({
        question_id: question.id,
        student_answer: answer.student_answer,
        is_correct: isCorrect,
        points_earned: earnedPoints,
        feedback: answer.feedback
      });
    }

    // Calculate percentage score
    const score = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;
    const passed = score >= assessment.minimum_passing_score;

    // Generate feedback
    const feedback: AssessmentFeedback = generateFeedback(
      assessment,
      validatedAnswers,
      score,
      passed
    );

    // Create assessment attempt
    const attempt = await AssessmentAttemptService.create({
      assessment_id: assessmentId,
      student_id: session.user.id,
      attempt_number: attemptNumber,
      answers: validatedAnswers,
      score,
      points_earned: pointsEarned,
      total_points: totalPoints,
      passed,
      time_spent: time_spent || null,
      started_at: new Date(Date.now() - (time_spent || 0) * 1000).toISOString(),
      submitted_at: new Date().toISOString(),
      feedback
    });

    // Update student progress
    await updateStudentProgress(session.user.id, assessment, attempt);

    return json(attempt);
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return json(
      { error: 'Failed to submit assessment' },
      { status: 500 }
    );
  }
};

function generateFeedback(
  assessment: any,
  answers: AssessmentAnswer[],
  score: number,
  passed: boolean
): AssessmentFeedback {
  const correctAnswers = answers.filter(a => a.is_correct);
  const incorrectAnswers = answers.filter(a => !a.is_correct);
  
  let overallFeedback = '';
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const recommendedResources: string[] = [];
  let nextSteps = '';

  if (passed) {
    overallFeedback = `Congratulations! You passed the assessment with a score of ${score}%. `;
    if (score >= 90) {
      overallFeedback += 'Excellent work! You demonstrated strong mastery of the material.';
      strengths.push('Excellent overall performance');
    } else if (score >= 80) {
      overallFeedback += 'Good work! You showed solid understanding of most concepts.';
      strengths.push('Good overall understanding');
    } else {
      overallFeedback += 'You passed, but there\'s room for improvement in some areas.';
    }
    nextSteps = 'You can now proceed to the next lesson or course content.';
  } else {
    overallFeedback = `You scored ${score}%, which is below the passing score of ${assessment.minimum_passing_score}%. `;
    overallFeedback += 'Don\'t worry - this is a learning opportunity!';
    nextSteps = 'Review the feedback below and study the recommended materials before retaking the assessment.';
  }

  // Analyze performance by topic
  const topicPerformance = new Map<string, { correct: number; total: number }>();
  
  assessment.questions.forEach((question: any, index: number) => {
    const answer = answers[index];
    question.topics.forEach((topic: string) => {
      if (!topicPerformance.has(topic)) {
        topicPerformance.set(topic, { correct: 0, total: 0 });
      }
      const perf = topicPerformance.get(topic)!;
      perf.total++;
      if (answer.is_correct) {
        perf.correct++;
      }
    });
  });

  // Identify strengths and areas for improvement
  topicPerformance.forEach((perf, topic) => {
    const percentage = (perf.correct / perf.total) * 100;
    if (percentage >= 80) {
      strengths.push(`Strong understanding of ${topic}`);
    } else if (percentage < 60) {
      areasForImprovement.push(`Need to review ${topic} concepts`);
      recommendedResources.push(`Study materials on ${topic}`);
    }
  });

  // Add general recommendations based on question types missed
  const missedTypes = new Set(
    incorrectAnswers.map(answer => {
      const question = assessment.questions.find((q: any) => q.id === answer.question_id);
      return question?.type;
    }).filter(Boolean)
  );

  if (missedTypes.has('multiple_choice')) {
    recommendedResources.push('Review key concepts and definitions');
  }
  if (missedTypes.has('short_answer')) {
    recommendedResources.push('Practice applying concepts in your own words');
  }
  if (missedTypes.has('essay')) {
    recommendedResources.push('Practice explaining concepts in detail');
  }

  return {
    overall_feedback: overallFeedback,
    strengths: strengths.length > 0 ? strengths : ['Completed the assessment'],
    areas_for_improvement: areasForImprovement,
    recommended_resources: recommendedResources,
    next_steps: nextSteps
  };
}

async function updateStudentProgress(
  studentId: string,
  assessment: any,
  attempt: any
): Promise<void> {
  try {
    // Update progress for lesson assessment
    if (assessment.lesson_id) {
      await StudentProgressService.upsert({
        student_id: studentId,
        lesson_id: assessment.lesson_id,
        assessment_id: assessment.id,
        status: attempt.passed ? 'completed' : 'in_progress',
        completion_percentage: attempt.passed ? 100 : 0,
        last_accessed: new Date().toISOString(),
        attempts_count: attempt.attempt_number,
        best_score: attempt.score
      });
    }

    // Update progress for course final assessment
    if (assessment.course_id && !assessment.lesson_id) {
      await StudentProgressService.upsert({
        student_id: studentId,
        course_id: assessment.course_id,
        assessment_id: assessment.id,
        status: attempt.passed ? 'completed' : 'in_progress',
        completion_percentage: attempt.passed ? 100 : 0,
        last_accessed: new Date().toISOString(),
        attempts_count: attempt.attempt_number,
        best_score: attempt.score
      });
    }

    // Update personalized roadmap based on assessment performance
    try {
      const { getRoadmapService } = await import('$lib/services/roadmapService.js');
      const roadmapService = getRoadmapService();
      await roadmapService.updateRoadmapForAssessment(
        studentId, 
        assessment.id, 
        attempt.passed, 
        attempt.score
      );

      // If assessment failed, trigger adaptive adjustments
      if (!attempt.passed) {
        try {
          const { getAdaptiveRoadmapService } = await import('$lib/services/adaptiveRoadmapService.js');
          const adaptiveService = getAdaptiveRoadmapService();
          await adaptiveService.handleAssessmentFailure(studentId, assessment.id, attempt);
          console.log(`Adaptive adjustments applied for failed assessment ${assessment.id} by student ${studentId}`);
        } catch (adaptiveError) {
          console.error('Failed to apply adaptive adjustments:', adaptiveError);
          // Don't fail the main flow - adaptive adjustments are supplementary
        }
      }
    } catch (roadmapError) {
      // Log error but don't fail the progress update
      console.error('Failed to update roadmap after assessment:', roadmapError);
    }
  } catch (error) {
    console.error('Error updating student progress:', error);
    // Don't throw here - the assessment submission was successful
  }
}