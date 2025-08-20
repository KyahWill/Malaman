# AI Integration Guide

## Overview

The Personalized LMS includes a comprehensive AI integration layer that provides intelligent content analysis, assessment generation, and personalized learning roadmap creation. The system is designed with provider abstraction, fallback mechanisms, and robust error handling.

## Architecture

### Core Components

1. **AI Service Layer** (`src/lib/services/ai/`)
   - Provider abstraction for easy switching between AI services
   - Rate limiting and cost management
   - Error handling and fallback mechanisms
   - Response validation and sanitization

2. **Provider Implementations**
   - OpenAI Provider (primary)
   - Fallback Provider (rule-based backup)
   - Extensible architecture for additional providers

3. **Client Service** (`src/lib/services/aiClient.ts`)
   - Frontend wrapper for AI API calls
   - Error handling and retry logic
   - Utility methods for common operations

4. **API Endpoints** (`src/routes/api/ai/`)
   - RESTful endpoints for AI operations
   - Authentication and authorization
   - Rate limiting and error responses

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4

# Optional: Custom base URL for OpenAI-compatible services
# OPENAI_BASE_URL=https://api.openai.com/v1
```

### Service Configuration

The AI service can be configured programmatically:

```typescript
import { AIService } from '$lib/services/ai';

const aiService = new AIService({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4',
  maxRetries: 3,
  timeout: 30000,
  rateLimiting: {
    requestsPerMinute: 60,
    tokensPerMinute: 90000
  }
});
```

## API Usage

### Content Analysis

Analyze educational content to extract key information:

```typescript
import { getAIClient } from '$lib/services/aiClient';

const aiClient = getAIClient();

try {
  const { analysis } = await aiClient.analyzeContent(
    "Your educational content here...",
    'content_analysis'
  );
  
  console.log('Key topics:', analysis.keyTopics);
  console.log('Difficulty:', analysis.difficulty);
  console.log('Learning objectives:', analysis.learningObjectives);
} catch (error) {
  console.error('Analysis failed:', error.message);
}
```

### Assessment Generation

Generate assessments based on learning content:

```typescript
const assessmentInput = {
  contentBlocks: [
    {
      type: 'rich_text',
      content: { plain_text: 'Your lesson content...' }
    }
  ],
  learningObjectives: [
    'Understand key concepts',
    'Apply knowledge to scenarios'
  ],
  difficulty: 'intermediate',
  questionTypes: ['multiple_choice', 'short_answer'],
  questionCount: 5
};

try {
  const { assessment } = await aiClient.generateAssessment(assessmentInput);
  console.log('Generated questions:', assessment.questions);
} catch (error) {
  if (aiClient.isRateLimitError(error)) {
    const retryAfter = aiClient.extractRetryAfter(error);
    console.log(`Rate limited. Retry in ${retryAfter} seconds.`);
  }
}
```

### Personalized Roadmap Generation

Create personalized learning paths:

```typescript
const roadmapInput = {
  studentProfile: {
    knowledgeProfile: { /* student's knowledge data */ },
    learningPreferences: { /* preferences */ },
    completedContent: ['course1', 'lesson2'],
    assessmentHistory: [/* assessment results */]
  },
  availableCourses: [
    { id: 'course1', title: 'Intro to Programming', difficulty: 'beginner' }
  ],
  targetSkills: ['JavaScript', 'React'],
  timeConstraints: {
    hoursPerWeek: 10,
    targetCompletionDate: '2024-06-01'
  }
};

try {
  const { roadmap } = await aiClient.generateRoadmap(roadmapInput);
  console.log('Learning path:', roadmap.learning_path);
  console.log('Reasoning:', roadmap.personalization_reasoning);
} catch (error) {
  console.error('Roadmap generation failed:', error.message);
}
```

## Rate Limiting and Cost Management

### Rate Limiting

The system implements intelligent rate limiting to prevent API abuse and manage costs:

- **Requests per minute**: Configurable limit (default: 60)
- **Tokens per minute**: Configurable limit (default: 90,000)
- **Burst protection**: Prevents rapid successive requests
- **Automatic retry**: Exponential backoff with jitter

### Cost Management

1. **Token Estimation**: Estimates token usage before API calls
2. **Usage Tracking**: Records actual token consumption
3. **Budget Alerts**: Can be configured to alert on high usage
4. **Fallback Activation**: Automatically switches to fallback when limits are reached

### Monitoring Usage

```typescript
import { getAIService } from '$lib/services/ai';

const aiService = getAIService();
const stats = aiService.getRateLimitStats();

console.log('Requests in last minute:', stats.requestsInLastMinute);
console.log('Tokens used:', stats.tokensInLastMinute);
console.log('Requests remaining:', stats.requestsRemaining);
console.log('Tokens remaining:', stats.tokensRemaining);
```

## Error Handling

### Error Types

The system defines specific error types for different scenarios:

```typescript
interface AIError extends Error {
  code: 'RATE_LIMIT' | 'INVALID_API_KEY' | 'MODEL_UNAVAILABLE' | 
        'CONTENT_FILTER' | 'NETWORK_ERROR' | 'UNKNOWN';
  provider: string;
  retryable: boolean;
  retryAfter?: number;
}
```

### Error Handling Patterns

```typescript
try {
  const result = await aiService.generateText(prompt);
} catch (error) {
  switch (error.code) {
    case 'RATE_LIMIT':
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
      break;
    
    case 'INVALID_API_KEY':
      // Configuration issue - don't retry
      console.error('AI service configuration error');
      break;
    
    case 'MODEL_UNAVAILABLE':
      // Temporary issue - retry later
      console.warn('AI model temporarily unavailable');
      break;
    
    case 'CONTENT_FILTER':
      // Content was filtered - modify content
      console.warn('Content filtered by AI safety systems');
      break;
    
    default:
      // Unknown error
      console.error('Unexpected AI service error:', error);
  }
}
```

## Fallback Mechanisms

### Automatic Fallback

The system automatically falls back to rule-based alternatives when:

- API key is not configured
- Rate limits are exceeded
- Network connectivity issues
- AI service is unavailable

### Fallback Capabilities

1. **Content Analysis**: Rule-based keyword extraction and difficulty assessment
2. **Assessment Generation**: Template-based question creation
3. **Roadmap Generation**: Sequential course ordering based on difficulty

### Detecting Fallback Usage

```typescript
const aiService = getAIService();

if (aiService.isUsingFallback()) {
  console.warn('Using fallback AI provider - limited functionality');
  // Show user notification about reduced AI features
}
```

## Provider Switching

### Runtime Provider Switching

```typescript
const aiService = getAIService();

// Switch to fallback mode
aiService.switchProvider('fallback');

// Switch back to OpenAI with new configuration
aiService.switchProvider('openai', {
  apiKey: 'new-api-key',
  model: 'gpt-3.5-turbo'
});
```

### Adding New Providers

To add a new AI provider:

1. Create a new provider class extending `BaseAIProvider`
2. Implement required methods (`generateText`, etc.)
3. Add provider to the factory method in `AIService`
4. Update configuration types

Example:

```typescript
// src/lib/services/ai/providers/anthropic.ts
export class AnthropicProvider extends BaseAIProvider {
  name = 'anthropic';
  
  async generateText(prompt: string, options?: AIGenerationOptions): Promise<AIResponse> {
    // Implementation for Anthropic's Claude API
  }
}
```

## Response Validation

### Automatic Validation

All AI responses are automatically validated for:

- Empty or invalid responses
- Potential hallucinations
- Security concerns (XSS, injection attacks)
- Format compliance (JSON structure, required fields)

### Custom Validation

```typescript
const validationResult = await aiService.validateResponse(response);

if (!validationResult.isValid) {
  console.error('Validation errors:', validationResult.errors);
  console.warn('Validation warnings:', validationResult.warnings);
} else {
  const sanitizedContent = validationResult.sanitizedContent;
  // Use sanitized content
}
```

## Security Considerations

### Input Sanitization

- All user inputs are sanitized before sending to AI services
- Content filtering prevents malicious prompt injection
- Response sanitization removes potentially harmful content

### API Key Security

- API keys are stored as environment variables
- Keys are never exposed to client-side code
- Rotation procedures should be implemented

### Content Filtering

- Automatic content filtering for inappropriate material
- Educational content guidelines enforcement
- Privacy protection for student data

## Performance Optimization

### Caching

Consider implementing caching for:

- Content analysis results (cache by content hash)
- Assessment templates (cache by content + parameters)
- Common roadmap patterns

### Batch Processing

For bulk operations:

```typescript
// Process multiple content blocks efficiently
const analyses = await Promise.all(
  contentBlocks.map(block => 
    aiClient.analyzeContent(block.content, 'assessment_generation')
  )
);
```

### Async Processing

For long-running operations, consider:

- Background job processing
- WebSocket updates for progress
- Partial result streaming

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Check environment variable configuration
   - Verify API key is valid and has sufficient credits
   - Ensure key has required permissions

2. **Rate Limit Exceeded**
   - Check current usage with `getRateLimitStats()`
   - Implement exponential backoff
   - Consider upgrading API plan

3. **Content Filtered**
   - Review content for policy violations
   - Modify prompts to be more educational
   - Use fallback for problematic content

4. **Network Timeouts**
   - Check internet connectivity
   - Increase timeout configuration
   - Implement retry logic

### Debug Mode

Enable debug logging in development:

```typescript
const aiService = new AIService({
  // ... other config
  debug: true // Enables detailed logging
});
```

### Health Checks

Monitor AI service health:

```typescript
// Check service status
const { status } = await aiClient.getStatus();

if (!status.isAvailable) {
  console.error('AI service unavailable:', status.error);
}
```

## Best Practices

### Prompt Engineering

1. **Be Specific**: Provide clear, detailed prompts
2. **Use Examples**: Include examples of desired output
3. **Set Context**: Provide educational context and constraints
4. **Validate Output**: Always validate and sanitize responses

### Error Recovery

1. **Graceful Degradation**: Always provide fallback functionality
2. **User Communication**: Inform users when AI features are limited
3. **Retry Logic**: Implement intelligent retry mechanisms
4. **Logging**: Log errors for monitoring and debugging

### Cost Optimization

1. **Efficient Prompts**: Use concise, effective prompts
2. **Caching**: Cache results when appropriate
3. **Batch Operations**: Group related requests
4. **Model Selection**: Use appropriate models for different tasks

## Integration Examples

### Assessment Builder Integration

```typescript
// In AssessmentBuilder.svelte
import { getAIClient } from '$lib/services/aiClient';

let generating = false;
let generationError = '';

async function generateQuestions() {
  generating = true;
  generationError = '';
  
  try {
    const aiClient = getAIClient();
    const { assessment } = await aiClient.generateAssessment({
      contentBlocks: lesson.content_blocks,
      learningObjectives: lesson.learning_objectives,
      difficulty: lesson.difficulty_level,
      questionTypes: selectedQuestionTypes,
      questionCount: questionCount
    });
    
    // Add generated questions to assessment
    questions = [...questions, ...assessment.questions];
  } catch (error) {
    generationError = error.message;
    
    if (aiClient.isRateLimitError(error)) {
      const retryAfter = aiClient.extractRetryAfter(error);
      generationError += ` Please try again in ${retryAfter} seconds.`;
    }
  } finally {
    generating = false;
  }
}
```

### Roadmap Generation Integration

```typescript
// In student dashboard
import { getAIClient } from '$lib/services/aiClient';

async function generatePersonalizedRoadmap() {
  const aiClient = getAIClient();
  
  try {
    const { roadmap } = await aiClient.generateRoadmap({
      studentProfile: {
        knowledgeProfile: user.knowledge_profile,
        learningPreferences: user.learning_preferences,
        completedContent: completedCourses.map(c => c.id),
        assessmentHistory: assessmentHistory
      },
      availableCourses: availableCourses,
      targetSkills: selectedSkills
    });
    
    // Display personalized roadmap
    personalizedRoadmap = roadmap;
  } catch (error) {
    console.error('Roadmap generation failed:', error);
    // Show fallback roadmap or error message
  }
}
```

This comprehensive AI integration provides a robust foundation for intelligent educational features while maintaining reliability through fallback mechanisms and proper error handling.