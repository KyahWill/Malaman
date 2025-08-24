/**
 * Adaptive Roadmap Service
 * Handles automatic roadmap adjustments based on student performance and learning patterns
 */

import { supabase } from '$lib/supabase.js';
import { getAIService } from './ai/index.js';
import { getRoadmapService, type PersonalizedRoadmap, type RoadmapData, type LearningPathItem } from './roadmapService.js';
import { ProgressionControlService } from './progressionControl.js';
import type { AssessmentAttempt } from '$lib/types/database.js';

export interface LearningPattern {
  student_id: string;
  pattern_type: 'struggle_area' | 'strength_area' | 'learning_pace' | 'content_preference';
  pattern_data: {
    topic?: string;
    difficulty_level?: string;
    content_type?: string;
    engagement_score?: number;
    completion_time?: number;
    retry_count?: number;
  };
  confidence_score: number; // 0-1, how confident we are in this pattern
  detected_at: string;
  last_updated: string;
}

export interface RemedialContent {
  id: string;
  title: string;
  content_type: 'lesson' | 'practice' | 'review';
  target_topics: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: number;
  description: string;
  prerequisites: string[];
  learning_objectives: string[];
}

export interface AdaptiveAdjustment {
  id: string;
  student_id: string;
  roadmap_id: string;
  trigger_event: 'assessment_failure' | 'repeated_struggles' | 'pace_mismatch' | 'engagement_drop';
  trigger_data: any;
  adjustment_type: 'add_remedial' | 'change_sequence' | 'alternative_path' | 'pace_adjustment';
  adjustment_data: any;
  reasoning: string;
  applied_at: string;
  effectiveness_score?: number; // Measured after implementation
}

export interface AlternativePath {
  id: string;
  original_content_id: string;
  alternative_content: LearningPathItem[];
  reason: string;
  difficulty_adjustment: 'easier' | 'different_approach' | 'more_practice';
  estimated_time_difference: number;
}

export class AdaptiveRoadmapService {
  private roadmapService = getRoadmapService();
  private aiService = getAIService();

  /**
   * Handle assessment failure and trigger adaptive adjustments
   */
  async handleAssessmentFailure(
    studentId: string,
    assessmentId: string,
    attemptData: AssessmentAttempt
  ): Promise<PersonalizedRoadmap | null> {
    try {
      console.log(`Handling assessment failure for student ${studentId}, assessment ${assessmentId}`);

      // Analyze the failure patterns
      const failureAnalysis = await this.analyzeAssessmentFailure(studentId, assessmentId, attemptData);
      
      // Update learning patterns
      await this.updateLearningPatterns(studentId, failureAnalysis);

      // Get current roadmap
      const currentRoadmap = await this.roadmapService.getActiveRoadmap(studentId);
      if (!currentRoadmap) {
        console.warn('No active roadmap found for student');
        return null;
      }

      // Generate adaptive adjustments
      const adjustments = await this.generateAdaptiveAdjustments(
        studentId,
        currentRoadmap,
        failureAnalysis
      );

      // Apply adjustments to roadmap
      const adjustedRoadmap = await this.applyAdjustments(currentRoadmap, adjustments);

      // Save the adjusted roadmap
      const updatedRoadmap = await this.saveAdjustedRoadmap(adjustedRoadmap);

      // Log the adjustment for tracking effectiveness
      await this.logAdjustment({
        student_id: studentId,
        roadmap_id: currentRoadmap.id,
        trigger_event: 'assessment_failure',
        trigger_data: {
          assessment_id: assessmentId,
          score: attemptData.score,
          attempt_number: attemptData.attempt_number
        },
        adjustment_type: 'add_remedial',
        adjustment_data: adjustments,
        reasoning: failureAnalysis.reasoning,
        applied_at: new Date().toISOString()
      });

      return updatedRoadmap;
    } catch (error) {
      console.error('Failed to handle assessment failure:', error);
      throw new Error('Failed to adapt roadmap for assessment failure');
    }
  }

  /**
   * Analyze assessment failure to understand knowledge gaps
   */
  private async analyzeAssessmentFailure(
    studentId: string,
    assessmentId: string,
    attemptData: AssessmentAttempt
  ): Promise<any> {
    try {
      // Get assessment details
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select(`
          *,
          lesson:lessons(*),
          course:courses(*)
        `)
        .eq('id', assessmentId)
        .single();

      if (error) throw error;

      // Get student's previous attempts on this assessment
      const { data: previousAttempts, error: attemptsError } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_id', assessmentId)
        .order('attempt_number', { ascending: true });

      if (attemptsError) throw attemptsError;

      // Analyze wrong answers to identify knowledge gaps
      const wrongAnswers = attemptData.answers.filter(answer => !answer.is_correct);
      const topicGaps = this.identifyTopicGaps(wrongAnswers, assessment.questions);

      // Check for patterns in previous attempts
      const attemptPatterns = this.analyzeAttemptPatterns(previousAttempts || []);

      // Get student's overall performance in related topics
      const relatedPerformance = await this.getRelatedTopicPerformance(studentId, topicGaps);

      return {
        assessment_id: assessmentId,
        score: attemptData.score,
        attempt_number: attemptData.attempt_number,
        topic_gaps: topicGaps,
        attempt_patterns: attemptPatterns,
        related_performance: relatedPerformance,
        reasoning: this.generateFailureReasoning(topicGaps, attemptPatterns, relatedPerformance)
      };
    } catch (error) {
      console.error('Failed to analyze assessment failure:', error);
      throw error;
    }
  }

  /**
   * Identify knowledge gaps from wrong answers
   */
  private identifyTopicGaps(wrongAnswers: any[], questions: any[]): string[] {
    const topicGaps: string[] = [];
    
    wrongAnswers.forEach(answer => {
      const question = questions.find(q => q.id === answer.question_id);
      if (question && question.topics) {
        topicGaps.push(...question.topics);
      }
    });

    // Return unique topics
    return [...new Set(topicGaps)];
  }

  /**
   * Analyze patterns across multiple attempts
   */
  private analyzeAttemptPatterns(attempts: AssessmentAttempt[]): any {
    if (attempts.length < 2) {
      return { pattern: 'insufficient_data' };
    }

    const scores = attempts.map(a => a.score);
    const timeSpent = attempts.map(a => a.time_spent);

    // Check for improvement or decline
    const isImproving = scores[scores.length - 1] > scores[0];
    const averageImprovement = scores.length > 1 ? 
      (scores[scores.length - 1] - scores[0]) / (scores.length - 1) : 0;

    // Check time patterns
    const averageTime = timeSpent.reduce((sum, time) => sum + time, 0) / timeSpent.length;
    const timeVariation = Math.max(...timeSpent) - Math.min(...timeSpent);

    return {
      pattern: isImproving ? 'improving' : 'struggling',
      average_improvement: averageImprovement,
      attempt_count: attempts.length,
      average_time: averageTime,
      time_variation: timeVariation,
      consistent_errors: this.findConsistentErrors(attempts)
    };
  }

  /**
   * Find errors that appear consistently across attempts
   */
  private findConsistentErrors(attempts: AssessmentAttempt[]): string[] {
    const errorCounts = new Map<string, number>();
    
    attempts.forEach(attempt => {
      const wrongAnswers = attempt.answers.filter(a => !a.is_correct);
      wrongAnswers.forEach(answer => {
        const key = answer.question_id;
        errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
      });
    });

    // Return questions that were wrong in most attempts
    const threshold = Math.ceil(attempts.length * 0.6); // 60% of attempts
    return Array.from(errorCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([questionId, _]) => questionId);
  }

  /**
   * Get student's performance in related topics
   */
  private async getRelatedTopicPerformance(studentId: string, topics: string[]): Promise<any> {
    try {
      // This would ideally query a topics performance table
      // For now, we'll get recent assessment performance
      const { data: recentAttempts, error } = await supabase
        .from('assessment_attempts')
        .select(`
          *,
          assessment:assessments(questions)
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const topicPerformance = new Map<string, { total: number, correct: number }>();

      recentAttempts?.forEach(attempt => {
        attempt.answers.forEach((answer: any) => {
          const question = attempt.assessment.questions.find((q: any) => q.id === answer.question_id);
          if (question && question.topics) {
            question.topics.forEach((topic: string) => {
              if (topics.includes(topic)) {
                const current = topicPerformance.get(topic) || { total: 0, correct: 0 };
                current.total += 1;
                if (answer.is_correct) current.correct += 1;
                topicPerformance.set(topic, current);
              }
            });
          }
        });
      });

      // Convert to performance percentages
      const performance: Record<string, number> = {};
      topicPerformance.forEach((stats, topic) => {
        performance[topic] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      });

      return performance;
    } catch (error) {
      console.error('Failed to get related topic performance:', error);
      return {};
    }
  }

  /**
   * Generate reasoning for the failure
   */
  private generateFailureReasoning(topicGaps: string[], attemptPatterns: any, relatedPerformance: any): string {
    const reasons = [];

    if (topicGaps.length > 0) {
      reasons.push(`Knowledge gaps identified in: ${topicGaps.join(', ')}`);
    }

    if (attemptPatterns.pattern === 'struggling') {
      reasons.push('Student shows consistent struggling pattern across attempts');
    }

    if (attemptPatterns.consistent_errors?.length > 0) {
      reasons.push('Consistent errors suggest fundamental misunderstanding');
    }

    const weakTopics = Object.entries(relatedPerformance)
      .filter(([_, score]) => (score as number) < 60)
      .map(([topic, _]) => topic);

    if (weakTopics.length > 0) {
      reasons.push(`Weak performance in related topics: ${weakTopics.join(', ')}`);
    }

    return reasons.join('. ') || 'Assessment failure requires remedial intervention';
  }

  /**
   * Generate adaptive adjustments based on failure analysis
   */
  private async generateAdaptiveAdjustments(
    studentId: string,
    roadmap: PersonalizedRoadmap,
    failureAnalysis: any
  ): Promise<any> {
    try {
      // Use AI to generate intelligent adjustments
      const adjustmentPrompt = `
        A student has failed an assessment and needs adaptive roadmap adjustments.
        
        Student ID: ${studentId}
        Current Roadmap: ${JSON.stringify(roadmap.roadmap_data, null, 2)}
        Failure Analysis: ${JSON.stringify(failureAnalysis, null, 2)}
        
        Please suggest specific adjustments including:
        1. Remedial content to address knowledge gaps
        2. Alternative learning approaches
        3. Prerequisite review if needed
        4. Modified pacing or sequencing
        
        Focus on the identified topic gaps: ${failureAnalysis.topic_gaps.join(', ')}
        
        Respond with a JSON object containing specific adjustment recommendations.
      `;

      const response = await this.aiService.generateText(adjustmentPrompt, {
        responseFormat: 'json',
        systemPrompt: 'You are an adaptive learning specialist. Provide specific, actionable adjustments to help struggling students succeed.'
      });

      const aiAdjustments = JSON.parse(response.content);

      // Combine AI suggestions with rule-based adjustments
      const ruleBasedAdjustments = this.generateRuleBasedAdjustments(failureAnalysis);

      return {
        ai_suggestions: aiAdjustments,
        rule_based: ruleBasedAdjustments,
        combined_strategy: this.combineAdjustmentStrategies(aiAdjustments, ruleBasedAdjustments)
      };
    } catch (error) {
      console.error('Failed to generate AI adjustments, using rule-based fallback:', error);
      return {
        rule_based: this.generateRuleBasedAdjustments(failureAnalysis),
        combined_strategy: this.generateRuleBasedAdjustments(failureAnalysis)
      };
    }
  }

  /**
   * Generate rule-based adjustments as fallback
   */
  private generateRuleBasedAdjustments(failureAnalysis: any): any {
    const adjustments = {
      remedial_content: [],
      sequence_changes: [],
      alternative_paths: [],
      pace_adjustments: []
    };

    // Add remedial content for each topic gap
    failureAnalysis.topic_gaps.forEach((topic: string) => {
      adjustments.remedial_content.push({
        type: 'review_lesson',
        topic: topic,
        title: `Review: ${topic}`,
        estimated_time: 30,
        difficulty_level: 'beginner',
        description: `Focused review of ${topic} concepts to address knowledge gaps`
      });
    });

    // If multiple attempts show no improvement, suggest alternative approach
    if (failureAnalysis.attempt_patterns.pattern === 'struggling' && 
        failureAnalysis.attempt_patterns.attempt_count >= 3) {
      adjustments.alternative_paths.push({
        type: 'different_approach',
        reason: 'Multiple failed attempts suggest need for alternative learning method',
        suggestion: 'Switch to more interactive or visual learning materials'
      });
    }

    // If consistent errors, add prerequisite review
    if (failureAnalysis.attempt_patterns.consistent_errors?.length > 0) {
      adjustments.sequence_changes.push({
        type: 'add_prerequisites',
        reason: 'Consistent errors suggest missing foundational knowledge',
        action: 'Add prerequisite review before retrying assessment'
      });
    }

    return adjustments;
  }

  /**
   * Combine AI and rule-based adjustment strategies
   */
  private combineAdjustmentStrategies(aiSuggestions: any, ruleBasedAdjustments: any): any {
    // Prioritize AI suggestions but fall back to rule-based for missing elements
    return {
      remedial_content: aiSuggestions.remedial_content || ruleBasedAdjustments.remedial_content,
      sequence_changes: aiSuggestions.sequence_changes || ruleBasedAdjustments.sequence_changes,
      alternative_paths: aiSuggestions.alternative_paths || ruleBasedAdjustments.alternative_paths,
      pace_adjustments: aiSuggestions.pace_adjustments || ruleBasedAdjustments.pace_adjustments,
      reasoning: aiSuggestions.reasoning || 'Generated using rule-based fallback system'
    };
  }

  /**
   * Apply adjustments to the roadmap
   */
  private async applyAdjustments(
    roadmap: PersonalizedRoadmap,
    adjustments: any
  ): Promise<PersonalizedRoadmap> {
    const adjustedRoadmapData = { ...roadmap.roadmap_data };
    const learningPath = [...adjustedRoadmapData.learning_path];

    // Apply remedial content
    if (adjustments.combined_strategy.remedial_content) {
      for (const remedial of adjustments.combined_strategy.remedial_content) {
        const remedialItem: LearningPathItem = {
          content_id: `remedial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content_type: 'lesson',
          title: remedial.title,
          order_index: 0, // Will be adjusted below
          estimated_time: remedial.estimated_time || 30,
          prerequisites: [],
          learning_objectives: [`Review ${remedial.topic}`, 'Address knowledge gaps'],
          personalization_notes: remedial.description,
          difficulty_level: remedial.difficulty_level || 'beginner',
          is_unlocked: true,
          completion_status: 'not_started'
        };

        // Insert remedial content at appropriate position
        const insertIndex = this.findInsertionPoint(learningPath, remedial.topic);
        learningPath.splice(insertIndex, 0, remedialItem);
      }
    }

    // Reorder indices
    learningPath.forEach((item, index) => {
      item.order_index = index;
    });

    // Update total estimated time
    adjustedRoadmapData.total_estimated_time = learningPath.reduce(
      (sum, item) => sum + item.estimated_time, 0
    );

    // Update learning path
    adjustedRoadmapData.learning_path = learningPath;

    // Add adjustment reasoning
    adjustedRoadmapData.personalization_reasoning += 
      `\n\nAdaptive Adjustment: ${adjustments.combined_strategy.reasoning}`;

    return {
      ...roadmap,
      roadmap_data: adjustedRoadmapData
    };
  }

  /**
   * Find appropriate insertion point for remedial content
   */
  private findInsertionPoint(learningPath: LearningPathItem[], topic: string): number {
    // Find the first item that might relate to this topic
    const relatedIndex = learningPath.findIndex(item => 
      item.learning_objectives.some(obj => 
        obj.toLowerCase().includes(topic.toLowerCase())
      ) || item.title.toLowerCase().includes(topic.toLowerCase())
    );

    // Insert before the related content, or at the beginning if not found
    return relatedIndex >= 0 ? relatedIndex : 0;
  }

  /**
   * Save adjusted roadmap to database
   */
  private async saveAdjustedRoadmap(roadmap: PersonalizedRoadmap): Promise<PersonalizedRoadmap> {
    try {
      const { data, error } = await supabase
        .from('personalized_roadmaps')
        .update({
          roadmap_data: roadmap.roadmap_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', roadmap.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save adjusted roadmap:', error);
      throw error;
    }
  }

  /**
   * Update learning patterns based on student behavior
   */
  private async updateLearningPatterns(studentId: string, analysisData: any): Promise<void> {
    try {
      // Create learning patterns from the analysis
      const patterns: Partial<LearningPattern>[] = [];

      // Add struggle patterns for topic gaps
      analysisData.topic_gaps.forEach((topic: string) => {
        patterns.push({
          student_id: studentId,
          pattern_type: 'struggle_area',
          pattern_data: {
            topic: topic,
            difficulty_level: 'needs_review'
          },
          confidence_score: 0.8,
          detected_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        });
      });

      // Add pace pattern if multiple attempts
      if (analysisData.attempt_patterns.attempt_count > 2) {
        patterns.push({
          student_id: studentId,
          pattern_type: 'learning_pace',
          pattern_data: {
            retry_count: analysisData.attempt_patterns.attempt_count,
            completion_time: analysisData.attempt_patterns.average_time
          },
          confidence_score: 0.7,
          detected_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        });
      }

      // Store patterns (this would typically go to a learning_patterns table)
      // For now, we'll store in the student's profile
      const { error } = await supabase
        .from('profiles')
        .update({
          learning_preferences: {
            detected_patterns: patterns,
            last_pattern_update: new Date().toISOString()
          }
        })
        .eq('id', studentId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update learning patterns:', error);
      // Don't throw - this is supplementary data
    }
  }

  /**
   * Log adjustment for effectiveness tracking
   */
  private async logAdjustment(adjustment: Omit<AdaptiveAdjustment, 'id'>): Promise<void> {
    try {
      // This would typically go to an adaptive_adjustments table
      // For now, we'll log to console and could store in a simple log table
      console.log('Adaptive adjustment applied:', adjustment);

      // Could implement database logging here
      // await supabase.from('adaptive_adjustments').insert(adjustment);
    } catch (error) {
      console.error('Failed to log adjustment:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  /**
   * Detect learning patterns from student interaction data
   */
  async detectLearningPatterns(studentId: string): Promise<LearningPattern[]> {
    try {
      // Get recent student activity
      const { data: recentProgress, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .order('last_accessed', { ascending: false })
        .limit(20);

      if (error) throw error;

      const patterns: LearningPattern[] = [];

      // Analyze time patterns
      const timePattern = this.analyzeTimePatterns(recentProgress || []);
      if (timePattern) {
        patterns.push(timePattern);
      }

      // Analyze completion patterns
      const completionPattern = this.analyzeCompletionPatterns(recentProgress || []);
      if (completionPattern) {
        patterns.push(completionPattern);
      }

      return patterns;
    } catch (error) {
      console.error('Failed to detect learning patterns:', error);
      return [];
    }
  }

  /**
   * Analyze time-based learning patterns
   */
  private analyzeTimePatterns(progressData: any[]): LearningPattern | null {
    if (progressData.length < 5) return null;

    const timesSpent = progressData.map(p => p.time_spent).filter(t => t > 0);
    if (timesSpent.length < 3) return null;

    const averageTime = timesSpent.reduce((sum, time) => sum + time, 0) / timesSpent.length;
    const variance = timesSpent.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / timesSpent.length;

    let paceType = 'medium';
    if (averageTime < 300) paceType = 'fast'; // Less than 5 minutes average
    else if (averageTime > 1800) paceType = 'slow'; // More than 30 minutes average

    return {
      student_id: progressData[0].student_id,
      pattern_type: 'learning_pace',
      pattern_data: {
        completion_time: averageTime,
        engagement_score: Math.min(1, 600 / averageTime) // Higher score for reasonable time spent
      },
      confidence_score: Math.min(0.9, timesSpent.length / 10),
      detected_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Analyze completion patterns
   */
  private analyzeCompletionPatterns(progressData: any[]): LearningPattern | null {
    if (progressData.length < 5) return null;

    const completionRate = progressData.filter(p => p.status === 'completed').length / progressData.length;
    const averageCompletion = progressData.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / progressData.length;

    if (completionRate < 0.3 || averageCompletion < 50) {
      return {
        student_id: progressData[0].student_id,
        pattern_type: 'struggle_area',
        pattern_data: {
          engagement_score: completionRate,
          completion_time: averageCompletion
        },
        confidence_score: 0.7,
        detected_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Generate alternative learning paths for struggling students
   */
  async generateAlternativePaths(
    studentId: string,
    currentContentId: string,
    strugglingTopics: string[]
  ): Promise<AlternativePath[]> {
    try {
      const alternativePaths: AlternativePath[] = [];

      // For each struggling topic, create alternative approaches
      for (const topic of strugglingTopics) {
        // Find alternative content for this topic
        const { data: alternativeContent, error } = await supabase
          .from('lessons')
          .select(`
            id,
            title,
            description,
            difficulty_level,
            estimated_duration,
            learning_objectives
          `)
          .contains('learning_objectives', [topic])
          .neq('id', currentContentId)
          .eq('is_published', true)
          .order('difficulty_level')
          .limit(3);

        if (error) throw error;

        if (alternativeContent && alternativeContent.length > 0) {
          const alternativeItems: LearningPathItem[] = alternativeContent.map((content, index) => ({
            content_id: content.id,
            content_type: 'lesson',
            title: content.title,
            order_index: index,
            estimated_time: content.estimated_duration || 60,
            prerequisites: [],
            learning_objectives: content.learning_objectives || [],
            personalization_notes: `Alternative approach for ${topic}`,
            difficulty_level: content.difficulty_level || 'beginner',
            is_unlocked: true,
            completion_status: 'not_started'
          }));

          alternativePaths.push({
            id: `alt-${topic}-${Date.now()}`,
            original_content_id: currentContentId,
            alternative_content: alternativeItems,
            reason: `Alternative learning approach for ${topic} to address learning difficulties`,
            difficulty_adjustment: 'easier',
            estimated_time_difference: alternativeItems.reduce((sum, item) => sum + item.estimated_time, 0) - 60
          });
        }
      }

      return alternativePaths;
    } catch (error) {
      console.error('Failed to generate alternative paths:', error);
      return [];
    }
  }

  /**
   * Monitor and adjust roadmap based on continuous learning patterns
   */
  async monitorAndAdjust(studentId: string): Promise<void> {
    try {
      // Detect current learning patterns
      const patterns = await this.detectLearningPatterns(studentId);
      
      // Get current roadmap
      const roadmap = await this.roadmapService.getActiveRoadmap(studentId);
      if (!roadmap) return;

      // Check if adjustments are needed based on patterns
      const needsAdjustment = patterns.some(pattern => 
        pattern.pattern_type === 'struggle_area' && pattern.confidence_score > 0.6
      );

      if (needsAdjustment) {
        console.log(`Continuous monitoring detected need for adjustment for student ${studentId}`);
        
        // Generate and apply minor adjustments
        const adjustments = await this.generateContinuousAdjustments(patterns, roadmap);
        if (adjustments.length > 0) {
          await this.applyContinuousAdjustments(roadmap, adjustments);
        }
      }
    } catch (error) {
      console.error('Failed to monitor and adjust roadmap:', error);
      // Don't throw - this is background monitoring
    }
  }

  /**
   * Generate continuous adjustments based on learning patterns
   */
  private async generateContinuousAdjustments(
    patterns: LearningPattern[],
    roadmap: PersonalizedRoadmap
  ): Promise<any[]> {
    const adjustments = [];

    for (const pattern of patterns) {
      if (pattern.pattern_type === 'learning_pace' && pattern.pattern_data.completion_time) {
        // Adjust pacing based on observed learning speed
        const avgTime = pattern.pattern_data.completion_time;
        if (avgTime > 1800) { // Slower than 30 minutes
          adjustments.push({
            type: 'pace_adjustment',
            action: 'increase_time_estimates',
            factor: 1.5,
            reason: 'Student needs more time than average'
          });
        } else if (avgTime < 300) { // Faster than 5 minutes
          adjustments.push({
            type: 'pace_adjustment',
            action: 'add_advanced_content',
            reason: 'Student progresses quickly, may benefit from additional challenges'
          });
        }
      }

      if (pattern.pattern_type === 'struggle_area' && pattern.pattern_data.engagement_score) {
        const engagementScore = pattern.pattern_data.engagement_score;
        if (engagementScore < 0.5) {
          adjustments.push({
            type: 'engagement_boost',
            action: 'add_interactive_content',
            reason: 'Low engagement detected, adding more interactive elements'
          });
        }
      }
    }

    return adjustments;
  }

  /**
   * Apply continuous adjustments to roadmap
   */
  private async applyContinuousAdjustments(
    roadmap: PersonalizedRoadmap,
    adjustments: any[]
  ): Promise<void> {
    try {
      let modified = false;
      const roadmapData = { ...roadmap.roadmap_data };

      for (const adjustment of adjustments) {
        if (adjustment.type === 'pace_adjustment' && adjustment.action === 'increase_time_estimates') {
          roadmapData.learning_path.forEach(item => {
            item.estimated_time = Math.round(item.estimated_time * adjustment.factor);
          });
          roadmapData.total_estimated_time = roadmapData.learning_path.reduce(
            (sum, item) => sum + item.estimated_time, 0
          );
          modified = true;
        }
      }

      if (modified) {
        await supabase
          .from('personalized_roadmaps')
          .update({
            roadmap_data: roadmapData,
            updated_at: new Date().toISOString()
          })
          .eq('id', roadmap.id);

        console.log(`Applied continuous adjustments to roadmap ${roadmap.id}`);
      }
    } catch (error) {
      console.error('Failed to apply continuous adjustments:', error);
    }
  }
}

// Export singleton instance
let adaptiveRoadmapServiceInstance: AdaptiveRoadmapService | null = null;

export function getAdaptiveRoadmapService(): AdaptiveRoadmapService {
  if (!adaptiveRoadmapServiceInstance) {
    adaptiveRoadmapServiceInstance = new AdaptiveRoadmapService();
  }
  return adaptiveRoadmapServiceInstance;
}