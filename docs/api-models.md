# API Data Models Documentation

This document provides comprehensive documentation for all data models used in the Personalized Learning Management System (LMS).

## Table of Contents

1. [User and Profile Models](#user-and-profile-models)
2. [Course and Lesson Models](#course-and-lesson-models)
3. [Content Models](#content-models)
4. [Assessment Models](#assessment-models)
5. [Progress and Analytics Models](#progress-and-analytics-models)
6. [AI and Personalization Models](#ai-and-personalization-models)
7. [Validation Rules](#validation-rules)
8. [Error Handling](#error-handling)
9. [Usage Examples](#usage-examples)

## User and Profile Models

### UserProfile

The core user profile model that extends Supabase authentication.

```typescript
interface UserProfile {
  id: string;                                    // UUID from Supabase Auth
  email: string;                                 // User's email address
  role: 'student' | 'instructor' | 'admin';      // User role
  first_name: string | null;                     // User's first name
  last_name: string | null;                      // User's last name
  avatar_url: string | null;                     // Profile picture URL
  learning_preferences: LearningPreferences | null;  // Learning preferences
  knowledge_profile: KnowledgeProfile | null;    // Knowledge assessment data
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}
```

**Validation Rules:**
- `email`: Must be valid email format
- `role`: Must be one of 'student', 'instructor', 'admin'
- `first_name`, `last_name`: Minimum 2 characters if provided
- `avatar_url`: Must be valid URL if provided

**Example:**
```typescript
const userProfile: UserProfile = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "student@example.com",
  role: "student",
  first_name: "John",
  last_name: "Doe",
  avatar_url: "https://example.com/avatar.jpg",
  learning_preferences: {
    preferred_pace: "medium",
    preferred_media_types: ["video", "text"],
    learning_style: "visual"
  },
  knowledge_profile: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
};
```

### LearningPreferences

Defines a user's learning preferences for personalization.

```typescript
interface LearningPreferences {
  preferred_pace: 'slow' | 'medium' | 'fast';     // Learning pace preference
  preferred_media_types: MediaType[];             // Preferred content types
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  daily_study_time?: number;                      // Minutes per day
  notification_preferences?: NotificationPreferences;
}
```

### KnowledgeProfile

Stores assessment results and knowledge mapping.

```typescript
interface KnowledgeProfile {
  subject_areas: SubjectKnowledge[];              // Knowledge by subject
  skill_levels: SkillLevel[];                     // Verified skill levels
  last_assessed: string;                          // ISO timestamp
  assessment_history: string[];                   // Assessment IDs
}
```

## Course and Lesson Models

### Course

Represents a complete learning course.

```typescript
interface Course {
  id: string;                                     // UUID
  title: string;                                  // Course title
  description: string | null;                     // Course description
  instructor_id: string;                          // Instructor's user ID
  final_assessment_id: string | null;             // Final assessment ID
  tags: string[];                                 // Course tags
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number | null;              // Minutes
  is_published: boolean;                          // Publication status
  enrollment_count?: number;                      // Number of enrolled students
  completion_rate?: number;                       // Percentage completion rate
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}
```

**Validation Rules:**
- `title`: Required, minimum 3 characters, maximum 200 characters
- `instructor_id`: Must be valid UUID
- `difficulty_level`: Must be 'beginner', 'intermediate', or 'advanced'
- `estimated_duration`: Must be between 1 and 10080 minutes (1 week)
- `tags`: Maximum 10 tags allowed

**Example:**
```typescript
const course: Course = {
  id: "course-123",
  title: "Introduction to Web Development",
  description: "Learn the basics of HTML, CSS, and JavaScript",
  instructor_id: "instructor-456",
  final_assessment_id: "assessment-789",
  tags: ["web", "html", "css", "javascript", "beginner"],
  difficulty_level: "beginner",
  estimated_duration: 1200, // 20 hours
  is_published: true,
  enrollment_count: 150,
  completion_rate: 85,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T00:00:00Z"
};
```

### Lesson ✅ IMPLEMENTED

Individual lesson within a course with comprehensive content management.

```typescript
interface Lesson {
  id: string;                                     // UUID
  course_id: string;                              // Parent course ID
  title: string;                                  // Lesson title
  description: string | null;                     // Lesson description
  order_index: number;                            // Order within course
  content_blocks: ContentBlock[];                 // Lesson content blocks
  learning_objectives: string[];                  // Learning objectives
  estimated_duration: number | null;              // Minutes
  assessment_id: string | null;                   // Associated assessment
  prerequisites: string[];                        // Required lesson IDs
  is_published: boolean;                          // Publication status
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}
```

**Validation Rules:**
- `title`: Required, minimum 3 characters
- `course_id`: Must be valid UUID
- `order_index`: Required, non-negative integer
- `estimated_duration`: Must be between 1 and 480 minutes (8 hours)
- `prerequisites`: All IDs must be valid UUIDs
- `content_blocks`: Each block must pass content-type specific validation

**Implementation Features:**
- ✅ Drag-and-drop content block reordering
- ✅ Real-time validation with error indicators
- ✅ Auto-save functionality for lesson progress
- ✅ Content block templates and management
- ✅ Learning objectives with dynamic add/remove

## Content Models

### ContentBlock

Individual content element within a lesson.

```typescript
interface ContentBlock {
  id: string;                                     // UUID
  lesson_id: string;                              // Parent lesson ID
  type: 'rich_text' | 'image' | 'video' | 'file' | 'youtube';
  content: ContentData;                           // Type-specific content
  order_index: number;                            // Order within lesson
  metadata: ContentMetadata;                      // Additional metadata
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}
```

### ContentData

Union type for different content types.

```typescript
type ContentData = {
  rich_text?: RichTextContent;
  image?: ImageContent;
  video?: VideoContent;
  file?: FileContent;
  youtube?: YouTubeContent;
};
```

### RichTextContent

Rich text content with HTML and plain text versions.

```typescript
interface RichTextContent {
  html: string;                                   // HTML content
  plain_text: string;                             // Plain text version
  word_count?: number;                            // Word count
  reading_level?: string;                         // Reading difficulty level
}
```

**Validation Rules:**
- `html`: Required, maximum 50,000 characters
- `plain_text`: Required, derived from HTML

### ImageContent

Image content with accessibility support.

```typescript
interface ImageContent {
  url: string;                                    // Image URL
  alt_text: string;                               // Required alt text
  caption?: string;                               // Optional caption
  width?: number;                                 // Image width
  height?: number;                                // Image height
  file_size?: number;                             // File size in bytes
}
```

**Validation Rules:**
- `url`: Required, must be valid URL
- `alt_text`: Required, minimum 5 characters for accessibility
- `width`, `height`: Must be positive numbers if provided

### YouTubeContent

YouTube video integration.

```typescript
interface YouTubeContent {
  video_id: string;                               // YouTube video ID
  title: string;                                  // Video title
  thumbnail_url: string;                          // Thumbnail URL
  duration: number;                               // Duration in seconds
  channel_name?: string;                          // Channel name
  description?: string;                           // Video description
}
```

**Validation Rules:**
- `video_id`: Must match YouTube video ID format (11 characters, alphanumeric + _ -)
- `title`: Required
- `duration`: Must be positive number

## Assessment Models

### Assessment

Assessment or quiz associated with lessons or courses.

```typescript
interface Assessment {
  id: string;                                     // UUID
  lesson_id: string | null;                       // Associated lesson
  course_id: string | null;                       // Associated course
  title: string;                                  // Assessment title
  description: string | null;                     // Assessment description
  questions: Question[];                          // Assessment questions
  ai_generated: boolean;                          // AI-generated flag
  source_content_ids: string[];                   // Source content IDs
  is_mandatory: boolean;                          // Mandatory completion
  minimum_passing_score: number;                  // Percentage (0-100)
  max_attempts: number | null;                    // Max attempts (null = unlimited)
  time_limit: number | null;                      // Time limit in minutes
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}
```

**Validation Rules:**
- `title`: Required, minimum 3 characters
- `questions`: Required, minimum 1 question, maximum 100 questions
- `minimum_passing_score`: Must be between 0 and 100
- `max_attempts`: Must be positive if provided
- `time_limit`: Must be positive if provided

### Question

Individual question within an assessment.

```typescript
interface Question {
  id: string;                                     // UUID
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question_text: string;                          // Question text
  options?: string[];                             // Multiple choice options
  correct_answer: string | string[];              // Correct answer(s)
  explanation: string;                            // Answer explanation
  difficulty_level: number;                       // 1-5 scale
  topics: string[];                               // Related topics
  points: number;                                 // Points awarded
}
```

**Validation Rules:**
- `question_text`: Required, minimum 10 characters
- `options`: Required for multiple choice, 2-6 options
- `correct_answer`: Required
- `explanation`: Required, minimum 10 characters
- `difficulty_level`: Must be 1-5
- `points`: Must be positive

### AssessmentAttempt

Student's attempt at an assessment.

```typescript
interface AssessmentAttempt {
  id: string;                                     // UUID
  assessment_id: string;                          // Assessment ID
  student_id: string;                             // Student ID
  attempt_number: number;                         // Attempt number
  answers: AssessmentAnswer[];                    // Student answers
  score: number;                                  // Score percentage
  points_earned: number;                          // Points earned
  total_points: number;                           // Total possible points
  passed: boolean;                                // Pass/fail status
  time_spent: number | null;                      // Time in seconds
  started_at: string;                            // ISO timestamp
  submitted_at: string;                          // ISO timestamp
  feedback: AssessmentFeedback | null;           // Detailed feedback
}
```

## Progress and Analytics Models

### StudentProgress

Tracks student progress through courses and lessons.

```typescript
interface StudentProgress {
  id: string;                                     // UUID
  student_id: string;                             // Student ID
  course_id: string;                              // Course ID
  lesson_id: string | null;                       // Lesson ID (if applicable)
  assessment_id: string | null;                   // Assessment ID (if applicable)
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  completion_percentage: number;                   // 0-100
  last_accessed: string;                          // ISO timestamp
  time_spent: number;                             // Seconds
  attempts_count: number;                         // Number of attempts
  best_score: number | null;                      // Best score percentage
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}
```

### LearningAnalytics

Comprehensive learning analytics for students.

```typescript
interface LearningAnalytics {
  student_id: string;                             // Student ID
  course_id: string;                              // Course ID
  metrics: AnalyticsMetrics;                      // Performance metrics
  trends: LearningTrend[];                        // Learning trends
  recommendations: string[];                      // Recommendations
  generated_at: string;                          // ISO timestamp
}
```

## AI and Personalization Models

### PersonalizedRoadmap

AI-generated personalized learning roadmap.

```typescript
interface PersonalizedRoadmap {
  id: string;                                     // UUID
  student_id: string;                             // Student ID
  generated_at: string;                          // ISO timestamp
  roadmap_data: RoadmapData;                     // Roadmap details
  ai_reasoning: string;                          // AI reasoning
  status: 'active' | 'completed' | 'paused';    // Roadmap status
  updated_at: string;                            // ISO timestamp
}
```

### RoadmapData

Detailed roadmap information.

```typescript
interface RoadmapData {
  learning_path: LearningPathItem[];              // Ordered learning path
  estimated_completion_time: number;              // Minutes
  difficulty_progression: DifficultyProgression; // Difficulty curve
  personalization_factors: PersonalizationFactors; // Personalization data
}
```

## Validation Rules

### General Validation Rules

1. **UUIDs**: All ID fields must be valid UUID format
2. **Timestamps**: All timestamp fields must be valid ISO 8601 format
3. **URLs**: All URL fields must be valid HTTP/HTTPS URLs
4. **Email**: Must follow standard email format
5. **Percentages**: Must be between 0 and 100
6. **Durations**: Must be positive numbers in specified units

### Content-Specific Rules

1. **Rich Text**: HTML content is sanitized to remove scripts and dangerous elements
2. **Images**: Alt text is required for accessibility compliance
3. **Videos**: Duration must be provided for progress tracking
4. **Files**: File type and size must be validated
5. **YouTube**: Video ID format must be validated

### Assessment Rules

1. **Questions**: Must have at least one question, maximum 100
2. **Multiple Choice**: Must have 2-6 options
3. **Scoring**: Points must be positive, passing score 0-100%
4. **Time Limits**: Must be reasonable (1 minute to 8 hours)

## Error Handling

### Error Types

The system uses typed errors for better error handling:

```typescript
// Database errors
class DatabaseError extends Error {
  code: string;
  details?: any;
  timestamp: string;
  context?: string;
}

// Validation errors
class ValidationError extends Error {
  field: string;
  code: string;
  timestamp: string;
}

// Authentication errors
class AuthenticationError extends Error {
  code: string;
  timestamp: string;
}
```

### Common Error Codes

- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Duplicate record
- `VALIDATION_FAILED`: Data validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INVALID_FORMAT`: Invalid data format

## Usage Examples

### Creating a Course

```typescript
import { CourseService, validateCourse } from '$lib/services';

const courseData = {
  title: "Advanced JavaScript",
  description: "Deep dive into JavaScript concepts",
  instructor_id: "instructor-123",
  difficulty_level: "intermediate" as const,
  estimated_duration: 2400, // 40 hours
  tags: ["javascript", "programming", "advanced"],
  is_published: false
};

// Validate before creating
const validation = validateCourse(courseData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  return;
}

// Create course
try {
  const course = await CourseService.create(courseData);
  console.log('Course created:', course);
} catch (error) {
  console.error('Failed to create course:', error);
}
```

### Tracking Student Progress

```typescript
import { StudentProgressService } from '$lib/services';

// Update progress when student completes a lesson
const progressUpdate = {
  student_id: "student-123",
  course_id: "course-456",
  lesson_id: "lesson-789",
  status: "completed" as const,
  completion_percentage: 100,
  time_spent: 1800, // 30 minutes
  last_accessed: new Date().toISOString()
};

try {
  const progress = await StudentProgressService.upsert(progressUpdate);
  console.log('Progress updated:', progress);
} catch (error) {
  console.error('Failed to update progress:', error);
}
```

### Handling Assessment Attempts

```typescript
import { AssessmentAttemptService, AssessmentService } from '$lib/services';

// Create assessment attempt
const attemptData = {
  assessment_id: "assessment-123",
  student_id: "student-456",
  attempt_number: 1,
  answers: [
    {
      question_id: "q1",
      student_answer: "Option A",
      is_correct: true,
      points_earned: 10
    }
  ],
  score: 85,
  points_earned: 85,
  total_points: 100,
  passed: true,
  time_spent: 600, // 10 minutes
  started_at: "2024-01-01T10:00:00Z",
  submitted_at: "2024-01-01T10:10:00Z"
};

try {
  const attempt = await AssessmentAttemptService.create(attemptData);
  console.log('Assessment attempt recorded:', attempt);
} catch (error) {
  console.error('Failed to record attempt:', error);
}
```

### Error Handling Example

```typescript
import { handleDatabaseError, DatabaseError } from '$lib/utils/errors';

try {
  const course = await CourseService.getById("invalid-id");
} catch (error) {
  const dbError = handleDatabaseError(error, 'Getting course by ID');
  
  if (dbError.code === 'NOT_FOUND') {
    console.log('Course not found');
  } else if (dbError.code === 'UNAUTHORIZED') {
    console.log('Access denied');
  } else {
    console.error('Unexpected error:', dbError.message);
  }
}
```

This documentation provides a comprehensive reference for all data models, validation rules, and usage patterns in the Personalized LMS system. The models are designed to be type-safe, well-validated, and support the complex requirements of personalized learning with AI integration.
##
 Course Management API Endpoints

The Course Management System provides comprehensive REST API endpoints for all course-related operations.

### Course CRUD Operations

#### GET /api/courses
Retrieve a list of courses with optional filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `search`: Search term for title/description
- `difficulty`: Filter by difficulty level
- `instructor_id`: Filter by instructor
- `published`: Filter by publication status

**Response:**
```typescript
{
  courses: Course[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

#### POST /api/courses
Create a new course.

**Request Body:**
```typescript
{
  title: string,
  description?: string,
  difficulty_level: DifficultyLevel,
  estimated_duration?: number,
  tags?: string[],
  is_published?: boolean
}
```

**Response:**
```typescript
{
  success: boolean,
  course: Course
}
```

#### GET /api/courses/[id]
Retrieve a specific course by ID.

**Response:**
```typescript
{
  course: CourseWithDetails,
  enrollment_status?: EnrollmentStatus
}
```

#### PUT /api/courses/[id]
Update an existing course.

**Request Body:** Partial course data
**Response:** Updated course object

#### DELETE /api/courses/[id]
Delete a course (instructor/admin only).

**Response:**
```typescript
{
  success: boolean,
  message: string
}
```

### Enrollment Management

#### POST /api/courses/[id]/enroll
Enroll the current user in a course.

**Response:**
```typescript
{
  success: boolean,
  enrollment: Enrollment,
  message: string
}
```

#### DELETE /api/courses/[id]/enroll
Unenroll the current user from a course.

**Response:**
```typescript
{
  success: boolean,
  message: string
}
```

#### GET /api/courses/[id]/students
Get enrolled students for a course (instructor only).

**Response:**
```typescript
{
  students: Array<{
    student: UserProfile,
    enrollment: Enrollment,
    progress: StudentProgress[]
  }>
}
```

### Course Analytics

#### GET /api/courses/[id]/analytics
Get comprehensive analytics for a course (instructor only).

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d, 1y)
- `metrics`: Specific metrics to include

**Response:**
```typescript
{
  enrollment_metrics: {
    total_enrollments: number,
    active_enrollments: number,
    completion_rate: number,
    enrollment_trend: Array<{date: string, count: number}>
  },
  engagement_metrics: {
    average_session_duration: number,
    content_completion_rate: number,
    assessment_participation_rate: number,
    return_rate: number
  },
  performance_metrics: {
    average_assessment_score: number,
    pass_rate: number,
    time_to_completion: number,
    student_satisfaction: number
  }
}
```

### Search and Discovery

#### GET /api/courses/search
Advanced course search with multiple criteria.

**Query Parameters:**
- `q`: Search query
- `tags`: Comma-separated tags
- `difficulty`: Difficulty level filter
- `duration_min`: Minimum duration filter
- `duration_max`: Maximum duration filter
- `sort`: Sort order (newest, oldest, popular, rating)

**Response:**
```typescript
{
  courses: Course[],
  facets: {
    difficulties: Array<{level: string, count: number}>,
    tags: Array<{tag: string, count: number}>,
    instructors: Array<{instructor: UserProfile, count: number}>
  },
  total: number
}
```

## Error Handling for Course APIs

### Common Error Responses

**400 Bad Request:**
```typescript
{
  error: "Validation failed",
  details: ValidationError[]
}
```

**401 Unauthorized:**
```typescript
{
  error: "Authentication required",
  message: "Please log in to access this resource"
}
```

**403 Forbidden:**
```typescript
{
  error: "Insufficient permissions",
  message: "You don't have permission to perform this action",
  required_role: "instructor"
}
```

**404 Not Found:**
```typescript
{
  error: "Course not found",
  message: "The requested course does not exist or is not accessible"
}
```

**409 Conflict:**
```typescript
{
  error: "Already enrolled",
  message: "You are already enrolled in this course"
}
```

### Rate Limiting

Course API endpoints implement rate limiting:
- **General endpoints**: 100 requests per minute
- **Search endpoints**: 50 requests per minute
- **Analytics endpoints**: 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

This comprehensive API documentation provides all the information needed to integrate with the Course Management System programmatically.