import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recommendationEngine } from '$lib/services/recommendationEngine';
import { requireAuth } from '$lib/middleware/auth';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const session = await requireAuth(['student'])(locals);
    const studentId = session.user.id;

    const engagementPattern = await recommendationEngine.analyzeEngagementPatterns(studentId);

    return json({ engagementPattern });

  } catch (error) {
    console.error('Error analyzing engagement patterns:', error);
    return json(
      { error: 'Failed to analyze engagement patterns' },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await requireAuth(['student'])(locals);
    const body = await request.json();
    const { supabase } = locals;

    // Handle batch interactions
    if (body.interactions && Array.isArray(body.interactions)) {
      const interactions = body.interactions.map((interaction: any) => ({
        student_id: session.user.id,
        content_id: interaction.contentId,
        content_type: interaction.contentType,
        interaction_type: interaction.interactionType,
        duration: interaction.duration || null,
        metadata: interaction.metadata || {}
      }));

      const { error } = await supabase
        .from('content_interactions')
        .insert(interactions);

      if (error) throw error;

      // Check if any completion interactions to trigger pattern recalculation
      const hasCompletions = body.interactions.some((i: any) => i.interactionType === 'complete');
      if (hasCompletions) {
        await recommendationEngine.analyzeEngagementPatterns(session.user.id);
      }

      return json({ success: true, processed: interactions.length });
    }

    // Handle single interaction (backward compatibility)
    const { contentId, contentType, interactionType, duration, metadata } = body;
    
    // Record content interaction
    const { error } = await supabase
      .from('content_interactions')
      .insert({
        student_id: session.user.id,
        content_id: contentId,
        content_type: contentType,
        interaction_type: interactionType,
        duration,
        metadata: metadata || {}
      });

    if (error) throw error;

    // Trigger engagement pattern recalculation if needed
    if (interactionType === 'complete') {
      await recommendationEngine.analyzeEngagementPatterns(session.user.id);
    }

    return json({ success: true });

  } catch (error) {
    console.error('Error recording content interaction:', error);
    return json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
};