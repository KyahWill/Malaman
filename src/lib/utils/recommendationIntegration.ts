/**
 * Integration utilities for recommendation system
 * 
 * Provides easy integration points for existing components
 */

import { getInteractionTracker, trackingUtils } from '$lib/services/interactionTracker';
import { goto } from '$app/navigation';

/**
 * Enhanced navigation that tracks content interactions
 */
export class RecommendationAwareNavigation {
  /**
   * Navigate to lesson with tracking
   */
  static async goToLesson(lessonId: string, fromRecommendation?: string) {
    const tracker = getInteractionTracker();
    
    // Track the navigation
    tracker.trackContentStart(lessonId, 'lesson', {
      source: fromRecommendation ? 'recommendation' : 'navigation',
      recommendationId: fromRecommendation,
      navigatedAt: new Date().toISOString()
    });

    // Navigate to lesson
    await goto(`/lessons/${lessonId}`);
  }

  /**
   * Navigate to course with tracking
   */
  static async goToCourse(courseId: string, fromRecommendation?: string) {
    const tracker = getInteractionTracker();
    
    // Track the navigation
    tracker.trackContentView(courseId, 'course', {
      source: fromRecommendation ? 'recommendation' : 'navigation',
      recommendationId: fromRecommendation,
      navigatedAt: new Date().toISOString()
    });

    // Navigate to course
    await goto(`/courses/${courseId}`);
  }

  /**
   * Navigate to assessment with tracking
   */
  static async goToAssessment(assessmentId: string, fromRecommendation?: string) {
    const tracker = getInteractionTracker();
    
    // Track the navigation
    tracker.trackContentStart(assessmentId, 'assessment', {
      source: fromRecommendation ? 'recommendation' : 'navigation',
      recommendationId: fromRecommendation,
      navigatedAt: new Date().toISOString()
    });

    // Navigate to assessment
    await goto(`/assessments/${assessmentId}`);
  }
}

/**
 * Lesson completion handler with recommendation tracking
 */
export async function handleLessonCompletion(lessonId: string, completionData: {
  timeSpent: number;
  contentBlocksViewed: string[];
  assessmentPassed?: boolean;
  assessmentScore?: number;
}) {
  // Track lesson completion
  trackingUtils.trackLessonComplete(lessonId, {
    timeSpent: completionData.timeSpent,
    contentBlocksViewed: completionData.contentBlocksViewed,
    assessmentPassed: completionData.assessmentPassed,
    assessmentScore: completionData.assessmentScore,
    completedAt: new Date().toISOString()
  });

  // Update progress in database
  try {
    await fetch('/api/progression/update-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId,
        status: 'completed',
        completionPercentage: 100,
        timeSpent: completionData.timeSpent,
        metadata: {
          contentBlocksViewed: completionData.contentBlocksViewed,
          assessmentPassed: completionData.assessmentPassed,
          assessmentScore: completionData.assessmentScore
        }
      })
    });
  } catch (error) {
    console.error('Failed to update lesson progress:', error);
  }
}

/**
 * Assessment completion handler with recommendation tracking
 */
export async function handleAssessmentCompletion(assessmentId: string, attemptData: {
  score: number;
  passed: boolean;
  timeSpent: number;
  answers: any[];
}) {
  // Track assessment completion
  trackingUtils.trackAssessmentComplete(assessmentId, attemptData.score, attemptData.passed);

  // The assessment submission will be handled by the existing assessment system
  // This just adds the recommendation tracking layer
}

/**
 * Course enrollment handler with recommendation tracking
 */
export async function handleCourseEnrollment(courseId: string, fromRecommendation?: string) {
  // Track course enrollment
  trackingUtils.trackCourseEnroll(courseId);

  // Add recommendation context if available
  if (fromRecommendation) {
    const tracker = getInteractionTracker();
    tracker.trackContentView(courseId, 'course', {
      source: 'recommendation',
      recommendationId: fromRecommendation,
      action: 'enroll',
      enrolledAt: new Date().toISOString()
    });
  }

  // Proceed with normal enrollment
  try {
    const response = await fetch(`/api/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Enrollment failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to enroll in course:', error);
    throw error;
  }
}

/**
 * Content skip handler with recommendation tracking
 */
export function handleContentSkip(contentId: string, contentType: 'lesson' | 'course' | 'assessment', reason?: string) {
  trackingUtils.trackContentSkip(contentId, contentType, reason);
}

/**
 * Recommendation click handler
 */
export async function handleRecommendationClick(recommendation: {
  id: string;
  contentId: string;
  contentType: 'lesson' | 'course' | 'assessment';
}) {
  try {
    // Track the click
    await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'click',
        recommendationId: recommendation.id,
        contentId: recommendation.contentId
      })
    });

    // Navigate with tracking
    switch (recommendation.contentType) {
      case 'lesson':
        await RecommendationAwareNavigation.goToLesson(recommendation.contentId, recommendation.id);
        break;
      case 'course':
        await RecommendationAwareNavigation.goToCourse(recommendation.contentId, recommendation.id);
        break;
      case 'assessment':
        await RecommendationAwareNavigation.goToAssessment(recommendation.contentId, recommendation.id);
        break;
    }
  } catch (error) {
    console.error('Failed to handle recommendation click:', error);
    // Still navigate even if tracking fails
    const url = getContentUrl(recommendation);
    if (url) {
      await goto(url);
    }
  }
}

/**
 * Get URL for content type
 */
function getContentUrl(recommendation: { contentId: string; contentType: string }): string {
  switch (recommendation.contentType) {
    case 'lesson':
      return `/lessons/${recommendation.contentId}`;
    case 'course':
      return `/courses/${recommendation.contentId}`;
    case 'assessment':
      return `/assessments/${recommendation.contentId}`;
    default:
      return '#';
  }
}

/**
 * Svelte store for recommendation context
 */
import { writable } from 'svelte/store';

interface RecommendationContext {
  currentRecommendationId?: string;
  source?: 'recommendation' | 'navigation' | 'search';
  metadata?: Record<string, any>;
}

export const recommendationContext = writable<RecommendationContext>({});

/**
 * Set recommendation context for tracking
 */
export function setRecommendationContext(context: RecommendationContext) {
  recommendationContext.set(context);
}

/**
 * Clear recommendation context
 */
export function clearRecommendationContext() {
  recommendationContext.set({});
}

/**
 * Get current recommendation context
 */
export function getCurrentRecommendationContext(): Promise<RecommendationContext> {
  return new Promise((resolve) => {
    const unsubscribe = recommendationContext.subscribe((context) => {
      unsubscribe();
      resolve(context);
    });
  });
}