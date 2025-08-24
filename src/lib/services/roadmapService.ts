/**
 * Personalized Roadmap Service
 * Handles AI-powered learning roadmap generation and management
 */

import { supabase } from '$lib/supabase.js';
import { getAIService } from './ai/index.js';
import type { RoadmapGenerationInput } from './ai/types.js';

export interface PersonalizedRoadmap {
  id: string;
  student_id: string;
  roadmap_data: RoadmapData;
  ai_reasoning: string;
  status: 'active' | 'completed' | 'paused';
  generated_at: string;
  updated_at: string;
}

export interface RoadmapData {
  learning_path: LearningPathItem[];
  total_estimated_time: number;
  personalization_reasoning: string;
  alternative_paths: string[];
  success_metrics: string[];
  difficulty_progression: {
    start: 'beginner' | 'intermediate' | 'advanced';
    end: 'beginner' | 'intermediate' | 'advanced';
  };
  personalization_factors: {
    knowledge_gaps: string[];
    learning_preferences: string[];
    time_constraints?: string;
    target_skills?: string[];
  };
}

export interface LearningPathItem {
  content_id: string;
  content_type: 'course' | 'lesson' | 'assessment';
  title: string;
  order_index: number;
  estimated_time: number;
  prerequisites: string[];
  learning_objectives: string[];
  personalization_notes: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_unlocked: boolean;
  completion_status: 'not_started' | 'in_progress' | 'completed' | 'failed';
}

export interface StudentProfile {
  id: string;
  knowledge_profile: any;
  learning_preferences: any;
  completed_content: string[];
  assessment_history: any[];
  current_enrollments: string[];
}

export class RoadmapService {
  /**
   * Generate a new personalized roadmap for a student
   */
  async generateRoadmap(
    studentId: string, 
    options?: {
      targetSkills?: string[];
      timeConstraints?: { hoursPerWeek: number; targetCompletionDate?: string };
      forceRegenerate?: boolean;
    }
  ): Promise<PersonalizedRoadmap> {
    try {
      // Check if student already has an active roadmap
      if (!options?.forceRegenerate) {
        const existingRoadmap = await this.getActiveRoadmap(studentId);
        if (existingRoadmap) {
          return existingRoadmap;
        }
      }

      // Gather student profile data
      const studentProfile = await this.getStudentProfile(studentId);
      const availableCourses = await this.getAvailableCourses(studentId);

      // Prepare AI input
      const aiInput: RoadmapGenerationInput = {
        studentProfile: {
          knowledgeProfile: studentProfile.knowledge_profile || {},
          learningPreferences: studentProfile.learning_preferences || {},
          completedContent: studentProfile.completed_content || [],
          assessmentHistory: studentProfile.assessment_history || []
        },
        availableCourses,
        targetSkills: options?.targetSkills,
        timeConstraints: options?.timeConstraints
      };

      // Generate roadmap using AI
      const aiService = getAIService();
      const generatedRoadmap = await aiService.generatePersonalizedRoadmap(aiInput);

      // Enhance roadmap with current progress data
      const enhancedRoadmap = await this.enhanceRoadmapWithProgress(
        studentId, 
        generatedRoadmap
      );

      // Save roadmap to database
      const savedRoadmap = await this.saveRoadmap(studentId, enhancedRoadmap);

      return savedRoadmap;
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      throw new Error('Failed to generate personalized roadmap');
    }
  }

  /**
   * Update roadmap based on assessment performance
   */
  async updateRoadmapForAssessment(
    studentId: string, 
    assessmentId: string, 
    passed: boolean, 
    score: number
  ): Promise<PersonalizedRoadmap | null> {
    try {
      const roadmap = await this.getActiveRoadmap(studentId);
      if (!roadmap) return null;

      const updatedRoadmapData = await this.adjustRoadmapForPerformance(
        roadmap.roadmap_data,
        assessmentId,
        passed,
        score
      );

      // Update roadmap in database
      const { data, error } = await supabase
        .from('personalized_roadmaps')
        .update({
          roadmap_data: updatedRoadmapData,
          updated_at: new Date().toISOString()
        })
        .eq('id', roadmap.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update roadmap for assessment:', error);
      throw new Error('Failed to update roadmap');
    }
  }

  /**
   * Get active roadmap for a student
   */
  async getActiveRoadmap(studentId: string): Promise<PersonalizedRoadmap | null> {
    try {
      const { data, error } = await supabase
        .from('personalized_roadmaps')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get active roadmap:', error);
      return null;
    }
  }

  /**
   * Get roadmap with enhanced progress information
   */
  async getRoadmapWithProgress(studentId: string): Promise<PersonalizedRoadmap | null> {
    try {
      const roadmap = await this.getActiveRoadmap(studentId);
      if (!roadmap) return null;

      // Enhance with current progress
      const enhancedData = await this.enhanceRoadmapWithProgress(
        studentId,
        roadmap.roadmap_data
      );

      return {
        ...roadmap,
        roadmap_data: enhancedData
      };
    } catch (error) {
      console.error('Failed to get roadmap with progress:', error);
      return null;
    }
  }

  /**
   * Pause or resume a roadmap
   */
  async updateRoadmapStatus(
    studentId: string, 
    status: 'active' | 'completed' | 'paused'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('personalized_roadmaps')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('student_id', studentId)
        .eq('status', 'active');

      return !error;
    } catch (error) {
      console.error('Failed to update roadmap status:', error);
      return false;
    }
  }

  /**
   * Get student's learning history for roadmap generation
   */
  private async getStudentProfile(studentId: string): Promise<StudentProfile> {
    try {
      // Get basic profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (profileError) throw profileError;

      // Get completed content
      const { data: progress, error: progressError } = await supabase
        .from('student_progress')
        .select('course_id, lesson_id, assessment_id, status, best_score')
        .eq('student_id', studentId)
        .eq('status', 'completed');

      if (progressError) throw progressError;

      // Get assessment history
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessment_attempts')
        .select(`
          assessment_id,
          score,
          passed,
          submitted_at,
          assessments (
            title,
            lesson_id,
            course_id
          )
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (assessmentError) throw assessmentError;

      // Get current enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (enrollmentError) throw enrollmentError;

      const completedContent = progress?.map(p => 
        p.course_id || p.lesson_id || p.assessment_id
      ).filter(Boolean) || [];

      return {
        id: studentId,
        knowledge_profile: profile.knowledge_profile || {},
        learning_preferences: profile.learning_preferences || {},
        completed_content: completedContent,
        assessment_history: assessments || [],
        current_enrollments: enrollments?.map(e => e.course_id) || []
      };
    } catch (error) {
      console.error('Failed to get student profile:', error);
      throw error;
    }
  }

  /**
   * Get available courses for roadmap generation
   */
  private async getAvailableCourses(studentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          difficulty_level,
          estimated_duration,
          tags,
          lessons (
            id,
            title,
            learning_objectives,
            estimated_duration
          )
        `)
        .eq('is_published', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get available courses:', error);
      return [];
    }
  }

  /**
   * Enhance roadmap with current student progress
   */
  private async enhanceRoadmapWithProgress(
    studentId: string,
    roadmapData: RoadmapData
  ): Promise<RoadmapData> {
    try {
      // Get current progress for all content in roadmap
      const contentIds = roadmapData.learning_path.map(item => item.content_id);
      
      const { data: progress, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .in('course_id', contentIds.concat(contentIds))
        .or(`lesson_id.in.(${contentIds.join(',')}),assessment_id.in.(${contentIds.join(',')})`);

      if (error) throw error;

      // Create progress map
      const progressMap = new Map();
      progress?.forEach(p => {
        const contentId = p.course_id || p.lesson_id || p.assessment_id;
        if (contentId) {
          progressMap.set(contentId, p);
        }
      });

      // Update learning path with progress
      const updatedLearningPath = roadmapData.learning_path.map(item => {
        const progressData = progressMap.get(item.content_id);
        
        return {
          ...item,
          completion_status: progressData?.status || 'not_started',
          is_unlocked: this.isContentUnlocked(item, roadmapData.learning_path, progressMap)
        };
      });

      return {
        ...roadmapData,
        learning_path: updatedLearningPath
      };
    } catch (error) {
      console.error('Failed to enhance roadmap with progress:', error);
      return roadmapData;
    }
  }

  /**
   * Check if content is unlocked based on prerequisites
   */
  private isContentUnlocked(
    item: LearningPathItem,
    learningPath: LearningPathItem[],
    progressMap: Map<string, any>
  ): boolean {
    // First item is always unlocked
    if (item.order_index === 0) return true;

    // Check if all prerequisites are completed
    for (const prereqId of item.prerequisites) {
      const progress = progressMap.get(prereqId);
      if (!progress || progress.status !== 'completed') {
        return false;
      }
    }

    // Check if previous item in sequence is completed
    const previousItem = learningPath.find(p => p.order_index === item.order_index - 1);
    if (previousItem) {
      const previousProgress = progressMap.get(previousItem.content_id);
      if (!previousProgress || previousProgress.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Adjust roadmap based on assessment performance
   */
  private async adjustRoadmapForPerformance(
    roadmapData: RoadmapData,
    assessmentId: string,
    passed: boolean,
    score: number
  ): Promise<RoadmapData> {
    if (passed) {
      // Student passed - continue with current path
      return roadmapData;
    }

    // Student failed - need to add remedial content
    const aiService = getAIService();
    
    try {
      const adjustmentPrompt = `
        A student failed an assessment (score: ${score}%) in their learning roadmap.
        Current roadmap: ${JSON.stringify(roadmapData, null, 2)}
        Failed assessment ID: ${assessmentId}
        
        Please suggest adjustments to the roadmap including:
        1. Remedial content to address knowledge gaps
        2. Alternative learning approaches
        3. Modified sequencing if needed
        
        Respond with a JSON object containing the adjusted roadmap data.
      `;

      const response = await aiService.generateText(adjustmentPrompt, {
        responseFormat: 'json',
        systemPrompt: 'You are an educational advisor. Adjust learning roadmaps based on student performance.'
      });

      const adjustedRoadmap = JSON.parse(response.content);
      return adjustedRoadmap;
    } catch (error) {
      console.error('Failed to adjust roadmap with AI:', error);
      
      // Fallback: add a review step before the failed assessment
      const failedItemIndex = roadmapData.learning_path.findIndex(
        item => item.content_id === assessmentId
      );
      
      if (failedItemIndex > 0) {
        const reviewItem: LearningPathItem = {
          content_id: `review-${assessmentId}`,
          content_type: 'lesson',
          title: 'Review and Practice',
          order_index: failedItemIndex,
          estimated_time: 30,
          prerequisites: [],
          learning_objectives: ['Review key concepts', 'Practice problem areas'],
          personalization_notes: 'Added due to assessment failure - focus on weak areas',
          difficulty_level: 'beginner',
          is_unlocked: true,
          completion_status: 'not_started'
        };

        // Insert review item and adjust order indices
        const updatedPath = [...roadmapData.learning_path];
        updatedPath.splice(failedItemIndex, 0, reviewItem);
        
        // Update order indices for subsequent items
        for (let i = failedItemIndex + 1; i < updatedPath.length; i++) {
          updatedPath[i].order_index = i;
        }

        return {
          ...roadmapData,
          learning_path: updatedPath,
          total_estimated_time: roadmapData.total_estimated_time + 30
        };
      }
    }

    return roadmapData;
  }

  /**
   * Save roadmap to database
   */
  private async saveRoadmap(
    studentId: string,
    roadmapData: RoadmapData
  ): Promise<PersonalizedRoadmap> {
    try {
      // Deactivate any existing active roadmaps
      await supabase
        .from('personalized_roadmaps')
        .update({ status: 'paused' })
        .eq('student_id', studentId)
        .eq('status', 'active');

      // Create new roadmap
      const { data, error } = await supabase
        .from('personalized_roadmaps')
        .insert({
          student_id: studentId,
          roadmap_data: roadmapData,
          ai_reasoning: roadmapData.personalization_reasoning,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save roadmap:', error);
      throw error;
    }
  }
}

// Export singleton instance
let roadmapServiceInstance: RoadmapService | null = null;

export function getRoadmapService(): RoadmapService {
  if (!roadmapServiceInstance) {
    roadmapServiceInstance = new RoadmapService();
  }
  return roadmapServiceInstance;
}