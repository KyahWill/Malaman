import { supabase } from '$lib/supabase';
import type { 
  User, 
  Course, 
  Lesson, 
  Assessment, 
  StudentProgress,
  LearningPreferences,
  ContentRecommendation,
  EngagementPattern,
  RecommendationFeedback
} from '$lib/types';

export interface RecommendationRequest {
  studentId: string;
  contentType?: 'lesson' | 'course' | 'assessment';
  limit?: number;
  excludeCompleted?: boolean;
}

export interface RecommendationScore {
  contentId: string;
  score: number;
  factors: RecommendationFactor[];
  explanation: string;
}

export interface RecommendationFactor {
  type: 'knowledge_gap' | 'learning_style' | 'difficulty_match' | 'engagement_pattern' | 'peer_success';
  weight: number;
  value: number;
  description: string;
}

export interface EngagementMetrics {
  timeSpent: number;
  completionRate: number;
  assessmentScores: number[];
  interactionFrequency: number;
  contentTypePreferences: Record<string, number>;
  difficultyPreferences: Record<string, number>;
}

export class RecommendationEngine {
  private readonly WEIGHTS = {
    knowledge_gap: 0.3,
    learning_style: 0.2,
    difficulty_match: 0.2,
    engagement_pattern: 0.2,
    peer_success: 0.1
  };

  /**
   * Generate content recommendations for a student
   */
  async generateRecommendations(request: RecommendationRequest): Promise<ContentRecommendation[]> {
    try {
      const { studentId, contentType, limit = 10, excludeCompleted = true } = request;

      // Get student profile and learning data
      const [profile, progress, engagementData] = await Promise.all([
        this.getStudentProfile(studentId),
        this.getStudentProgress(studentId),
        this.getEngagementPatterns(studentId)
      ]);

      // Get available content
      const availableContent = await this.getAvailableContent(studentId, contentType, excludeCompleted);

      // Score each piece of content
      const scoredContent = await Promise.all(
        availableContent.map(content => this.scoreContent(content, profile, progress, engagementData))
      );

      // Sort by score and take top recommendations
      const topRecommendations = scoredContent
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Convert to recommendation format
      return topRecommendations.map(scored => this.createRecommendation(scored, profile));

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate content recommendations');
    }
  }

  /**
   * Analyze engagement patterns for a student
   */
  async analyzeEngagementPatterns(studentId: string): Promise<EngagementPattern> {
    try {
      const { data: progressData, error } = await supabase
        .from('student_progress')
        .select(`
          *,
          lessons:lesson_id(id, title, content_blocks),
          courses:course_id(id, title, difficulty_level),
          assessments:assessment_id(id, title, questions)
        `)
        .eq('student_id', studentId);

      if (error) throw error;

      const metrics = this.calculateEngagementMetrics(progressData || []);
      
      return {
        studentId,
        metrics,
        patterns: this.identifyLearningPatterns(metrics),
        preferences: this.extractPreferences(metrics),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error analyzing engagement patterns:', error);
      throw new Error('Failed to analyze engagement patterns');
    }
  }

  /**
   * Record feedback on a recommendation
   */
  async recordFeedback(feedback: RecommendationFeedback): Promise<void> {
    try {
      const { error } = await supabase
        .from('recommendation_feedback')
        .insert({
          student_id: feedback.studentId,
          content_id: feedback.contentId,
          recommendation_id: feedback.recommendationId,
          feedback_type: feedback.type,
          rating: feedback.rating,
          comment: feedback.comment,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update recommendation algorithm based on feedback
      await this.updateRecommendationWeights(feedback);

    } catch (error) {
      console.error('Error recording feedback:', error);
      throw new Error('Failed to record recommendation feedback');
    }
  }

  /**
   * Get recommendation explanations
   */
  async getRecommendationExplanation(recommendationId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('content_recommendations')
        .select('explanation, factors')
        .eq('id', recommendationId)
        .single();

      if (error) throw error;

      return this.formatExplanation(data.explanation, data.factors);

    } catch (error) {
      console.error('Error getting recommendation explanation:', error);
      return 'Recommendation based on your learning profile and progress.';
    }
  }

  private async getStudentProfile(studentId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, learning_preferences, knowledge_profile')
      .eq('id', studentId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getStudentProgress(studentId: string) {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId);

    if (error) throw error;
    return data || [];
  }

  private async getEngagementPatterns(studentId: string): Promise<EngagementPattern | null> {
    const { data, error } = await supabase
      .from('engagement_patterns')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  private async getAvailableContent(studentId: string, contentType?: string, excludeCompleted = true) {
    let query = supabase
      .from('lessons')
      .select(`
        id, title, description, course_id, difficulty_level, learning_objectives,
        courses:course_id(id, title, difficulty_level, tags),
        content_blocks(type, metadata)
      `)
      .eq('is_published', true);

    if (excludeCompleted) {
      const { data: completedContent } = await supabase
        .from('student_progress')
        .select('lesson_id')
        .eq('student_id', studentId)
        .eq('status', 'completed');

      const completedIds = completedContent?.map(p => p.lesson_id).filter(Boolean) || [];
      if (completedIds.length > 0) {
        query = query.not('id', 'in', `(${completedIds.join(',')})`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async scoreContent(content: any, profile: any, progress: any[], engagementData: EngagementPattern | null): Promise<RecommendationScore> {
    const factors: RecommendationFactor[] = [];
    let totalScore = 0;

    // Knowledge gap analysis
    const knowledgeGapScore = this.calculateKnowledgeGapScore(content, profile.knowledge_profile);
    factors.push({
      type: 'knowledge_gap',
      weight: this.WEIGHTS.knowledge_gap,
      value: knowledgeGapScore,
      description: `Addresses ${Math.round(knowledgeGapScore * 100)}% of your knowledge gaps`
    });
    totalScore += knowledgeGapScore * this.WEIGHTS.knowledge_gap;

    // Learning style match
    const learningStyleScore = this.calculateLearningStyleScore(content, profile.learning_preferences);
    factors.push({
      type: 'learning_style',
      weight: this.WEIGHTS.learning_style,
      value: learningStyleScore,
      description: `${Math.round(learningStyleScore * 100)}% match with your learning style`
    });
    totalScore += learningStyleScore * this.WEIGHTS.learning_style;

    // Difficulty match
    const difficultyScore = this.calculateDifficultyScore(content, progress);
    factors.push({
      type: 'difficulty_match',
      weight: this.WEIGHTS.difficulty_match,
      value: difficultyScore,
      description: `Difficulty level is ${this.getDifficultyDescription(difficultyScore)} for you`
    });
    totalScore += difficultyScore * this.WEIGHTS.difficulty_match;

    // Engagement pattern match
    if (engagementData) {
      const engagementScore = this.calculateEngagementScore(content, engagementData);
      factors.push({
        type: 'engagement_pattern',
        weight: this.WEIGHTS.engagement_pattern,
        value: engagementScore,
        description: `Matches your engagement patterns (${Math.round(engagementScore * 100)}%)`
      });
      totalScore += engagementScore * this.WEIGHTS.engagement_pattern;
    }

    // Peer success rate
    const peerSuccessScore = await this.calculatePeerSuccessScore(content);
    factors.push({
      type: 'peer_success',
      weight: this.WEIGHTS.peer_success,
      value: peerSuccessScore,
      description: `${Math.round(peerSuccessScore * 100)}% of similar students succeeded`
    });
    totalScore += peerSuccessScore * this.WEIGHTS.peer_success;

    return {
      contentId: content.id,
      score: Math.min(totalScore, 1), // Cap at 1.0
      factors,
      explanation: this.generateExplanation(factors, content)
    };
  }

  private calculateKnowledgeGapScore(content: any, knowledgeProfile: any): number {
    if (!knowledgeProfile?.subject_areas) return 0.5;

    const contentTopics = content.learning_objectives || [];
    const knownTopics = knowledgeProfile.subject_areas.map((area: any) => area.topic);
    
    const gapTopics = contentTopics.filter((topic: string) => 
      !knownTopics.some((known: string) => 
        known.toLowerCase().includes(topic.toLowerCase()) || 
        topic.toLowerCase().includes(known.toLowerCase())
      )
    );

    return contentTopics.length > 0 ? gapTopics.length / contentTopics.length : 0.5;
  }

  private calculateLearningStyleScore(content: any, preferences: LearningPreferences): number {
    if (!preferences?.preferred_media_types) return 0.5;

    const contentTypes = content.content_blocks?.map((block: any) => block.type) || [];
    const preferredTypes = preferences.preferred_media_types;

    const matchingTypes = contentTypes.filter((type: string) => 
      preferredTypes.includes(type as any)
    );

    return contentTypes.length > 0 ? matchingTypes.length / contentTypes.length : 0.5;
  }

  private calculateDifficultyScore(content: any, progress: any[]): number {
    const avgScore = progress.length > 0 
      ? progress.reduce((sum, p) => sum + (p.best_score || 0), 0) / progress.length 
      : 70;

    const contentDifficulty = content.courses?.difficulty_level || 'beginner';
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const contentLevel = difficultyMap[contentDifficulty as keyof typeof difficultyMap];

    // Recommend slightly challenging content based on performance
    const idealLevel = avgScore >= 85 ? 3 : avgScore >= 70 ? 2 : 1;
    const levelDiff = Math.abs(contentLevel - idealLevel);

    return Math.max(0, 1 - (levelDiff * 0.3));
  }

  private calculateEngagementScore(content: any, engagementData: EngagementPattern): number {
    const contentTypes = content.content_blocks?.map((block: any) => block.type) || [];
    const preferences = engagementData.preferences?.contentTypePreferences || {};

    let score = 0;
    let totalWeight = 0;

    contentTypes.forEach((type: string) => {
      const preference = preferences[type] || 0.5;
      score += preference;
      totalWeight += 1;
    });

    return totalWeight > 0 ? score / totalWeight : 0.5;
  }

  private async calculatePeerSuccessScore(content: any): Promise<number> {
    const { data, error } = await supabase
      .from('student_progress')
      .select('status, best_score')
      .eq('lesson_id', content.id);

    if (error || !data || data.length === 0) return 0.5;

    const successfulAttempts = data.filter(p => 
      p.status === 'completed' && (p.best_score || 0) >= 70
    ).length;

    return data.length > 0 ? successfulAttempts / data.length : 0.5;
  }

  private calculateEngagementMetrics(progressData: any[]): EngagementMetrics {
    const totalTime = progressData.reduce((sum, p) => sum + (p.time_spent || 0), 0);
    const completedCount = progressData.filter(p => p.status === 'completed').length;
    const completionRate = progressData.length > 0 ? completedCount / progressData.length : 0;
    
    const assessmentScores = progressData
      .map(p => p.best_score)
      .filter(score => score !== null && score !== undefined);

    const contentTypePreferences: Record<string, number> = {};
    const difficultyPreferences: Record<string, number> = {};

    // Analyze preferences based on completion and time spent
    progressData.forEach(p => {
      if (p.lessons?.content_blocks) {
        p.lessons.content_blocks.forEach((block: any) => {
          const type = block.type;
          const engagement = (p.time_spent || 0) / Math.max(p.lessons.estimated_duration || 1, 1);
          contentTypePreferences[type] = (contentTypePreferences[type] || 0) + engagement;
        });
      }

      if (p.courses?.difficulty_level) {
        const difficulty = p.courses.difficulty_level;
        const success = p.status === 'completed' ? 1 : 0;
        difficultyPreferences[difficulty] = (difficultyPreferences[difficulty] || 0) + success;
      }
    });

    return {
      timeSpent: totalTime,
      completionRate,
      assessmentScores,
      interactionFrequency: progressData.length,
      contentTypePreferences,
      difficultyPreferences
    };
  }

  private identifyLearningPatterns(metrics: EngagementMetrics): string[] {
    const patterns: string[] = [];

    if (metrics.completionRate > 0.8) {
      patterns.push('high_completion');
    } else if (metrics.completionRate < 0.3) {
      patterns.push('low_completion');
    }

    const avgScore = metrics.assessmentScores.length > 0 
      ? metrics.assessmentScores.reduce((sum, score) => sum + score, 0) / metrics.assessmentScores.length 
      : 0;

    if (avgScore > 85) {
      patterns.push('high_performer');
    } else if (avgScore < 60) {
      patterns.push('struggling_learner');
    }

    const avgTimePerContent = metrics.interactionFrequency > 0 
      ? metrics.timeSpent / metrics.interactionFrequency 
      : 0;

    if (avgTimePerContent > 1800) { // 30 minutes
      patterns.push('thorough_learner');
    } else if (avgTimePerContent < 300) { // 5 minutes
      patterns.push('quick_learner');
    }

    return patterns;
  }

  private extractPreferences(metrics: EngagementMetrics): any {
    return {
      contentTypePreferences: metrics.contentTypePreferences,
      difficultyPreferences: metrics.difficultyPreferences,
      pacePreference: this.determinePacePreference(metrics)
    };
  }

  private determinePacePreference(metrics: EngagementMetrics): 'slow' | 'medium' | 'fast' {
    const avgTimePerContent = metrics.interactionFrequency > 0 
      ? metrics.timeSpent / metrics.interactionFrequency 
      : 0;

    if (avgTimePerContent > 1800) return 'slow';
    if (avgTimePerContent < 600) return 'fast';
    return 'medium';
  }

  private async updateRecommendationWeights(feedback: RecommendationFeedback): Promise<void> {
    // This would implement machine learning to adjust weights based on feedback
    // For now, we'll store the feedback for future analysis
    console.log('Feedback recorded for algorithm improvement:', feedback);
  }

  private createRecommendation(scored: RecommendationScore, profile: any): ContentRecommendation {
    return {
      id: crypto.randomUUID(),
      studentId: profile.id,
      contentId: scored.contentId,
      contentType: 'lesson',
      score: scored.score,
      factors: scored.factors,
      explanation: scored.explanation,
      createdAt: new Date().toISOString(),
      viewed: false,
      clicked: false
    };
  }

  private generateExplanation(factors: RecommendationFactor[], content: any): string {
    const topFactors = factors
      .sort((a, b) => (b.value * b.weight) - (a.value * a.weight))
      .slice(0, 2);

    const reasons = topFactors.map(factor => factor.description);
    
    return `Recommended because: ${reasons.join(' and ')}.`;
  }

  private formatExplanation(explanation: string, factors: RecommendationFactor[]): string {
    const factorDescriptions = factors.map(f => 
      `• ${f.description} (${Math.round(f.value * f.weight * 100)}% impact)`
    ).join('\n');

    return `${explanation}\n\nDetailed factors:\n${factorDescriptions}`;
  }

  private getDifficultyDescription(score: number): string {
    if (score > 0.8) return 'well-suited';
    if (score > 0.6) return 'appropriately challenging';
    if (score > 0.4) return 'moderately challenging';
    return 'quite challenging';
  }
}

export const recommendationEngine = new RecommendationEngine();