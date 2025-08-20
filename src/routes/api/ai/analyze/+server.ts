/**
 * AI Content Analysis API Endpoint
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getAIService } from '$lib/services/index.js';
import type { ContentAnalysisType } from '$lib/services/ai/types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { content, analysisType } = await request.json();

    // Validate input
    if (!content || typeof content !== 'string') {
      throw error(400, 'Content is required and must be a string');
    }

    if (!analysisType || !['assessment_generation', 'roadmap_creation', 'content_analysis', 'difficulty_assessment'].includes(analysisType)) {
      throw error(400, 'Valid analysisType is required');
    }

    // Get AI service and analyze content
    const aiService = getAIService();
    const analysis = await aiService.analyzeContent(content, analysisType as ContentAnalysisType);

    return json({
      success: true,
      analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        contentLength: content.length,
        analysisType,
        usingFallback: aiService.isUsingFallback()
      }
    });

  } catch (err) {
    console.error('AI content analysis error:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }

    // Handle AI-specific errors
    if (err && typeof err === 'object' && 'code' in err) {
      const aiError = err as any;
      
      if (aiError.code === 'RATE_LIMIT') {
        throw error(429, `Rate limit exceeded. Retry after ${aiError.retryAfter} seconds.`);
      }
      
      if (aiError.code === 'INVALID_API_KEY') {
        throw error(503, 'AI service configuration error');
      }
    }

    throw error(500, 'Failed to analyze content');
  }
};