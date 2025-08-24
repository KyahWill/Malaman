import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recommendationEngine } from '$lib/services/recommendationEngine';
import { requireAuth } from '$lib/middleware/auth';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await requireAuth(['student'])(locals);
    const studentId = session.user.id;

    const contentType = url.searchParams.get('contentType') as 'lesson' | 'course' | 'assessment' | undefined;
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const excludeCompleted = url.searchParams.get('excludeCompleted') !== 'false';

    const recommendations = await recommendationEngine.generateRecommendations({
      studentId,
      contentType,
      limit,
      excludeCompleted
    });

    return json({ recommendations });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await requireAuth(['student'])(locals);
    const { action, recommendationId, contentId } = await request.json();

    if (action === 'view' || action === 'click') {
      // Update recommendation interaction
      const { supabase } = locals;
      await supabase
        .from('content_recommendations')
        .update({ [action === 'view' ? 'viewed' : 'clicked']: true })
        .eq('id', recommendationId)
        .eq('student_id', session.user.id);

      // Track content interaction
      await supabase
        .from('content_interactions')
        .insert({
          student_id: session.user.id,
          content_id: contentId,
          content_type: 'lesson', // This could be dynamic
          interaction_type: action === 'view' ? 'view' : 'start'
        });
    }

    return json({ success: true });

  } catch (error) {
    console.error('Error updating recommendation interaction:', error);
    return json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    );
  }
};