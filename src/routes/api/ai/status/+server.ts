/**
 * AI Service Status API Endpoint
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getAIService } from '$lib/services/index.js';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const aiService = getAIService();
    const rateLimitStats = aiService.getRateLimitStats();
    const isUsingFallback = aiService.isUsingFallback();

    return json({
      success: true,
      status: {
        provider: isUsingFallback ? 'fallback' : 'openai',
        isAvailable: true,
        usingFallback: isUsingFallback,
        rateLimiting: {
          ...rateLimitStats,
          resetTime: new Date(Date.now() + 60000).toISOString() // Next minute
        },
        capabilities: {
          contentAnalysis: true,
          assessmentGeneration: true,
          roadmapGeneration: true,
          responseValidation: true
        },
        lastChecked: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('AI status check error:', err);
    
    return json({
      success: false,
      status: {
        provider: 'unknown',
        isAvailable: false,
        usingFallback: true,
        error: 'Service unavailable',
        lastChecked: new Date().toISOString()
      }
    });
  }
};