import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAIService } from '$lib/services/ai/index.js';
import { AssessmentService } from '$lib/services/database.js';
import { requireAuth } from '$lib/middleware/auth.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Require instructor or admin authentication
    const session = await requireAuth(locals);
    if (!['instructor', 'admin'].includes(session.user.role)) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { assessmentId, questionIndex, options = {} } = await request.json();

    if (!assessmentId || questionIndex === undefined) {
      return json(
        { error: 'Assessment ID and question index are required' },
        { status: 400 }
      );
    }

    // Get the assessment
    const assessment = await AssessmentService.getById(assessmentId);
    if (!assessment) {
      return json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check if the question exists
    if (!assessment.questions || questionIndex >= assessment.questions.length) {
      return json({ error: 'Question not found' }, { status: 404 });
    }

    const originalQuestion = assessment.questions[questionIndex];

    // Prepare AI input for regeneration
    const aiInput = {
      contentBlocks: [], // We'll use the original question context
      learningObjectives: originalQuestion.topics || [],
      difficulty: options.difficulty || 'intermediate',
      questionTypes: [originalQuestion.type],
      questionCount: 1,
      context: {
        originalQuestion: originalQuestion.question_text,
        explanation: originalQuestion.explanation,
        topics: originalQuestion.topics
      }
    };

    // Generate new question using AI
    const aiService = getAIService();
    const prompt = buildRegenerationPrompt(originalQuestion, options);
    
    const response = await aiService.generateText(prompt, {
      responseFormat: 'json',
      systemPrompt: `You are an expert educational assessment creator. Regenerate a single question based on the provided context and requirements.
      
      Respond with valid JSON in this format:
      {
        "question": {
          "type": "${originalQuestion.type}",
          "question_text": "The new question text",
          "options": ["option1", "option2", "option3", "option4"], // for multiple choice only
          "correct_answer": "correct answer or option",
          "explanation": "Why this is correct and others are wrong",
          "difficulty_level": 1-5,
          "topics": ["topic1", "topic2"],
          "points": ${originalQuestion.points}
        }
      }`
    });

    const result = JSON.parse(response.content);
    
    if (!result.question) {
      throw new Error('Invalid AI response format');
    }

    // Validate the regenerated question
    const newQuestion = {
      ...result.question,
      id: crypto.randomUUID()
    };

    return json({
      success: true,
      question: newQuestion,
      metadata: {
        originalQuestion: originalQuestion.question_text,
        regenerationReason: options.reason || 'Manual regeneration',
        aiProvider: aiService.isUsingFallback() ? 'fallback' : 'ai'
      }
    });

  } catch (error) {
    console.error('Error regenerating question:', error);
    
    if (error.code === 'RATE_LIMIT') {
      return json(
        { 
          error: 'AI service rate limit exceeded', 
          retryAfter: error.retryAfter 
        },
        { status: 429 }
      );
    }

    return json(
      { 
        error: 'Failed to regenerate question',
        details: error.message
      },
      { status: 500 }
    );
  }
};

function buildRegenerationPrompt(originalQuestion: any, options: any): string {
  return `Regenerate this assessment question with the following requirements:

Original Question:
Type: ${originalQuestion.type}
Question: ${originalQuestion.question_text}
${originalQuestion.options ? `Options: ${originalQuestion.options.join(', ')}` : ''}
Correct Answer: ${originalQuestion.correct_answer}
Explanation: ${originalQuestion.explanation}
Topics: ${originalQuestion.topics?.join(', ') || 'General'}
Difficulty: ${originalQuestion.difficulty_level}/5

Requirements for the new question:
- Keep the same question type (${originalQuestion.type})
- Cover the same topics: ${originalQuestion.topics?.join(', ') || 'General'}
- Maintain similar difficulty level
- Create a completely different question that tests the same concepts
- Ensure the question is clear, unambiguous, and educationally sound
- Provide a thorough explanation for the correct answer

${options.reason ? `Regeneration reason: ${options.reason}` : ''}
${options.focusArea ? `Focus on: ${options.focusArea}` : ''}

Please create a new question that is different from the original but tests the same learning objectives.`;
}