# Progression Control System Guide

## Overview

The Progression Control System is a comprehensive content access management system that ensures students follow a structured learning path. It enforces prerequisites, manages assessment-based progression, and provides instructors with tools to monitor and control student progress.

## Key Features

### 1. Prerequisite Checking
- **Lesson Prerequisites**: Students must complete prerequisite lessons before accessing new content
- **Assessment Requirements**: Mandatory assessments must be passed to unlock subsequent content
- **Course Enrollment**: Students must be enrolled in a course to access its content
- **Publishing Status**: Only published content is accessible to students

### 2. Assessment-Gated Progression
- **Lesson Assessments**: Each lesson can have a mandatory assessment that must be passed
- **Course Final Assessments**: Courses can have final assessments requiring completion of all lessons
- **Minimum Passing Scores**: Configurable passing scores (default 70%)
- **Attempt Limits**: Optional limits on assessment attempts
- **Progress Blocking**: Failed assessments can block further progression

### 3. Progress Tracking
- **Real-time Status Updates**: Track completion status, time spent, and scores
- **Comprehensive Analytics**: Detailed progress information for students and instructors
- **Unlocking Notifications**: Automatic detection of newly unlocked content
- **Progress Persistence**: All progress is saved and can be resumed

### 4. Instructor Controls
- **Progress Override**: Instructors can manually unblock student progress
- **Progress Blocking**: Instructors can block students for academic integrity issues
- **Detailed Monitoring**: View comprehensive progress reports for all students
- **Manual Interventions**: Tools for handling special cases and exceptions

## System Architecture

### Core Components

#### 1. ProgressionControlService
The main service class that handles all progression logic:

```typescript
// Check content access
const accessResult = await ProgressionControlService.canAccessContent(
  studentId, 
  contentId, 
  contentType
);

// Update progress
const unlockedContent = await ProgressionControlService.updateProgress({
  student_id: studentId,
  content_id: contentId,
  content_type: 'lesson',
  status: 'completed',
  completion_percentage: 100
});
```

#### 2. ProgressionClient
Client-side service for API interactions:

```typescript
// Check access from frontend
const access = await ProgressionClient.checkAccess(lessonId, 'lesson');

// Update progress from frontend
const result = await ProgressionClient.updateProgress({
  content_id: lessonId,
  content_type: 'lesson',
  status: 'completed'
});
```

#### 3. ProgressionGate Component
Svelte component that enforces access control:

```svelte
<ProgressionGate 
  contentId={lessonId} 
  contentType="lesson"
  contentTitle="Introduction to Programming"
>
  <!-- Content only shows if access is granted -->
  <LessonContent />
</ProgressionGate>
```

### Database Schema

The system uses several database tables to track progression:

#### student_progress
Tracks individual progress records:
```sql
CREATE TABLE student_progress (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  assessment_id UUID REFERENCES assessments(id),
  status progress_status DEFAULT 'not_started',
  completion_percentage INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  time_spent INTEGER DEFAULT 0,
  attempts_count INTEGER DEFAULT 0,
  best_score INTEGER
);
```

#### assessments
Defines assessment requirements:
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),
  course_id UUID REFERENCES courses(id),
  is_mandatory BOOLEAN DEFAULT TRUE,
  minimum_passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER
);
```

#### lessons
Includes prerequisite information:
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  prerequisites UUID[] DEFAULT '{}',
  assessment_id UUID REFERENCES assessments(id)
);
```

## Progression Logic

### Content Access Flow

1. **Authentication Check**: Verify user is logged in
2. **Enrollment Verification**: Confirm student is enrolled in the course
3. **Publishing Status**: Ensure content is published
4. **Prerequisite Validation**: Check all prerequisites are met
5. **Assessment Requirements**: Verify required assessments are passed
6. **Attempt Limits**: Check assessment attempt limits
7. **Access Decision**: Grant or deny access with detailed reasoning

### Prerequisite Checking

Prerequisites are checked recursively:

```typescript
// Example prerequisite chain
Lesson 3 requires Lesson 2
Lesson 2 requires Lesson 1 + Assessment 1 (passed)
Lesson 1 requires Course Enrollment

// Access to Lesson 3 requires:
// 1. Course enrollment
// 2. Lesson 1 completed
// 3. Assessment 1 passed with minimum score
// 4. Lesson 2 completed
```

### Progress Status States

- **not_started**: Content not yet accessed
- **in_progress**: Content accessed but not completed
- **completed**: Content successfully completed
- **blocked**: Progress blocked due to failed assessment or instructor action

### Assessment Integration

Assessments are tightly integrated with progression:

1. **Lesson Assessments**: Must be passed to unlock next lesson
2. **Course Assessments**: Must be passed to complete course
3. **Prerequisite Assessments**: Previous assessments must be passed
4. **Retake Logic**: Failed assessments allow retakes (if attempts remain)

## API Endpoints

### Check Content Access
```http
POST /api/progression/check-access
Content-Type: application/json

{
  "contentId": "lesson-uuid",
  "contentType": "lesson"
}
```

Response:
```json
{
  "canAccess": false,
  "reason": "Prerequisites not met",
  "blockedBy": {
    "type": "lesson",
    "id": "prerequisite-lesson-uuid",
    "title": "Introduction to Variables"
  },
  "prerequisites": [
    {
      "id": "prerequisite-lesson-uuid",
      "type": "lesson",
      "title": "Introduction to Variables",
      "completed": false
    }
  ]
}
```

### Update Progress
```http
POST /api/progression/update-progress
Content-Type: application/json

{
  "content_id": "lesson-uuid",
  "content_type": "lesson",
  "status": "completed",
  "completion_percentage": 100,
  "time_spent": 1800
}
```

Response:
```json
{
  "success": true,
  "unlockedContent": {
    "lessons": ["next-lesson-uuid"],
    "assessments": ["lesson-assessment-uuid"],
    "courses": []
  }
}
```

### Course Progress Overview
```http
GET /api/progression/course-overview/{courseId}
```

Response:
```json
{
  "courseId": "course-uuid",
  "overallProgress": 75,
  "totalLessons": 8,
  "completedLessons": 6,
  "lessons": [
    {
      "lesson": { "id": "lesson-uuid", "title": "Lesson 1" },
      "progress": { "status": "completed", "completion_percentage": 100 },
      "canAccess": true,
      "assessment": {
        "id": "assessment-uuid",
        "canAccess": true,
        "passed": true
      }
    }
  ],
  "finalAssessment": {
    "id": "final-assessment-uuid",
    "canAccess": false,
    "passed": false
  },
  "isCompleted": false
}
```

## Usage Examples

### Student Learning Flow

1. **Course Enrollment**:
```typescript
// Student enrolls in course
await EnrollmentService.enroll(studentId, courseId);
```

2. **Accessing First Lesson**:
```typescript
// Check if first lesson is accessible
const access = await ProgressionClient.checkAccess(firstLessonId, 'lesson');
if (access.canAccess) {
  // Show lesson content
  navigateToLesson(firstLessonId);
}
```

3. **Completing Lesson**:
```typescript
// Mark lesson as completed
const result = await ProgressionClient.updateProgress({
  content_id: firstLessonId,
  content_type: 'lesson',
  status: 'completed',
  completion_percentage: 100,
  time_spent: 1200 // 20 minutes
});

// Check what was unlocked
if (result.unlockedContent.assessments.length > 0) {
  showNotification('Assessment unlocked!');
}
```

4. **Taking Assessment**:
```typescript
// Check assessment access
const assessmentAccess = await ProgressionClient.checkAccess(assessmentId, 'assessment');
if (assessmentAccess.canAccess) {
  // Take assessment
  navigateToAssessment(assessmentId);
}
```

### Instructor Management

1. **Viewing Student Progress**:
```typescript
// Get comprehensive progress overview
const overview = await ProgressionClient.getCourseProgressOverview(courseId);

// Check for blocked students
const blockedContent = await ProgressionClient.getBlockedContent(studentId);
```

2. **Unblocking Student**:
```typescript
// Instructor override for blocked progress
await ProgressionClient.unblockProgress(studentId, lessonId, 'lesson');
```

3. **Blocking Student** (for academic integrity):
```typescript
// Block student progress
await ProgressionClient.blockProgress(
  studentId, 
  assessmentId, 
  'Academic integrity violation - suspected cheating'
);
```

## Component Integration

### Using ProgressionGate

The ProgressionGate component automatically handles access control:

```svelte
<script>
  import ProgressionGate from '$lib/components/shared/ProgressionGate.svelte';
  import LessonContent from './LessonContent.svelte';
</script>

<ProgressionGate 
  contentId={lesson.id} 
  contentType="lesson"
  contentTitle={lesson.title}
  showDetails={true}
  allowBypass={userRole === 'instructor'}
>
  <LessonContent {lesson} />
</ProgressionGate>
```

### Course Progress Display

Show comprehensive progress information:

```svelte
<script>
  import CourseProgressOverview from '$lib/components/student/CourseProgressOverview.svelte';
</script>

<CourseProgressOverview 
  courseId={course.id}
  showActions={true}
/>
```

### Instructor Progress Management

Manage student progress:

```svelte
<script>
  import ProgressManagement from '$lib/components/instructor/ProgressManagement.svelte';
</script>

<ProgressManagement 
  studentId={student.id}
  studentName={student.name}
  courseId={course.id}
/>
```

## Troubleshooting

### Common Issues

#### 1. Student Cannot Access Content

**Symptoms**: Student sees "Content Locked" message

**Diagnosis**:
1. Check enrollment status
2. Verify prerequisite completion
3. Check assessment pass status
4. Confirm content is published

**Resolution**:
```typescript
// Check detailed access information
const access = await ProgressionClient.checkAccess(contentId, contentType);
console.log('Access result:', access);

// Check prerequisites
if (access.prerequisites) {
  const unmetPrereqs = access.prerequisites.filter(p => !p.completed);
  console.log('Unmet prerequisites:', unmetPrereqs);
}
```

#### 2. Progress Not Updating

**Symptoms**: Completion status not changing

**Diagnosis**:
1. Check API call success
2. Verify database permissions
3. Check for JavaScript errors

**Resolution**:
```typescript
try {
  const result = await ProgressionClient.updateProgress({
    content_id: contentId,
    content_type: 'lesson',
    status: 'completed'
  });
  console.log('Progress updated:', result);
} catch (error) {
  console.error('Progress update failed:', error);
}
```

#### 3. Assessment Not Unlocking

**Symptoms**: Assessment remains locked after lesson completion

**Diagnosis**:
1. Verify lesson is marked as completed
2. Check assessment configuration
3. Confirm prerequisite chain

**Resolution**:
```typescript
// Check lesson completion status
const lessonProgress = await ProgressionControlService.getContentProgress(
  studentId, 
  lessonId, 
  'lesson'
);

// Check assessment access
const assessmentAccess = await ProgressionControlService.canAccessContent(
  studentId,
  assessmentId,
  'assessment'
);
```

### Manual Override Procedures

#### Instructor Override Process

1. **Identify Issue**: Determine why student is blocked
2. **Verify Legitimacy**: Confirm override is appropriate
3. **Execute Override**: Use instructor tools to unblock
4. **Document Action**: Record reason for override
5. **Monitor Progress**: Ensure student can continue

#### Emergency Access Procedures

For critical situations requiring immediate access:

```sql
-- Direct database override (use with caution)
UPDATE student_progress 
SET status = 'completed', 
    completion_percentage = 100,
    updated_at = NOW()
WHERE student_id = 'student-uuid' 
  AND lesson_id = 'lesson-uuid';
```

### Performance Optimization

#### Caching Strategies

1. **Access Results**: Cache access check results for short periods
2. **Progress Data**: Cache progress overviews for active sessions
3. **Prerequisite Chains**: Cache prerequisite relationships

#### Database Optimization

1. **Indexes**: Ensure proper indexing on progression queries
2. **Query Optimization**: Use efficient queries for progress checks
3. **Batch Operations**: Process multiple progress updates together

## Security Considerations

### Access Control

1. **Authentication**: All progression APIs require authentication
2. **Authorization**: Role-based access to instructor functions
3. **Data Validation**: Validate all input parameters
4. **Rate Limiting**: Prevent abuse of progression APIs

### Data Integrity

1. **Transaction Safety**: Use database transactions for progress updates
2. **Consistency Checks**: Validate progression state consistency
3. **Audit Logging**: Log all progression changes
4. **Backup Procedures**: Regular backups of progression data

## Best Practices

### For Instructors

1. **Clear Prerequisites**: Define clear prerequisite chains
2. **Reasonable Passing Scores**: Set appropriate minimum scores
3. **Regular Monitoring**: Check student progress regularly
4. **Timely Interventions**: Address blocked students quickly
5. **Documentation**: Document any manual overrides

### For Developers

1. **Error Handling**: Implement comprehensive error handling
2. **User Feedback**: Provide clear feedback on access restrictions
3. **Performance**: Optimize progression checks for speed
4. **Testing**: Thoroughly test progression logic
5. **Monitoring**: Monitor progression system health

### For Students

1. **Sequential Learning**: Follow the designed learning sequence
2. **Assessment Preparation**: Prepare thoroughly for assessments
3. **Help Seeking**: Contact instructors when blocked
4. **Progress Tracking**: Monitor your own progress regularly

## Future Enhancements

### Planned Features

1. **Adaptive Prerequisites**: Dynamic prerequisite adjustment based on performance
2. **Learning Path Optimization**: AI-powered path optimization
3. **Peer Prerequisites**: Prerequisites based on peer performance
4. **Conditional Unlocking**: Complex conditional logic for unlocking
5. **Progress Predictions**: Predictive analytics for completion times

### Integration Opportunities

1. **LMS Integration**: Integration with external LMS systems
2. **Analytics Platforms**: Integration with learning analytics tools
3. **Notification Systems**: Enhanced notification and reminder systems
4. **Mobile Apps**: Mobile-specific progression features
5. **Gamification**: Achievement and badge systems

This comprehensive guide provides all the information needed to understand, implement, and maintain the Progression Control System effectively.