/**
 * Data Transformation Utilities
 * 
 * This file contains transformation functions for converting data between
 * different formats and structures used throughout the application.
 */

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
  EnrollmentProgress,
  LearningAnalytics,
  InstructorAnalytics
} from '$lib/types/database.js';

// ============================================================================
// DATABASE TO API TRANSFORMERS
// ============================================================================

/**
 * Transform database user profile to API format
 */
export const transformUserProfile = (dbProfile: any): UserProfile => {
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    role: dbProfile.role,
    first_name: dbProfile.first_name,
    last_name: dbProfile.last_name,
    avatar_url: dbProfile.avatar_url,
    learning_preferences: dbProfile.learning_preferences ? 
      dbProfile.learning_preferences : null,
    knowledge_profile: dbProfile.knowledge_profile ? 
      dbProfile.knowledge_profile : null,
    created_at: dbProfile.created_at,
    updated_at: dbProfile.updated_at
  };
};

/**
 * Transform database course to API format
 */
export const transformCourse = (dbCourse: any): Course => {
  return {
    id: dbCourse.id,
    title: dbCourse.title,
    description: dbCourse.description,
    instructor_id: dbCourse.instructor_id,
    final_assessment_id: dbCourse.final_assessment_id,
    tags: dbCourse.tags || [],
    difficulty_level: dbCourse.difficulty_level,
    estimated_duration: dbCourse.estimated_duration,
    is_published: dbCourse.is_published,
    enrollment_count: dbCourse.enrollment_count,
    completion_rate: dbCourse.completion_rate,
    created_at: dbCourse.created_at,
    updated_at: dbCourse.updated_at
  };
};

/**
 * Transform database course with related data to detailed format
 */
export const transformCourseWithDetails = (
  dbCourse: any,
  instructor?: any,
  lessons?: any[],
  finalAssessment?: any,
  enrollmentStatus?: any
): CourseWithDetails => {
  const course = transformCourse(dbCourse);
  
  return {
    ...course,
    instructor: instructor ? transformUserProfile(instructor) : {} as UserProfile,
    lessons: lessons ? lessons.map(transformLesson) : [],
    final_assessment: finalAssessment ? transformAssessment(finalAssessment) : null,
    enrollment_status: enrollmentStatus ? {
      is_enrolled: enrollmentStatus.is_enrolled,
      enrollment_date: enrollmentStatus.enrollment_date,
      completion_status: enrollmentStatus.completion_status,
      progress_percentage: enrollmentStatus.progress_percentage
    } : undefined
  };
};

/**
 * Transform database lesson to API format
 */
export const transformLesson = (dbLesson: any): Lesson => {
  return {
    id: dbLesson.id,
    course_id: dbLesson.course_id,
    title: dbLesson.title,
    description: dbLesson.description,
    order_index: dbLesson.order_index,
    content_blocks: dbLesson.content_blocks ? 
      dbLesson.content_blocks.map(transformContentBlock) : [],
    learning_objectives: dbLesson.learning_objectives || [],
    estimated_duration: dbLesson.estimated_duration,
    assessment_id: dbLesson.assessment_id,
    prerequisites: dbLesson.prerequisites || [],
    is_published: dbLesson.is_published,
    created_at: dbLesson.created_at,
    updated_at: dbLesson.updated_at
  };
};

/**
 * Transform database lesson with related data to detailed format
 */
export const transformLessonWithDetails = (
  dbLesson: any,
  course?: any,
  assessment?: any,
  progress?: any
): LessonWithDetails => {
  const lesson = transformLesson(dbLesson);
  
  return {
    ...lesson,
    course: course ? transformCourse(course) : {} as Course,
    assessment: assessment ? transformAssessment(assessment) : null,
    progress_status: progress?.status,
    completion_percentage: progress?.completion_percentage
  };
};

/**
 * Transform database content block to API format
 */
export const transformContentBlock = (dbBlock: any): ContentBlock => {
  return {
    id: dbBlock.id,
    lesson_id: dbBlock.lesson_id,
    type: dbBlock.type,
    content: typeof dbBlock.content === 'string' ? 
      JSON.parse(dbBlock.content) : dbBlock.content,
    order_index: dbBlock.order_index,
    metadata: typeof dbBlock.metadata === 'string' ? 
      JSON.parse(dbBlock.metadata) : (dbBlock.metadata || {}),
    created_at: dbBlock.created_at,
    updated_at: dbBlock.updated_at
  };
};

/**
 * Transform database assessment to API format
 */
export const transformAssessment = (dbAssessment: any): Assessment => {
  let questions = [];
  
  // Handle questions field - it might be a JSON string, array, or null/undefined
  if (dbAssessment.questions) {
    if (typeof dbAssessment.questions === 'string') {
      try {
        questions = JSON.parse(dbAssessment.questions);
      } catch (error) {
        console.warn('Failed to parse questions JSON:', error);
        questions = [];
      }
    } else if (Array.isArray(dbAssessment.questions)) {
      questions = dbAssessment.questions;
    }
  }

  return {
    id: dbAssessment.id,
    lesson_id: dbAssessment.lesson_id,
    course_id: dbAssessment.course_id,
    title: dbAssessment.title,
    description: dbAssessment.description,
    questions: questions,
    ai_generated: dbAssessment.ai_generated,
    source_content_ids: dbAssessment.source_content_ids || [],
    is_mandatory: dbAssessment.is_mandatory,
    minimum_passing_score: dbAssessment.minimum_passing_score,
    max_attempts: dbAssessment.max_attempts,
    time_limit: dbAssessment.time_limit,
    created_at: dbAssessment.created_at,
    updated_at: dbAssessment.updated_at
  };
};

/**
 * Transform database assessment attempt to API format
 */
export const transformAssessmentAttempt = (dbAttempt: any): AssessmentAttempt => {
  return {
    id: dbAttempt.id,
    assessment_id: dbAttempt.assessment_id,
    student_id: dbAttempt.student_id,
    attempt_number: dbAttempt.attempt_number,
    answers: typeof dbAttempt.answers === 'string' ? 
      JSON.parse(dbAttempt.answers) : dbAttempt.answers,
    score: dbAttempt.score,
    points_earned: dbAttempt.points_earned,
    total_points: dbAttempt.total_points,
    passed: dbAttempt.passed,
    time_spent: dbAttempt.time_spent,
    started_at: dbAttempt.started_at,
    submitted_at: dbAttempt.submitted_at,
    feedback: typeof dbAttempt.feedback === 'string' ? 
      JSON.parse(dbAttempt.feedback) : dbAttempt.feedback
  };
};

/**
 * Transform database personalized roadmap to API format
 */
export const transformPersonalizedRoadmap = (dbRoadmap: any): PersonalizedRoadmap => {
  return {
    id: dbRoadmap.id,
    student_id: dbRoadmap.student_id,
    generated_at: dbRoadmap.generated_at,
    roadmap_data: typeof dbRoadmap.roadmap_data === 'string' ? 
      JSON.parse(dbRoadmap.roadmap_data) : dbRoadmap.roadmap_data,
    ai_reasoning: dbRoadmap.ai_reasoning,
    status: dbRoadmap.status,
    updated_at: dbRoadmap.updated_at
  };
};

/**
 * Transform database student progress to API format
 */
export const transformStudentProgress = (dbProgress: any): StudentProgress => {
  return {
    id: dbProgress.id,
    student_id: dbProgress.student_id,
    course_id: dbProgress.course_id,
    lesson_id: dbProgress.lesson_id,
    assessment_id: dbProgress.assessment_id,
    status: dbProgress.status,
    completion_percentage: dbProgress.completion_percentage,
    last_accessed: dbProgress.last_accessed,
    time_spent: dbProgress.time_spent,
    attempts_count: dbProgress.attempts_count,
    best_score: dbProgress.best_score,
    created_at: dbProgress.created_at,
    updated_at: dbProgress.updated_at
  };
};

// ============================================================================
// API TO DATABASE TRANSFORMERS
// ============================================================================

/**
 * Transform API user profile to database format
 */
export const transformUserProfileForDB = (profile: Partial<UserProfile>): any => {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    first_name: profile.first_name,
    last_name: profile.last_name,
    avatar_url: profile.avatar_url,
    learning_preferences: profile.learning_preferences ? 
      JSON.stringify(profile.learning_preferences) : null,
    knowledge_profile: profile.knowledge_profile ? 
      JSON.stringify(profile.knowledge_profile) : null,
    updated_at: new Date().toISOString()
  };
};

/**
 * Transform API course to database format
 */
export const transformCourseForDB = (course: Partial<Course>): any => {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    instructor_id: course.instructor_id,
    final_assessment_id: course.final_assessment_id,
    tags: course.tags,
    difficulty_level: course.difficulty_level,
    estimated_duration: course.estimated_duration,
    is_published: course.is_published,
    updated_at: new Date().toISOString()
  };
};

/**
 * Transform API lesson to database format
 */
export const transformLessonForDB = (lesson: Partial<Lesson>): any => {
  return {
    id: lesson.id,
    course_id: lesson.course_id,
    title: lesson.title,
    description: lesson.description,
    order_index: lesson.order_index,
    learning_objectives: lesson.learning_objectives,
    estimated_duration: lesson.estimated_duration,
    assessment_id: lesson.assessment_id,
    prerequisites: lesson.prerequisites,
    is_published: lesson.is_published,
    updated_at: new Date().toISOString()
  };
};

/**
 * Transform API content block to database format
 */
export const transformContentBlockForDB = (block: Partial<ContentBlock>): any => {
  return {
    id: block.id,
    lesson_id: block.lesson_id,
    type: block.type,
    content: block.content,
    order_index: block.order_index,
    metadata: block.metadata || {},
    updated_at: new Date().toISOString()
  };
};

/**
 * Transform API assessment to database format
 */
export const transformAssessmentForDB = (assessment: Partial<Assessment>): any => {
  return {
    id: assessment.id,
    lesson_id: assessment.lesson_id,
    course_id: assessment.course_id,
    title: assessment.title,
    description: assessment.description,
    questions: JSON.stringify(assessment.questions),
    ai_generated: assessment.ai_generated,
    source_content_ids: assessment.source_content_ids,
    is_mandatory: assessment.is_mandatory,
    minimum_passing_score: assessment.minimum_passing_score,
    max_attempts: assessment.max_attempts,
    time_limit: assessment.time_limit,
    updated_at: new Date().toISOString()
  };
};

// ============================================================================
// AGGREGATION TRANSFORMERS
// ============================================================================

/**
 * Calculate enrollment progress from student progress records
 */
export const calculateEnrollmentProgress = (
  progressRecords: StudentProgress[],
  totalLessons: number,
  totalAssessments: number
): EnrollmentProgress => {
  const lessonsCompleted = progressRecords.filter(
    p => p.lesson_id && p.status === 'completed'
  ).length;
  
  const assessmentsPassed = progressRecords.filter(
    p => p.assessment_id && p.status === 'completed' && p.best_score && p.best_score >= 70
  ).length;
  
  const overallPercentage = Math.round(
    ((lessonsCompleted + assessmentsPassed) / (totalLessons + totalAssessments)) * 100
  );
  
  return {
    lessons_completed: lessonsCompleted,
    total_lessons: totalLessons,
    assessments_passed: assessmentsPassed,
    total_assessments: totalAssessments,
    overall_percentage: overallPercentage,
    current_lesson_id: getCurrentLessonId(progressRecords),
    estimated_completion_date: estimateCompletionDate(progressRecords, overallPercentage)
  };
};

/**
 * Transform multiple progress records into learning analytics
 */
export const transformToLearningAnalytics = (
  studentId: string,
  courseId: string,
  progressRecords: StudentProgress[],
  assessmentAttempts: AssessmentAttempt[]
): LearningAnalytics => {
  const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.time_spent, 0);
  const lessonsCompleted = progressRecords.filter(p => p.lesson_id && p.status === 'completed').length;
  const assessmentsPassed = assessmentAttempts.filter(a => a.passed).length;
  const averageScore = assessmentAttempts.length > 0 ? 
    assessmentAttempts.reduce((sum, a) => sum + a.score, 0) / assessmentAttempts.length : 0;
  
  return {
    student_id: studentId,
    course_id: courseId,
    metrics: {
      total_time_spent: totalTimeSpent,
      lessons_completed: lessonsCompleted,
      assessments_passed: assessmentsPassed,
      average_score: Math.round(averageScore),
      engagement_score: calculateEngagementScore(progressRecords),
      progress_velocity: calculateProgressVelocity(progressRecords)
    },
    trends: calculateLearningTrends(progressRecords, assessmentAttempts),
    recommendations: generateRecommendations(progressRecords, assessmentAttempts),
    generated_at: new Date().toISOString()
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the current lesson ID from progress records
 */
const getCurrentLessonId = (progressRecords: StudentProgress[]): string | undefined => {
  const inProgressLesson = progressRecords.find(
    p => p.lesson_id && p.status === 'in_progress'
  );
  
  if (inProgressLesson) {
    return inProgressLesson.lesson_id!;
  }
  
  // Find the next lesson to start
  const completedLessons = progressRecords
    .filter(p => p.lesson_id && p.status === 'completed')
    .map(p => p.lesson_id!);
  
  const nextLesson = progressRecords.find(
    p => p.lesson_id && p.status === 'not_started' && !completedLessons.includes(p.lesson_id!)
  );
  
  return nextLesson?.lesson_id || undefined;
};

/**
 * Estimate completion date based on current progress
 */
const estimateCompletionDate = (
  progressRecords: StudentProgress[],
  overallPercentage: number
): string | undefined => {
  if (overallPercentage === 0) return undefined;
  
  const recentRecords = progressRecords
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);
  
  if (recentRecords.length < 2) return undefined;
  
  const averageTimePerItem = recentRecords.reduce((sum, p) => sum + p.time_spent, 0) / recentRecords.length;
  const remainingItems = Math.round((100 - overallPercentage) / 100 * progressRecords.length);
  const estimatedRemainingTime = remainingItems * averageTimePerItem;
  
  const estimatedDate = new Date();
  estimatedDate.setTime(estimatedDate.getTime() + estimatedRemainingTime * 1000);
  
  return estimatedDate.toISOString();
};

/**
 * Calculate engagement score based on progress patterns
 */
const calculateEngagementScore = (progressRecords: StudentProgress[]): number => {
  if (progressRecords.length === 0) return 0;
  
  const completedCount = progressRecords.filter(p => p.status === 'completed').length;
  const completionRate = completedCount / progressRecords.length;
  
  const averageTimeSpent = progressRecords.reduce((sum, p) => sum + p.time_spent, 0) / progressRecords.length;
  const timeEngagement = Math.min(averageTimeSpent / 1800, 1); // Normalize to 30 minutes
  
  const recentActivity = progressRecords.filter(p => {
    const lastAccessed = new Date(p.last_accessed);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastAccessed > weekAgo;
  }).length / progressRecords.length;
  
  return Math.round((completionRate * 0.4 + timeEngagement * 0.3 + recentActivity * 0.3) * 100);
};

/**
 * Calculate progress velocity (lessons per week)
 */
const calculateProgressVelocity = (progressRecords: StudentProgress[]): number => {
  const completedRecords = progressRecords
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
  
  if (completedRecords.length < 2) return 0;
  
  const firstCompletion = new Date(completedRecords[0].updated_at);
  const lastCompletion = new Date(completedRecords[completedRecords.length - 1].updated_at);
  const weeksDiff = (lastCompletion.getTime() - firstCompletion.getTime()) / (1000 * 60 * 60 * 24 * 7);
  
  return weeksDiff > 0 ? Math.round((completedRecords.length / weeksDiff) * 10) / 10 : 0;
};

/**
 * Calculate learning trends from historical data
 */
const calculateLearningTrends = (
  progressRecords: StudentProgress[],
  assessmentAttempts: AssessmentAttempt[]
): any[] => {
  // This is a simplified implementation - in practice, you'd want more sophisticated trend analysis
  return [
    {
      metric: 'completion_rate',
      trend_direction: 'increasing' as const,
      change_percentage: 15,
      time_period: 'last_month'
    },
    {
      metric: 'average_score',
      trend_direction: 'stable' as const,
      change_percentage: 2,
      time_period: 'last_month'
    }
  ];
};

/**
 * Generate recommendations based on progress and performance
 */
const generateRecommendations = (
  progressRecords: StudentProgress[],
  assessmentAttempts: AssessmentAttempt[]
): string[] => {
  const recommendations: string[] = [];
  
  const completionRate = progressRecords.filter(p => p.status === 'completed').length / progressRecords.length;
  if (completionRate < 0.5) {
    recommendations.push('Consider setting aside more regular study time to improve completion rate');
  }
  
  const averageScore = assessmentAttempts.length > 0 ? 
    assessmentAttempts.reduce((sum, a) => sum + a.score, 0) / assessmentAttempts.length : 0;
  if (averageScore < 70) {
    recommendations.push('Review lesson materials more thoroughly before taking assessments');
  }
  
  const recentActivity = progressRecords.filter(p => {
    const lastAccessed = new Date(p.last_accessed);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastAccessed > weekAgo;
  }).length;
  
  if (recentActivity === 0) {
    recommendations.push('Try to engage with learning materials more regularly for better retention');
  }
  
  return recommendations;
};