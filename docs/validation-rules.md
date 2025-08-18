# Validation Rules Documentation

This document outlines all validation rules, transformation utilities, and error handling patterns used in the Personalized Learning Management System.

## Table of Contents

1. [Validation Overview](#validation-overview)
2. [Basic Type Validators](#basic-type-validators)
3. [Model Validation Rules](#model-validation-rules)
4. [Content Validation](#content-validation)
5. [Assessment Validation](#assessment-validation)
6. [Transformation Utilities](#transformation-utilities)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Usage Examples](#usage-examples)

## Validation Overview

The validation system provides comprehensive data validation for all models in the LMS. It follows these principles:

- **Type Safety**: All validators return typed results
- **Detailed Errors**: Specific error codes and messages for each validation failure
- **Composability**: Validators can be combined and reused
- **Accessibility**: Special validation for accessibility requirements
- **Security**: Input sanitization and XSS prevention

### ValidationResult Interface

All validators return a consistent result structure:

```typescript
interface ValidationResult<T> {
  isValid: boolean;        // Whether validation passed
  data?: T;               // Validated and transformed data
  errors: ValidationError[]; // Array of validation errors
}

interface ValidationError {
  field: string;          // Field that failed validation
  message: string;        // Human-readable error message
  code: string;          // Machine-readable error code
}
```

## Basic Type Validators

### Email Validation

```typescript
isValidEmail(email: string): boolean
```

**Rules:**
- Must contain @ symbol
- Must have domain with at least one dot
- No spaces allowed
- Standard email regex pattern

**Example:**
```typescript
isValidEmail("user@example.com") // true
isValidEmail("invalid-email")    // false
```

### UUID Validation

```typescript
isValidUUID(uuid: string): boolean
```

**Rules:**
- Must be 36 characters long
- Format: 8-4-4-4-12 hexadecimal digits
- Version 1-5 UUIDs supported

**Example:**
```typescript
isValidUUID("123e4567-e89b-12d3-a456-426614174000") // true
isValidUUID("invalid-uuid")                          // false
```

### URL Validation

```typescript
isValidURL(url: string): boolean
```

**Rules:**
- Must be valid HTTP or HTTPS URL
- Uses native URL constructor for validation
- Supports international domain names

**Example:**
```typescript
isValidURL("https://example.com")     // true
isValidURL("not-a-url")              // false
```

### YouTube Video ID Validation

```typescript
isValidYouTubeVideoId(videoId: string): boolean
```

**Rules:**
- Must be exactly 11 characters
- Alphanumeric characters, hyphens, and underscores only
- Matches YouTube's video ID format

**Example:**
```typescript
isValidYouTubeVideoId("dQw4w9WgXcQ")  // true
isValidYouTubeVideoId("invalid")      // false
```

## Model Validation Rules

### User Profile Validation

```typescript
validateUserProfile(profile: Partial<UserProfile>): ValidationResult<UserProfile>
```

**Validation Rules:**

| Field | Rules | Error Codes |
|-------|-------|-------------|
| `email` | Required, valid email format | `INVALID_EMAIL` |
| `role` | Required, must be 'student', 'instructor', or 'admin' | `INVALID_ROLE` |
| `first_name` | Optional, minimum 2 characters if provided | `MIN_LENGTH_NOT_MET` |
| `last_name` | Optional, minimum 2 characters if provided | `MIN_LENGTH_NOT_MET` |
| `avatar_url` | Optional, must be valid URL if provided | `INVALID_URL` |

**Example:**
```typescript
const validation = validateUserProfile({
  email: "student@example.com",
  role: "student",
  first_name: "John",
  last_name: "Doe"
});

if (validation.isValid) {
  console.log("Valid profile:", validation.data);
} else {
  console.log("Validation errors:", validation.errors);
}
```

### Course Validation

```typescript
validateCourse(course: Partial<Course>): ValidationResult<Course>
```

**Validation Rules:**

| Field | Rules | Error Codes |
|-------|-------|-------------|
| `title` | Required, 3-200 characters | `REQUIRED_FIELD`, `MAX_LENGTH_EXCEEDED` |
| `instructor_id` | Required, valid UUID | `INVALID_UUID` |
| `difficulty_level` | Required, 'beginner', 'intermediate', or 'advanced' | `INVALID_DIFFICULTY` |
| `estimated_duration` | Optional, 1-10080 minutes (1 week max) | `INVALID_DURATION` |
| `tags` | Optional, maximum 10 tags | `MAX_ITEMS_EXCEEDED` |

**Example:**
```typescript
const courseValidation = validateCourse({
  title: "Introduction to Programming",
  instructor_id: "123e4567-e89b-12d3-a456-426614174000",
  difficulty_level: "beginner",
  estimated_duration: 1200,
  tags: ["programming", "beginner", "fundamentals"]
});
```

### Lesson Validation

```typescript
validateLesson(lesson: Partial<Lesson>): ValidationResult<Lesson>
```

**Validation Rules:**

| Field | Rules | Error Codes |
|-------|-------|-------------|
| `title` | Required, minimum 3 characters | `REQUIRED_FIELD` |
| `course_id` | Required, valid UUID | `INVALID_UUID` |
| `order_index` | Required, non-negative integer | `INVALID_ORDER` |
| `estimated_duration` | Optional, 1-480 minutes (8 hours max) | `INVALID_DURATION` |
| `prerequisites` | Optional, all must be valid UUIDs | `INVALID_UUID` |

## Content Validation

### Rich Text Content Validation

```typescript
validateRichTextContent(content: any): ValidationResult<RichTextContent>
```

**Validation Rules:**

| Field | Rules | Error Codes |
|-------|-------|-------------|
| `html` | Required, maximum 50,000 characters | `REQUIRED_FIELD`, `MAX_LENGTH_EXCEEDED` |
| `plain_text` | Required, derived from HTML | `REQUIRED_FIELD` |

**Security Features:**
- HTML sanitization removes dangerous elements
- Script tags are stripped
- Event handlers are removed
- Only safe HTML tags allowed

**Example:**
```typescript
const richTextValidation = validateRichTextContent({
  html: "<p>This is <strong>bold</strong> text.</p>",
  plain_text: "This is bold text."
});
```

### Image Content Validation

```typescript
validateImageContent(content: any): ValidationResult<ImageContent>
```

**Validation Rules:**

| Field | Rules | Error Codes |
|-------|-------|-------------|
| `url` | Required, valid URL | `REQUIRED_FIELD`, `INVALID_FORMAT` |
| `alt_text` | Required, minimum 5 characters (accessibility) | `REQUIRED_FIELD`, `MIN_LENGTH_NOT_MET` |
| `width` | Optional, positive number | `INVALID_VALUE` |
| `height` | Optional, positive number | `INVALID_VALUE` |

**Accessibility Requirements:**
- Alt text is mandatory for all images
- Minimum 5 characters to ensure meaningful descriptions
- Descriptive alt text guidelines enforced

**Example:**
```typescript
const imageValidation = validateImageContent({
  url: "https://example.com/image.jpg",
  alt_text: "A student reading a book in the library",
  width: 800,
  height: 600
});
```

### YouTube Content Validation

```typescript
validateYouTubeContent(content: any): ValidationResult<YouTubeContent>
```

**Validation Rules:**

| Field | Rules | Error Codes |
|-------|-------|-------------|
| `video_id` | Required, valid YouTube video ID format | `REQUIRED_FIELD`, `INVALID_FORMAT` |
| `title` | Required, video title | `REQUIRED_FIELD` |
| `duration` | Optional, positive number in seconds | `INVALID_VALUE` |

**Example:**
```typescript
const youtubeValidation = validateYouTubeContent({
  video_id: "dQw4w9WgXcQ",
  title: "Never Gonna Give You Up",
  duration: 212
});
```

## Assessment Validation

### Assessment Validation

```typescript
validateAssessment(assessment: Partial<Assessment>): ValidationResult<Assessment>
```

**Validation Rules:**

| Field | Rules | Error Codes |
|-------|-------|-------------|
| `title` | Required, minimum 3 characters | `REQUIRED_FIELD` |
| `questions` | Required, 1-100 questions | `REQUIRED_FIELD`, `MAX_ITEMS_EXCEEDED` |
| `minimum_passing_score` | Required, 0-100 percentage | `INVALID_PERCENTAGE` |
| `max_attempts` | Optional, positive number | `INVALID_VALUE` |
| `time_limit` | Optional, positive number in minutes | `INVALID_VALUE` |

**Question Validation:**
Each question in the assessment is validated individually with specific rules for each question type.

### Question Validation

```typescript
validateQuestion(question: Partial<Question>): ValidationResult<Question>
```

**Validation Rules:**

| Field | Rules | Error Codes |
|-------|-------|-------------|
| `type` | Required, valid question type | `INVALID_QUESTION_TYPE` |
| `question_text` | Required, minimum 10 characters | `REQUIRED_FIELD` |
| `options` | Required for multiple choice, 2-6 options | `INSUFFICIENT_OPTIONS`, `TOO_MANY_OPTIONS` |
| `correct_answer` | Required | `REQUIRED_FIELD` |
| `explanation` | Required, minimum 10 characters | `REQUIRED_FIELD` |
| `difficulty_level` | Required, 1-5 scale | `INVALID_DIFFICULTY` |
| `points` | Required, positive number | `INVALID_POINTS` |

**Question Type Specific Rules:**

#### Multiple Choice
- Must have 2-6 options
- Correct answer must match one of the options
- All options must be unique

#### True/False
- Correct answer must be "true" or "false"
- No options array needed

#### Short Answer
- Correct answer should be concise
- Case-insensitive matching supported

#### Essay
- Requires manual grading
- Rubric guidelines recommended

## Transformation Utilities

### Data Sanitization

```typescript
sanitizeString(input: string): string
sanitizeHTML(html: string): string
sanitizeUserInput(input: any): any
```

**Sanitization Features:**
- Removes extra whitespace
- Strips dangerous HTML elements
- Removes JavaScript code
- Cleans event handlers
- Recursive sanitization for objects and arrays

**Example:**
```typescript
const cleanHtml = sanitizeHTML('<p>Safe content</p><script>alert("xss")</script>');
// Result: '<p>Safe content</p>'

const cleanInput = sanitizeUserInput({
  title: "  My Course  ",
  description: "<p>Course description</p><script>bad()</script>"
});
// Result: { title: "My Course", description: "<p>Course description</p>" }
```

### Batch Validation

```typescript
validateBatch<T>(
  items: Partial<T>[],
  validator: (item: Partial<T>) => ValidationResult<T>
): ValidationResult<T[]>
```

**Features:**
- Validates multiple items at once
- Collects all validation errors
- Returns valid items and error details
- Useful for bulk operations

**Example:**
```typescript
const courses = [
  { title: "Course 1", instructor_id: "valid-uuid" },
  { title: "", instructor_id: "invalid" }, // Invalid
  { title: "Course 3", instructor_id: "another-valid-uuid" }
];

const batchResult = validateBatch(courses, validateCourse);
console.log(`${batchResult.data?.length} valid courses`);
console.log(`${batchResult.errors.length} validation errors`);
```

## Error Handling Patterns

### Error Types

The system uses specific error types for different scenarios:

```typescript
// Database operations
class DatabaseError extends Error {
  code: string;
  details?: any;
  timestamp: string;
  context?: string;
}

// Data validation
class ValidationError extends Error {
  field: string;
  code: string;
  timestamp: string;
}

// Authentication
class AuthenticationError extends Error {
  code: string;
  timestamp: string;
}

// Authorization
class AuthorizationError extends Error {
  code: string;
  requiredRole?: string;
  userRole?: string;
}
```

### Error Codes

**Validation Error Codes:**
- `REQUIRED_FIELD`: Required field is missing
- `INVALID_FORMAT`: Data format is incorrect
- `MIN_LENGTH_NOT_MET`: String too short
- `MAX_LENGTH_EXCEEDED`: String too long
- `INVALID_VALUE`: Value outside acceptable range
- `DUPLICATE_ENTRY`: Duplicate data detected

**Database Error Codes:**
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Access denied
- `FOREIGN_KEY_VIOLATION`: Referenced record doesn't exist
- `UNIQUE_CONSTRAINT_VIOLATION`: Duplicate unique value

### Error Recovery

```typescript
// Retry with exponential backoff
await retryWithBackoff(async () => {
  return await DatabaseService.create(data);
}, 3, 1000);

// Circuit breaker for external services
const circuitBreaker = new CircuitBreaker(5, 60000);
await circuitBreaker.execute(async () => {
  return await ExternalAPI.call();
});
```

## Usage Examples

### Complete Validation Workflow

```typescript
import { 
  validateCourse, 
  validateLesson, 
  validateContentBlock,
  CourseService 
} from '$lib/services';

async function createCourseWithValidation(courseData: any) {
  // 1. Validate course data
  const courseValidation = validateCourse(courseData);
  if (!courseValidation.isValid) {
    throw new ValidationError(
      'Course validation failed',
      'course',
      'VALIDATION_FAILED'
    );
  }

  try {
    // 2. Create course
    const course = await CourseService.create(courseValidation.data!);
    
    // 3. Validate and create lessons
    for (const lessonData of courseData.lessons || []) {
      const lessonValidation = validateLesson({
        ...lessonData,
        course_id: course.id
      });
      
      if (lessonValidation.isValid) {
        await LessonService.create(lessonValidation.data!);
      } else {
        console.warn('Skipping invalid lesson:', lessonValidation.errors);
      }
    }
    
    return course;
  } catch (error) {
    throw handleDatabaseError(error, 'Creating course with lessons');
  }
}
```

### Validation with Custom Rules

```typescript
function validateCustomCourse(course: any): ValidationResult<Course> {
  // First run standard validation
  const standardValidation = validateCourse(course);
  
  // Add custom business rules
  const customErrors: ValidationError[] = [];
  
  // Custom rule: Advanced courses must have prerequisites
  if (course.difficulty_level === 'advanced' && 
      (!course.prerequisites || course.prerequisites.length === 0)) {
    customErrors.push({
      field: 'prerequisites',
      message: 'Advanced courses must have prerequisites',
      code: 'PREREQUISITES_REQUIRED'
    });
  }
  
  // Custom rule: Published courses must have description
  if (course.is_published && !course.description) {
    customErrors.push({
      field: 'description',
      message: 'Published courses must have a description',
      code: 'DESCRIPTION_REQUIRED'
    });
  }
  
  // Combine validation results
  const allErrors = [...standardValidation.errors, ...customErrors];
  
  return {
    isValid: allErrors.length === 0,
    data: allErrors.length === 0 ? course : undefined,
    errors: allErrors
  };
}
```

### Error Handling in API Routes

```typescript
// src/routes/api/courses/+server.ts
import { createErrorResponse, getErrorStatusCode } from '$lib/utils/errors';

export async function POST({ request }) {
  try {
    const courseData = await request.json();
    
    // Validate input
    const validation = validateCourse(courseData);
    if (!validation.isValid) {
      return createErrorResponse(
        new ValidationError('Invalid course data', 'course', 'VALIDATION_FAILED'),
        400
      );
    }
    
    // Create course
    const course = await CourseService.create(validation.data!);
    
    return new Response(JSON.stringify(course), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    const statusCode = getErrorStatusCode(error as Error);
    return createErrorResponse(error as Error, statusCode);
  }
}
```

### Client-Side Validation

```typescript
// Svelte component with validation
<script lang="ts">
  import { validateCourse, type ValidationError } from '$lib/utils/validation';
  
  let courseData = {
    title: '',
    description: '',
    difficulty_level: 'beginner'
  };
  
  let validationErrors: ValidationError[] = [];
  
  function handleSubmit() {
    const validation = validateCourse(courseData);
    
    if (validation.isValid) {
      // Submit valid data
      submitCourse(validation.data!);
    } else {
      // Show validation errors
      validationErrors = validation.errors;
    }
  }
  
  // Real-time validation
  $: {
    const validation = validateCourse(courseData);
    validationErrors = validation.errors;
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input 
    bind:value={courseData.title}
    class:error={validationErrors.some(e => e.field === 'title')}
  />
  
  {#each validationErrors as error}
    {#if error.field === 'title'}
      <span class="error-message">{error.message}</span>
    {/if}
  {/each}
</form>
```

This comprehensive validation system ensures data integrity, security, and accessibility throughout the Personalized LMS while providing clear error messages and recovery mechanisms.