# Assessment System Documentation

## Overview

The Assessment System is a comprehensive solution for creating, managing, and taking assessments within the Personalized Learning Management System. It supports multiple question types, configurable scoring, time limits, and attempt tracking.

## Features

### Assessment Types
- **Lesson Assessments**: Mandatory assessments tied to specific lessons
- **Course Assessments**: Final assessments for entire courses
- **Standalone Assessments**: Independent assessments not tied to specific content

### Question Types

#### 1. Multiple Choice
- Single correct answer from 2-6 options
- Automatic scoring
- Immediate feedback with explanations

**Example:**
```json
{
  "type": "multiple_choice",
  "question_text": "What is the capital of France?",
  "options": ["London", "Berlin", "Paris", "Madrid"],
  "correct_answer": "Paris",
  "explanation": "Paris is the capital and largest city of France.",
  "points": 1
}
```

#### 2. True/False
- Simple binary choice questions
- Automatic scoring
- Quick assessment of basic concepts

**Example:**
```json
{
  "type": "true_false",
  "question_text": "The Earth is flat.",
  "correct_answer": "false",
  "explanation": "The Earth is an oblate spheroid, not flat.",
  "points": 1
}
```

#### 3. Short Answer
- Brief text responses (1-2 sentences)
- Manual or semi-automatic grading
- Good for definitions and explanations

**Example:**
```json
{
  "type": "short_answer",
  "question_text": "Define photosynthesis in your own words.",
  "correct_answer": "The process by which plants convert sunlight into energy",
  "explanation": "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
  "points": 2
}
```

#### 4. Essay
- Extended written responses
- Manual grading required
- Suitable for complex analysis and critical thinking

**Example:**
```json
{
  "type": "essay",
  "question_text": "Analyze the causes and effects of the Industrial Revolution.",
  "correct_answer": "Sample answer covering key points: technological innovations, social changes, economic impacts...",
  "explanation": "A comprehensive essay should cover technological, social, and economic aspects of the Industrial Revolution.",
  "points": 10
}
```

## Assessment Configuration

### Basic Settings
- **Title**: Clear, descriptive assessment name
- **Description**: Optional detailed explanation of the assessment
- **Mandatory**: Whether completion is required for progression
- **Minimum Passing Score**: Percentage required to pass (default: 70%)

### Attempt Management
- **Maximum Attempts**: Limit on how many times a student can take the assessment
- **Unlimited Attempts**: Allow students to retake until they pass
- **Best Score Tracking**: System records the highest score achieved

### Time Management
- **Time Limit**: Optional time constraint in minutes
- **Auto-Submit**: Automatic submission when time expires
- **Time Tracking**: Record actual time spent on assessment

## Scoring Algorithms

### Point-Based Scoring
Each question has a point value, and the final score is calculated as:
```
Score = (Points Earned / Total Points) × 100
```

### Question Weighting
Questions can have different point values to reflect their importance:
- Simple recall questions: 1 point
- Application questions: 2-3 points
- Analysis questions: 5-10 points

### Partial Credit
- Multiple choice and true/false: All or nothing
- Short answer: Instructor discretion
- Essay: Rubric-based scoring

## Progression Control

### Assessment Gates
Students must pass assessments to unlock subsequent content:

1. **Lesson Assessment**: Must pass to access next lesson
2. **Course Assessment**: Must pass to complete course
3. **Prerequisite Checking**: System validates completion before allowing access

### Failure Handling
When students fail an assessment:
- Provide detailed feedback
- Suggest review materials
- Allow retakes (if configured)
- Block progression until passing score achieved

## Assessment Creation Guide

### Step 1: Basic Information
1. Enter assessment title and description
2. Set minimum passing score (recommended: 70-80%)
3. Configure attempt limits and time constraints
4. Mark as mandatory if required for progression

### Step 2: Question Creation
1. Click "Add Question" to open question editor
2. Select question type from dropdown
3. Enter question text using rich text editor
4. Configure type-specific options:
   - **Multiple Choice**: Add 2-6 options, select correct answer
   - **True/False**: Select true or false as correct
   - **Short Answer/Essay**: Provide sample answer or key points
5. Set point value and difficulty level (1-5)
6. Write detailed explanation for feedback
7. Add relevant topics/tags for categorization

### Step 3: Question Management
- **Reorder**: Drag and drop questions to change order
- **Edit**: Click edit button to modify existing questions
- **Delete**: Remove questions with confirmation
- **Duplicate**: Copy questions to save time

### Step 4: Preview and Validation
1. Click "Preview" to test the assessment
2. Take the assessment as a student would
3. Review scoring and feedback
4. Make adjustments as needed

### Step 5: Publishing
1. Final review of all questions and settings
2. Click "Publish" to make available to students
3. Monitor student attempts and performance

## Best Practices

### Question Writing
- **Clear and Concise**: Avoid ambiguous language
- **Single Concept**: Each question should test one specific concept
- **Appropriate Difficulty**: Match question difficulty to learning objectives
- **Avoid Tricks**: Focus on understanding, not catching students off-guard

### Assessment Design
- **Balanced Coverage**: Include questions from all major topics
- **Progressive Difficulty**: Start with easier questions, increase complexity
- **Reasonable Length**: 10-20 questions for most assessments
- **Time Allocation**: Allow 1-2 minutes per multiple choice, more for essays

### Feedback Quality
- **Explanatory**: Explain why answers are correct or incorrect
- **Educational**: Use feedback as a teaching opportunity
- **Constructive**: Provide guidance for improvement
- **Specific**: Reference relevant course materials

## Pedagogical Guidelines

### Formative vs. Summative Assessment
- **Formative**: Low-stakes, frequent, feedback-focused
- **Summative**: High-stakes, comprehensive, grade-focused

### Assessment Frequency
- **Lesson Assessments**: After each major concept
- **Module Assessments**: Every 3-5 lessons
- **Course Assessments**: Mid-term and final

### Difficulty Progression
1. **Knowledge**: Basic recall and recognition
2. **Comprehension**: Understanding and explanation
3. **Application**: Using knowledge in new situations
4. **Analysis**: Breaking down complex information
5. **Synthesis**: Creating new understanding
6. **Evaluation**: Making judgments and critiques

## Technical Implementation

### Database Schema
```sql
-- Assessments table
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),
  course_id UUID REFERENCES courses(id),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  minimum_passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER,
  time_limit INTEGER,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assessment attempts table
CREATE TABLE assessment_attempts (
  id UUID PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id),
  student_id UUID REFERENCES profiles(id),
  attempt_number INTEGER NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  time_spent INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/{id}` - Get assessment details
- `PUT /api/assessments/{id}` - Update assessment
- `DELETE /api/assessments/{id}` - Delete assessment
- `POST /api/assessments/{id}/attempts` - Submit attempt
- `GET /api/assessments/{id}/attempts` - Get attempt history

### Validation Rules
- Title: 3-200 characters
- Questions: 1-100 per assessment
- Passing score: 0-100%
- Time limit: 1-480 minutes
- Max attempts: 1-10 or unlimited
- Question points: 1-100 per question

## Accessibility Features

### Screen Reader Support
- Proper ARIA labels on all form elements
- Semantic HTML structure
- Alternative text for images in questions

### Keyboard Navigation
- Tab order follows logical sequence
- All interactive elements accessible via keyboard
- Keyboard shortcuts for common actions

### Visual Accessibility
- High contrast mode support
- Scalable text and UI elements
- Clear visual hierarchy and spacing

## Security Considerations

### Data Protection
- Assessment content encrypted at rest
- Secure transmission of student responses
- Access control based on user roles

### Academic Integrity
- Time limits to prevent collaboration
- Question randomization (future feature)
- Attempt tracking and monitoring
- Secure assessment environment

## Performance Optimization

### Database Optimization
- Indexed queries for fast retrieval
- Efficient JSON operations for questions
- Pagination for large result sets

### Frontend Performance
- Lazy loading of assessment content
- Optimized rendering for large assessments
- Efficient state management

## Troubleshooting

### Common Issues

#### Assessment Won't Save
- Check validation errors in browser console
- Ensure all required fields are completed
- Verify question format is correct

#### Students Can't Access Assessment
- Confirm assessment is published
- Check prerequisite completion
- Verify enrollment status

#### Scoring Issues
- Review question point values
- Check correct answer format
- Validate passing score calculation

#### Time Limit Problems
- Ensure time limit is reasonable
- Check for browser compatibility issues
- Verify auto-submit functionality

### Error Messages
- **Validation Failed**: Check required fields and formats
- **Unauthorized**: Verify user permissions
- **Assessment Not Found**: Check assessment ID and availability
- **Time Expired**: Assessment auto-submitted due to time limit

## Future Enhancements

### Planned Features
- Question banks and randomization
- Advanced analytics and reporting
- Peer assessment capabilities
- Integration with external assessment tools
- Mobile app support
- Offline assessment capability

### AI Integration
- Automatic question generation from content
- Intelligent difficulty adjustment
- Personalized feedback generation
- Cheating detection algorithms

## Support and Resources

### Getting Help
- Check this documentation first
- Review error messages and logs
- Contact system administrator
- Submit bug reports through issue tracker

### Training Resources
- Video tutorials for assessment creation
- Best practices webinars
- Peer mentoring programs
- Assessment design workshops

### Community
- Instructor forums for sharing strategies
- Question bank sharing (future)
- Assessment template library
- Regular user group meetings