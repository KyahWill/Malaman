/**
 * OpenAI Provider Implementation
 */

import { BaseAIProvider } from './base.js';
import type { AIResponse, AIGenerationOptions, AIError } from '../types.js';

export class OpenAIProvider extends BaseAIProvider {
  name = 'openai';
  private readonly defaultBaseUrl = 'https://api.openai.com/v1';

  constructor(config: {
    apiKey: string;
    model?: string;
    baseUrl?: string;
    maxRetries?: number;
    timeout?: number;
  }) {
    super({
      ...config,
      model: config.model || 'gpt-4',
      baseUrl: config.baseUrl || 'https://api.openai.com/v1'
    });
  }

  async generateText(prompt: string, options: AIGenerationOptions = {}): Promise<AIResponse> {
    const requestBody = {
      model: options.model || this.model,
      messages: [
        ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      ...(options.responseFormat === 'json' && { response_format: { type: 'json_object' } })
    };

    let lastError: any;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest('/chat/completions', requestBody);
        return this.parseOpenAIResponse(response);
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryableError(error) || attempt === this.maxRetries - 1) {
          throw this.createAIError(error, `OpenAI API request failed after ${attempt + 1} attempts`);
        }

        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
        await this.delay(delay);
      }
    }

    throw this.createAIError(lastError, 'OpenAI API request failed after all retries');
  }

  private async makeRequest(endpoint: string, body: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PersonalizedLMS/1.0'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error?.message || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).headers = Object.fromEntries([...response.headers.entries()]);
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private parseOpenAIResponse(response: any): AIResponse {
    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error('No choices in OpenAI response');
    }

    return {
      content: choice.message?.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined,
      model: response.model,
      finishReason: this.mapFinishReason(choice.finish_reason)
    };
  }

  private mapFinishReason(reason: string): AIResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'error';
    }
  }

  protected createAIError(originalError: any, message: string): AIError {
    const error = super.createAIError(originalError, message);
    
    // OpenAI-specific error handling
    if (originalError?.status === 400 && originalError?.message?.includes('content_policy')) {
      error.code = 'CONTENT_FILTER';
      error.retryable = false;
    }

    return error;
  }
}