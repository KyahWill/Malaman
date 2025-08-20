/**
 * AI Service Main Implementation
 */

import { dev } from '$app/environment';
import { 
  OPENAI_API_KEY, 
  AI_MODEL 
} from '$env/static/private';

import type { 
  AIProvider, 
  AIServiceConfig, 
  AIResponse, 
  AIGenerationOptions,
  ContentAnalysis,
  ContentAnalysisType,
  ValidationResult,
  RoadmapGenerationInput,
  AssessmentGenerationInput,
  AIError
} from './types.js';

import { OpenAIProvider } from './providers/openai.js';
import { FallbackProvider } from './providers/fallback.js';
import { getRateLimiter } from './rateLimiter.js';

export class AIService {
  private provider: AIProvider;
  private fallbackProvider: FallbackProvider;
  private config: AIServiceConfig;
  private rateLimiter;

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = {
      provider: 'openai',
      apiKey: OPENAI_API_KEY || '',
      model: AI_MODEL || 'gpt-4',
      maxRetries: 3,
      timeout: 30000,
      rateLimiting: {
        requestsPerMinute: 60,
        tokensPerMinute: 90000
      },
      ...config
    };

    this.fallbackProvider = new FallbackProvider();
    this.provider = this.createProvider();
    
    this.rateLimiter = getRateLimiter(this.config.provider, this.config.rateLimiting);
  }

  private createProvider(): AIProvider {
    if (!this.config.apiKey && !dev) {
      console.warn('AI API key not configured, using fallback provider');
      return this.fallbackProvider;
    }

    switch (this.config.provider) {
      case 'openai':
        return new OpenAIProvider({
          apiKey: this.config.apiKey,
          model: this.config.model,
          maxRetries: this.config.maxRetries,
          timeout: this.config.timeout
        });
      default:
        console.warn(`Unknown AI provider: ${this.config.provider}, using fallback`);
        return this.fallbackProvider;
    }
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<AIResponse> {
    // Check rate limits
    const estimatedTokens = Math.ceil(prompt.length / 4) + (options?.maxTokens || 2000);
    const rateLimitCheck = await this.rateLimiter.checkLimit(estimatedTokens);
    
    if (!rateLimitCheck.allowed) {
      const error = new Error('Rate limit exceeded') as AIError;
      error.code = 'RATE_LIMIT';
      error.provider = this.config.provider;
      error.retryable = true;
      error.retryAfter = rateLimitCheck.retryAfter;
      throw error;
    }

    try {
      const response = await this.provider.generateText(prompt, options);
      
      // Record actual token usage for rate limiting
      if (response.usage) {
        this.rateLimiter.recordRequest(response.usage.totalTokens);
      } else {
        // Estimate if no usage data
        this.rateLimiter.recordRequest(estimatedTokens);
      }

      return response;
    } catch (error) {
      // If primary provider fails, try fallback
      if (this.provider !== this.fallbackProvider && this.shouldUseFallback(error)) {
        console.warn('Primary AI provider failed, using fallback:', error);
        return await this.fallbackProvider.generateText(prompt, options);
      }
      throw error;
    }
  }

  async analyzeContent(content: string, analysisType: ContentAnalysisType): Promise<ContentAnalysis> {
    try {
      return await this.provider.analyzeContent(content, analysisType);
    } catch (error) {
      if (this.provider !== this.fallbackProvider && this.shouldUseFallback(error)) {
        console.warn('Content analysis failed, using fallback:', error);
        return await this.fallbackProvider.analyzeContent(content, analysisType);
      }
      throw error;
    }
  }

  async validateResponse(response: string): Promise<ValidationResult> {
    return await this.provider.validateResponse(response);
  }

  async generatePersonalizedRoadmap(input: RoadmapGenerationInput): Promise<any> {
    const prompt = this.buildRoadmapPrompt(input);
    
    try {
      const response = await this.generateText(prompt, {
        responseFormat: 'json',
        systemPrompt: `You are an expert educational advisor. Create personalized learning roadmaps based on student profiles and available courses. 
        
        Respond with valid JSON in this format:
        {
          "learning_path": [
            {
              "content_id": "course_or_lesson_id",
              "content_type": "course|lesson",
              "title": "Content Title",
              "order_index": 0,
              "estimated_time": 60,
              "prerequisites": ["id1", "id2"],
              "learning_objectives": ["objective1", "objective2"],
              "personalization_notes": "Why this is recommended for this student",
              "difficulty_level": "beginner|intermediate|advanced"
            }
          ],
          "total_estimated_time": 300,
          "personalization_reasoning": "Explanation of why this path was chosen",
          "alternative_paths": ["Brief description of alternative approaches"],
          "success_metrics": ["How to measure progress"]
        }`
      });

      const roadmapData = JSON.parse(response.content);
      return this.validateRoadmapData(roadmapData);
    } catch (error) {
      console.error('Roadmap generation failed:', error);
      return this.generateFallbackRoadmap(input);
    }
  }

  async generateAssessment(input: AssessmentGenerationInput): Promise<any> {
    const prompt = this.buildAssessmentPrompt(input);
    
    try {
      const response = await this.generateText(prompt, {
        responseFormat: 'json',
        systemPrompt: `You are an expert educational assessment creator. Generate high-quality assessment questions based on learning content.
        
        Respond with valid JSON in this format:
        {
          "questions": [
            {
              "type": "multiple_choice|true_false|short_answer|essay",
              "question_text": "The question text",
              "options": ["option1", "option2", "option3", "option4"], // for multiple choice only
              "correct_answer": "correct answer or option",
              "explanation": "Why this is correct and others are wrong",
              "difficulty_level": 1-5,
              "topics": ["topic1", "topic2"],
              "points": 10
            }
          ],
          "assessment_metadata": {
            "total_points": 100,
            "estimated_time": 30,
            "difficulty_distribution": {"easy": 3, "medium": 4, "hard": 3},
            "topic_coverage": ["topic1", "topic2", "topic3"]
          }
        }`
      });

      const assessmentData = JSON.parse(response.content);
      return this.validateAssessmentData(assessmentData);
    } catch (error) {
      console.error('Assessment generation failed:', error);
      return this.generateFallbackAssessment(input);
    }
  }

  private buildRoadmapPrompt(input: RoadmapGenerationInput): string {
    return `Create a personalized learning roadmap for a student with the following profile:

Student Profile:
- Knowledge Profile: ${JSON.stringify(input.studentProfile.knowledgeProfile, null, 2)}
- Learning Preferences: ${JSON.stringify(input.studentProfile.learningPreferences, null, 2)}
- Completed Content: ${input.studentProfile.completedContent.join(', ') || 'None'}
- Assessment History: ${input.studentProfile.assessmentHistory.length} previous assessments

Available Courses:
${input.availableCourses.map(course => `- ${course.title}: ${course.description} (${course.difficulty_level})`).join('\n')}

${input.targetSkills ? `Target Skills: ${input.targetSkills.join(', ')}` : ''}
${input.timeConstraints ? `Time Constraints: ${input.timeConstraints.hoursPerWeek} hours/week` : ''}

Please create a personalized learning path that:
1. Builds on the student's existing knowledge
2. Addresses identified knowledge gaps
3. Follows a logical progression from basic to advanced concepts
4. Considers the student's learning preferences
5. Provides realistic time estimates
6. Includes clear learning objectives for each step`;
  }

  private buildAssessmentPrompt(input: AssessmentGenerationInput): string {
    const contentSummary = input.contentBlocks
      .map(block => `${block.type}: ${block.content}`)
      .join('\n\n');

    return `Generate an assessment based on the following learning content:

Content to Assess:
${contentSummary}

Learning Objectives:
${input.learningObjectives.map(obj => `- ${obj}`).join('\n')}

Assessment Requirements:
- Difficulty Level: ${input.difficulty}
- Question Types: ${input.questionTypes.join(', ')}
- Number of Questions: ${input.questionCount}

Please create questions that:
1. Test understanding of key concepts from the content
2. Include a mix of difficulty levels appropriate for ${input.difficulty} level
3. Cover all major learning objectives
4. Provide clear explanations for correct answers
5. Are free from bias and culturally sensitive
6. Follow educational best practices for assessment design`;
  }

  private validateRoadmapData(data: any): any {
    // Basic validation and sanitization
    if (!data.learning_path || !Array.isArray(data.learning_path)) {
      throw new Error('Invalid roadmap data: missing or invalid learning_path');
    }

    // Ensure required fields exist
    data.learning_path.forEach((item: any, index: number) => {
      if (!item.content_id || !item.content_type || !item.title) {
        throw new Error(`Invalid learning path item at index ${index}: missing required fields`);
      }
      
      // Set defaults for missing optional fields
      item.order_index = item.order_index ?? index;
      item.estimated_time = item.estimated_time ?? 60;
      item.prerequisites = item.prerequisites ?? [];
      item.learning_objectives = item.learning_objectives ?? [];
      item.personalization_notes = item.personalization_notes ?? '';
      item.difficulty_level = item.difficulty_level ?? 'intermediate';
    });

    return data;
  }

  private validateAssessmentData(data: any): any {
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid assessment data: missing or invalid questions');
    }

    // Validate each question
    data.questions.forEach((question: any, index: number) => {
      if (!question.type || !question.question_text || !question.correct_answer) {
        throw new Error(`Invalid question at index ${index}: missing required fields`);
      }

      // Set defaults
      question.explanation = question.explanation ?? 'No explanation provided';
      question.difficulty_level = question.difficulty_level ?? 3;
      question.topics = question.topics ?? [];
      question.points = question.points ?? 10;

      // Validate multiple choice questions have options
      if (question.type === 'multiple_choice' && (!question.options || !Array.isArray(question.options))) {
        throw new Error(`Multiple choice question at index ${index} missing options`);
      }
    });

    return data;
  }

  private generateFallbackRoadmap(input: RoadmapGenerationInput): any {
    return {
      learning_path: input.availableCourses.map((course, index) => ({
        content_id: course.id,
        content_type: 'course',
        title: course.title,
        order_index: index,
        estimated_time: course.estimated_duration || 120,
        prerequisites: [],
        learning_objectives: course.learning_objectives || ['Complete the course'],
        personalization_notes: 'Generated by fallback system',
        difficulty_level: course.difficulty_level || 'intermediate'
      })),
      total_estimated_time: input.availableCourses.reduce((sum, course) => sum + (course.estimated_duration || 120), 0),
      personalization_reasoning: 'Fallback roadmap based on available courses',
      alternative_paths: ['Consider reviewing prerequisites if difficulty is too high'],
      success_metrics: ['Course completion', 'Assessment scores above 70%']
    };
  }

  private generateFallbackAssessment(input: AssessmentGenerationInput): any {
    const questions = [];
    const questionCount = Math.min(input.questionCount, 10);

    // Generate a variety of sample questions based on requested types
    const sampleQuestions = {
      multiple_choice: [
        {
          type: 'multiple_choice',
          question_text: 'Which of the following best describes effective learning?',
          options: [
            'Memorizing facts without understanding context',
            'Understanding concepts and applying them to new situations',
            'Reading material once and moving on',
            'Focusing only on test preparation'
          ],
          correct_answer: 'Understanding concepts and applying them to new situations',
          explanation: 'Effective learning involves deep understanding and the ability to transfer knowledge to new contexts.',
          difficulty_level: 3,
          topics: ['Learning Theory', 'Educational Psychology'],
          points: 10
        },
        {
          type: 'multiple_choice',
          question_text: 'What is the most important factor in knowledge retention?',
          options: [
            'Repetition without understanding',
            'Active engagement and practice',
            'Passive reading',
            'Cramming before tests'
          ],
          correct_answer: 'Active engagement and practice',
          explanation: 'Active learning strategies that involve practice and engagement lead to better retention than passive methods.',
          difficulty_level: 2,
          topics: ['Memory', 'Learning Strategies'],
          points: 10
        }
      ],
      true_false: [
        {
          type: 'true_false',
          question_text: 'Spaced repetition is more effective than massed practice for long-term retention.',
          correct_answer: 'true',
          explanation: 'Research consistently shows that distributing practice over time (spaced repetition) leads to better long-term retention than concentrated practice sessions.',
          difficulty_level: 2,
          topics: ['Memory', 'Study Techniques'],
          points: 5
        },
        {
          type: 'true_false',
          question_text: 'All students learn best using the same teaching methods.',
          correct_answer: 'false',
          explanation: 'Students have different learning preferences, backgrounds, and needs, requiring varied instructional approaches for optimal learning.',
          difficulty_level: 1,
          topics: ['Individual Differences', 'Teaching Methods'],
          points: 5
        }
      ],
      short_answer: [
        {
          type: 'short_answer',
          question_text: 'Explain the difference between surface learning and deep learning approaches.',
          correct_answer: 'Surface learning focuses on memorization and reproduction of information, while deep learning involves understanding concepts, making connections, and applying knowledge to new situations.',
          explanation: 'Deep learning is characterized by seeking meaning, relating ideas, and critical thinking, whereas surface learning is more about rote memorization without understanding.',
          difficulty_level: 3,
          topics: ['Learning Approaches', 'Educational Theory'],
          points: 15
        },
        {
          type: 'short_answer',
          question_text: 'What are two key benefits of formative assessment in education?',
          correct_answer: 'Formative assessment provides ongoing feedback to improve learning and helps instructors adjust their teaching methods based on student understanding.',
          explanation: 'Formative assessment serves dual purposes: it helps students identify areas for improvement and guides instructors in modifying their teaching strategies.',
          difficulty_level: 2,
          topics: ['Assessment', 'Feedback'],
          points: 10
        }
      ],
      essay: [
        {
          type: 'essay',
          question_text: 'Discuss the role of metacognition in effective learning. Include specific strategies that learners can use to develop metacognitive skills.',
          correct_answer: 'Metacognition involves awareness and understanding of one\'s own thought processes. Effective strategies include self-questioning, reflection on learning progress, planning study approaches, monitoring comprehension, and evaluating learning outcomes. Students can develop these skills through journaling, self-assessment, goal setting, and regular reflection on their learning strategies.',
          explanation: 'This essay should demonstrate understanding of metacognition as "thinking about thinking" and provide concrete examples of metacognitive strategies that enhance learning effectiveness.',
          difficulty_level: 4,
          topics: ['Metacognition', 'Learning Strategies', 'Self-Regulation'],
          points: 25
        }
      ]
    };

    // Select questions based on requested types
    for (const questionType of input.questionTypes) {
      if (sampleQuestions[questionType] && questions.length < questionCount) {
        const availableQuestions = sampleQuestions[questionType];
        const questionsToAdd = Math.min(
          availableQuestions.length,
          Math.ceil(questionCount / input.questionTypes.length)
        );
        
        for (let i = 0; i < questionsToAdd && questions.length < questionCount; i++) {
          questions.push({
            ...availableQuestions[i],
            id: crypto.randomUUID()
          });
        }
      }
    }

    // Fill remaining slots with multiple choice if needed
    while (questions.length < questionCount && sampleQuestions.multiple_choice.length > 0) {
      const randomIndex = Math.floor(Math.random() * sampleQuestions.multiple_choice.length);
      questions.push({
        ...sampleQuestions.multiple_choice[randomIndex],
        id: crypto.randomUUID()
      });
    }

    return {
      questions: questions.slice(0, questionCount),
      assessment_metadata: {
        total_points: questions.reduce((sum, q) => sum + q.points, 0),
        estimated_time: questions.length * 4, // 4 minutes per question average
        difficulty_distribution: {
          easy: questions.filter(q => q.difficulty_level <= 2).length,
          medium: questions.filter(q => q.difficulty_level === 3).length,
          hard: questions.filter(q => q.difficulty_level >= 4).length
        },
        topic_coverage: [...new Set(questions.flatMap(q => q.topics))]
      }
    };
  }

  private shouldUseFallback(error: any): boolean {
    // Use fallback for certain types of errors
    const fallbackCodes = ['RATE_LIMIT', 'INVALID_API_KEY', 'MODEL_UNAVAILABLE', 'NETWORK_ERROR'];
    return fallbackCodes.includes(error?.code) || !this.config.apiKey;
  }

  // Utility methods
  getRateLimitStats() {
    return this.rateLimiter.getStats();
  }

  switchProvider(newProvider: 'openai' | 'fallback' | 'anthropic' | 'local', config?: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...config, provider: newProvider };
    this.provider = this.createProvider();
  }

  isUsingFallback(): boolean {
    return this.provider === this.fallbackProvider;
  }
}

// Export types
export type * from './types.js';

// Export singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(config?: Partial<AIServiceConfig>): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService(config);
  }
  return aiServiceInstance;
}