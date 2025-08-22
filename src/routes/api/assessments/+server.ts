import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AssessmentService, CourseService, LessonService } from '$lib/services/database.js';
import { validateAssessment } from '$lib/utils/validation.js';
import type { Assessment } from '$lib/types';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Require authentication
    const session = locals.session

    if(session == null) {
      throw redirect(302, '/login')
    }
    
    const lessonId = url.searchParams.get('lesson');
    const courseId = url.searchParams.get('course');
    const instructorId = url.searchParams.get('instructor');

    let assessments;

    if (lessonId) {
      assessments = await AssessmentService.getByLesson(lessonId);
    } else if (courseId) {
      assessments = await AssessmentService.getByCourse(courseId);
    } else if (instructorId) {
      // Get assessments by instructor (would need to implement this method)
      assessments = await AssessmentService.getByInstructor(instructorId);
    } else {
      // Get all assessments for the current user
      if (session.user.role === 'admin') {
        assessments = await AssessmentService.getAll();
      } else {
        assessments = await AssessmentService.getByInstructor(session.user.id);
      }
    }

    return json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Require authentication

    const session = locals.session

    if(session == null) {
      throw redirect(302, '/login')
    }
    
    const assessmentData: Assessment = await request.json();

    // Validate assessment data
    const validation = validateAssessment(assessmentData);
    if (!validation.isValid) {
      return json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Ensure the assessment belongs to the current user (unless admin)
    if (session.user.role !== 'admin') {
      // For lesson assessments, verify the lesson belongs to the instructor
      if (assessmentData.lesson_id) {
        const lesson = await LessonService.getById(assessmentData.lesson_id);
        if (!lesson) {
          return json({ error: 'Lesson not found' }, { status: 404 });
        }
        
        const course = await CourseService.getById(lesson.course_id);
        if (!course || course.instructor_id !== session.user.id) {
          return json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      // For course assessments, verify the course belongs to the instructor
      if (assessmentData.course_id) {
        const course = await CourseService.getById(assessmentData.course_id);
        if (!course || course.instructor_id !== session.user.id) {
          return json({ error: 'Unauthorized' }, { status: 403 });
        }
      }
    }

    // Generate unique IDs for questions if not provided
    if (assessmentData.questions) {
      assessmentData.questions = assessmentData.questions.map(question => ({
        ...question,
        id: question.id || crypto.randomUUID()
      }));
    }

    const assessment = await AssessmentService.create(assessmentData);

    // If this is a lesson assessment, update the lesson to reference it
    if (assessment.lesson_id) {
      await LessonService.update(assessment.lesson_id, {
        assessment_id: assessment.id
      });
    }

    // If this is a course final assessment, update the course to reference it
    if (assessment.course_id && !assessment.lesson_id) {
      await CourseService.update(assessment.course_id, {
        final_assessment_id: assessment.id
      });
    }

    return json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
};