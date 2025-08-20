import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAIService } from '$lib/services/ai/index.js';
import { LessonService, CourseService } from '$lib/services/database.js';
import { requireAuth } from '$lib/middleware/auth.js';
import type { AssessmentGenerationInput } from '$lib/services/ai/types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // For demo purposes, we'll skip authentication
    // In production, you would check authentication here
    // const session = await requireAuth(locals);
    // if (!['instructor', 'admin'].includes(session.user.role)) {
    //   return json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const requestData = await request.json();
    const { lessonId, courseId, options = {} } = requestData;

    if (!lessonId && !courseId) {
      return json(
        { error: 'Either lessonId or courseId is required' },
        { status: 400 }
      );
    }

    let contentBlocks: any[] = [];
    let learningObjectives: string[] = [];
    let title = '';
    let description = '';

    // For demo purposes, use mock content
    if (lessonId) {
      // Mock lesson content
      contentBlocks = [
        {
          id: 'mock-1',
          type: 'rich_text',
          content: 'This lesson covers the fundamentals of machine learning, including supervised and unsupervised learning algorithms. Students will learn about linear regression, decision trees, and neural networks.'
        },
        {
          id: 'mock-2', 
          type: 'rich_text',
          content: 'Key concepts include training data, validation, overfitting, and model evaluation metrics such as accuracy, precision, and recall.'
        }
      ];
      learningObjectives = [
        'Understand the difference between supervised and unsupervised learning',
        'Implement basic machine learning algorithms',
        'Evaluate model performance using appropriate metrics'
      ];
      title = 'Machine Learning Fundamentals Assessment';
      description = 'Assessment covering basic machine learning concepts and algorithms';
    } else if (courseId) {
      // Mock course content
      contentBlocks = [
        {
          id: 'mock-course-1',
          type: 'rich_text', 
          content: 'This comprehensive course covers data science from basics to advanced topics including statistics, machine learning, data visualization, and big data processing.'
        },
        {
          id: 'mock-course-2',
          type: 'rich_text',
          content: 'Students will work with Python, pandas, scikit-learn, and other industry-standard tools to analyze real-world datasets.'
        }
      ];
      learningObjectives = [
        'Master statistical analysis and hypothesis testing',
        'Build and deploy machine learning models',
        'Create effective data visualizations',
        'Process and analyze large datasets'
      ];
      title = 'Data Science Comprehensive Final Assessment';
      description = 'Final assessment covering all aspects of data science covered in the course';
    }

    if (contentBlocks.length === 0) {
      return json(
        { error: 'No content found to generate assessment from' },
        { status: 400 }
      );
    }

    // Prepare AI input
    const aiInput: AssessmentGenerationInput = {
      contentBlocks: contentBlocks.map(block => ({
        type: block.type,
        content: extractTextContent(block.content)
      })),
      learningObjectives: [...new Set(learningObjectives)], // Remove duplicates
      difficulty: options.difficulty || 'intermediate',
      questionTypes: options.questionTypes || ['multiple_choice', 'true_false', 'short_answer'],
      questionCount: options.questionCount || 10
    };

    // Generate assessment using AI
    const aiService = getAIService();
    const generatedAssessment = await aiService.generateAssessment(aiInput);

    // Prepare assessment data
    const assessmentData = {
      title,
      description,
      questions: generatedAssessment.questions,
      ai_generated: true,
      source_content_ids: contentBlocks.map(block => block.id),
      is_mandatory: options.isMandatory !== false, // Default to true
      minimum_passing_score: options.minimumPassingScore || 70,
      max_attempts: options.maxAttempts || null,
      time_limit: options.timeLimit || null,
      lesson_id: lessonId || null,
      course_id: courseId || null,
      metadata: {
        generation_timestamp: new Date().toISOString(),
        ai_model: aiService.isUsingFallback() ? 'fallback' : 'ai',
        generation_options: options,
        ...generatedAssessment.assessment_metadata
      }
    };

    return json({
      success: true,
      assessment: assessmentData,
      metadata: {
        contentAnalyzed: contentBlocks.length,
        objectivesCovered: learningObjectives.length,
        questionsGenerated: generatedAssessment.questions.length,
        aiProvider: aiService.isUsingFallback() ? 'fallback' : 'ai'
      }
    });

  } catch (error) {
    console.error('Error generating AI assessment:', error);
    
    // Return specific error messages for different failure types
    const err = error as any;
    if (err.code === 'RATE_LIMIT') {
      return json(
        { 
          error: 'AI service rate limit exceeded', 
          retryAfter: err.retryAfter,
          fallbackAvailable: true
        },
        { status: 429 }
      );
    }

    if (err.code === 'INVALID_API_KEY') {
      return json(
        { 
          error: 'AI service configuration error',
          fallbackAvailable: true
        },
        { status: 503 }
      );
    }

    return json(
      { 
        error: 'Failed to generate assessment',
        details: err.message || 'Unknown error',
        fallbackAvailable: true
      },
      { status: 500 }
    );
  }
};

/**
 * Extract text content from content blocks for AI analysis
 */
function extractTextContent(content: any): string {
  if (!content) return '';

  if (content.rich_text?.plain_text) {
    return content.rich_text.plain_text;
  }

  if (content.rich_text?.html) {
    // Strip HTML tags for plain text
    return content.rich_text.html.replace(/<[^>]*>/g, '');
  }

  if (content.image?.alt_text) {
    return `Image: ${content.image.alt_text}`;
  }

  if (content.video?.title) {
    return `Video: ${content.video.title}`;
  }

  if (content.youtube?.title) {
    return `YouTube Video: ${content.youtube.title}`;
  }

  if (content.file?.filename) {
    return `File: ${content.file.filename}`;
  }

  return '';
}