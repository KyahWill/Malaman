/**
 * Core type definitions for the Personalized LMS
 * 
 * This file re-exports all types from the comprehensive database types
 * and maintains backward compatibility with existing code.
 */

// Export all comprehensive database types
export * from './database.js';

// Export validation types (avoiding duplicate ValidationError)
export type {
  ValidationResult,
  ValidationError as DataValidationError
} from '../utils/validation.js';

// Export error types (avoiding duplicate ValidationError)
export type {
  ErrorDetails,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  AIServiceError
} from '../utils/errors.js';

// Export validation functions
export {
  isValidEmail,
  isValidUUID,
  isValidURL,
  isValidYouTubeVideoId,
  isValidUserRole,
  isValidDifficultyLevel,
  isValidContentType,
  isValidProgressStatus,
  isValidQuestionType,
  isValidLearningPace,
  isValidLearningStyle,
  validateUserProfile,
  validateCourse,
  validateLesson,
  validateContentBlock,
  validateAssessment,
  validateQuestion,
  validateBatch,
  sanitizeString,
  sanitizeHTML,
  sanitizeUserInput
} from '../utils/validation.js';

// Export error handling functions
export {
  handleDatabaseError,
  handleAuthError,
  handleAIError,
  handleValidationError,
  errorLogger,
  retryWithBackoff,
  CircuitBreaker,
  safeAsync,
  safeSync,
  createErrorResponse,
  getErrorStatusCode
} from '../utils/errors.js';