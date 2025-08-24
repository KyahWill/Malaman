# Knowledge Profiling Guide

## Overview

The Knowledge Assessment and Profiling system is a core component of the Personalized LMS that evaluates students' current knowledge levels, identifies learning gaps, and creates detailed knowledge profiles to enable personalized learning experiences.

## Table of Contents

1. [Assessment Methodology](#assessment-methodology)
2. [Knowledge Profile Structure](#knowledge-profile-structure)
3. [Gap Analysis](#gap-analysis)
4. [Skill Mapping](#skill-mapping)
5. [Prerequisite Identification](#prerequisite-identification)
6. [Profile Update Mechanisms](#profile-update-mechanisms)
7. [API Reference](#api-reference)
8. [Usage Examples](#usage-examples)

## Assessment Methodology

### Initial Knowledge Assessment

The system uses initial knowledge assessments to establish baseline understanding across different subject areas:

#### Assessment Types
- **Subject-Based Assessments**: Evaluate knowledge in specific subject areas (e.g., Mathematics, Computer Science)
- **Topic-Specific Assessments**: Focus on particular topics within a subject
- **Skill-Level Assessments**: Determine proficiency at different difficulty levels

#### Question Generation
- **Difficulty Levels**: Questions span beginner, intermediate, and advanced levels
- **Topic Coverage**: Each assessment covers multiple topics within the subject area
- **Adaptive Questioning**: Future versions will adapt question difficulty based on responses

#### Scoring Methodology
```typescript
// Proficiency calculation
const proficiencyLevel = (correctAnswers / totalQuestions) * 10; // 1-10 scale

// Confidence calculation based on question difficulty
const confidenceLevel = weightedScore / totalPossibleWeight;

// Knowledge gap identification
const isKnowledgeGap = proficiencyLevel < 7.0; // 70% threshold
```

### Assessment Configuration

Instructors can create knowledge assessments with the following parameters:

```typescript
interface KnowledgeAssessmentConfig {
  subject_area: string;           // Main subject area
  topics: string[];              // Specific topics to assess
  difficulty_levels: DifficultyLevel[]; // Levels to include
  question_count: number;        // Total questions (1-50)
  time_limit?: number;          // Optional time limit in minutes
}
```

## Knowledge Profile Structure

### Core Components

#### Subject Knowledge
```typescript
interface SubjectKnowledge {
  subject: string;              // Subject area name
  proficiency_level: number;    // Overall proficiency (1-10)
  topics: TopicKnowledge[];     // Individual topic assessments
  last_updated: string;         // Last assessment date
}
```

#### Topic Knowledge
```typescript
interface TopicKnowledge {
  topic: string;                // Topic name
  confidence_level: number;     // Confidence score (1-10)
  mastery_indicators: string[]; // Evidence of mastery
}
```

#### Skill Levels
```typescript
interface SkillLevel {
  skill: string;                // Skill name
  level: DifficultyLevel;       // Current proficiency level
  evidence: string[];           // Supporting evidence
  verified_at: string;          // Verification timestamp
}
```

### Profile Interpretation

#### Proficiency Levels
- **8-10**: Advanced proficiency - Student demonstrates mastery
- **6-7**: Intermediate proficiency - Student has solid understanding
- **4-5**: Basic proficiency - Student has foundational knowledge
- **1-3**: Novice level - Student needs significant support

#### Confidence Indicators
- **High Confidence (8-10)**: Student consistently answers correctly
- **Medium Confidence (5-7)**: Student shows partial understanding
- **Low Confidence (1-4)**: Student struggles with concepts

## Gap Analysis

### Knowledge Gap Identification

The system identifies knowledge gaps using multiple criteria:

#### Gap Detection Algorithm
```typescript
function identifyKnowledgeGaps(assessmentResults: AssessmentAttempt[]): KnowledgeGap[] {
  const gaps: KnowledgeGap[] = [];
  
  // Analyze performance by topic
  for (const [topic, performance] of topicPerformance) {
    const proficiencyLevel = (performance.correct / performance.total) * 10;
    
    if (proficiencyLevel < 7.0) { // 70% threshold
      gaps.push({
        topic,
        subject_area: getSubjectArea(topic),
        proficiency_level: proficiencyLevel,
        confidence_level: calculateConfidence(performance),
        recommended_difficulty: getDifficultyRecommendation(proficiencyLevel),
        prerequisite_skills: identifyPrerequisites(topic, proficiencyLevel),
        remedial_content_ids: findRemedialContent(topic)
      });
    }
  }
  
  return gaps;
}
```

#### Gap Categories
- **Critical Gaps**: Proficiency < 30% - Requires immediate attention
- **Significant Gaps**: Proficiency 30-50% - Needs focused remediation
- **Minor Gaps**: Proficiency 50-70% - Benefits from additional practice

### Remediation Recommendations

For each identified gap, the system provides:
- **Prerequisite Skills**: Foundational concepts to master first
- **Recommended Difficulty**: Appropriate starting level for improvement
- **Learning Resources**: Targeted content for gap remediation
- **Practice Assessments**: Personalized assessments for skill building

## Skill Mapping

### Skill Identification Process

#### From Assessment Results
```typescript
function extractSkills(assessment: Assessment, attempt: AssessmentAttempt): SkillLevel[] {
  const skills: Map<string, SkillData> = new Map();
  
  // Analyze each question's topics
  for (const question of assessment.questions) {
    for (const topic of question.topics) {
      const answer = attempt.answers.find(a => a.question_id === question.id);
      
      if (!skills.has(topic)) {
        skills.set(topic, { correct: 0, total: 0, difficulties: [] });
      }
      
      const skillData = skills.get(topic)!;
      skillData.total++;
      skillData.difficulties.push(question.difficulty_level);
      
      if (answer?.is_correct) {
        skillData.correct++;
      }
    }
  }
  
  // Convert to skill levels
  return Array.from(skills.entries()).map(([skill, data]) => ({
    skill,
    level: calculateSkillLevel(data),
    evidence: [`Assessment: ${assessment.title} (${Math.round(data.correct/data.total*100)}%)`],
    verified_at: attempt.submitted_at
  }));
}
```

#### Skill Level Calculation
```typescript
function calculateSkillLevel(skillData: SkillData): DifficultyLevel {
  const proficiency = skillData.correct / skillData.total;
  const avgDifficulty = skillData.difficulties.reduce((sum, d) => sum + d, 0) / skillData.difficulties.length;
  
  if (proficiency >= 0.8 && avgDifficulty >= 4) return 'advanced';
  if (proficiency >= 0.6 && avgDifficulty >= 2) return 'intermediate';
  return 'beginner';
}
```

### Skill Progression Tracking

The system tracks skill development over time:
- **Skill Advancement**: Movement between difficulty levels
- **Evidence Accumulation**: Multiple assessment results supporting skill level
- **Verification Status**: Confidence in skill level assessment

## Prerequisite Identification

### Prerequisite Mapping

#### Rule-Based Prerequisites
```typescript
function identifyPrerequisiteSkills(topic: string, proficiencyLevel: number): string[] {
  const prerequisites: string[] = [];
  
  // Very low proficiency - fundamental concepts needed
  if (proficiencyLevel < 3) {
    prerequisites.push(`Basic concepts in ${topic}`);
    prerequisites.push(`Fundamental terminology for ${topic}`);
  }
  
  // Low-medium proficiency - core principles needed
  if (proficiencyLevel < 5) {
    prerequisites.push(`Core principles of ${topic}`);
    prerequisites.push(`Common applications of ${topic}`);
  }
  
  // Medium proficiency - advanced concepts needed
  if (proficiencyLevel < 7) {
    prerequisites.push(`Advanced concepts in ${topic}`);
    prerequisites.push(`Complex problem-solving with ${topic}`);
  }
  
  return prerequisites;
}
```

#### Content-Based Prerequisites
Future implementations will analyze course content to identify:
- **Sequential Dependencies**: Topics that must be learned in order
- **Conceptual Prerequisites**: Foundational concepts required for understanding
- **Skill Prerequisites**: Abilities needed to succeed in content

### Prerequisite Assessment

```typescript
interface PrerequisiteAssessment {
  hasPrerequisites: boolean;      // Whether student meets requirements
  missingSkills: string[];        // Skills that need development
  recommendations: string[];      // Specific improvement suggestions
}
```

## Profile Update Mechanisms

### Automatic Updates

#### After Assessment Completion
1. **Gap Analysis**: Identify new or resolved knowledge gaps
2. **Skill Level Updates**: Adjust skill levels based on performance
3. **Proficiency Recalculation**: Update overall subject proficiency
4. **Evidence Accumulation**: Add assessment results as evidence

#### Update Algorithm
```typescript
async function updateKnowledgeProfile(
  studentId: string,
  assessmentResults: AssessmentAttempt[],
  knowledgeGaps: KnowledgeGap[]
): Promise<KnowledgeProfile> {
  // Build subject knowledge from gaps and results
  const subjectAreas = aggregateSubjectKnowledge(knowledgeGaps);
  
  // Extract skill levels from assessment evidence
  const skillLevels = extractSkillLevels(assessmentResults);
  
  // Create updated profile
  const knowledgeProfile: KnowledgeProfile = {
    subject_areas: Array.from(subjectAreas.values()),
    skill_levels: skillLevels,
    last_assessed: new Date().toISOString(),
    assessment_history: assessmentResults.map(r => r.assessment_id)
  };
  
  // Persist to database
  await UserProfileService.update(studentId, {
    knowledge_profile: knowledgeProfile
  });
  
  return knowledgeProfile;
}
```

### Manual Updates

Instructors can manually adjust knowledge profiles:
- **Skill Level Overrides**: Adjust skill levels based on observation
- **Gap Modifications**: Add or remove knowledge gaps
- **Evidence Addition**: Include external evidence of competency

## API Reference

### Knowledge Assessment Creation

#### POST `/api/knowledge-assessment/create`
Create a new initial knowledge assessment.

**Request Body:**
```json
{
  "subject_area": "Mathematics",
  "topics": ["Algebra", "Geometry", "Calculus"],
  "difficulty_levels": ["beginner", "intermediate", "advanced"],
  "question_count": 15,
  "time_limit": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assessment-uuid",
    "title": "Initial Knowledge Assessment: Mathematics",
    "questions": [...],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Knowledge Gap Analysis

#### POST `/api/knowledge-assessment/analyze`
Analyze assessment results to identify knowledge gaps.

**Request Body:**
```json
{
  "assessmentId": "assessment-uuid",
  "attemptId": "attempt-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "knowledge_gaps": [
      {
        "topic": "Algebra",
        "subject_area": "Mathematics",
        "proficiency_level": 4.5,
        "confidence_level": 4.2,
        "recommended_difficulty": "beginner",
        "prerequisite_skills": ["Basic arithmetic", "Number operations"],
        "remedial_content_ids": []
      }
    ],
    "gap_count": 1,
    "analysis_timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Knowledge Profile Retrieval

#### GET `/api/knowledge-assessment/profile/{studentId}`
Get a student's complete knowledge profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "knowledge_profile": {
      "subject_areas": [...],
      "skill_levels": [...],
      "last_assessed": "2024-01-01T00:00:00Z",
      "assessment_history": ["assessment-1", "assessment-2"]
    },
    "knowledge_gaps": [...],
    "has_profile": true,
    "gap_count": 3
  }
}
```

### Prerequisite Assessment

#### POST `/api/knowledge-assessment/prerequisites`
Assess whether a student meets prerequisites for content.

**Request Body:**
```json
{
  "contentId": "course-uuid",
  "contentType": "course"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasPrerequisites": false,
    "missingSkills": ["Advanced Algebra", "Trigonometry"],
    "recommendations": [
      "Improve Advanced Algebra to intermediate level",
      "Complete Trigonometry fundamentals"
    ]
  }
}
```

## Usage Examples

### For Students

#### Taking a Knowledge Assessment
```typescript
// Navigate to knowledge assessment
window.location.href = '/knowledge-assessment/Mathematics';

// Or use the component directly
<KnowledgeAssessment 
  subjectArea="Mathematics"
  onComplete={(gaps) => {
    console.log('Knowledge gaps identified:', gaps);
    // Handle completion
  }}
/>
```

#### Viewing Knowledge Profile
```typescript
// Display knowledge profile
<KnowledgeProfile 
  studentId={currentUser.id}
  showActions={true}
/>
```

### For Instructors

#### Creating Knowledge Assessments
```typescript
// Use the assessment builder component
<KnowledgeAssessmentBuilder 
  on:created={(event) => {
    const assessment = event.detail;
    console.log('Assessment created:', assessment);
  }}
  on:cancel={() => {
    // Handle cancellation
  }}
/>
```

#### Viewing Student Profiles
```typescript
// View any student's knowledge profile
<KnowledgeProfile 
  studentId={selectedStudent.id}
  showActions={false}
/>
```

### Programmatic Usage

#### Analyzing Knowledge Gaps
```typescript
import { KnowledgeAssessmentService } from '$lib/services/knowledgeAssessment.js';

// Analyze gaps from assessment attempt
const gaps = await KnowledgeAssessmentService.analyzeKnowledgeGaps(
  studentId,
  assessmentId,
  attemptId
);

// Update knowledge profile
const profile = await KnowledgeAssessmentService.updateKnowledgeProfile(
  studentId,
  assessmentResults,
  gaps
);
```

#### Checking Prerequisites
```typescript
// Check if student can access content
const prerequisiteCheck = await KnowledgeAssessmentService.assessPrerequisites(
  studentId,
  courseId,
  'course'
);

if (!prerequisiteCheck.hasPrerequisites) {
  console.log('Missing skills:', prerequisiteCheck.missingSkills);
  console.log('Recommendations:', prerequisiteCheck.recommendations);
}
```

## Best Practices

### For Assessment Creation
1. **Comprehensive Coverage**: Include questions across all difficulty levels
2. **Topic Balance**: Ensure even coverage of all topics in the subject area
3. **Clear Questions**: Write unambiguous questions with clear correct answers
4. **Appropriate Timing**: Set reasonable time limits for assessment completion

### For Gap Analysis
1. **Regular Updates**: Reassess knowledge profiles periodically
2. **Multiple Evidence**: Use multiple assessments to validate skill levels
3. **Context Consideration**: Consider the context in which assessments were taken
4. **Remediation Focus**: Prioritize critical gaps for immediate attention

### For Profile Interpretation
1. **Holistic View**: Consider the complete profile, not individual scores
2. **Trend Analysis**: Look at improvement trends over time
3. **Evidence Quality**: Weight evidence based on assessment quality and recency
4. **Student Input**: Consider student self-assessment and feedback

## Troubleshooting

### Common Issues

#### No Knowledge Profile
- **Cause**: Student hasn't taken any knowledge assessments
- **Solution**: Direct student to take initial knowledge assessment
- **Prevention**: Prompt new students to complete knowledge assessment during onboarding

#### Inaccurate Gap Analysis
- **Cause**: Limited assessment data or poor question quality
- **Solution**: Encourage retaking assessments or taking additional assessments
- **Prevention**: Create high-quality assessments with good topic coverage

#### Missing Prerequisites
- **Cause**: Knowledge profile doesn't reflect actual student abilities
- **Solution**: Update profile manually or have student retake relevant assessments
- **Prevention**: Regular profile updates and validation

### Error Handling

The system includes comprehensive error handling:
- **Assessment Loading Failures**: Graceful fallback with error messages
- **Analysis Failures**: Fallback to basic gap identification
- **Profile Update Failures**: Retry mechanisms with user notification
- **API Failures**: Clear error messages and recovery suggestions

## Future Enhancements

### Planned Features
1. **AI-Powered Gap Analysis**: Use machine learning for more accurate gap identification
2. **Adaptive Assessments**: Adjust question difficulty based on student responses
3. **Peer Comparison**: Compare knowledge profiles with similar students
4. **Learning Path Integration**: Automatically generate learning paths from profiles
5. **Competency Mapping**: Map skills to industry competency frameworks

### Integration Opportunities
1. **LMS Integration**: Connect with external learning management systems
2. **Content Recommendation**: Use profiles to recommend external learning resources
3. **Career Guidance**: Align knowledge profiles with career requirements
4. **Certification Tracking**: Track progress toward professional certifications

This comprehensive knowledge profiling system provides the foundation for truly personalized learning experiences, enabling students to understand their strengths and areas for improvement while giving instructors insights into student needs and progress.