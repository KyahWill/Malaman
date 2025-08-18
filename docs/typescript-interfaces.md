# TypeScript Interface Documentation

This document provides comprehensive documentation for all TypeScript interfaces used in the Personalized Learning Management System, including usage examples and best practices.

## Table of Contents

1. [Interface Overview](#interface-overview)
2. [Core User Interfaces](#core-user-interfaces)
3. [Course and Content Interfaces](#course-and-content-interfaces)
4. [Assessment Interfaces](#assessment-interfaces)
5. [Progress and Analytics Interfaces](#progress-and-analytics-interfaces)
6. [AI and Personalization Interfaces](#ai-and-personalization-interfaces)
7. [Utility and Helper Interfaces](#utility-and-helper-interfaces)
8. [Usage Patterns](#usage-patterns)
9. [Type Guards and Utilities](#type-guards-and-utilities)

## Interface Overview

The TypeScript interfaces in this system are designed with the following principles:

- **Strict Typing**: All properties are explicitly typed
- **Null Safety**: Optional properties are clearly marked
- **Extensibility**: Interfaces can be extended for specific use cases
- **Consistency**: Common patterns are reused across interfaces
- **Documentation**: All interfaces include comprehensive JSDoc comments

### Import Patterns

```typescript
// Import specific interfaces
import type { UserProfile, Course, Lesson } from '$lib/types';

// Import all database types
import type * as DB from '$lib/types/database';

// Import validation types
import type { ValidationResult, ValidationError } from '$lib/utils/validation';
```

## Core User Interfaces

### UserProfile

The main user profile interface that extends Supabase authentication.

```typescript
interface UserProfile {
  id: string;                                    // UUID from Supabase Auth
  email: string;                                 // User's email address
  role: UserRole;                                // User role enum
  first_name: string | null;                     // Optional first name
  last_name: string | null;                      // Optional last name
  avatar_url: string | null;                     // Optional profile picture
  learning_preferences: LearningPreferences | null;  // Learning settings
  knowledge_profile: KnowledgeProfile | null;    // Assessment results
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}
```

**Usage Example:**
```typescript
// Creating a new user profile
const newProfile: Partial<UserProfile> = {
  email: "student@example.com",
  role: "student",
  first_name: "John",
  last_name: "Doe"
};

// Type-safe profile update
function updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  // TypeScript ensures only valid UserProfile properties can be updated
  return UserProfileService.update(id, updates);
}

// Accessing profile properties with null safety
function getDisplayName(profile: UserProfile): string {
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  return profile.email;
}
```

### UserRole

Enum type for user roles with strict typing.

```typescript
type UserRole = 'student' | 'instructor' | 'admin';
```

**Usage Example:**
```typescript
// Type-safe role checking
function hasInstructorAccess(user: UserProfile): boolean {
  return user.role === 'instructor' || user.role === 'admin';
}

// Role-based component rendering
function getRoleSpecificComponent(role: UserRole) {
  switch (role) {
    case 'student':
      return StudentDashboard;
    case 'instructor':
      return InstructorDashboard;
    case 'admin':
      return AdminDashboard;
    default:
      // TypeScript ensures this is unreachable
      const _exhaustive: never = role;
      throw new Error(`Unhandled role: ${_exhaustive}`);
  }
}
```

### LearningPreferences

Defines user learning preferences for personalization.

```typescript
interface LearningPreferences {
  preferred_pace: LearningPace;                   // Learning speed preference
  preferred_media_types: MediaType[];             // Preferred content types
  learning_style: LearningStyle;                  // Learning style preference
  daily_study_time?: number;                      // Optional daily minutes
  notification_preferences?: NotificationPreferences; // Optional notifications
}

type LearningPace = 'slow' | 'medium' | 'fast';
type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
type MediaType = 'image' | 'video' | 'audio' | 'text' | 'interactive';
```

**Usage Example:**
```typescript
// Default learning preferences
const defaultPreferences: LearningPreferences = {
  preferred_pace: 'medium',
  preferred_media_types: ['text', 'video'],
  learning_style: 'mixed'
};

// Type-safe preference updates
function updateLearningPreferences(
  profile: UserProfile,
  newPreferences: Partial<LearningPreferences>
): UserProfile {
  return {
    ...profile,
    learning_preferences: {
      ...profile.learning_preferences,
      ...newPreferences
    },
    updated_at: new Date().toISOString()
  };
}
```

### KnowledgeProfile

Stores assessment results and knowledge mapping.

```typescript
interface KnowledgeProfile {
  subject_areas: SubjectKnowledge[];              // Knowledge by subject
  skill_levels: SkillLevel[];                     // Verified skills
  last_assessed: string;                          // Last assessment date
  assessment_history: string[];                   // Assessment IDs
}

interface SubjectKnowledge {
  subject: string;                                // Subject name
  proficiency_level: number;                      // 1-10 scale
  topics: TopicKnowledge[];                       // Detailed topic knowledge
  last_updated: string;                          // Last update timestamp
}

interface TopicKnowledge {
  topic: string;                                  // Topic name
  confidence_level: number;                       // 1-10 confidence scale
  mastery_indicators: string[];                   // Evidence of mastery
}
```

**Usage Example:**
```typescript
// Finding knowledge gaps
function findKnowledgeGaps(profile: KnowledgeProfile, requiredTopics: string[]): string[] {
  const knownTopics = profile.subject_areas
    .flatMap(subject => subject.topics)
    .filter(topic => topic.confidence_level >= 7)
    .map(topic => topic.topic);
  
  return requiredTopics.filter(topic => !knownTopics.includes(topic));
}

// Updating knowledge after assessment
function updateKnowledgeProfile(
  profile: KnowledgeProfile,
  assessmentResults: AssessmentAttempt
): KnowledgeProfile {
  return {
    ...profile,
    assessment_history: [...profile.assessment_history, assessmentResults.id],
    last_assessed: assessmentResults.submitted_at
  };
}
```

## Course and Content Interfaces

### Course

Main course interface with comprehensive metadata.

```typescript
interface Course {
  id: string;                                     // UUID
  title: string;                                  // Course title
  description: string | null;                     // Optional description
  instructor_id: string;                          // Instructor UUID
  final_assessment_id: string | null;             // Optional final assessment
  tags: string[];                                 // Course tags
  difficulty_level: DifficultyLevel;              // Difficulty enum
  estimated_duration: number | null;              // Minutes
  is_published: boolean;                          // Publication status
  enrollment_count?: number;                      // Optional enrollment count
  completion_rate?: number;                       // Optional completion rate
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
```

**Usage Example:**
```typescript
// Course creation with type safety
async function createCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
  const validation = validateCourse(courseData);
  if (!validation.isValid) {
    throw new ValidationError('Invalid course data');
  }
  
  return await CourseService.create(validation.data!);
}

// Type-safe course filtering
function filterCoursesByDifficulty(
  courses: Course[],
  difficulty: DifficultyLevel
): Course[] {
  return courses.filter(course => course.difficulty_level === difficulty);
}

// Course with computed properties
interface CourseWithStats extends Course {
  averageRating: number;
  totalStudents: number;
  isPopular: boolean;
}

function enrichCourseWithStats(course: Course): CourseWithStats {
  return {
    ...course,
    averageRating: 4.5, // Computed from reviews
    totalStudents: course.enrollment_count || 0,
    isPopular: (course.enrollment_count || 0) > 100
  };
}
```

### CourseWithDetails

Extended course interface with related data.

```typescript
interface CourseWithDetails extends Course {
  instructor: UserProfile;                        // Instructor details
  lessons: Lesson[];                              // Course lessons
  final_assessment: Assessment | null;            // Final assessment details
  enrollment_status?: EnrollmentStatus;           // Student enrollment info
}

interface EnrollmentStatus {
  is_enrolled: boolean;                           // Enrollment status
  enrollment_date?: string;                       // Enrollment timestamp
  completion_status: ProgressStatus;              // Progress status
  progress_percentage: number;                    // Completion percentage
}
```

**Usage Example:**
```typescript
// Loading course with all related data
async function loadCourseDetails(courseId: string, studentId?: string): Promise<CourseWithDetails | null> {
  const course = await CourseService.getWithDetails(courseId, studentId);
  
  if (!course) {
    return null;
  }
  
  // Type-safe access to nested properties
  const instructorName = `${course.instructor.first_name} ${course.instructor.last_name}`;
  const lessonCount = course.lessons.length;
  const hasEnrolled = course.enrollment_status?.is_enrolled ?? false;
  
  return course;
}
```

### Lesson

Individual lesson within a course.

```typescript
interface Lesson {
  id: string;                                     // UUID
  course_id: string;                              // Parent course UUID
  title: string;                                  // Lesson title
  description: string | null;                     // Optional description
  order_index: number;                            // Order within course
  content_blocks: ContentBlock[];                 // Lesson content
  learning_objectives: string[];                  // Learning goals
  estimated_duration: number | null;              // Minutes
  assessment_id: string | null;                   // Associated assessment
  prerequisites: string[];                        // Required lesson UUIDs
  is_published: boolean;                          // Publication status
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}
```

**Usage Example:**
```typescript
// Lesson ordering and prerequisites
function canAccessLesson(lesson: Lesson, completedLessons: string[]): boolean {
  return lesson.prerequisites.every(prereq => completedLessons.includes(prereq));
}

// Type-safe lesson creation
interface CreateLessonData {
  title: string;
  description?: string;
  course_id: string;
  order_index: number;
  learning_objectives: string[];
  estimated_duration?: number;
}

async function createLesson(data: CreateLessonData): Promise<Lesson> {
  const lessonData: Partial<Lesson> = {
    ...data,
    content_blocks: [],
    prerequisites: [],
    is_published: false
  };
  
  return await LessonService.create(lessonData);
}
```

### ContentBlock

Individual content element within a lesson.

```typescript
interface ContentBlock {
  id: string;                                     // UUID
  lesson_id: string;                              // Parent lesson UUID
  type: ContentType;                              // Content type enum
  content: ContentData;                           // Type-specific content
  order_index: number;                            // Order within lesson
  metadata: ContentMetadata;                      // Additional metadata
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}

type ContentType = 'rich_text' | 'image' | 'video' | 'file' | 'youtube';
```

**Usage Example:**
```typescript
// Type-safe content block creation
function createRichTextBlock(
  lessonId: string,
  html: string,
  orderIndex: number
): Partial<ContentBlock> {
  return {
    lesson_id: lessonId,
    type: 'rich_text',
    content: {
      rich_text: {
        html,
        plain_text: stripHtml(html)
      }
    },
    order_index: orderIndex,
    metadata: {
      estimated_read_time: calculateReadTime(html)
    }
  };
}

// Content type discrimination
function renderContentBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'rich_text':
      return block.content.rich_text?.html || '';
    case 'image':
      return `<img src="${block.content.image?.url}" alt="${block.content.image?.alt_text}">`;
    case 'youtube':
      return `<iframe src="https://youtube.com/embed/${block.content.youtube?.video_id}"></iframe>`;
    default:
      const _exhaustive: never = block.type;
      throw new Error(`Unhandled content type: ${_exhaustive}`);
  }
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

interface RichTextContent {
  html: string;                                   // HTML content
  plain_text: string;                             // Plain text version
  word_count?: number;                            // Word count
  reading_level?: string;                         // Reading difficulty
}

interface ImageContent {
  url: string;                                    // Image URL
  alt_text: string;                               // Accessibility text
  caption?: string;                               // Optional caption
  width?: number;                                 // Image width
  height?: number;                                // Image height
  file_size?: number;                             // File size in bytes
}

interface YouTubeContent {
  video_id: string;                               // YouTube video ID
  title: string;                                  // Video title
  thumbnail_url: string;                          // Thumbnail URL
  duration: number;                               // Duration in seconds
  channel_name?: string;                          // Channel name
  description?: string;                           // Video description
}
```

**Usage Example:**
```typescript
// Type-safe content creation
function createImageContent(
  url: string,
  altText: string,
  options?: Partial<ImageContent>
): ImageContent {
  return {
    url,
    alt_text: altText,
    ...options
  };
}

// Content validation
function validateContentData(type: ContentType, content: ContentData): boolean {
  switch (type) {
    case 'rich_text':
      return !!content.rich_text?.html && !!content.rich_text?.plain_text;
    case 'image':
      return !!content.image?.url && !!content.image?.alt_text;
    case 'youtube':
      return !!content.youtube?.video_id && !!content.youtube?.title;
    default:
      return false;
  }
}
```

## Assessment Interfaces

### Assessment

Main assessment interface for quizzes and tests.

```typescript
interface Assessment {
  id: string;                                     // UUID
  lesson_id: string | null;                       // Associated lesson
  course_id: string | null;                       // Associated course
  title: string;                                  // Assessment title
  description: string | null;                     // Optional description
  questions: Question[];                          // Assessment questions
  ai_generated: boolean;                          // AI generation flag
  source_content_ids: string[];                   // Source content references
  is_mandatory: boolean;                          // Mandatory completion
  minimum_passing_score: number;                  // Percentage (0-100)
  max_attempts: number | null;                    // Max attempts (null = unlimited)
  time_limit: number | null;                      // Time limit in minutes
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}
```

**Usage Example:**
```typescript
// Assessment creation with validation
interface CreateAssessmentData {
  title: string;
  lesson_id?: string;
  course_id?: string;
  questions: Partial<Question>[];
  minimum_passing_score?: number;
  time_limit?: number;
}

async function createAssessment(data: CreateAssessmentData): Promise<Assessment> {
  const assessmentData: Partial<Assessment> = {
    ...data,
    ai_generated: false,
    source_content_ids: [],
    is_mandatory: true,
    minimum_passing_score: data.minimum_passing_score || 70,
    max_attempts: null
  };
  
  const validation = validateAssessment(assessmentData);
  if (!validation.isValid) {
    throw new ValidationError('Invalid assessment data');
  }
  
  return await AssessmentService.create(validation.data!);
}

// Assessment difficulty calculation
function calculateAssessmentDifficulty(assessment: Assessment): number {
  const avgDifficulty = assessment.questions.reduce(
    (sum, q) => sum + q.difficulty_level, 0
  ) / assessment.questions.length;
  
  return Math.round(avgDifficulty * 10) / 10;
}
```

### Question

Individual question within an assessment.

```typescript
interface Question {
  id: string;                                     // UUID
  type: QuestionType;                             // Question type enum
  question_text: string;                          // Question text
  options?: string[];                             // Multiple choice options
  correct_answer: string | string[];              // Correct answer(s)
  explanation: string;                            // Answer explanation
  difficulty_level: number;                       // 1-5 scale
  topics: string[];                               // Related topics
  points: number;                                 // Points awarded
}

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
```

**Usage Example:**
```typescript
// Type-safe question creation
function createMultipleChoiceQuestion(
  questionText: string,
  options: string[],
  correctIndex: number,
  explanation: string
): Partial<Question> {
  return {
    type: 'multiple_choice',
    question_text: questionText,
    options,
    correct_answer: options[correctIndex],
    explanation,
    difficulty_level: 3,
    topics: [],
    points: 10
  };
}

// Question type discrimination
function validateAnswer(question: Question, studentAnswer: string | string[]): boolean {
  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
    case 'short_answer':
      return question.correct_answer === studentAnswer;
    case 'essay':
      // Essays require manual grading
      return false;
    default:
      const _exhaustive: never = question.type;
      throw new Error(`Unhandled question type: ${_exhaustive}`);
  }
}
```

### AssessmentAttempt

Student's attempt at an assessment.

```typescript
interface AssessmentAttempt {
  id: string;                                     // UUID
  assessment_id: string;                          // Assessment UUID
  student_id: string;                             // Student UUID
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

interface AssessmentAnswer {
  question_id: string;                            // Question UUID
  student_answer: string | string[];              // Student's answer
  is_correct: boolean;                            // Correctness flag
  points_earned: number;                          // Points for this answer
  feedback?: string;                              // Question-specific feedback
}
```

**Usage Example:**
```typescript
// Assessment attempt creation
async function submitAssessment(
  assessmentId: string,
  studentId: string,
  answers: Map<string, string | string[]>
): Promise<AssessmentAttempt> {
  const assessment = await AssessmentService.getById(assessmentId);
  if (!assessment) {
    throw new Error('Assessment not found');
  }
  
  const assessmentAnswers: AssessmentAnswer[] = assessment.questions.map(question => {
    const studentAnswer = answers.get(question.id) || '';
    const isCorrect = validateAnswer(question, studentAnswer);
    
    return {
      question_id: question.id,
      student_answer: studentAnswer,
      is_correct: isCorrect,
      points_earned: isCorrect ? question.points : 0
    };
  });
  
  const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
  const pointsEarned = assessmentAnswers.reduce((sum, a) => sum + a.points_earned, 0);
  const score = Math.round((pointsEarned / totalPoints) * 100);
  
  const attemptNumber = await AssessmentAttemptService.getNextAttemptNumber(
    studentId,
    assessmentId
  );
  
  const attempt: Partial<AssessmentAttempt> = {
    assessment_id: assessmentId,
    student_id: studentId,
    attempt_number: attemptNumber,
    answers: assessmentAnswers,
    score,
    points_earned: pointsEarned,
    total_points: totalPoints,
    passed: score >= assessment.minimum_passing_score,
    started_at: new Date().toISOString(),
    submitted_at: new Date().toISOString()
  };
  
  return await AssessmentAttemptService.create(attempt);
}
```

## Progress and Analytics Interfaces

### StudentProgress

Tracks student progress through courses and lessons.

```typescript
interface StudentProgress {
  id: string;                                     // UUID
  student_id: string;                             // Student UUID
  course_id: string;                              // Course UUID
  lesson_id: string | null;                       // Lesson UUID (optional)
  assessment_id: string | null;                   // Assessment UUID (optional)
  status: ProgressStatus;                         // Progress status enum
  completion_percentage: number;                   // 0-100 percentage
  last_accessed: string;                          // ISO timestamp
  time_spent: number;                             // Seconds
  attempts_count: number;                         // Number of attempts
  best_score: number | null;                      // Best score percentage
  created_at: string;                            // ISO timestamp
  updated_at: string;                            // ISO timestamp
}

type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
```

**Usage Example:**
```typescript
// Progress tracking
async function updateLessonProgress(
  studentId: string,
  lessonId: string,
  timeSpent: number
): Promise<StudentProgress> {
  const lesson = await LessonService.getById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }
  
  const progressData: Partial<StudentProgress> = {
    student_id: studentId,
    course_id: lesson.course_id,
    lesson_id: lessonId,
    status: 'in_progress',
    completion_percentage: 50, // Could be calculated based on content viewed
    time_spent: timeSpent,
    last_accessed: new Date().toISOString()
  };
  
  return await StudentProgressService.upsert(progressData);
}

// Progress analysis
function analyzeStudentProgress(progressRecords: StudentProgress[]): ProgressAnalysis {
  const completed = progressRecords.filter(p => p.status === 'completed').length;
  const total = progressRecords.length;
  const averageScore = progressRecords
    .filter(p => p.best_score !== null)
    .reduce((sum, p) => sum + (p.best_score || 0), 0) / progressRecords.length;
  
  return {
    completion_rate: (completed / total) * 100,
    average_score: averageScore,
    total_time_spent: progressRecords.reduce((sum, p) => sum + p.time_spent, 0),
    at_risk: averageScore < 60 || (completed / total) < 0.3
  };
}

interface ProgressAnalysis {
  completion_rate: number;
  average_score: number;
  total_time_spent: number;
  at_risk: boolean;
}
```

### LearningAnalytics

Comprehensive learning analytics for students.

```typescript
interface LearningAnalytics {
  student_id: string;                             // Student UUID
  course_id: string;                              // Course UUID
  metrics: AnalyticsMetrics;                      // Performance metrics
  trends: LearningTrend[];                        // Learning trends
  recommendations: string[];                      // Recommendations
  generated_at: string;                          // ISO timestamp
}

interface AnalyticsMetrics {
  total_time_spent: number;                       // Total seconds
  lessons_completed: number;                      // Completed lessons
  assessments_passed: number;                     // Passed assessments
  average_score: number;                          // Average percentage
  engagement_score: number;                       // Engagement metric
  progress_velocity: number;                      // Lessons per week
}

interface LearningTrend {
  metric: string;                                 // Metric name
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number;                      // Percentage change
  time_period: string;                           // Time period
}
```

**Usage Example:**
```typescript
// Analytics generation
async function generateLearningAnalytics(
  studentId: string,
  courseId: string
): Promise<LearningAnalytics> {
  const progressRecords = await StudentProgressService.getByCourse(studentId, courseId);
  const assessmentAttempts = await getAssessmentAttempts(studentId, courseId);
  
  return transformToLearningAnalytics(
    studentId,
    courseId,
    progressRecords,
    assessmentAttempts
  );
}

// Trend analysis
function calculateTrends(
  currentMetrics: AnalyticsMetrics,
  previousMetrics: AnalyticsMetrics
): LearningTrend[] {
  return [
    {
      metric: 'average_score',
      trend_direction: getTrendDirection(currentMetrics.average_score, previousMetrics.average_score),
      change_percentage: calculatePercentageChange(currentMetrics.average_score, previousMetrics.average_score),
      time_period: 'last_month'
    },
    {
      metric: 'engagement_score',
      trend_direction: getTrendDirection(currentMetrics.engagement_score, previousMetrics.engagement_score),
      change_percentage: calculatePercentageChange(currentMetrics.engagement_score, previousMetrics.engagement_score),
      time_period: 'last_month'
    }
  ];
}
```

## AI and Personalization Interfaces

### PersonalizedRoadmap

AI-generated personalized learning roadmap.

```typescript
interface PersonalizedRoadmap {
  id: string;                                     // UUID
  student_id: string;                             // Student UUID
  generated_at: string;                          // ISO timestamp
  roadmap_data: RoadmapData;                     // Roadmap details
  ai_reasoning: string;                          // AI reasoning explanation
  status: RoadmapStatus;                         // Roadmap status
  updated_at: string;                            // ISO timestamp
}

type RoadmapStatus = 'active' | 'completed' | 'paused';

interface RoadmapData {
  learning_path: LearningPathItem[];              // Ordered learning path
  estimated_completion_time: number;              // Total minutes
  difficulty_progression: DifficultyProgression; // Difficulty curve
  personalization_factors: PersonalizationFactors; // Personalization data
}

interface LearningPathItem {
  content_id: string;                             // Content UUID
  content_type: 'lesson' | 'assessment' | 'practice'; // Content type
  order_index: number;                            // Order in path
  estimated_time: number;                         // Minutes
  prerequisites: string[];                        // Required content UUIDs
  learning_objectives: string[];                  // Learning goals
  personalization_notes: string;                 // AI personalization notes
  is_unlocked: boolean;                          // Access status
  completion_status: ProgressStatus;              // Completion status
}
```

**Usage Example:**
```typescript
// Roadmap generation
async function generatePersonalizedRoadmap(
  studentId: string,
  courseIds: string[]
): Promise<PersonalizedRoadmap> {
  const student = await UserProfileService.getById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }
  
  const courses = await Promise.all(
    courseIds.map(id => CourseService.getById(id))
  );
  
  // AI service call (simplified)
  const roadmapData = await AIService.generateRoadmap(
    student.knowledge_profile,
    student.learning_preferences,
    courses.filter(Boolean)
  );
  
  const roadmap: Partial<PersonalizedRoadmap> = {
    student_id: studentId,
    roadmap_data: roadmapData,
    ai_reasoning: "Generated based on knowledge gaps and learning preferences",
    status: 'active',
    generated_at: new Date().toISOString()
  };
  
  return await RoadmapService.create(roadmap);
}

// Roadmap navigation
function getNextLearningItem(roadmap: PersonalizedRoadmap): LearningPathItem | null {
  return roadmap.roadmap_data.learning_path.find(
    item => item.is_unlocked && item.completion_status === 'not_started'
  ) || null;
}

// Progress tracking
function updateRoadmapProgress(
  roadmap: PersonalizedRoadmap,
  completedItemId: string
): PersonalizedRoadmap {
  const updatedPath = roadmap.roadmap_data.learning_path.map(item => {
    if (item.content_id === completedItemId) {
      return { ...item, completion_status: 'completed' as const };
    }
    return item;
  });
  
  // Unlock next items
  const updatedPathWithUnlocks = unlockNextItems(updatedPath);
  
  return {
    ...roadmap,
    roadmap_data: {
      ...roadmap.roadmap_data,
      learning_path: updatedPathWithUnlocks
    },
    updated_at: new Date().toISOString()
  };
}
```

## Utility and Helper Interfaces

### ValidationResult

Standard validation result interface.

```typescript
interface ValidationResult<T> {
  isValid: boolean;                               // Validation success
  data?: T;                                      // Validated data
  errors: ValidationError[];                      // Validation errors
}

interface ValidationError {
  field: string;                                  // Field name
  message: string;                               // Error message
  code: string;                                  // Error code
}
```

**Usage Example:**
```typescript
// Generic validation function
function validateAndTransform<T, U>(
  data: T,
  validator: (data: T) => ValidationResult<U>
): U {
  const result = validator(data);
  
  if (!result.isValid) {
    throw new ValidationError(
      `Validation failed: ${result.errors.map(e => e.message).join(', ')}`,
      'validation',
      'VALIDATION_FAILED'
    );
  }
  
  return result.data!;
}

// Validation composition
function composeValidators<T>(
  ...validators: Array<(data: T) => ValidationResult<T>>
): (data: T) => ValidationResult<T> {
  return (data: T) => {
    const allErrors: ValidationError[] = [];
    let validData = data;
    
    for (const validator of validators) {
      const result = validator(validData);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      } else if (result.data) {
        validData = result.data;
      }
    }
    
    return {
      isValid: allErrors.length === 0,
      data: allErrors.length === 0 ? validData : undefined,
      errors: allErrors
    };
  };
}
```

## Usage Patterns

### Generic CRUD Operations

```typescript
// Generic service interface
interface CRUDService<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  getById(id: string): Promise<T | null>;
  create(data: CreateData): Promise<T>;
  update(id: string, data: UpdateData): Promise<T>;
  delete(id: string): Promise<void>;
}

// Implementation example
class GenericService<T> implements CRUDService<T> {
  constructor(
    private tableName: string,
    private transformer: (data: any) => T
  ) {}
  
  async getById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw handleDatabaseError(error);
    return data ? this.transformer(data) : null;
  }
  
  // ... other methods
}
```

### Type Guards and Utilities

```typescript
// Type guards for runtime type checking
function isUserProfile(obj: any): obj is UserProfile {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    ['student', 'instructor', 'admin'].includes(obj.role);
}

function isCourse(obj: any): obj is Course {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.instructor_id === 'string' &&
    ['beginner', 'intermediate', 'advanced'].includes(obj.difficulty_level);
}

// Utility types
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Usage examples
type CourseWithRequiredTitle = RequiredFields<Course, 'title' | 'instructor_id'>;
type PartialUserProfile = OptionalFields<UserProfile, 'first_name' | 'last_name'>;

// Conditional types for API responses
type APIResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code: string;
};

// Helper function for API responses
function createSuccessResponse<T>(data: T): APIResponse<T> {
  return { success: true, data };
}

function createErrorResponse(error: string, code: string): APIResponse<never> {
  return { success: false, error, code };
}
```

This comprehensive TypeScript interface documentation provides a complete reference for all types used in the Personalized LMS, with practical usage examples and best practices for type-safe development.