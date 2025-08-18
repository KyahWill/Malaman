/**
 * Core Database Types and Interfaces
 * 
 * This file contains all TypeScript interfaces for database models
 * used throughout the personalized LMS application.
 */

// ============================================================================
// ENUMS AND BASIC TYPES
// ============================================================================

export type UserRole = 'student' | 'instructor' | 'admin';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ContentType = 'rich_text' | 'image' | 'video' | 'file' | 'youtube';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type RoadmapStatus = 'active' | 'completed' | 'paused';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
export type LearningPace = 'slow' | 'medium' | 'fast';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
export type MediaType = 'image' | 'video' | 'audio' | 'text' | 'interactive';

// ============================================================================
// USER AND PROFILE MODELS
// ============================================================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  learning_preferences: LearningPreferences | null;
  knowledge_profile: KnowledgeProfile | null;
  created_at: string;
  updated_at: string;
}

export interface LearningPreferences {
  preferred_pace: LearningPace;
  preferred_media_types: MediaType[];
  learning_style: LearningStyle;
  daily_study_time?: number; // in minutes
  notification_preferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  email_reminders: boolean;
  progress_updates: boolean;
  new_content_alerts: boolean;
  assessment_deadlines: boolean;
}

export interface KnowledgeProfile {
  subject_areas: SubjectKnowledge[];
  skill_levels: SkillLevel[];
  last_assessed: string;
  assessment_history: string[]; // assessment IDs
}

export interface SubjectKnowledge {
  subject: string;
  proficiency_level: number; // 1-10 scale
  topics: TopicKnowledge[];
  last_updated: string;
}

export interface TopicKnowledge {
  topic: string;
  confidence_level: number; // 1-10 scale
  mastery_indicators: string[];
}

export interface SkillLevel {
  skill: string;
  level: DifficultyLevel;
  evidence: string[];
  verified_at: string;
}

// ============================================================================
// COURSE AND LESSON MODELS
// ============================================================================

export interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string;
  final_assessment_id: string | null;
  tags: string[];
  difficulty_level: DifficultyLevel;
  estimated_duration: number | null; // in minutes
  is_published: boolean;
  enrollment_count?: number;
  completion_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface CourseWithDetails extends Course {
  instructor: UserProfile;
  lessons: Lesson[];
  final_assessment: Assessment | null;
  enrollment_status?: EnrollmentStatus;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  content_blocks: ContentBlock[];
  learning_objectives: string[];
  estimated_duration: number | null;
  assessment_id: string | null;
  prerequisites: string[]; // lesson IDs
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonWithDetails extends Lesson {
  course: Course;
  assessment: Assessment | null;
  progress_status?: ProgressStatus;
  completion_percentage?: number;
}

export interface ContentBlock {
  id: string;
  lesson_id: string;
  type: ContentType;
  content: ContentData;
  order_index: number;
  metadata: ContentMetadata;
  created_at: string;
  updated_at: string;
}

export interface ContentMetadata {
  title?: string;
  description?: string;
  accessibility_notes?: string;
  estimated_read_time?: number; // in minutes
  difficulty_indicators?: string[];
  tags?: string[];
}

// ============================================================================
// CONTENT DATA TYPES
// ============================================================================

export type ContentData = {
  rich_text?: RichTextContent;
  image?: ImageContent;
  video?: VideoContent;
  file?: FileContent;
  youtube?: YouTubeContent;
};

export interface RichTextContent {
  html: string;
  plain_text: string;
  word_count?: number;
  reading_level?: string;
}

export interface ImageContent {
  url: string;
  alt_text: string;
  caption?: string;
  width?: number;
  height?: number;
  file_size?: number;
}

export interface VideoContent {
  url: string;
  thumbnail_url?: string;
  duration?: number; // in seconds
  file_size?: number;
  format?: string;
  captions_url?: string;
}

export interface FileContent {
  url: string;
  filename: string;
  file_type: string;
  file_size: number;
  download_count?: number;
  description?: string;
}

export interface YouTubeContent {
  video_id: string;
  title: string;
  thumbnail_url: string;
  duration: number; // in seconds
  channel_name?: string;
  description?: string;
}

// ============================================================================
// ENROLLMENT AND PROGRESS MODELS
// ============================================================================

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  progress: EnrollmentProgress | null;
}

export interface EnrollmentProgress {
  lessons_completed: number;
  total_lessons: number;
  assessments_passed: number;
  total_assessments: number;
  overall_percentage: number;
  current_lesson_id?: string;
  estimated_completion_date?: string;
}

export interface EnrollmentStatus {
  is_enrolled: boolean;
  enrollment_date?: string;
  completion_status: ProgressStatus;
  progress_percentage: number;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id: string | null;
  assessment_id: string | null;
  status: ProgressStatus;
  completion_percentage: number;
  last_accessed: string;
  time_spent: number; // in seconds
  attempts_count: number;
  best_score: number | null; // percentage
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ASSESSMENT MODELS
// ============================================================================

export interface Assessment {
  id: string;
  lesson_id: string | null;
  course_id: string | null;
  title: string;
  description: string | null;
  questions: Question[];
  ai_generated: boolean;
  source_content_ids: string[];
  is_mandatory: boolean;
  minimum_passing_score: number; // percentage
  max_attempts: number | null; // null for unlimited
  time_limit: number | null; // in minutes
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question_text: string;
  options?: string[]; // for multiple choice
  correct_answer: string | string[];
  explanation: string;
  difficulty_level: number; // 1-5 scale
  topics: string[];
  points: number;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  student_id: string;
  attempt_number: number;
  answers: AssessmentAnswer[];
  score: number; // percentage
  points_earned: number;
  total_points: number;
  passed: boolean;
  time_spent: number | null; // in seconds
  started_at: string;
  submitted_at: string;
  feedback: AssessmentFeedback | null;
}

export interface AssessmentAnswer {
  question_id: string;
  student_answer: string | string[];
  is_correct: boolean;
  points_earned: number;
  feedback?: string;
}

export interface AssessmentFeedback {
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommended_resources: string[];
  next_steps: string;
}

export interface AssessmentRecord {
  id: string;
  student_id: string;
  assessment_id: string;
  attempt_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  certificate_data: CertificateData;
}

export interface CertificateData {
  assessment_title: string;
  questions_count: number;
  time_spent: number;
  detailed_results: AssessmentAnswer[];
}

// ============================================================================
// AI AND PERSONALIZATION MODELS
// ============================================================================

export interface PersonalizedRoadmap {
  id: string;
  student_id: string;
  generated_at: string;
  roadmap_data: RoadmapData;
  ai_reasoning: string;
  status: RoadmapStatus;
  updated_at: string;
}

export interface RoadmapData {
  learning_path: LearningPathItem[];
  estimated_completion_time: number;
  difficulty_progression: DifficultyProgression;
  personalization_factors: PersonalizationFactors;
}

export interface LearningPathItem {
  content_id: string;
  content_type: 'lesson' | 'assessment' | 'practice';
  order_index: number;
  estimated_time: number;
  prerequisites: string[];
  learning_objectives: string[];
  personalization_notes: string;
  is_unlocked: boolean;
  completion_status: ProgressStatus;
}

export interface DifficultyProgression {
  start: DifficultyLevel;
  end: DifficultyLevel;
  milestones: ProgressionMilestone[];
}

export interface ProgressionMilestone {
  content_id: string;
  difficulty_level: DifficultyLevel;
  skills_acquired: string[];
  assessment_required: boolean;
}

export interface PersonalizationFactors {
  knowledge_gaps: string[];
  learning_preferences: LearningPreferences;
  performance_patterns: PerformancePattern[];
  engagement_metrics: EngagementMetrics;
}

export interface PerformancePattern {
  pattern_type: string;
  description: string;
  confidence_score: number;
  recommendations: string[];
}

export interface EngagementMetrics {
  average_session_duration: number;
  preferred_content_types: ContentType[];
  peak_learning_times: string[];
  completion_rate: number;
}

// ============================================================================
// ANALYTICS AND REPORTING MODELS
// ============================================================================

export interface LearningAnalytics {
  student_id: string;
  course_id: string;
  metrics: AnalyticsMetrics;
  trends: LearningTrend[];
  recommendations: string[];
  generated_at: string;
}

export interface AnalyticsMetrics {
  total_time_spent: number;
  lessons_completed: number;
  assessments_passed: number;
  average_score: number;
  engagement_score: number;
  progress_velocity: number; // lessons per week
}

export interface LearningTrend {
  metric: string;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number;
  time_period: string;
}

export interface InstructorAnalytics {
  instructor_id: string;
  course_analytics: CourseAnalytics[];
  student_engagement: StudentEngagement[];
  content_performance: ContentPerformance[];
  generated_at: string;
}

export interface CourseAnalytics {
  course_id: string;
  enrollment_count: number;
  completion_rate: number;
  average_score: number;
  student_satisfaction: number;
  time_to_completion: number;
}

export interface StudentEngagement {
  student_id: string;
  engagement_score: number;
  last_active: string;
  progress_status: ProgressStatus;
  risk_indicators: string[];
}

export interface ContentPerformance {
  content_id: string;
  content_type: ContentType;
  engagement_rate: number;
  completion_rate: number;
  average_time_spent: number;
  difficulty_rating: number;
  improvement_suggestions: string[];
}