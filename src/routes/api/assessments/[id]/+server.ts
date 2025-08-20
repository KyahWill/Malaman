import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AssessmentService, CourseService, LessonService } from '$lib/services/database.js';
import { validateAssessment } from '$lib/utils/validation.js';
import { requireAuth } from '$lib/middleware/auth.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const { id } = params;
    
    // Basic authentication check
    const session = await requireAuth()(locals);
    
    const assessment = await AssessmentService.getById(id);
    if (!assessment) {
      return json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === 'student') {
      // Students can only view assessments for courses they're enrolled in
      // This would require additional logic to check enrollment
      // For now, we'll allow students to view any assessment
    } else if (session.user.role === 'instructor') {
      // Instructors can only view their own assessments
      let hasPermission = false;

      if (assessment.lesson_id) {
        const lesson = await LessonService.getById(assessment.lesson_id);
        if (lesson) {
          const course = await CourseService.getById(lesson.course_id);
          hasPermission = course?.instructor_id === session.user.id;
        }
      } else if (assessment.course_id) {
        const course = await CourseService.getById(assessment.course_id);
        hasPermission = course?.instructor_id === session.user.id;
      }

      if (!hasPermission) {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    // Admins can view any assessment

    return json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const { id } = params;
    
    // Require instructor or admin authentication
    const session = await requireAuth(['instructor', 'admin'])(locals);
    
    const updates = await request.json();

    // Get existing assessment
    const existingAssessment = await AssessmentService.getById(id);
    if (!existingAssessment) {
      return json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check permissions for instructors
    if (session.user.role === 'instructor') {
      let hasPermission = false;

      if (existingAssessment.lesson_id) {
        const lesson = await LessonService.getById(existingAssessment.lesson_id);
        if (lesson) {
          const course = await CourseService.getById(lesson.course_id);
          hasPermission = course?.instructor_id === session.user.id;
        }
      } else if (existingAssessment.course_id) {
        const course = await CourseService.getById(existingAssessment.course_id);
        hasPermission = course?.instructor_id === session.user.id;
      }

      if (!hasPermission) {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Validate updated assessment data
    const updatedAssessment = { ...existingAssessment, ...updates };
    const validation = validateAssessment(updatedAssessment);
    if (!validation.isValid) {
      return json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate unique IDs for new questions if not provided
    if (updates.questions) {
      updates.questions = updates.questions.map(question => ({
        ...question,
        id: question.id || crypto.randomUUID()
      }));
    }

    const assessment = await AssessmentService.update(id, updates);
    return json(assessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    return json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const { id } = params;
    
    // Require instructor or admin authentication
    const session = await requireAuth(['instructor', 'admin'])(locals);
    
    // Get existing assessment
    const existingAssessment = await AssessmentService.getById(id);
    if (!existingAssessment) {
      return json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check permissions for instructors
    if (session.user.role === 'instructor') {
      let hasPermission = false;

      if (existingAssessment.lesson_id) {
        const lesson = await LessonService.getById(existingAssessment.lesson_id);
        if (lesson) {
          const course = await CourseService.getById(lesson.course_id);
          hasPermission = course?.instructor_id === session.user.id;
        }
      } else if (existingAssessment.course_id) {
        const course = await CourseService.getById(existingAssessment.course_id);
        hasPermission = course?.instructor_id === session.user.id;
      }

      if (!hasPermission) {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Remove assessment references from lessons/courses before deleting
    if (existingAssessment.lesson_id) {
      await LessonService.update(existingAssessment.lesson_id, {
        assessment_id: null
      });
    }

    if (existingAssessment.course_id && !existingAssessment.lesson_id) {
      await CourseService.update(existingAssessment.course_id, {
        final_assessment_id: null
      });
    }

    await AssessmentService.delete(id);
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
};