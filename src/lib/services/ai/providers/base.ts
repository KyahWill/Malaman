/**
 * Base AI Provider Abstract Class
 */

import type { 
  AIProvider, 
  AIResponse, 
  AIGenerationOptions, 
  ContentAnalysis, 
  ContentAnalysisType,
  ValidationResult,
  AIError 
} from '../types.js';

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  protected apiKey: string;
  protected model: string;
  protected baseUrl?: string;
  protected maxRetries: number;
  protected timeout: number;

  constructor(config: {
    apiKey: string;
    model: string;
    baseUrl?: string;
    maxRetries?: number;
    timeout?: number;
  }) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;
  }

  abstract generateText(prompt: string, options?: AIGenerationOptions): Promise<AIResponse>;

  async analyzeContent(content: string, analysisType: ContentAnalysisType): Promise<ContentAnalysis> {
    const prompt = this.buildContentAnalysisPrompt(content, analysisType);
    
    try {
      const response = await this.generateText(prompt, {
        responseFormat: 'json',
        systemPrompt: 'You are an educational content analyst. Respond only with valid JSON.'
      });

      return this.parseContentAnalysis(response.content);
    } catch (error) {
      throw this.createAIError(error, 'Failed to analyze content');
    }
  }

  async validateResponse(response: string): Promise<ValidationResult> {
    try {
      // Basic validation - can be overridden by specific providers
      const trimmed = response.trim();
      
      if (!trimmed) {
        return {
          isValid: false,
          errors: ['Empty response'],
          warnings: []
        };
      }

      // Check for common AI hallucination patterns
      const warnings: string[] = [];
      if (trimmed.includes('I cannot') || trimmed.includes('I am unable')) {
        warnings.push('Response indicates AI limitations');
      }

      return {
        isValid: true,
        errors: [],
        warnings,
        sanitizedContent: this.sanitizeResponse(trimmed)
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  protected buildContentAnalysisPrompt(content: string, analysisType: ContentAnalysisType): string {
    const basePrompt = `Analyze the following educational content and provide a structured analysis:

Content:
${content}

Please provide your analysis in the following JSON format:
{
  "keyTopics": ["topic1", "topic2", "topic3"],
  "difficulty": "beginner|intermediate|advanced",
  "learningObjectives": ["objective1", "objective2"],
  "concepts": ["concept1", "concept2"],
  "estimatedReadingTime": 10,
  "contentType": "theoretical|practical|mixed"
}`;

    switch (analysisType) {
      case 'assessment_generation':
        return `${basePrompt}

Focus on identifying key concepts that should be tested in an assessment.`;
      
      case 'roadmap_creation':
        return `${basePrompt}

Focus on prerequisite knowledge and learning progression.`;
      
      case 'difficulty_assessment':
        return `${basePrompt}

Focus on accurately determining the difficulty level and required background knowledge.`;
      
      default:
        return basePrompt;
    }
  }

  protected parseContentAnalysis(response: string): ContentAnalysis {
    try {
      const parsed = JSON.parse(response);
      
      // Validate required fields
      const required = ['keyTopics', 'difficulty', 'learningObjectives', 'concepts', 'estimatedReadingTime', 'contentType'];
      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate difficulty level
      if (!['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty)) {
        parsed.difficulty = 'intermediate'; // Default fallback
      }

      // Validate content type
      if (!['theoretical', 'practical', 'mixed'].includes(parsed.contentType)) {
        parsed.contentType = 'mixed'; // Default fallback
      }

      // Ensure arrays are arrays
      parsed.keyTopics = Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [];
      parsed.learningObjectives = Array.isArray(parsed.learningObjectives) ? parsed.learningObjectives : [];
      parsed.concepts = Array.isArray(parsed.concepts) ? parsed.concepts : [];

      // Ensure reading time is a number
      parsed.estimatedReadingTime = typeof parsed.estimatedReadingTime === 'number' 
        ? parsed.estimatedReadingTime 
        : 5; // Default 5 minutes

      return parsed as ContentAnalysis;
    } catch (error) {
      // Fallback analysis if parsing fails
      return {
        keyTopics: ['General Topic'],
        difficulty: 'intermediate',
        learningObjectives: ['Learn the content'],
        concepts: ['Basic Concepts'],
        estimatedReadingTime: 5,
        contentType: 'mixed'
      };
    }
  }

  protected sanitizeResponse(response: string): string {
    // Remove potential harmful content
    return response
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }

  protected createAIError(originalError: any, message: string): AIError {
    const error = new Error(message) as AIError;
    error.name = 'AIError';
    error.provider = this.name;
    error.retryable = this.isRetryableError(originalError);
    
    if (originalError?.status === 429) {
      error.code = 'RATE_LIMIT';
      error.retryAfter = originalError.headers?.['retry-after'] ? 
        parseInt(originalError.headers['retry-after']) : 60;
    } else if (originalError?.status === 401) {
      error.code = 'INVALID_API_KEY';
      error.retryable = false;
    } else if (originalError?.status === 503) {
      error.code = 'MODEL_UNAVAILABLE';
    } else if (originalError?.message?.includes('content_filter')) {
      error.code = 'CONTENT_FILTER';
      error.retryable = false;
    } else if (originalError?.code === 'ENOTFOUND' || originalError?.code === 'ECONNREFUSED') {
      error.code = 'NETWORK_ERROR';
    } else {
      error.code = 'UNKNOWN';
    }

    return error;
  }

  protected isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const retryableCodes = ['RATE_LIMIT', 'MODEL_UNAVAILABLE', 'NETWORK_ERROR'];
    const retryableStatuses = [429, 500, 502, 503, 504];
    
    return retryableCodes.includes(error.code) || 
           retryableStatuses.includes(error.status) ||
           error.code === 'ENOTFOUND' ||
           error.code === 'ECONNREFUSED';
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}