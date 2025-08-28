-- Performance Optimization: Database Indexes
-- This migration adds indexes to improve query performance

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Courses table indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty_level ON courses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_tags ON courses USING GIN(tags);

-- Lessons table indexes
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON lessons(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, order_index);

-- Content blocks table indexes
CREATE INDEX IF NOT EXISTS idx_content_blocks_lesson_id ON content_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_type ON content_blocks(type);
CREATE INDEX IF NOT EXISTS idx_content_blocks_lesson_order ON content_blocks(lesson_id, order_index);

-- Enrollments table indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON enrollments(enrolled_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_completed_at ON enrollments(completed_at);

-- Assessments table indexes
CREATE INDEX IF NOT EXISTS idx_assessments_lesson_id ON assessments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessments_is_mandatory ON assessments(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_assessments_ai_generated ON assessments(ai_generated);

-- Assessment attempts table indexes
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student_id ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_passed ON assessment_attempts(passed);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_submitted_at ON assessment_attempts(submitted_at);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student_assessment ON assessment_attempts(student_id, assessment_id);

-- Student progress table indexes
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_course_id ON student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_lesson_id ON student_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_status ON student_progress(status);
CREATE INDEX IF NOT EXISTS idx_student_progress_last_accessed ON student_progress(last_accessed);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_course ON student_progress(student_id, course_id);

-- Personalized roadmaps table indexes
CREATE INDEX IF NOT EXISTS idx_personalized_roadmaps_student_id ON personalized_roadmaps(student_id);
CREATE INDEX IF NOT EXISTS idx_personalized_roadmaps_status ON personalized_roadmaps(status);
CREATE INDEX IF NOT EXISTS idx_personalized_roadmaps_generated_at ON personalized_roadmaps(generated_at);

-- Learning progress table indexes
CREATE INDEX IF NOT EXISTS idx_learning_progress_student_id ON learning_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_content_id ON learning_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_content_type ON learning_progress(content_type);
CREATE INDEX IF NOT EXISTS idx_learning_progress_completed_at ON learning_progress(completed_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_courses_published_instructor ON courses(is_published, instructor_id) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_lessons_published_course ON lessons(is_published, course_id) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_student_progress_active ON student_progress(student_id, status) WHERE status IN ('in_progress', 'not_started');

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON enrollments(student_id, course_id) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_latest ON assessment_attempts(assessment_id, student_id, attempt_number DESC);

-- Full-text search indexes for content search
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_lessons_search ON lessons USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Performance statistics and monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Add comments for documentation
COMMENT ON INDEX idx_courses_published_instructor IS 'Optimizes queries for published courses by instructor';
COMMENT ON INDEX idx_student_progress_active IS 'Optimizes queries for active student progress';
COMMENT ON INDEX idx_assessment_attempts_latest IS 'Optimizes queries for latest assessment attempts';