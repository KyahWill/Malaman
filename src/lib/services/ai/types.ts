/**
 * AI Service Types and Interfaces
 */

export interface AIProvider {
  name: string;
  generateText(prompt: string, options?: AIGenerationOptions): Promise<AIResponse>;
  analyzeContent(content: string, analysisType: ContentAnalysisType): Promise<ContentAnalysis>;
  validateResponse(response: string): Promise<ValidationResult>;
}

export interface AIGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json';
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface ContentAnalysis {
  keyTopics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  concepts: string[];
  estimatedReadingTime: number;
  contentType: 'theoretical' | 'practical' | 'mixed';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: string;
}

export type ContentAnalysisType = 
  | 'assessment_generation'
  | 'roadmap_creation'
  | 'content_analysis'
  | 'difficulty_assessment';

export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'fallback';
  apiKey: string;
  model: string;
  baseUrl?: string;
  maxRetries: number;
  timeout: number;
  rateLimiting: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface AIError extends Error {
  code: 'RATE_LIMIT' | 'INVALID_API_KEY' | 'MODEL_UNAVAILABLE' | 'CONTENT_FILTER' | 'NETWORK_ERROR' | 'UNKNOWN';
  provider: string;
  retryable: boolean;
  retryAfter?: number;
}

export interface RoadmapGenerationInput {
  studentProfile: {
    knowledgeProfile: any;
    learningPreferences: any;
    completedContent: string[];
    assessmentHistory: any[];
  };
  availableCourses: any[];
  targetSkills?: string[];
  timeConstraints?: {
    hoursPerWeek: number;
    targetCompletionDate?: string;
  };
}

export interface AssessmentGenerationInput {
  contentBlocks: any[];
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionTypes: ('multiple_choice' | 'true_false' | 'short_answer' | 'essay')[];
  questionCount: number;
}