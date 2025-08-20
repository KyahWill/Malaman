/**
 * Client-side AI Service Wrapper
 */

import type { 
  ContentAnalysisType, 
  ContentAnalysis, 
  AssessmentGenerationInput,
  RoadmapGenerationInput 
} from './ai/types.js';

export class AIClientService {
  private baseUrl = '/api/ai';

  async analyzeContent(content: string, analysisType: ContentAnalysisType): Promise<{
    analysis: ContentAnalysis;
    metadata: any;
  }> {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, analysisType })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      analysis: data.analysis,
      metadata: data.metadata
    };
  }

  async generateAssessment(input: AssessmentGenerationInput): Promise<{
    assessment: any;
    metadata: any;
  }> {
    const response = await fetch(`${this.baseUrl}/generate-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        const retryAfter = errorData.retryAfter || 60;
        throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
      }
      
      throw new Error(errorData.message || `Assessment generation failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      assessment: data.assessment,
      metadata: data.metadata
    };
  }

  async generateRoadmap(input: RoadmapGenerationInput): Promise<{
    roadmap: any;
    metadata: any;
  }> {
    const response = await fetch(`${this.baseUrl}/generate-roadmap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        const retryAfter = errorData.retryAfter || 60;
        throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
      }
      
      throw new Error(errorData.message || `Roadmap generation failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      roadmap: data.roadmap,
      metadata: data.metadata
    };
  }

  async getStatus(): Promise<{
    status: any;
  }> {
    const response = await fetch(`${this.baseUrl}/status`);

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      status: data.status
    };
  }

  // Utility methods for common operations
  async analyzeForAssessment(contentBlocks: any[]): Promise<ContentAnalysis> {
    const combinedContent = contentBlocks
      .map(block => {
        switch (block.type) {
          case 'rich_text':
            return block.content.plain_text || block.content.html;
          case 'image':
            return `Image: ${block.content.alt_text || 'No description'}`;
          case 'video':
            return `Video content`;
          case 'file':
            return `File: ${block.content.filename}`;
          case 'youtube':
            return `YouTube video: ${block.content.title}`;
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n\n');

    const result = await this.analyzeContent(combinedContent, 'assessment_generation');
    return result.analysis;
  }

  async analyzeForRoadmap(courses: any[]): Promise<ContentAnalysis> {
    const combinedContent = courses
      .map(course => `Course: ${course.title}\nDescription: ${course.description}`)
      .join('\n\n');

    const result = await this.analyzeContent(combinedContent, 'roadmap_creation');
    return result.analysis;
  }

  // Error handling utilities
  isRateLimitError(error: Error): boolean {
    return error.message.includes('Rate limit exceeded');
  }

  isServiceUnavailableError(error: Error): boolean {
    return error.message.includes('service is currently unavailable') ||
           error.message.includes('Service unavailable');
  }

  extractRetryAfter(error: Error): number {
    const match = error.message.match(/try again in (\d+) seconds/);
    return match ? parseInt(match[1]) : 60;
  }
}

// Export singleton instance
let aiClientInstance: AIClientService | null = null;

export function getAIClient(): AIClientService {
  if (!aiClientInstance) {
    aiClientInstance = new AIClientService();
  }
  return aiClientInstance;
}