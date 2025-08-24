import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recommendationEngine } from '$lib/services/recommendationEngine';
import { requireAuth } from '$lib/middleware/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await requireAuth(['student'])(locals);
    const feedbackData = await request.json();

    const feedback = {
      studentId: session.user.id,
      contentId: feedbackData.contentId,
      recommendationId: feedbackData.recommendationId,
      type: feedbackData.type,
      rating: feedbackData.rating,
      comment: feedbackData.comment
    };

    await recommendationEngine.recordFeedback(feedback);

    return json({ success: true });

  } catch (error) {
    console.error('Error recording recommendation feedback:', error);
    return json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await requireAuth(['student'])(locals);
    const recommendationId = url.searchParams.get('recommendationId');

    if (!recommendationId) {
      return json({ error: 'Recommendation ID required' }, { status: 400 });
    }

    const explanation = await recommendationEngine.getRecommendationExplanation(recommendationId);

    return json({ explanation });

  } catch (error) {
    console.error('Error getting recommendation explanation:', error);
    return json(
      { error: 'Failed to get explanation' },
      { status: 500 }
    );
  }
};