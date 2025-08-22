/**
 * Progression Control Service
 * 
 * This service manages content access control, prerequisite checking,
 * and progress-based unlocking for the personalized LMS.
 */

import { supabase } from '$lib/supabase.js';
import type {
  StudentProgress,
  Assessment,
  AssessmentAttempt,
  Lesson,
  Course,
  ProgressStatus
} from '$lib/types/database.js';
import { StudentProgressService, AssessmentAttemptService, LessonService, CourseService } from './database.js';
import { handleDatabaseError } from '$lib/utils/errors.js';

export interface ContentAccessResult {
  canAccess: boolean;
  reason?: string;
  blockedBy?: {
    type: 'lesson' | 'assessment' | 'course';
    id: string;
    title: string;
  };
  prerequisites?: PrerequisiteStatus[];
}

export interface PrerequisiteStatus {
  id: string;
  type: 'lesson' | 'assessment';
  title: string;
  completed: boolean;
  score?: number;
  required_score?: number;
}

export interface ProgressUpdate {
  student_id: string;
  content_id: string;
  content_type: 'lesson' | 'course' | 'assessment';
  status: ProgressStatus;
  completion_percentage?: number;
  time_spent?: number;
  score?: number;
}

export interface UnlockedContent {
  lessons: string[];
  assessments: string[];
  courses: string[];
}

export class ProgressionControlService {
  /**
   * Check if a student can access specific content
   */
  static async canAccessContent(
    studentId: string, 
    contentId: string, 
    contentType: 'lesson' | 'course' | 'assessment'
  ): Promise<ContentAccessResult> {
    try {
      switch (contentType) {
        case 'lesson':
          return await this.canAccessLesson(studentId, contentId);
        case 'course':
          return await this.canAccessCourse(studentId, contentId);
        case 'assessment':
          return await this.canAccessAssessment(studentId, contentId);
        default:
          return {
            canAccess: false,
            reason: 'Invalid content type'
          };
      }
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to check content access');
    }
  }

  /**
   * Check if student can access a specific lesson
   */
  private static async canAccessLesson(studentId: string, lessonId: string): Promise<ContentAccessResult> {
    try {
      // Get lesson with prerequisites
      const lesson = await LessonService.getById(lessonId);
      if (!lesson) {
        return {
          canAccess: false,
          reason: 'Lesson not found'
        };
      }

      // Check if lesson is published
      if (!lesson.is_published) {
        return {
          canAccess: false,
          reason: 'Lesson is not published'
        };
      }

      // Check course enrollment
      const isEnrolled = await this.isEnrolledInCourse(studentId, lesson.course_id);
      if (!isEnrolled) {
        return {
          canAccess: false,
          reason: 'Not enrolled in course'
        };
      }

      // Check prerequisites
      const prerequisiteStatuses = await this.checkLessonPrerequisites(studentId, lesson);
      const unmetPrerequisites = prerequisiteStatuses.filter(p => !p.completed);

      if (unmetPrerequisites.length > 0) {
        return {
          canAccess: false,
          reason: 'Prerequisites not met',
          blockedBy: {
            type: unmetPrerequisites[0].type,
            id: unmetPrerequisites[0].id,
            title: unmetPrerequisites[0].title
          },
          prerequisites: prerequisiteStatuses
        };
      }

      return {
        canAccess: true,
        prerequisites: prerequisiteStatuses
      };
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to check lesson access');
    }
  }

  /**
   * Check if student can access a specific course
   */
  private static async canAccessCourse(studentId: string, courseId: string): Promise<ContentAccessResult> {
    try {
      // Get course details
      const course = await CourseService.getById(courseId);
      if (!course) {
        return {
          canAccess: false,
          reason: 'Course not found'
        };
      }

      // Check if course is published
      if (!course.is_published) {
        return {
          canAccess: false,
          reason: 'Course is not published'
        };
      }

      // Check enrollment
      const isEnrolled = await this.isEnrolledInCourse(studentId, courseId);
      if (!isEnrolled) {
        return {
          canAccess: false,
          reason: 'Not enrolled in course'
        };
      }

      return {
        canAccess: true
      };
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to check course access');
    }
  }

  /**
   * Check if student can access a specific assessment
   */
  private static async canAccessAssessment(studentId: string, assessmentId: string): Promise<ContentAccessResult> {
    try {
      // Get assessment details
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select(`
          *,
          lesson:lessons(*),
          course:courses(*)
        `)
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      if (!assessment) {
        return {
          canAccess: false,
          reason: 'Assessment not found'
        };
      }

      // Check if assessment belongs to a lesson or course
      if (assessment.lesson_id) {
        // Lesson assessment - check lesson access
        const lessonAccess = await this.canAccessLesson(studentId, assessment.lesson_id);
        if (!lessonAccess.canAccess) {
          return lessonAccess;
        }

        // Check if lesson content is completed (for mandatory assessments)
        if (assessment.is_mandatory) {
          const lessonProgress = await this.getContentProgress(studentId, assessment.lesson_id, 'lesson');
          if (!lessonProgress || lessonProgress.status !== 'completed') {
            return {
              canAccess: false,
              reason: 'Must complete lesson content first',
              blockedBy: {
                type: 'lesson',
                id: assessment.lesson_id,
                title: assessment.lesson?.title || 'Unknown Lesson'
              }
            };
          }
        }
      } else if (assessment.course_id) {
        // Course final assessment - check course access and completion
        const courseAccess = await this.canAccessCourse(studentId, assessment.course_id);
        if (!courseAccess.canAccess) {
          return courseAccess;
        }

        // Check if all course lessons are completed
        if (assessment.is_mandatory) {
          const allLessonsCompleted = await this.areAllLessonsCompleted(studentId, assessment.course_id);
          if (!allLessonsCompleted) {
            return {
              canAccess: false,
              reason: 'Must complete all course lessons first',
              blockedBy: {
                type: 'course',
                id: assessment.course_id,
                title: assessment.course?.title || 'Unknown Course'
              }
            };
          }
        }
      }

      // Check attempt limits
      if (assessment.max_attempts) {
        const attempts = await AssessmentAttemptService.getByStudentAndAssessment(studentId, assessmentId);
        if (attempts.length >= assessment.max_attempts) {
          return {
            canAccess: false,
            reason: `Maximum attempts (${assessment.max_attempts}) reached`
          };
        }
      }

      return {
        canAccess: true
      };
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to check assessment access');
    }
  }

  /**
   * Check lesson prerequisites
   */
  private static async checkLessonPrerequisites(studentId: string, lesson: Lesson): Promise<PrerequisiteStatus[]> {
    const prerequisites: PrerequisiteStatus[] = [];

    for (const prereqId of lesson.prerequisites) {
      try {
        // Get prerequisite lesson
        const prereqLesson = await LessonService.getById(prereqId);
        if (!prereqLesson) continue;

        // Check if prerequisite lesson is completed
        const progress = await this.getContentProgress(studentId, prereqId, 'lesson');
        const completed = progress?.status === 'completed';

        let score: number | undefined;
        let required_score: number | undefined;

        // If lesson has an assessment, check if it's passed
        if (prereqLesson.assessment_id && completed) {
          const bestAttempt = await AssessmentAttemptService.getBestAttempt(studentId, prereqLesson.assessment_id);
          if (bestAttempt) {
            score = bestAttempt.score;
            // Get required passing score
            const assessment = await supabase
              .from('assessments')
              .select('minimum_passing_score')
              .eq('id', prereqLesson.assessment_id)
              .single();
            
            if (assessment.data) {
              required_score = assessment.data.minimum_passing_score;
            }
          }
        }

        prerequisites.push({
          id: prereqId,
          type: 'lesson',
          title: prereqLesson.title,
          completed,
          score,
          required_score
        });
      } catch (error) {
        console.error(`Error checking prerequisite ${prereqId}:`, error);
      }
    }

    return prerequisites;
  }

  /**
   * Update student progress and check for newly unlocked content
   */
  static async updateProgress(progressUpdate: ProgressUpdate): Promise<UnlockedContent> {
    try {
      const { student_id, content_id, content_type, status, completion_percentage, time_spent, score } = progressUpdate;

      // Update progress record
      const progressData: Partial<StudentProgress> = {
        student_id,
        status,
        completion_percentage: completion_percentage || 0,
        time_spent: time_spent || 0,
        last_accessed: new Date().toISOString()
      };

      // Set content-specific fields
      if (content_type === 'lesson') {
        progressData.lesson_id = content_id;
        // Get course ID from lesson
        const lesson = await LessonService.getById(content_id);
        if (lesson) {
          progressData.course_id = lesson.course_id;
        }
      } else if (content_type === 'course') {
        progressData.course_id = content_id;
      } else if (content_type === 'assessment') {
        progressData.assessment_id = content_id;
        if (score !== undefined) {
          progressData.best_score = Math.max(progressData.best_score || 0, score);
        }
        // Get course ID from assessment
        const { data: assessment } = await supabase
          .from('assessments')
          .select('course_id, lesson_id')
          .eq('id', content_id)
          .single();
        
        if (assessment) {
          if (assessment.course_id) {
            progressData.course_id = assessment.course_id;
          } else if (assessment.lesson_id) {
            const lesson = await LessonService.getById(assessment.lesson_id);
            if (lesson) {
              progressData.course_id = lesson.course_id;
            }
          }
        }
      }

      await StudentProgressService.upsert(progressData);

      // Check for newly unlocked content
      return await this.checkUnlockedContent(student_id, progressData.course_id!);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to update progress');
    }
  }

  /**
   * Check what content has been newly unlocked for a student
   */
  private static async checkUnlockedContent(studentId: string, courseId: string): Promise<UnlockedContent> {
    try {
      const unlockedContent: UnlockedContent = {
        lessons: [],
        assessments: [],
        courses: []
      };

      // Get all lessons in the course
      const lessons = await LessonService.getByCourse(courseId);

      for (const lesson of lessons) {
        // Check if lesson is now accessible
        const access = await this.canAccessLesson(studentId, lesson.id);
        if (access.canAccess) {
          // Check if this is newly unlocked (not previously accessed)
          const progress = await this.getContentProgress(studentId, lesson.id, 'lesson');
          if (!progress || progress.status === 'not_started') {
            unlockedContent.lessons.push(lesson.id);
          }

          // Check lesson assessment
          if (lesson.assessment_id) {
            const assessmentAccess = await this.canAccessAssessment(studentId, lesson.assessment_id);
            if (assessmentAccess.canAccess) {
              const assessmentProgress = await this.getContentProgress(studentId, lesson.assessment_id, 'assessment');
              if (!assessmentProgress || assessmentProgress.status === 'not_started') {
                unlockedContent.assessments.push(lesson.assessment_id);
              }
            }
          }
        }
      }

      // Check course final assessment
      const course = await CourseService.getById(courseId);
      if (course?.final_assessment_id) {
        const assessmentAccess = await this.canAccessAssessment(studentId, course.final_assessment_id);
        if (assessmentAccess.canAccess) {
          const assessmentProgress = await this.getContentProgress(studentId, course.final_assessment_id, 'assessment');
          if (!assessmentProgress || assessmentProgress.status === 'not_started') {
            unlockedContent.assessments.push(course.final_assessment_id);
          }
        }
      }

      return unlockedContent;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to check unlocked content');
    }
  }

  /**
   * Block student progress due to failed assessment
   */
  static async blockProgress(studentId: string, assessmentId: string, reason: string): Promise<void> {
    try {
      // Get assessment details to determine what to block
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select('lesson_id, course_id')
        .eq('id', assessmentId)
        .single();

      if (error) throw error;

      if (assessment.lesson_id) {
        // Block lesson progress
        await StudentProgressService.upsert({
          student_id: studentId,
          lesson_id: assessment.lesson_id,
          course_id: await this.getCourseIdFromLesson(assessment.lesson_id),
          status: 'blocked',
          last_accessed: new Date().toISOString()
        });
      } else if (assessment.course_id) {
        // Block course progress
        await StudentProgressService.upsert({
          student_id: studentId,
          course_id: assessment.course_id,
          status: 'blocked',
          last_accessed: new Date().toISOString()
        });
      }

      // Log the blocking reason (could be stored in a separate table for audit)
      console.log(`Progress blocked for student ${studentId} on assessment ${assessmentId}: ${reason}`);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to block progress');
    }
  }

  /**
   * Unblock student progress (instructor override)
   */
  static async unblockProgress(studentId: string, contentId: string, contentType: 'lesson' | 'course'): Promise<void> {
    try {
      const progressData: Partial<StudentProgress> = {
        student_id: studentId,
        status: 'in_progress',
        last_accessed: new Date().toISOString()
      };

      if (contentType === 'lesson') {
        progressData.lesson_id = contentId;
        progressData.course_id = await this.getCourseIdFromLesson(contentId);
      } else {
        progressData.course_id = contentId;
      }

      await StudentProgressService.upsert(progressData);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to unblock progress');
    }
  }

  /**
   * Get student's progress status for specific content
   */
  static async getContentProgress(
    studentId: string, 
    contentId: string, 
    contentType: 'lesson' | 'course' | 'assessment'
  ): Promise<StudentProgress | null> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq(`${contentType}_id`, contentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to get content progress');
    }
  }

  /**
   * Check if student has passed a specific assessment
   */
  static async hasPassedAssessment(studentId: string, assessmentId: string): Promise<boolean> {
    try {
      const bestAttempt = await AssessmentAttemptService.getBestAttempt(studentId, assessmentId);
      return bestAttempt?.passed || false;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to check assessment pass status');
    }
  }

  /**
   * Get all blocked content for a student
   */
  static async getBlockedContent(studentId: string): Promise<StudentProgress[]> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'blocked');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to get blocked content');
    }
  }

  /**
   * Get comprehensive progress overview for a student in a course
   */
  static async getCourseProgressOverview(studentId: string, courseId: string) {
    try {
      // Get all lessons in course
      const lessons = await LessonService.getByCourse(courseId);
      
      // Get student progress for all lessons
      const lessonProgress = await Promise.all(
        lessons.map(async (lesson) => {
          const progress = await this.getContentProgress(studentId, lesson.id, 'lesson');
          const canAccess = await this.canAccessLesson(studentId, lesson.id);
          
          let assessmentStatus = null;
          if (lesson.assessment_id) {
            const assessmentProgress = await this.getContentProgress(studentId, lesson.assessment_id, 'assessment');
            const canAccessAssessment = await this.canAccessAssessment(studentId, lesson.assessment_id);
            const passed = await this.hasPassedAssessment(studentId, lesson.assessment_id);
            
            assessmentStatus = {
              id: lesson.assessment_id,
              canAccess: canAccessAssessment.canAccess,
              progress: assessmentProgress,
              passed
            };
          }

          return {
            lesson,
            progress,
            canAccess: canAccess.canAccess,
            blockedBy: canAccess.blockedBy,
            assessment: assessmentStatus
          };
        })
      );

      // Get course final assessment status
      const course = await CourseService.getById(courseId);
      let finalAssessmentStatus = null;
      if (course?.final_assessment_id) {
        const assessmentProgress = await this.getContentProgress(studentId, course.final_assessment_id, 'assessment');
        const canAccessAssessment = await this.canAccessAssessment(studentId, course.final_assessment_id);
        const passed = await this.hasPassedAssessment(studentId, course.final_assessment_id);
        
        finalAssessmentStatus = {
          id: course.final_assessment_id,
          canAccess: canAccessAssessment.canAccess,
          progress: assessmentProgress,
          passed
        };
      }

      // Calculate overall progress
      const completedLessons = lessonProgress.filter(lp => lp.progress?.status === 'completed').length;
      const totalLessons = lessons.length;
      const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        courseId,
        overallProgress,
        totalLessons,
        completedLessons,
        lessons: lessonProgress,
        finalAssessment: finalAssessmentStatus,
        isCompleted: completedLessons === totalLessons && (finalAssessmentStatus?.passed || !finalAssessmentStatus)
      };
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to get course progress overview');
    }
  }

  // Helper methods

  private static async isEnrolledInCourse(studentId: string, courseId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to check enrollment');
    }
  }

  private static async areAllLessonsCompleted(studentId: string, courseId: string): Promise<boolean> {
    try {
      const lessons = await LessonService.getByCourse(courseId);
      
      for (const lesson of lessons) {
        const progress = await this.getContentProgress(studentId, lesson.id, 'lesson');
        if (!progress || progress.status !== 'completed') {
          return false;
        }

        // Also check if lesson assessment is passed (if exists)
        if (lesson.assessment_id) {
          const passed = await this.hasPassedAssessment(studentId, lesson.assessment_id);
          if (!passed) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to check lesson completion');
    }
  }

  private static async getCourseIdFromLesson(lessonId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('course_id')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      return data.course_id;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to get course ID from lesson');
    }
  }
}