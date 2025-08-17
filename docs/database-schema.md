# Database Schema Documentation

## Overview

The Personalized LMS uses a PostgreSQL database hosted on Supabase with comprehensive Row Level Security (RLS) policies. The schema is designed to support multi-tenant access with role-based permissions for students, instructors, and administrators.

## Entity Relationship Diagram

```mermaid
erDiagram
    profiles ||--o{ courses : "instructor creates"
    profiles ||--o{ enrollments : "student enrolls"
    profiles ||--o{ assessment_attempts : "student attempts"
    profiles ||--o{ student_progress : "tracks progress"
    profiles ||--o{ personalized_roadmaps : "has roadmap"
    profiles ||--o{ learning_progress : "detailed tracking"
    
    courses ||--o{ lessons : "contains"
    courses ||--o{ enrollments : "students enroll"
    courses ||--o{ assessments : "has final assessment"
    courses ||--o{ student_progress : "progress tracked"
    
    lessons ||--o{ content_blocks : "contains"
    lessons ||--o{ assessments : "has assessment"
    lessons ||--o{ student_progress : "progress tracked"
    
    assessments ||--o{ assessment_attempts : "students attempt"
    assessments ||--o{ student_progress : "progress tracked"
    
    profiles {
        uuid id PK
        text email UK
        user_role role
        text first_name
        text last_name
        text avatar_url
        jsonb learning_preferences
        jsonb knowledge_profile
        timestamp created_at
        timestamp updated_at
    }
    
    courses {
        uuid id PK
        text title
        text description
        uuid instructor_id FK
        uuid final_assessment_id FK
        text[] tags
        difficulty_level difficulty_level
        integer estimated_duration
        boolean is_published
        timestamp created_at
        timestamp updated_at
    }
    
    lessons {
        uuid id PK
        uuid course_id FK
        text title
        text description
        integer order_index
        text[] learning_objectives
        integer estimated_duration
        uuid assessment_id FK
        uuid[] prerequisites
        boolean is_published
        timestamp created_at
        timestamp updated_at
    }
    
    content_blocks {
        uuid id PK
        uuid lesson_id FK
        content_type type
        jsonb content
        integer order_index
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    enrollments {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        timestamp enrolled_at
        timestamp completed_at
        jsonb progress
    }
    
    assessments {
        uuid id PK
        uuid lesson_id FK
        uuid course_id FK
        text title
        text description
        jsonb questions
        boolean ai_generated
        uuid[] source_content_ids
        boolean is_mandatory
        integer minimum_passing_score
        integer max_attempts
        integer time_limit
        timestamp created_at
        timestamp updated_at
    }
    
    assessment_attempts {
        uuid id PK
        uuid assessment_id FK
        uuid student_id FK
        integer attempt_number
        jsonb answers
        integer score
        integer points_earned
        integer total_points
        boolean passed
        integer time_spent
        timestamp started_at
        timestamp submitted_at
        jsonb feedback
    }
    
    student_progress {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        uuid lesson_id FK
        uuid assessment_id FK
        progress_status status
        integer completion_percentage
        timestamp last_accessed
        integer time_spent
        integer attempts_count
        integer best_score
        timestamp created_at
        timestamp updated_at
    }
    
    personalized_roadmaps {
        uuid id PK
        uuid student_id FK
        jsonb roadmap_data
        text ai_reasoning
        roadmap_status status
        timestamp generated_at
        timestamp updated_at
    }
    
    learning_progress {
        uuid id PK
        uuid student_id FK
        uuid content_id
        text content_type
        jsonb progress_data
        timestamp completed_at
        integer time_spent
        timestamp created_at
        timestamp updated_at
    }
```

## Custom Types

### Enums

```sql
-- User roles in the system
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');

-- Difficulty levels for courses and content
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Types of content blocks
CREATE TYPE content_type AS ENUM ('rich_text', 'image', 'video', 'file', 'youtube');

-- Status of personalized roadmaps
CREATE TYPE roadmap_status AS ENUM ('active', 'completed', 'paused');

-- Progress status for learning content
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked');
```

## Table Descriptions

### profiles
Extends Supabase's `auth.users` table with additional profile information and learning preferences.

**Key Features:**
- Automatically created when a user signs up via trigger
- Stores learning preferences and knowledge profiles as JSONB
- Role-based access control (student, instructor, admin)

**Relationships:**
- One-to-many with courses (as instructor)
- One-to-many with enrollments (as student)
- One-to-many with assessment attempts
- One-to-many with progress tracking

### courses
Represents learning courses created by instructors.

**Key Features:**
- Hierarchical structure with lessons
- Mandatory final assessment
- Publishing workflow (draft/published)
- Tagging and difficulty classification

**Relationships:**
- Belongs to instructor (profiles)
- Has many lessons
- Has many enrollments
- Has one final assessment

### lessons
Individual learning units within courses.

**Key Features:**
- Ordered sequence within courses
- Multiple content blocks per lesson
- Mandatory assessment per lesson
- Prerequisite system for sequential learning

**Relationships:**
- Belongs to course
- Has many content blocks
- Has one assessment
- Can have prerequisite lessons

### content_blocks
Individual pieces of content within lessons.

**Key Features:**
- Support for multiple media types
- Ordered sequence within lessons
- Flexible JSONB content storage
- Metadata for additional properties

**Content Types:**
- `rich_text`: HTML content with formatting
- `image`: Images with alt text and captions
- `video`: Uploaded video files
- `file`: Downloadable files (PDFs, documents)
- `youtube`: Embedded YouTube videos

### enrollments
Tracks student enrollment in courses.

**Key Features:**
- Prevents duplicate enrollments
- Tracks completion status
- Stores progress data as JSONB

### assessments
Quizzes and tests for lessons and courses.

**Key Features:**
- AI-generated or manually created
- Multiple question types support
- Configurable passing scores and attempt limits
- Time limits for timed assessments

**Question Types Supported:**
- Multiple choice
- True/false
- Short answer
- Essay questions

### assessment_attempts
Individual attempts at assessments by students.

**Key Features:**
- Tracks multiple attempts per assessment
- Detailed answer storage
- Automatic scoring and feedback
- Time tracking for performance analysis

### student_progress
Comprehensive progress tracking for all learning activities.

**Key Features:**
- Granular progress tracking
- Performance metrics
- Time spent analytics
- Completion percentages

### personalized_roadmaps
AI-generated learning paths for individual students.

**Key Features:**
- AI reasoning transparency
- Dynamic updates based on performance
- Status tracking (active/completed/paused)

### learning_progress
Detailed analytics for learning behavior.

**Key Features:**
- Flexible content tracking
- Detailed progress data as JSONB
- Time-based analytics

## Row Level Security (RLS) Policies

### Security Principles

1. **Data Isolation**: Users can only access data they own or are authorized to view
2. **Role-Based Access**: Different permissions for students, instructors, and admins
3. **Course-Based Access**: Students can only access enrolled courses
4. **Instructor Ownership**: Instructors can only manage their own courses
5. **Admin Override**: Administrators have full access for system management

### Policy Examples

#### Profile Access
```sql
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Instructors can view student profiles for course management
CREATE POLICY "Instructors can view student profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('instructor', 'admin')
    )
  );
```

#### Course Access
```sql
-- Anyone can view published courses
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

-- Students can view enrolled courses (even unpublished)
CREATE POLICY "Students can view enrolled courses" ON courses
  FOR SELECT USING (
    id IN (
      SELECT course_id FROM enrollments 
      WHERE student_id = auth.uid()
    )
  );

-- Instructors can manage their own courses
CREATE POLICY "Instructors can manage own courses" ON courses
  FOR ALL USING (auth.uid() = instructor_id);
```

#### Assessment Security
```sql
-- Students can only view their own assessment attempts
CREATE POLICY "Students can manage own assessment attempts" ON assessment_attempts
  FOR ALL USING (auth.uid() = student_id);

-- Instructors can view attempts for their course assessments
CREATE POLICY "Instructors can view course assessment attempts" ON assessment_attempts
  FOR SELECT USING (
    assessment_id IN (
      SELECT a.id FROM assessments a
      LEFT JOIN lessons l ON a.lesson_id = l.id
      LEFT JOIN courses c1 ON l.course_id = c1.id
      LEFT JOIN courses c2 ON a.course_id = c2.id
      WHERE c1.instructor_id = auth.uid() OR c2.instructor_id = auth.uid()
    )
  );
```

## Indexes and Performance

### Primary Indexes
All tables have UUID primary keys with automatic indexing.

### Performance Indexes
```sql
-- User and role-based queries
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Course and lesson hierarchy
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, order_index);

-- Content and media
CREATE INDEX idx_content_blocks_lesson ON content_blocks(lesson_id);
CREATE INDEX idx_content_blocks_order ON content_blocks(lesson_id, order_index);

-- Assessment and progress tracking
CREATE INDEX idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_course ON student_progress(course_id);
```

## Triggers and Functions

### Automatic Profile Creation
```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Automatic Timestamp Updates
```sql
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applied to all tables with updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Data Validation

### Constraints
- **Unique Constraints**: Prevent duplicate enrollments, ensure unique email addresses
- **Check Constraints**: Validate percentage values (0-100), ensure positive durations
- **Foreign Key Constraints**: Maintain referential integrity across all relationships
- **Assessment Constraints**: Ensure assessments belong to either lesson OR course, not both

### JSONB Schema Validation
While JSONB fields are flexible, the application enforces schema validation:

#### Learning Preferences Schema
```typescript
interface LearningPreferences {
  preferred_pace: 'slow' | 'medium' | 'fast';
  preferred_media_types: ContentType[];
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
}
```

#### Content Block Schema
```typescript
interface ContentData {
  rich_text?: {
    html: string;
    plain_text: string;
  };
  image?: {
    url: string;
    alt_text: string;
    caption?: string;
  };
  video?: {
    url: string;
    thumbnail_url?: string;
    duration?: number;
  };
  file?: {
    url: string;
    filename: string;
    file_type: string;
    file_size: number;
  };
  youtube?: {
    video_id: string;
    title: string;
    thumbnail_url: string;
    duration: number;
  };
}
```

## Migration Strategy

### Development Workflow
1. Create migration files in `supabase/migrations/`
2. Test migrations locally with `supabase db reset`
3. Apply to staging environment
4. Deploy to production with `supabase db push`

### Migration Naming Convention
- Format: `YYYYMMDDHHMMSS_description.sql`
- Example: `20240101000001_initial_schema.sql`

### Rollback Strategy
- Each migration should include rollback instructions in comments
- Use transactions for atomic migrations
- Test rollback procedures in staging environment

## Backup and Restore Procedures

### Automated Backups
Supabase provides automated daily backups with point-in-time recovery.

### Manual Backup
```bash
# Export schema and data
pg_dump -h your-host -U postgres -d your-database > backup.sql

# Schema only
pg_dump -h your-host -U postgres -d your-database --schema-only > schema.sql

# Data only
pg_dump -h your-host -U postgres -d your-database --data-only > data.sql
```

### Restore Procedures
```bash
# Full restore
psql -h your-host -U postgres -d your-database < backup.sql

# Schema restore
psql -h your-host -U postgres -d your-database < schema.sql

# Data restore
psql -h your-host -U postgres -d your-database < data.sql
```

### Disaster Recovery
1. **RTO (Recovery Time Objective)**: 4 hours maximum
2. **RPO (Recovery Point Objective)**: 1 hour maximum data loss
3. **Backup Retention**: 30 days for production, 7 days for staging
4. **Testing**: Monthly disaster recovery drills

## Security Considerations

### Data Encryption
- **At Rest**: All data encrypted using AES-256
- **In Transit**: TLS 1.3 for all connections
- **Application Level**: Sensitive fields encrypted before storage

### Access Control
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security policies
- **API Security**: Rate limiting and request validation

### Compliance
- **GDPR**: Data portability and deletion capabilities
- **CCPA**: User data access and deletion rights
- **FERPA**: Educational record privacy protection

### Audit Logging
- All data modifications logged with user ID and timestamp
- Failed authentication attempts tracked
- Administrative actions logged for compliance

## Performance Monitoring

### Key Metrics
- Query execution time
- Connection pool utilization
- Index usage statistics
- Table size growth

### Optimization Strategies
- Regular VACUUM and ANALYZE operations
- Index optimization based on query patterns
- Partitioning for large tables (future consideration)
- Connection pooling configuration

### Alerting
- Slow query alerts (>1 second)
- High connection count alerts
- Disk space utilization alerts
- Failed backup alerts

This comprehensive database schema provides a solid foundation for the Personalized LMS with proper security, performance, and maintainability considerations.