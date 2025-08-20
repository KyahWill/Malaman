/**
 * Rate Limiter for AI API Calls
 */

interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  burstLimit?: number;
}

interface RequestRecord {
  timestamp: number;
  tokens: number;
}

export class RateLimiter {
  private requests: RequestRecord[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      burstLimit: Math.ceil(config.requestsPerMinute * 0.1), // 10% of RPM as burst
      ...config
    };
  }

  async checkLimit(estimatedTokens: number = 1000): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old requests
    this.requests = this.requests.filter(req => req.timestamp > oneMinuteAgo);

    // Check request count limit
    if (this.requests.length >= this.config.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requests.map(r => r.timestamp));
      const retryAfter = Math.ceil((oldestRequest + 60000 - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Check token limit
    const totalTokens = this.requests.reduce((sum, req) => sum + req.tokens, 0);
    if (totalTokens + estimatedTokens > this.config.tokensPerMinute) {
      // Find when enough tokens will be available
      let tokensToFree = (totalTokens + estimatedTokens) - this.config.tokensPerMinute;
      const sortedRequests = [...this.requests].sort((a, b) => a.timestamp - b.timestamp);
      
      let retryAfter = 60; // Default to 1 minute
      for (const request of sortedRequests) {
        tokensToFree -= request.tokens;
        if (tokensToFree <= 0) {
          retryAfter = Math.ceil((request.timestamp + 60000 - now) / 1000);
          break;
        }
      }
      
      return { allowed: false, retryAfter };
    }

    // Check burst limit
    const recentRequests = this.requests.filter(req => req.timestamp > now - 10000); // Last 10 seconds
    if (this.config.burstLimit && recentRequests.length >= this.config.burstLimit) {
      return { allowed: false, retryAfter: 10 };
    }

    return { allowed: true };
  }

  recordRequest(actualTokens: number): void {
    this.requests.push({
      timestamp: Date.now(),
      tokens: actualTokens
    });
  }

  getStats(): {
    requestsInLastMinute: number;
    tokensInLastMinute: number;
    requestsRemaining: number;
    tokensRemaining: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requests.filter(req => req.timestamp > oneMinuteAgo);
    
    const requestsInLastMinute = recentRequests.length;
    const tokensInLastMinute = recentRequests.reduce((sum, req) => sum + req.tokens, 0);

    return {
      requestsInLastMinute,
      tokensInLastMinute,
      requestsRemaining: Math.max(0, this.config.requestsPerMinute - requestsInLastMinute),
      tokensRemaining: Math.max(0, this.config.tokensPerMinute - tokensInLastMinute)
    };
  }

  reset(): void {
    this.requests = [];
  }
}

// Global rate limiter instances for different providers
const rateLimiters = new Map<string, RateLimiter>();

export function getRateLimiter(provider: string, config: RateLimitConfig): RateLimiter {
  if (!rateLimiters.has(provider)) {
    rateLimiters.set(provider, new RateLimiter(config));
  }
  return rateLimiters.get(provider)!;
}

export function resetRateLimiter(provider: string): void {
  rateLimiters.delete(provider);
}