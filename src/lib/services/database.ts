/**
 * Database Service Layer
 * 
 * This file contains the database service layer with CRUD operations
 * for all data models in the personalized LMS application.
 */

import { supabase } from '$lib/supabase.js';
import type {
  UserProfile,
  Course,
  CourseWithDetails,
  Lesson,
  LessonWithDetails,
  ContentBlock,
  Assessment,
  AssessmentAttempt,
  PersonalizedRoadmap,
  StudentProgress,
  Enrollment,
  LearningAnalytics
} from '$lib/types/database.js';
import {
  transformUserProfile,
  transformCourse,
  transformCourseWithDetails,
  transformLesson,
  transformLessonWithDetails,
  transformContentBlock,
  transformAssessment,
  transformAssessmentAttempt,
  transformPersonalizedRoadmap,
  transformStudentProgress,
  transformUserProfileForDB,
  transformCourseForDB,
  transformLessonForDB,
  transformContentBlockForDB,
  transformAssessmentForDB
} from '$lib/utils/transformers.js';
import { DatabaseError, handleDatabaseError } from '$lib/utils/errors.js';

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

export class UserProfileService {
  /**
   * Get user profile by ID
   */
  static async getById(id: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? transformUserProfile(data) : null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch user profile');
    }
  }

  /**
   * Get user profile by email
   */
  static async getByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data ? transformUserProfile(data) : null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch user profile by email');
    }
  }

  /**
   * Create new user profile
   */
  static async create(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const dbProfile = transformUserProfileForDB(profile);
      const { data, error } = await supabase
        .from('profiles')
        .insert(dbProfile)
        .select()
        .single();

      if (error) throw error;
      return transformUserProfile(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to create user profile');
    }
  }

  /**
   * Update user profile
   */
  static async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const dbUpdates = transformUserProfileForDB(updates);
      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformUserProfile(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to update user profile');
    }
  }

  /**
   * Delete user profile
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to delete user profile');
    }
  }

  /**
   * Get instructors list
   */
  static async getInstructors(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'instructor')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data.map(transformUserProfile);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch instructors');
    }
  }
}

// ============================================================================
// COURSE OPERATIONS
// ============================================================================

export class CourseService {
  /**
   * Get course by ID
   */
  static async getById(id: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? transformCourse(data) : null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch course');
    }
  }

  /**
   * Get course with detailed information
   */
  static async getWithDetails(id: string, studentId?: string): Promise<CourseWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(*),
          lessons(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Get enrollment status if student ID provided
      let enrollmentStatus;
      if (studentId) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('course_id', id)
          .eq('student_id', studentId)
          .single();

        if (enrollment) {
          enrollmentStatus = {
            is_enrolled: true,
            enrollment_date: enrollment.enrolled_at,
            completion_status: enrollment.completed_at ? 'completed' : 'in_progress',
            progress_percentage: enrollment.progress?.overall_percentage || 0
          };
        } else {
          enrollmentStatus = {
            is_enrolled: false,
            completion_status: 'not_started',
            progress_percentage: 0
          };
        }
      }

      return transformCourseWithDetails(
        data,
        data.instructor,
        data.lessons,
        enrollmentStatus
      );
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch course details');
    }
  }

  /**
   * Get all published courses
   */
  static async getPublished(limit?: number, offset?: number): Promise<Course[]> {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit || 10) - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data.map(transformCourse);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch published courses');
    }
  }

  /**
   * Get courses by instructor
   */
  static async getByInstructor(instructorId: string): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(transformCourse);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch instructor courses');
    }
  }

  /**
   * Create new course
   */
  static async create(course: Partial<Course>): Promise<Course> {
    try {
      const dbCourse = transformCourseForDB(course);
      const { data, error } = await supabase
        .from('courses')
        .insert(dbCourse)
        .select()
        .single();

      if (error) throw error;
      return transformCourse(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to create course');
    }
  }

  /**
   * Update course
   */
  static async update(id: string, updates: Partial<Course>): Promise<Course> {
    try {
      const dbUpdates = transformCourseForDB(updates);
      const { data, error } = await supabase
        .from('courses')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformCourse(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to update course');
    }
  }

  /**
   * Delete course
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to delete course');
    }
  }

  /**
   * Search courses by title or tags
   */
  static async search(query: string, limit?: number): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .or(`title.ilike.%${query}%,tags.cs.{${query}}`)
        .eq('is_published', true)
        .limit(limit || 20);

      if (error) throw error;
      return data.map(transformCourse);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to search courses');
    }
  }
}

// ============================================================================
// LESSON OPERATIONS
// ============================================================================

export class LessonService {
  /**
   * Get lesson by ID
   */
  static async getById(id: string): Promise<Lesson | null> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          content_blocks(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? transformLesson(data) : null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch lesson');
    }
  }

  /**
   * Get lesson with detailed information
   */
  static async getWithDetails(id: string, studentId?: string): Promise<LessonWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          content_blocks(*),
          course:courses(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Get progress if student ID provided
      let progress;
      if (studentId) {
        const { data: progressData } = await supabase
          .from('student_progress')
          .select('*')
          .eq('lesson_id', id)
          .eq('student_id', studentId)
          .single();

        progress = progressData;
      }

      return transformLessonWithDetails(data, data.course, data.assessment, progress);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch lesson details');
    }
  }

  /**
   * Get lessons by course
   */
  static async getByCourse(courseId: string): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          content_blocks(*)
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data.map(transformLesson);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch course lessons');
    }
  }

  /**
   * Create new lesson
   */
  static async create(lesson: Partial<Lesson>): Promise<Lesson> {
    try {
      const dbLesson = transformLessonForDB(lesson);
      const { data, error } = await supabase
        .from('lessons')
        .insert(dbLesson)
        .select()
        .single();

      if (error) throw error;
      return transformLesson(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to create lesson');
    }
  }

  /**
   * Update lesson
   */
  static async update(id: string, updates: Partial<Lesson>): Promise<Lesson> {
    try {
      const dbUpdates = transformLessonForDB(updates);
      const { data, error } = await supabase
        .from('lessons')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformLesson(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to update lesson');
    }
  }

  /**
   * Delete lesson
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to delete lesson');
    }
  }

  /**
   * Reorder lessons in a course
   */
  static async reorder(courseId: string, lessonIds: string[]): Promise<void> {
    try {
      const updates = lessonIds.map((id, index) => ({
        id,
        order_index: index,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('lessons')
        .upsert(updates);

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to reorder lessons');
    }
  }
}

// ============================================================================
// CONTENT BLOCK OPERATIONS
// ============================================================================

export class ContentBlockService {
  /**
   * Get content blocks by lesson
   */
  static async getByLesson(lessonId: string): Promise<ContentBlock[]> {
    try {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data.map(transformContentBlock);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch content blocks');
    }
  }

  /**
   * Create new content block
   */
  static async create(block: Partial<ContentBlock>): Promise<ContentBlock> {
    try {
      const dbBlock = transformContentBlockForDB(block);
      const { data, error } = await supabase
        .from('content_blocks')
        .insert(dbBlock)
        .select()
        .single();

      if (error) throw error;
      return transformContentBlock(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to create content block');
    }
  }

  /**
   * Update content block
   */
  static async update(id: string, updates: Partial<ContentBlock>): Promise<ContentBlock> {
    try {
      const dbUpdates = transformContentBlockForDB(updates);
      const { data, error } = await supabase
        .from('content_blocks')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return transformContentBlock(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to update content block');
    }
  }

  /**
   * Delete content block
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to delete content block');
    }
  }

  /**
   * Reorder content blocks in a lesson
   */
  static async reorder(lessonId: string, blockIds: string[]): Promise<void> {
    try {
      const updates = blockIds.map((id, index) => ({
        id,
        order_index: index,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('content_blocks')
        .upsert(updates);

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to reorder content blocks');
    }
  }
}

// ============================================================================
// ASSESSMENT OPERATIONS
// ============================================================================

export class AssessmentService {
  /**
   * Get assessment by ID
   */
  static async getById(id: string): Promise<Assessment | null> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? transformAssessment(data) : null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch assessment');
    }
  }

  /**
   * Get assessments by lesson
   */
  static async getByLesson(lessonId: string): Promise<Assessment[]> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('lesson_id', lessonId);

      if (error) throw error;
      return data.map(transformAssessment);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch lesson assessments');
    }
  }

  /**
   * Get assessments by course
   */
  static async getByCourse(courseId: string): Promise<Assessment[]> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      return data.map(transformAssessment);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch course assessments');
    }
  }

  /**
   * Create new assessment
   */
  static async create(assessment: Partial<Assessment>): Promise<Assessment> {
    try {
      const dbAssessment = transformAssessmentForDB(assessment);
      const { data, error } = await supabase
        .from('assessments')
        .insert(dbAssessment)
        .select()
        .single();

      if (error) throw error;
      return transformAssessment(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to create assessment');
    }
  }

  /**
   * Update assessment
   */
  static async update(id: string, updates: Partial<Assessment>): Promise<Assessment> {
    try {
      const dbUpdates = transformAssessmentForDB(updates);
      const { data, error } = await supabase
        .from('assessments')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformAssessment(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to update assessment');
    }
  }

  /**
   * Delete assessment
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to delete assessment');
    }
  }

  /**
   * Get assessments by instructor
   */
  static async getByInstructor(instructorId: string): Promise<Assessment[]> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *
          lessons!assessments_lesson_id_fkey(
            course_id,
            courses!lessons_course_id_fkey(instructor_id)
          ),
          courses!assessments_course_id_fkey(instructor_id)
        `)
        //.or(`courses.instructor_id.eq.${instructorId}`);

      if (error) throw error;
      return data.map(transformAssessment);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch instructor assessments');
    }
  }

  /**
   * Get all assessments (admin only)
   */
  static async getAll(): Promise<Assessment[]> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(transformAssessment);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch all assessments');
    }
  }
}

// ============================================================================
// ASSESSMENT ATTEMPT OPERATIONS
// ============================================================================

export class AssessmentAttemptService {
  /**
   * Get assessment attempt by ID
   */
  static async getById(id: string): Promise<AssessmentAttempt | null> {
    try {
      const { data, error } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? transformAssessmentAttempt(data) : null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch assessment attempt');
    }
  }

  /**
   * Get attempts by student and assessment
   */
  static async getByStudentAndAssessment(
    studentId: string,
    assessmentId: string
  ): Promise<AssessmentAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_id', assessmentId)
        .order('attempt_number', { ascending: true });

      if (error) throw error;
      return data.map(transformAssessmentAttempt);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch assessment attempts');
    }
  }

  /**
   * Get best attempt for student and assessment
   */
  static async getBestAttempt(
    studentId: string,
    assessmentId: string
  ): Promise<AssessmentAttempt | null> {
    try {
      const { data, error } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_id', assessmentId)
        .order('score', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data ? transformAssessmentAttempt(data) : null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch best assessment attempt');
    }
  }

  /**
   * Create new assessment attempt
   */
  static async create(attempt: Partial<AssessmentAttempt>): Promise<AssessmentAttempt> {
    try {
      const dbAttempt = {
        assessment_id: attempt.assessment_id,
        student_id: attempt.student_id,
        attempt_number: attempt.attempt_number,
        answers: JSON.stringify(attempt.answers),
        score: attempt.score,
        points_earned: attempt.points_earned,
        total_points: attempt.total_points,
        passed: attempt.passed,
        time_spent: attempt.time_spent,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        feedback: attempt.feedback ? JSON.stringify(attempt.feedback) : null
      };

      const { data, error } = await supabase
        .from('assessment_attempts')
        .insert(dbAttempt)
        .select()
        .single();

      if (error) throw error;
      return transformAssessmentAttempt(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to create assessment attempt');
    }
  }

  /**
   * Get next attempt number for student and assessment
   */
  static async getNextAttemptNumber(studentId: string, assessmentId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('assessment_attempts')
        .select('attempt_number')
        .eq('student_id', studentId)
        .eq('assessment_id', assessmentId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data.length > 0 ? data[0].attempt_number + 1 : 1;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to get next attempt number');
    }
  }

  /**
   * Update assessment attempt (for manual grading)
   */
  static async update(id: string, updates: Partial<AssessmentAttempt>): Promise<AssessmentAttempt> {
    try {
      const dbUpdates: any = {};
      
      if (updates.answers) dbUpdates.answers = JSON.stringify(updates.answers);
      if (updates.score !== undefined) dbUpdates.score = updates.score;
      if (updates.points_earned !== undefined) dbUpdates.points_earned = updates.points_earned;
      if (updates.passed !== undefined) dbUpdates.passed = updates.passed;
      if (updates.feedback) dbUpdates.feedback = JSON.stringify(updates.feedback);
      
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('assessment_attempts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformAssessmentAttempt(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to update assessment attempt');
    }
  }
}

// ============================================================================
// STUDENT PROGRESS OPERATIONS
// ============================================================================

export class StudentProgressService {
  /**
   * Get progress by student and course
   */
  static async getByCourse(studentId: string, courseId: string): Promise<StudentProgress[]> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      if (error) throw error;
      return data.map(transformStudentProgress);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch student progress');
    }
  }

  /**
   * Update or create progress record
   */
  static async upsert(progress: Partial<StudentProgress>): Promise<StudentProgress> {
    try {
      const dbProgress = {
        student_id: progress.student_id,
        course_id: progress.course_id,
        lesson_id: progress.lesson_id,
        assessment_id: progress.assessment_id,
        status: progress.status,
        completion_percentage: progress.completion_percentage,
        last_accessed: progress.last_accessed || new Date().toISOString(),
        time_spent: progress.time_spent,
        attempts_count: progress.attempts_count,
        best_score: progress.best_score,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('student_progress')
        .upsert(dbProgress)
        .select()
        .single();

      if (error) throw error;
      return transformStudentProgress(data);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to update student progress');
    }
  }

  /**
   * Get overall course progress for student
   */
  static async getCourseProgress(studentId: string, courseId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_course_progress', {
          p_student_id: studentId,
          p_course_id: courseId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to get course progress');
    }
  }
}

// ============================================================================
// ENROLLMENT OPERATIONS
// ============================================================================

export class EnrollmentService {
  /**
   * Enroll student in course
   */
  static async enroll(studentId: string, courseId: string): Promise<Enrollment> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to enroll student');
    }
  }

  /**
   * Get student enrollments
   */
  static async getByStudent(studentId: string): Promise<Enrollment[]> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to fetch student enrollments');
    }
  }

  /**
   * Check if student is enrolled in course
   */
  static async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
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
      throw handleDatabaseError(error, 'Failed to check enrollment status');
    }
  }
}