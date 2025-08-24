/**
 * Content Interaction Tracking Service
 * 
 * Automatically tracks student interactions with content for recommendation engine
 */

export interface InteractionEvent {
  contentId: string;
  contentType: 'lesson' | 'course' | 'assessment';
  interactionType: 'view' | 'start' | 'complete' | 'pause' | 'skip';
  duration?: number;
  metadata?: Record<string, any>;
}

export class InteractionTracker {
  private sessionStartTime: number | null = null;
  private currentContent: { id: string; type: string } | null = null;
  private interactionQueue: InteractionEvent[] = [];
  private flushInterval: number | null = null;

  constructor() {
    // Flush interactions every 30 seconds
    this.flushInterval = window.setInterval(() => {
      this.flushInteractions();
    }, 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushInteractions();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPause();
      } else {
        this.trackResume();
      }
    });
  }

  /**
   * Track when a student starts viewing content
   */
  trackContentStart(contentId: string, contentType: 'lesson' | 'course' | 'assessment', metadata?: Record<string, any>) {
    // End previous session if exists
    if (this.currentContent) {
      this.trackContentEnd();
    }

    this.currentContent = { id: contentId, type: contentType };
    this.sessionStartTime = Date.now();

    this.queueInteraction({
      contentId,
      contentType,
      interactionType: 'start',
      metadata
    });
  }

  /**
   * Track when a student completes content
   */
  trackContentComplete(contentId: string, contentType: 'lesson' | 'course' | 'assessment', metadata?: Record<string, any>) {
    const duration = this.calculateDuration();
    
    this.queueInteraction({
      contentId,
      contentType,
      interactionType: 'complete',
      duration,
      metadata
    });

    this.endSession();
  }

  /**
   * Track when a student views content (without starting)
   */
  trackContentView(contentId: string, contentType: 'lesson' | 'course' | 'assessment', metadata?: Record<string, any>) {
    this.queueInteraction({
      contentId,
      contentType,
      interactionType: 'view',
      metadata
    });
  }

  /**
   * Track when a student skips content
   */
  trackContentSkip(contentId: string, contentType: 'lesson' | 'course' | 'assessment', metadata?: Record<string, any>) {
    const duration = this.calculateDuration();
    
    this.queueInteraction({
      contentId,
      contentType,
      interactionType: 'skip',
      duration,
      metadata
    });

    this.endSession();
  }

  /**
   * Track when a student pauses (page becomes hidden)
   */
  private trackPause() {
    if (!this.currentContent) return;

    const duration = this.calculateDuration();
    
    this.queueInteraction({
      contentId: this.currentContent.id,
      contentType: this.currentContent.type as any,
      interactionType: 'pause',
      duration
    });
  }

  /**
   * Track when a student resumes (page becomes visible)
   */
  private trackResume() {
    if (!this.currentContent) return;

    // Reset session start time
    this.sessionStartTime = Date.now();

    this.queueInteraction({
      contentId: this.currentContent.id,
      contentType: this.currentContent.type as any,
      interactionType: 'start'
    });
  }

  /**
   * Track when content session ends
   */
  private trackContentEnd() {
    if (!this.currentContent) return;

    const duration = this.calculateDuration();
    
    this.queueInteraction({
      contentId: this.currentContent.id,
      contentType: this.currentContent.type as any,
      interactionType: 'pause',
      duration
    });

    this.endSession();
  }

  /**
   * Calculate session duration
   */
  private calculateDuration(): number {
    if (!this.sessionStartTime) return 0;
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }

  /**
   * End current session
   */
  private endSession() {
    this.currentContent = null;
    this.sessionStartTime = null;
  }

  /**
   * Queue interaction for batch sending
   */
  private queueInteraction(interaction: InteractionEvent) {
    this.interactionQueue.push(interaction);

    // Flush immediately for important interactions
    if (interaction.interactionType === 'complete' || interaction.interactionType === 'skip') {
      this.flushInteractions();
    }
  }

  /**
   * Send queued interactions to server
   */
  private async flushInteractions() {
    if (this.interactionQueue.length === 0) return;

    const interactions = [...this.interactionQueue];
    this.interactionQueue = [];

    try {
      await fetch('/api/recommendations/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactions })
      });
    } catch (error) {
      console.error('Failed to send interaction data:', error);
      // Re-queue failed interactions
      this.interactionQueue.unshift(...interactions);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushInteractions();
  }
}

// Global instance
let globalTracker: InteractionTracker | null = null;

/**
 * Get or create global interaction tracker
 */
export function getInteractionTracker(): InteractionTracker {
  if (typeof window === 'undefined') {
    // Return mock tracker for SSR
    return {
      trackContentStart: () => {},
      trackContentComplete: () => {},
      trackContentView: () => {},
      trackContentSkip: () => {},
      destroy: () => {}
    } as any;
  }

  if (!globalTracker) {
    globalTracker = new InteractionTracker();
  }

  return globalTracker;
}

/**
 * Svelte action for automatic content tracking
 */
export function trackContent(node: HTMLElement, params: { contentId: string; contentType: 'lesson' | 'course' | 'assessment'; metadata?: Record<string, any> }) {
  const tracker = getInteractionTracker();
  let hasStarted = false;

  // Track view when element comes into viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasStarted) {
        tracker.trackContentView(params.contentId, params.contentType, params.metadata);
        hasStarted = true;
      }
    });
  }, { threshold: 0.5 });

  observer.observe(node);

  // Track start on click or focus
  const handleStart = () => {
    if (!hasStarted) {
      tracker.trackContentStart(params.contentId, params.contentType, params.metadata);
      hasStarted = true;
    }
  };

  node.addEventListener('click', handleStart);
  node.addEventListener('focus', handleStart);

  return {
    update(newParams: typeof params) {
      params = newParams;
    },
    destroy() {
      observer.disconnect();
      node.removeEventListener('click', handleStart);
      node.removeEventListener('focus', handleStart);
    }
  };
}

/**
 * Utility functions for manual tracking
 */
export const trackingUtils = {
  /**
   * Track lesson completion
   */
  trackLessonComplete(lessonId: string, metadata?: Record<string, any>) {
    getInteractionTracker().trackContentComplete(lessonId, 'lesson', metadata);
  },

  /**
   * Track assessment completion
   */
  trackAssessmentComplete(assessmentId: string, score: number, passed: boolean) {
    getInteractionTracker().trackContentComplete(assessmentId, 'assessment', {
      score,
      passed,
      completedAt: new Date().toISOString()
    });
  },

  /**
   * Track course enrollment
   */
  trackCourseEnroll(courseId: string) {
    getInteractionTracker().trackContentStart(courseId, 'course', {
      action: 'enroll',
      enrolledAt: new Date().toISOString()
    });
  },

  /**
   * Track content skip
   */
  trackContentSkip(contentId: string, contentType: 'lesson' | 'course' | 'assessment', reason?: string) {
    getInteractionTracker().trackContentSkip(contentId, contentType, {
      reason,
      skippedAt: new Date().toISOString()
    });
  }
};