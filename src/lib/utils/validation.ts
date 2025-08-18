/**
 * Data Validation Utilities
 * 
 * This file contains validation functions for all data models
 * used throughout the personalized LMS application.
 */

import type {
  UserRole,
  DifficultyLevel,
  ContentType,
  ProgressStatus,
  QuestionType,
  LearningPace,
  LearningStyle,
  UserProfile,
  Course,
  Lesson,
  ContentBlock,
  Assessment,
  Question,
  AssessmentAttempt,
  PersonalizedRoadmap
} from '$lib/types/database.js';

// ============================================================================
// VALIDATION ERROR TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
}

// ============================================================================
// BASIC TYPE VALIDATORS
// ============================================================================

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidYouTubeVideoId = (videoId: string): boolean => {
  const youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
  return youtubeRegex.test(videoId);
};

export const isValidUserRole = (role: string): role is UserRole => {
  return ['student', 'instructor', 'admin'].includes(role);
};

export const isValidDifficultyLevel = (level: string): level is DifficultyLevel => {
  return ['beginner', 'intermediate', 'advanced'].includes(level);
};

export const isValidContentType = (type: string): type is ContentType => {
  return ['rich_text', 'image', 'video', 'file', 'youtube'].includes(type);
};

export const isValidProgressStatus = (status: string): status is ProgressStatus => {
  return ['not_started', 'in_progress', 'completed', 'blocked'].includes(status);
};

export const isValidQuestionType = (type: string): type is QuestionType => {
  return ['multiple_choice', 'true_false', 'short_answer', 'essay'].includes(type);
};

export const isValidLearningPace = (pace: string): pace is LearningPace => {
  return ['slow', 'medium', 'fast'].includes(pace);
};

export const isValidLearningStyle = (style: string): style is LearningStyle => {
  return ['visual', 'auditory', 'kinesthetic', 'mixed'].includes(style);
};

// ============================================================================
// CONTENT VALIDATORS
// ============================================================================

export const validateRichTextContent = (content: any): ValidationResult<any> => {
  const errors: ValidationError[] = [];

  if (!content.html || typeof content.html !== 'string') {
    errors.push({
      field: 'html',
      message: 'HTML content is required and must be a string',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!content.plain_text || typeof content.plain_text !== 'string') {
    errors.push({
      field: 'plain_text',
      message: 'Plain text content is required and must be a string',
      code: 'REQUIRED_FIELD'
    });
  }

  if (content.html && content.html.length > 50000) {
    errors.push({
      field: 'html',
      message: 'HTML content must be less than 50,000 characters',
      code: 'MAX_LENGTH_EXCEEDED'
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? content : undefined,
    errors
  };
};

export const validateImageContent = (content: any): ValidationResult<any> => {
  const errors: ValidationError[] = [];

  if (!content.url || typeof content.url !== 'string') {
    errors.push({
      field: 'url',
      message: 'Image URL is required and must be a string',
      code: 'REQUIRED_FIELD'
    });
  } else if (!isValidURL(content.url)) {
    errors.push({
      field: 'url',
      message: 'Image URL must be a valid URL',
      code: 'INVALID_FORMAT'
    });
  }

  if (!content.alt_text || typeof content.alt_text !== 'string') {
    errors.push({
      field: 'alt_text',
      message: 'Alt text is required for accessibility and must be a string',
      code: 'REQUIRED_FIELD'
    });
  } else if (content.alt_text.length < 5) {
    errors.push({
      field: 'alt_text',
      message: 'Alt text must be at least 5 characters long',
      code: 'MIN_LENGTH_NOT_MET'
    });
  }

  if (content.width && (typeof content.width !== 'number' || content.width <= 0)) {
    errors.push({
      field: 'width',
      message: 'Width must be a positive number',
      code: 'INVALID_VALUE'
    });
  }

  if (content.height && (typeof content.height !== 'number' || content.height <= 0)) {
    errors.push({
      field: 'height',
      message: 'Height must be a positive number',
      code: 'INVALID_VALUE'
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? content : undefined,
    errors
  };
};

export const validateYouTubeContent = (content: any): ValidationResult<any> => {
  const errors: ValidationError[] = [];

  if (!content.video_id || typeof content.video_id !== 'string') {
    errors.push({
      field: 'video_id',
      message: 'YouTube video ID is required and must be a string',
      code: 'REQUIRED_FIELD'
    });
  } else if (!isValidYouTubeVideoId(content.video_id)) {
    errors.push({
      field: 'video_id',
      message: 'Invalid YouTube video ID format',
      code: 'INVALID_FORMAT'
    });
  }

  if (!content.title || typeof content.title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Video title is required and must be a string',
      code: 'REQUIRED_FIELD'
    });
  }

  if (content.duration && (typeof content.duration !== 'number' || content.duration <= 0)) {
    errors.push({
      field: 'duration',
      message: 'Duration must be a positive number in seconds',
      code: 'INVALID_VALUE'
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? content : undefined,
    errors
  };
};

// ============================================================================
// MODEL VALIDATORS
// ============================================================================

export const validateUserProfile = (profile: Partial<UserProfile>): ValidationResult<UserProfile> => {
  const errors: ValidationError[] = [];

  if (!profile.email || !isValidEmail(profile.email)) {
    errors.push({
      field: 'email',
      message: 'Valid email address is required',
      code: 'INVALID_EMAIL'
    });
  }

  if (!profile.role || !isValidUserRole(profile.role)) {
    errors.push({
      field: 'role',
      message: 'Valid user role is required (student, instructor, admin)',
      code: 'INVALID_ROLE'
    });
  }

  if (profile.first_name && profile.first_name.length < 2) {
    errors.push({
      field: 'first_name',
      message: 'First name must be at least 2 characters long',
      code: 'MIN_LENGTH_NOT_MET'
    });
  }

  if (profile.last_name && profile.last_name.length < 2) {
    errors.push({
      field: 'last_name',
      message: 'Last name must be at least 2 characters long',
      code: 'MIN_LENGTH_NOT_MET'
    });
  }

  if (profile.avatar_url && !isValidURL(profile.avatar_url)) {
    errors.push({
      field: 'avatar_url',
      message: 'Avatar URL must be a valid URL',
      code: 'INVALID_URL'
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? profile as UserProfile : undefined,
    errors
  };
};

export const validateCourse = (course: Partial<Course>): ValidationResult<Course> => {
  const errors: ValidationError[] = [];

  if (!course.title || course.title.trim().length < 3) {
    errors.push({
      field: 'title',
      message: 'Course title is required and must be at least 3 characters long',
      code: 'REQUIRED_FIELD'
    });
  }

  if (course.title && course.title.length > 200) {
    errors.push({
      field: 'title',
      message: 'Course title must be less than 200 characters',
      code: 'MAX_LENGTH_EXCEEDED'
    });
  }

  if (!course.instructor_id || !isValidUUID(course.instructor_id)) {
    errors.push({
      field: 'instructor_id',
      message: 'Valid instructor ID is required',
      code: 'INVALID_UUID'
    });
  }

  if (!course.difficulty_level || !isValidDifficultyLevel(course.difficulty_level)) {
    errors.push({
      field: 'difficulty_level',
      message: 'Valid difficulty level is required (beginner, intermediate, advanced)',
      code: 'INVALID_DIFFICULTY'
    });
  }

  if (course.estimated_duration && (course.estimated_duration <= 0 || course.estimated_duration > 10080)) {
    errors.push({
      field: 'estimated_duration',
      message: 'Estimated duration must be between 1 and 10080 minutes (1 week)',
      code: 'INVALID_DURATION'
    });
  }

  if (course.tags && course.tags.length > 10) {
    errors.push({
      field: 'tags',
      message: 'Maximum of 10 tags allowed',
      code: 'MAX_ITEMS_EXCEEDED'
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? course as Course : undefined,
    errors
  };
};

export const validateLesson = (lesson: Partial<Lesson>): ValidationResult<Lesson> => {
  const errors: ValidationError[] = [];

  if (!lesson.title || lesson.title.trim().length < 3) {
    errors.push({
      field: 'title',
      message: 'Lesson title is required and must be at least 3 characters long',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!lesson.course_id || !isValidUUID(lesson.course_id)) {
    errors.push({
      field: 'course_id',
      message: 'Valid course ID is required',
      code: 'INVALID_UUID'
    });
  }

  if (lesson.order_index === undefined || lesson.order_index < 0) {
    errors.push({
      field: 'order_index',
      message: 'Order index is required and must be non-negative',
      code: 'INVALID_ORDER'
    });
  }

  if (lesson.estimated_duration && (lesson.estimated_duration <= 0 || lesson.estimated_duration > 480)) {
    errors.push({
      field: 'estimated_duration',
      message: 'Estimated duration must be between 1 and 480 minutes (8 hours)',
      code: 'INVALID_DURATION'
    });
  }

  if (lesson.prerequisites) {
    for (const prereq of lesson.prerequisites) {
      if (!isValidUUID(prereq)) {
        errors.push({
          field: 'prerequisites',
          message: 'All prerequisite IDs must be valid UUIDs',
          code: 'INVALID_UUID'
        });
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? lesson as Lesson : undefined,
    errors
  };
};

export const validateContentBlock = (block: Partial<ContentBlock>): ValidationResult<ContentBlock> => {
  const errors: ValidationError[] = [];

  if (!block.lesson_id || !isValidUUID(block.lesson_id)) {
    errors.push({
      field: 'lesson_id',
      message: 'Valid lesson ID is required',
      code: 'INVALID_UUID'
    });
  }

  if (!block.type || !isValidContentType(block.type)) {
    errors.push({
      field: 'type',
      message: 'Valid content type is required',
      code: 'INVALID_CONTENT_TYPE'
    });
  }

  if (block.order_index === undefined || block.order_index < 0) {
    errors.push({
      field: 'order_index',
      message: 'Order index is required and must be non-negative',
      code: 'INVALID_ORDER'
    });
  }

  if (!block.content) {
    errors.push({
      field: 'content',
      message: 'Content data is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    // Validate content based on type
    if (block.type === 'rich_text' && block.content.rich_text) {
      const contentValidation = validateRichTextContent(block.content.rich_text);
      if (!contentValidation.isValid) {
        errors.push(...contentValidation.errors.map(err => ({
          ...err,
          field: `content.rich_text.${err.field}`
        })));
      }
    } else if (block.type === 'image' && block.content.image) {
      const contentValidation = validateImageContent(block.content.image);
      if (!contentValidation.isValid) {
        errors.push(...contentValidation.errors.map(err => ({
          ...err,
          field: `content.image.${err.field}`
        })));
      }
    } else if (block.type === 'youtube' && block.content.youtube) {
      const contentValidation = validateYouTubeContent(block.content.youtube);
      if (!contentValidation.isValid) {
        errors.push(...contentValidation.errors.map(err => ({
          ...err,
          field: `content.youtube.${err.field}`
        })));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? block as ContentBlock : undefined,
    errors
  };
};

export const validateAssessment = (assessment: Partial<Assessment>): ValidationResult<Assessment> => {
  const errors: ValidationError[] = [];

  if (!assessment.title || assessment.title.trim().length < 3) {
    errors.push({
      field: 'title',
      message: 'Assessment title is required and must be at least 3 characters long',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!assessment.questions || assessment.questions.length === 0) {
    errors.push({
      field: 'questions',
      message: 'At least one question is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (assessment.questions.length > 100) {
    errors.push({
      field: 'questions',
      message: 'Maximum of 100 questions allowed',
      code: 'MAX_ITEMS_EXCEEDED'
    });
  }

  if (assessment.minimum_passing_score === undefined || 
      assessment.minimum_passing_score < 0 || 
      assessment.minimum_passing_score > 100) {
    errors.push({
      field: 'minimum_passing_score',
      message: 'Minimum passing score must be between 0 and 100',
      code: 'INVALID_PERCENTAGE'
    });
  }

  if (assessment.max_attempts && assessment.max_attempts <= 0) {
    errors.push({
      field: 'max_attempts',
      message: 'Maximum attempts must be a positive number',
      code: 'INVALID_VALUE'
    });
  }

  if (assessment.time_limit && assessment.time_limit <= 0) {
    errors.push({
      field: 'time_limit',
      message: 'Time limit must be a positive number in minutes',
      code: 'INVALID_VALUE'
    });
  }

  // Validate individual questions
  if (assessment.questions) {
    assessment.questions.forEach((question, index) => {
      const questionValidation = validateQuestion(question);
      if (!questionValidation.isValid) {
        errors.push(...questionValidation.errors.map(err => ({
          ...err,
          field: `questions[${index}].${err.field}`
        })));
      }
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? assessment as Assessment : undefined,
    errors
  };
};

export const validateQuestion = (question: Partial<Question>): ValidationResult<Question> => {
  const errors: ValidationError[] = [];

  if (!question.type || !isValidQuestionType(question.type)) {
    errors.push({
      field: 'type',
      message: 'Valid question type is required',
      code: 'INVALID_QUESTION_TYPE'
    });
  }

  if (!question.question_text || question.question_text.trim().length < 10) {
    errors.push({
      field: 'question_text',
      message: 'Question text is required and must be at least 10 characters long',
      code: 'REQUIRED_FIELD'
    });
  }

  if (question.type === 'multiple_choice') {
    if (!question.options || question.options.length < 2) {
      errors.push({
        field: 'options',
        message: 'Multiple choice questions must have at least 2 options',
        code: 'INSUFFICIENT_OPTIONS'
      });
    } else if (question.options.length > 6) {
      errors.push({
        field: 'options',
        message: 'Multiple choice questions can have at most 6 options',
        code: 'TOO_MANY_OPTIONS'
      });
    }
  }

  if (!question.correct_answer) {
    errors.push({
      field: 'correct_answer',
      message: 'Correct answer is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!question.explanation || question.explanation.trim().length < 10) {
    errors.push({
      field: 'explanation',
      message: 'Explanation is required and must be at least 10 characters long',
      code: 'REQUIRED_FIELD'
    });
  }

  if (question.difficulty_level === undefined || 
      question.difficulty_level < 1 || 
      question.difficulty_level > 5) {
    errors.push({
      field: 'difficulty_level',
      message: 'Difficulty level must be between 1 and 5',
      code: 'INVALID_DIFFICULTY'
    });
  }

  if (question.points === undefined || question.points <= 0) {
    errors.push({
      field: 'points',
      message: 'Points must be a positive number',
      code: 'INVALID_POINTS'
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? question as Question : undefined,
    errors
  };
};

// ============================================================================
// BATCH VALIDATION UTILITIES
// ============================================================================

export const validateBatch = <T>(
  items: Partial<T>[],
  validator: (item: Partial<T>) => ValidationResult<T>
): ValidationResult<T[]> => {
  const errors: ValidationError[] = [];
  const validItems: T[] = [];

  items.forEach((item, index) => {
    const result = validator(item);
    if (result.isValid && result.data) {
      validItems.push(result.data);
    } else {
      errors.push(...result.errors.map(err => ({
        ...err,
        field: `[${index}].${err.field}`
      })));
    }
  });

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? validItems : undefined,
    errors
  };
};

// ============================================================================
// SANITIZATION UTILITIES
// ============================================================================

export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

export const sanitizeHTML = (html: string): string => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

export const sanitizeUserInput = (input: any): any => {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeUserInput);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeUserInput(value);
    }
    return sanitized;
  }
  return input;
};