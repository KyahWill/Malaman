/**
 * Central export for all services
 */

export { AuthService } from './auth.js';

// Database services
export {
  UserProfileService,
  CourseService,
  LessonService,
  ContentBlockService,
  AssessmentService,
  AssessmentAttemptService,
  StudentProgressService,
  EnrollmentService
} from './database.js';

// Content services
export { ContentSanitizationService } from './contentSanitization.js';

// Media services
export { MediaStorageService } from './mediaStorage.js';

// AI services
export { AIService, getAIService } from './ai/index.js';
export type * from './ai/types.js';

// Progression services
export { ProgressionControlService } from './progressionControl.js';
export { ProgressionClient, ProgressionUtils } from './progressionClient.js';
export type * from './progressionControl.js';

// Roadmap services
export { RoadmapService, getRoadmapService } from './roadmapService.js';
export type * from './roadmapService.js';