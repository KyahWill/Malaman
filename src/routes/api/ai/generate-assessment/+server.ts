/**
 * AI Assessment Generation API Endpoint
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getAIService } from '$lib/services/index.js';
import type { AssessmentGenerationInput } from '$lib/services/ai/types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication and instructor role
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    if (locals.session.user.role !== 'instructor' && locals.session.user.role !== 'admin') {
      throw error(403, 'Instructor access required');
    }

    const input = await request.json() as AssessmentGenerationInput;

    // Validate input
    if (!input.contentBlocks || !Array.isArray(input.contentBlocks) || input.contentBlocks.length === 0) {
      throw error(400, 'Content blocks are required');
    }

    if (!input.learningObjectives || !Array.isArray(input.learningObjectives)) {
      throw error(400, 'Learning objectives are required');
    }

    if (!input.difficulty || !['beginner', 'intermediate', 'advanced'].includes(input.difficulty)) {
      throw error(400, 'Valid difficulty level is required');
    }

    if (!input.questionTypes || !Array.isArray(input.questionTypes) || input.questionTypes.length === 0) {
      throw error(400, 'Question types are required');
    }

    if (!input.questionCount || input.questionCount < 1 || input.questionCount > 50) {
      throw error(400, 'Question count must be between 1 and 50');
    }

    // Get AI service and generate assessment
    const aiService = getAIService();
    const assessment = await aiService.generateAssessment(input);

    return json({
      success: true,
      assessment,
      metadata: {
        generatedAt: new Date().toISOString(),
        contentBlocksCount: input.contentBlocks.length,
        requestedQuestions: input.questionCount,
        actualQuestions: assessment.questions?.length || 0,
        usingFallback: aiService.isUsingFallback(),
        rateLimitStats: aiService.getRateLimitStats()
      }
    });

  } catch (err) {
    console.error('AI assessment generation error:', err);
    
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

    throw error(500, 'Failed to generate assessment');
  }
};