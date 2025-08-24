/**
 * Knowledge Assessment Service
 * 
 * This service handles initial knowledge assessments, knowledge profile creation,
 * gap analysis, and prerequisite skill identification for personalized learning.
 */

import { supabase } from '$lib/supabase.js';
import type {
  Assessment,
  AssessmentAttempt,
  KnowledgeProfile,
  SubjectKnowledge,
  TopicKnowledge,
  SkillLevel,
  UserProfile,
  DifficultyLevel
} from '$lib/types/database.js';
import { AssessmentService, AssessmentAttemptService, UserProfileService } from './database.js';
import { handleDatabaseError } from '$lib/utils/errors.js';

// ============================================================================
// KNOWLEDGE ASSESSMENT TYPES
// ============================================================================

export interface KnowledgeAssessmentConfig {
  subject_area: string;
  topics: string[];
  difficulty_levels: DifficultyLevel[];
  question_count: number;
  time_limit?: number; // in minutes
}

export interface KnowledgeGap {
  topic: string;
  subject_area: string;
  proficiency_level: number; // 1-10 scale
  confidence_level: number; // 1-10 scale
  recommended_difficulty: DifficultyLevel;
  prerequisite_skills: string[];
  remedial_content_ids: string[];
}

export interface SkillAssessmentResult {
  skill: string;
  level: DifficultyLevel;
  confidence_score: number; // 0-1 scale
  evidence: AssessmentEvidence[];
  verified: boolean;
}

export interface AssessmentEvidence {
  assessment_id: string;
  question_topics: string[];
  score: number;
  difficulty_level: DifficultyLevel;
  timestamp: string;
}

export interface PrerequisiteSkill {
  skill: string;
  required_level: DifficultyLevel;
  assessment_criteria: string[];
  validation_questions: string[];
}

// ============================================================================
// KNOWLEDGE ASSESSMENT SERVICE
// ============================================================================

export class KnowledgeAssessmentService {
  /**
   * Create an initial knowledge assessment for a subject area
   */
  static async createInitialAssessment(config: KnowledgeAssessmentConfig): Promise<Assessment> {
    try {
      // Generate questions covering different topics and difficulty levels
      const questions = await this.generateKnowledgeAssessmentQuestions(config);
      
      const assessment: Partial<Assessment> = {
        title: `Initial Knowledge Assessment: ${config.subject_area}`,
        description: `Assess your current knowledge level in ${config.subject_area} to create a personalized learning path.`,
        questions,
        ai_generated: true,
        source_content_ids: [],
        is_mandatory: false, // Initial assessments are optional
        minimum_passing_score: 0, // No passing score for knowledge assessment
        max_attempts: null, // Unlimited attempts
        time_limit: config.time_limit || 30, // Default 30 minutes
        lesson_id: null,
        course_id: null
      };

      return await AssessmentService.create(assessment);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to create initial knowledge assessment');
    }
  }

  /**
   * Generate questions for knowledge assessment
   */
  private static async generateKnowledgeAssessmentQuestions(config: KnowledgeAssessmentConfig) {
    const questions = [];
    const questionsPerTopic = Math.ceil(config.question_count / config.topics.length);
    
    for (const topic of config.topics) {
      for (let i = 0; i < questionsPerTopic && questions.length < config.question_count; i++) {
        const difficultyLevel = config.difficulty_levels[i % config.difficulty_levels.length];
        const difficultyScore = this.getDifficultyScore(difficultyLevel);
        
        // Generate a sample question for the topic and difficulty
        const question = {
          id: crypto.randomUUID(),
          type: 'multiple_choice' as const,
          question_text: `Which of the following best describes ${topic} at ${difficultyLevel} level?`,
          options: [
            `Basic understanding of ${topic}`,
            `Intermediate knowledge of ${topic}`,
            `Advanced expertise in ${topic}`,
            `No knowledge of ${topic}`
          ],
          correct_answer: difficultyLevel === 'beginner' ? 'Basic understanding' : 
                          difficultyLevel === 'intermediate' ? 'Intermediate knowledge' : 
                          'Advanced expertise',
          explanation: `This question assesses your current knowledge level in ${topic}.`,
          difficulty_level: difficultyScore,
          topics: [topic],
          points: difficultyScore
        };
        
        questions.push(question);
      }
    }
    
    return questions;
  }

  /**
   * Convert difficulty level to numeric score
   */
  private static getDifficultyScore(level: DifficultyLevel): number {
    switch (level) {
      case 'beginner': return 1;
      case 'intermediate': return 3;
      case 'advanced': return 5;
      default: return 1;
    }
  }

  /**
   * Analyze assessment results to identify knowledge gaps
   */
  static async analyzeKnowledgeGaps(
    studentId: string,
    assessmentId: string,
    attemptId: string
  ): Promise<KnowledgeGap[]> {
    try {
      const attempt = await AssessmentAttemptService.getById(attemptId);
      const assessment = await AssessmentService.getById(assessmentId);
      
      if (!attempt || !assessment) {
        throw new Error('Assessment or attempt not found');
      }

      const gaps: KnowledgeGap[] = [];
      const topicScores = new Map<string, { correct: number; total: number; difficulty: number[] }>();

      // Analyze answers by topic
      for (const answer of attempt.answers) {
        const question = assessment.questions.find(q => q.id === answer.question_id);
        if (!question) continue;

        for (const topic of question.topics) {
          if (!topicScores.has(topic)) {
            topicScores.set(topic, { correct: 0, total: 0, difficulty: [] });
          }
          
          const topicData = topicScores.get(topic)!;
          topicData.total++;
          topicData.difficulty.push(question.difficulty_level);
          
          if (answer.is_correct) {
            topicData.correct++;
          }
        }
      }

      // Identify gaps based on performance
      for (const [topic, data] of topicScores) {
        const proficiencyLevel = (data.correct / data.total) * 10; // Scale to 1-10
        const avgDifficulty = data.difficulty.reduce((sum, d) => sum + d, 0) / data.difficulty.length;
        
        // Consider it a gap if proficiency is below 70%
        if (proficiencyLevel < 7) {
          const gap: KnowledgeGap = {
            topic,
            subject_area: assessment.title.split(':')[1]?.trim() || 'General',
            proficiency_level: proficiencyLevel,
            confidence_level: proficiencyLevel, // Simplified - could be more sophisticated
            recommended_difficulty: avgDifficulty <= 2 ? 'beginner' : 
                                  avgDifficulty <= 4 ? 'intermediate' : 'advanced',
            prerequisite_skills: await this.identifyPrerequisiteSkills(topic, proficiencyLevel),
            remedial_content_ids: [] // Would be populated with actual content IDs
          };
          
          gaps.push(gap);
        }
      }

      return gaps;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to analyze knowledge gaps');
    }
  }

  /**
   * Create or update knowledge profile based on assessment results
   */
  static async updateKnowledgeProfile(
    studentId: string,
    assessmentResults: AssessmentAttempt[],
    knowledgeGaps: KnowledgeGap[]
  ): Promise<KnowledgeProfile> {
    try {
      const profile = await UserProfileService.getById(studentId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Build subject knowledge from assessment results
      const subjectAreas = new Map<string, SubjectKnowledge>();
      
      for (const gap of knowledgeGaps) {
        if (!subjectAreas.has(gap.subject_area)) {
          subjectAreas.set(gap.subject_area, {
            subject: gap.subject_area,
            proficiency_level: 0,
            topics: [],
            last_updated: new Date().toISOString()
          });
        }
        
        const subject = subjectAreas.get(gap.subject_area)!;
        subject.topics.push({
          topic: gap.topic,
          confidence_level: gap.confidence_level,
          mastery_indicators: gap.prerequisite_skills
        });
        
        // Update overall proficiency (average of topic proficiencies)
        const avgProficiency = subject.topics.reduce((sum, t) => sum + t.confidence_level, 0) / subject.topics.length;
        subject.proficiency_level = avgProficiency;
      }

      // Build skill levels from assessment evidence
      const skillLevels: SkillLevel[] = [];
      for (const result of assessmentResults) {
        const assessment = await AssessmentService.getById(result.assessment_id);
        if (!assessment) continue;

        // Extract skills from question topics
        const skills = new Set<string>();
        for (const question of assessment.questions) {
          question.topics.forEach(topic => skills.add(topic));
        }

        for (const skill of skills) {
          const skillQuestions = assessment.questions.filter(q => q.topics.includes(skill));
          const skillAnswers = result.answers.filter(a => 
            skillQuestions.some(q => q.id === a.question_id)
          );
          
          const skillScore = skillAnswers.reduce((sum, a) => sum + (a.is_correct ? 1 : 0), 0) / skillAnswers.length;
          const skillLevel: DifficultyLevel = skillScore >= 0.8 ? 'advanced' : 
                                            skillScore >= 0.6 ? 'intermediate' : 'beginner';

          skillLevels.push({
            skill,
            level: skillLevel,
            evidence: [`Assessment: ${assessment.title} (Score: ${Math.round(skillScore * 100)}%)`],
            verified_at: result.submitted_at
          });
        }
      }

      // Create updated knowledge profile
      const knowledgeProfile: KnowledgeProfile = {
        subject_areas: Array.from(subjectAreas.values()),
        skill_levels: skillLevels,
        last_assessed: new Date().toISOString(),
        assessment_history: assessmentResults.map(r => r.assessment_id)
      };

      // Update user profile with new knowledge profile
      await UserProfileService.update(studentId, {
        knowledge_profile: knowledgeProfile
      });

      return knowledgeProfile;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to update knowledge profile');
    }
  }

  /**
   * Identify prerequisite skills for a topic based on proficiency level
   */
  static async identifyPrerequisiteSkills(topic: string, proficiencyLevel: number): Promise<string[]> {
    // This would typically use AI or a knowledge graph
    // For now, we'll use a simple rule-based approach
    const prerequisites: string[] = [];
    
    // If proficiency is very low, suggest fundamental skills
    if (proficiencyLevel < 3) {
      prerequisites.push(`Basic concepts in ${topic}`);
      prerequisites.push(`Fundamental terminology for ${topic}`);
    }
    
    // If proficiency is low-medium, suggest intermediate prerequisites
    if (proficiencyLevel < 5) {
      prerequisites.push(`Core principles of ${topic}`);
      prerequisites.push(`Common applications of ${topic}`);
    }
    
    // If proficiency is medium, suggest advanced prerequisites
    if (proficiencyLevel < 7) {
      prerequisites.push(`Advanced concepts in ${topic}`);
      prerequisites.push(`Complex problem-solving with ${topic}`);
    }
    
    return prerequisites;
  }

  /**
   * Get knowledge assessment for a subject area
   */
  static async getKnowledgeAssessment(subjectArea: string): Promise<Assessment | null> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .ilike('title', `%Initial Knowledge Assessment: ${subjectArea}%`)
        .eq('is_mandatory', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? {
        ...data,
        questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions
      } : null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to get knowledge assessment');
    }
  }

  /**
   * Get student's knowledge profile
   */
  static async getStudentKnowledgeProfile(studentId: string): Promise<KnowledgeProfile | null> {
    try {
      const profile = await UserProfileService.getById(studentId);
      return profile?.knowledge_profile || null;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to get student knowledge profile');
    }
  }

  /**
   * Get knowledge gaps for a student
   */
  static async getStudentKnowledgeGaps(studentId: string): Promise<KnowledgeGap[]> {
    try {
      const profile = await this.getStudentKnowledgeProfile(studentId);
      if (!profile) return [];

      const gaps: KnowledgeGap[] = [];
      
      for (const subject of profile.subject_areas) {
        for (const topic of subject.topics) {
          // Consider topics with confidence < 7 as gaps
          if (topic.confidence_level < 7) {
            gaps.push({
              topic: topic.topic,
              subject_area: subject.subject,
              proficiency_level: subject.proficiency_level,
              confidence_level: topic.confidence_level,
              recommended_difficulty: topic.confidence_level < 3 ? 'beginner' :
                                    topic.confidence_level < 6 ? 'intermediate' : 'advanced',
              prerequisite_skills: topic.mastery_indicators,
              remedial_content_ids: []
            });
          }
        }
      }

      return gaps;
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to get student knowledge gaps');
    }
  }

  /**
   * Assess prerequisite skills for a course or lesson
   */
  static async assessPrerequisites(
    studentId: string,
    contentId: string,
    contentType: 'course' | 'lesson'
  ): Promise<{ hasPrerequisites: boolean; missingSkills: string[]; recommendations: string[] }> {
    try {
      const profile = await this.getStudentKnowledgeProfile(studentId);
      if (!profile) {
        return {
          hasPrerequisites: false,
          missingSkills: [],
          recommendations: ['Complete initial knowledge assessment']
        };
      }

      // Get content requirements (this would be stored in content metadata)
      const requiredSkills = await this.getContentRequiredSkills(contentId, contentType);
      const missingSkills: string[] = [];
      const recommendations: string[] = [];

      for (const requiredSkill of requiredSkills) {
        const studentSkill = profile.skill_levels.find(s => s.skill === requiredSkill.skill);
        
        if (!studentSkill || this.compareDifficultyLevels(studentSkill.level, requiredSkill.required_level) < 0) {
          missingSkills.push(requiredSkill.skill);
          recommendations.push(`Improve ${requiredSkill.skill} to ${requiredSkill.required_level} level`);
        }
      }

      return {
        hasPrerequisites: missingSkills.length === 0,
        missingSkills,
        recommendations
      };
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to assess prerequisites');
    }
  }

  /**
   * Get required skills for content (placeholder - would be stored in content metadata)
   */
  private static async getContentRequiredSkills(
    contentId: string,
    contentType: 'course' | 'lesson'
  ): Promise<PrerequisiteSkill[]> {
    // This would typically query content metadata or use AI to analyze content
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Compare difficulty levels numerically
   */
  private static compareDifficultyLevels(level1: DifficultyLevel, level2: DifficultyLevel): number {
    const levels = { beginner: 1, intermediate: 2, advanced: 3 };
    return levels[level1] - levels[level2];
  }

  /**
   * Generate personalized assessment based on knowledge gaps
   */
  static async generatePersonalizedAssessment(
    studentId: string,
    subjectArea: string
  ): Promise<Assessment> {
    try {
      const gaps = await this.getStudentKnowledgeGaps(studentId);
      const subjectGaps = gaps.filter(g => g.subject_area === subjectArea);

      if (subjectGaps.length === 0) {
        throw new Error('No knowledge gaps found for personalized assessment');
      }

      const questions = [];
      for (const gap of subjectGaps.slice(0, 10)) { // Limit to 10 questions
        const question = {
          id: crypto.randomUUID(),
          type: 'multiple_choice' as const,
          question_text: `Based on your knowledge gap in ${gap.topic}, which approach would you take?`,
          options: [
            `Review basic concepts of ${gap.topic}`,
            `Practice intermediate problems in ${gap.topic}`,
            `Study advanced applications of ${gap.topic}`,
            `Skip ${gap.topic} for now`
          ],
          correct_answer: gap.recommended_difficulty === 'beginner' ? 'Review basic concepts' :
                          gap.recommended_difficulty === 'intermediate' ? 'Practice intermediate problems' :
                          'Study advanced applications',
          explanation: `This question targets your identified knowledge gap in ${gap.topic}.`,
          difficulty_level: this.getDifficultyScore(gap.recommended_difficulty),
          topics: [gap.topic],
          points: this.getDifficultyScore(gap.recommended_difficulty)
        };
        
        questions.push(question);
      }

      const assessment: Partial<Assessment> = {
        title: `Personalized Assessment: ${subjectArea}`,
        description: `Targeted assessment based on your identified knowledge gaps in ${subjectArea}.`,
        questions,
        ai_generated: true,
        source_content_ids: [],
        is_mandatory: false,
        minimum_passing_score: 70,
        max_attempts: 3,
        time_limit: 20,
        lesson_id: null,
        course_id: null
      };

      return await AssessmentService.create(assessment);
    } catch (error) {
      throw handleDatabaseError(error, 'Failed to generate personalized assessment');
    }
  }
}