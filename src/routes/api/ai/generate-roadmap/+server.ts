/**
 * AI Roadmap Generation API Endpoint
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getAIService } from '$lib/services/index.js';
import type { RoadmapGenerationInput } from '$lib/services/ai/types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const input = await request.json() as RoadmapGenerationInput;

    // Validate input
    if (!input.studentProfile) {
      throw error(400, 'Student profile is required');
    }

    if (!input.availableCourses || !Array.isArray(input.availableCourses)) {
      throw error(400, 'Available courses are required');
    }

    // Ensure student can only generate roadmaps for themselves (unless admin/instructor)
    const userRole = locals.session.user.role;
    if (userRole === 'student') {
      // For students, we'll use their own profile
      // In a real implementation, you'd fetch this from the database
      input.studentProfile = {
        knowledgeProfile: (locals.session.user as any).knowledge_profile || {},
        learningPreferences: (locals.session.user as any).learning_preferences || {},
        completedContent: [], // Would be fetched from database
        assessmentHistory: [] // Would be fetched from database
      };
    }

    // Get AI service and generate roadmap
    const aiService = getAIService();
    const roadmap = await aiService.generatePersonalizedRoadmap(input);

    return json({
      success: true,
      roadmap,
      metadata: {
        generatedAt: new Date().toISOString(),
        studentId: locals.session.user.id,
        coursesConsidered: input.availableCourses.length,
        pathLength: roadmap.learning_path?.length || 0,
        totalEstimatedTime: roadmap.total_estimated_time || 0,
        usingFallback: aiService.isUsingFallback(),
        rateLimitStats: aiService.getRateLimitStats()
      }
    });

  } catch (err) {
    console.error('AI roadmap generation error:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }

    // Handle AI-specific errors
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