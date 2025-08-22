/**
 * Client-side service for progression control
 */

import type { 
  ContentAccessResult, 
  ProgressUpdate, 
  UnlockedContent 
} from './progressionControl.js';
import type { StudentProgress } from '$lib/types/database.js';

export class ProgressionClient {
  /**
   * Check if content is accessible
   */
  static async checkAccess(
    contentId: string, 
    contentType: 'lesson' | 'course' | 'assessment'
  ): Promise<ContentAccessResult> {
    const response = await fetch('/api/progression/check-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contentId,
        contentType
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check content access');
    }

    return response.json();
  }

  /**
   * Update progress and get unlocked content
   */
  static async updateProgress(progressUpdate: Omit<ProgressUpdate, 'student_id'>): Promise<{
    success: boolean;
    unlockedContent: UnlockedContent;
  }> {
    const response = await fetch('/api/progression/update-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(progressUpdate)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update progress');
    }

    return response.json();
  }

  /**
   * Get comprehensive course progress overview
   */
  static async getCourseProgressOverview(courseId: string) {
    const response = await fetch(`/api/progression/course-overview/${courseId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get course progress overview');
    }

    return response.json();
  }

  /**
   * Block student progress (instructor/admin only)
   */
  static async blockProgress(
    studentId: string, 
    assessmentId: string, 
    reason: string
  ): Promise<void> {
    const response = await fetch('/api/progression/block-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId,
        assessmentId,
        reason
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to block progress');
    }
  }

  /**
   * Unblock student progress (instructor/admin only)
   */
  static async unblockProgress(
    studentId: string, 
    contentId: string, 
    contentType: 'lesson' | 'course'
  ): Promise<void> {
    const response = await fetch('/api/progression/unblock-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId,
        contentId,
        contentType
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unblock progress');
    }
  }

  /**
   * Get blocked content for a student
   */
  static async getBlockedContent(studentId: string): Promise<StudentProgress[]> {
    const response = await fetch(`/api/progression/blocked-content/${studentId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get blocked content');
    }

    return response.json();
  }
}

/**
 * Utility functions for progression control
 */
export class ProgressionUtils {
  /**
   * Check if content is locked based on access result
   */
  static isContentLocked(accessResult: ContentAccessResult): boolean {
    return !accessResult.canAccess;
  }

  /**
   * Get user-friendly lock reason
   */
  static getLockReason(accessResult: ContentAccessResult): string {
    if (accessResult.canAccess) return '';

    if (accessResult.reason) {
      switch (accessResult.reason) {
        case 'Prerequisites not met':
          return `Complete ${accessResult.blockedBy?.title || 'prerequisite content'} first`;
        case 'Not enrolled in course':
          return 'You must enroll in this course to access this content';
        case 'Must complete lesson content first':
          return 'Complete the lesson content before taking the assessment';
        case 'Must complete all course lessons first':
          return 'Complete all course lessons before taking the final assessment';
        default:
          return accessResult.reason;
      }
    }

    return 'Content is not accessible';
  }

  /**
   * Get progress status color for UI
   */
  static getProgressStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'blocked':
        return 'text-red-600';
      case 'not_started':
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Get progress status icon
   */
  static getProgressStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '⏳';
      case 'blocked':
        return '🚫';
      case 'not_started':
      default:
        return '○';
    }
  }

  /**
   * Calculate overall course progress percentage
   */
  static calculateCourseProgress(lessons: any[]): number {
    if (lessons.length === 0) return 0;

    const completedLessons = lessons.filter(lesson => 
      lesson.progress?.status === 'completed'
    ).length;

    return Math.round((completedLessons / lessons.length) * 100);
  }

  /**
   * Check if all prerequisites are met
   */
  static arePrerequisitesMet(accessResult: ContentAccessResult): boolean {
    if (!accessResult.prerequisites) return true;
    return accessResult.prerequisites.every(prereq => prereq.completed);
  }

  /**
   * Get next available content for a student
   */
  static getNextAvailableContent(courseOverview: any): {
    type: 'lesson' | 'assessment' | null;
    id: string | null;
    title: string | null;
  } {
    // Find first incomplete lesson
    for (const lessonData of courseOverview.lessons) {
      if (lessonData.canAccess && (!lessonData.progress || lessonData.progress.status !== 'completed')) {
        return {
          type: 'lesson',
          id: lessonData.lesson.id,
          title: lessonData.lesson.title
        };
      }

      // Check lesson assessment
      if (lessonData.assessment && lessonData.assessment.canAccess && !lessonData.assessment.passed) {
        return {
          type: 'assessment',
          id: lessonData.assessment.id,
          title: `${lessonData.lesson.title} Assessment`
        };
      }
    }

    // Check final assessment
    if (courseOverview.finalAssessment && courseOverview.finalAssessment.canAccess && !courseOverview.finalAssessment.passed) {
      return {
        type: 'assessment',
        id: courseOverview.finalAssessment.id,
        title: 'Final Assessment'
      };
    }

    return {
      type: null,
      id: null,
      title: null
    };
  }
}