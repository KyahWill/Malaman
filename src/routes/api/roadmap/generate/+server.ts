/**
 * API endpoint for generating personalized roadmaps
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getRoadmapService } from '$lib/services/roadmapService.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const body = await request.json();
    const { studentId, targetSkills, timeConstraints, forceRegenerate } = body;
    const currentUser = locals.session.user;

    // Authorization check
    if (currentUser.role === 'student' && currentUser.id !== studentId) {
      throw error(403, 'You can only generate roadmaps for yourself');
    }

    // Validate input
    if (!studentId) {
      throw error(400, 'Student ID is required');
    }

    // Validate time constraints if provided
    if (timeConstraints) {
      if (typeof timeConstraints.hoursPerWeek !== 'number' || timeConstraints.hoursPerWeek <= 0) {
        throw error(400, 'Invalid time constraints: hoursPerWeek must be a positive number');
      }
      
      if (timeConstraints.targetCompletionDate) {
        const targetDate = new Date(timeConstraints.targetCompletionDate);
        if (isNaN(targetDate.getTime()) || targetDate <= new Date()) {
          throw error(400, 'Invalid target completion date: must be a future date');
        }
      }
    }

    // Validate target skills if provided
    if (targetSkills && (!Array.isArray(targetSkills) || targetSkills.some(skill => typeof skill !== 'string'))) {
      throw error(400, 'Invalid target skills: must be an array of strings');
    }

    // Generate roadmap
    const roadmapService = getRoadmapService();
    const roadmap = await roadmapService.generateRoadmap(studentId, {
      targetSkills: targetSkills || undefined,
      timeConstraints: timeConstraints || undefined,
      forceRegenerate: Boolean(forceRegenerate)
    });

    return json({
      success: true,
      roadmap,
      metadata: {
        generatedAt: roadmap.generated_at,
        pathLength: roadmap.roadmap_data.learning_path.length,
        totalEstimatedTime: roadmap.roadmap_data.total_estimated_time,
        personalizationFactors: roadmap.roadmap_data.personalization_factors,
        wasRegenerated: Boolean(forceRegenerate)
      }
    });

  } catch (err) {
    console.error('Failed to generate roadmap:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }

    // Handle specific error types
    if (err && typeof err === 'object' && 'code' in err) {
      const aiError = err as any;
      
      if (aiError.code === 'RATE_LIMIT') {
        throw error(429, `Rate limit exceeded. Please try again in ${aiError.retryAfter} seconds.`);
      }
      
      if (aiError.code === 'INVALID_API_KEY') {
        throw error(503, 'AI service is currently unavailable');
      }

      if (aiError.code === 'CONTENT_FILTER') {
        throw error(400, 'Content was filtered by AI safety systems');
      }
    }

    throw error(500, 'Failed to generate personalized roadmap');
  }
};