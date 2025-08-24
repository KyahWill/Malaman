/**
 * API endpoint for managing user learning preferences
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { supabase } from '$lib/supabase.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { id: profileId } = params;
    const currentUser = locals.session.user;

    // Authorization check
    if (currentUser.role === 'student' && currentUser.id !== profileId) {
      throw error(403, 'You can only access your own preferences');
    }

    // Get user's learning preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('learning_preferences, knowledge_profile')
      .eq('id', profileId)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        throw error(404, 'Profile not found');
      }
      throw error(500, 'Failed to fetch learning preferences');
    }

    return json({
      success: true,
      preferences: profile.learning_preferences || {},
      knowledgeProfile: profile.knowledge_profile || {}
    });

  } catch (err) {
    console.error('Failed to get learning preferences:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, 'Failed to retrieve learning preferences');
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { id: profileId } = params;
    const currentUser = locals.session.user;

    // Authorization check
    if (currentUser.role === 'student' && currentUser.id !== profileId) {
      throw error(403, 'You can only update your own preferences');
    }

    const body = await request.json();
    const { learningPreferences, knowledgeProfile } = body;

    // Validate learning preferences structure
    if (learningPreferences) {
      const validPaces = ['slow', 'medium', 'fast'];
      const validStyles = ['visual', 'auditory', 'kinesthetic', 'mixed'];
      const validMediaTypes = ['rich_text', 'image', 'video', 'file', 'youtube'];

      if (learningPreferences.preferredPace && !validPaces.includes(learningPreferences.preferredPace)) {
        throw error(400, 'Invalid preferred pace');
      }

      if (learningPreferences.learningStyle && !validStyles.includes(learningPreferences.learningStyle)) {
        throw error(400, 'Invalid learning style');
      }

      if (learningPreferences.preferredMediaTypes) {
        if (!Array.isArray(learningPreferences.preferredMediaTypes)) {
          throw error(400, 'Preferred media types must be an array');
        }
        
        const invalidTypes = learningPreferences.preferredMediaTypes.filter(
          (type: string) => !validMediaTypes.includes(type)
        );
        
        if (invalidTypes.length > 0) {
          throw error(400, `Invalid media types: ${invalidTypes.join(', ')}`);
        }
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (learningPreferences) {
      updateData.learning_preferences = learningPreferences;
    }
    
    if (knowledgeProfile) {
      updateData.knowledge_profile = knowledgeProfile;
    }

    if (Object.keys(updateData).length === 0) {
      throw error(400, 'No valid data provided for update');
    }

    // Update the profile
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select('learning_preferences, knowledge_profile')
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw error(500, 'Failed to update learning preferences');
    }

    return json({
      success: true,
      preferences: data.learning_preferences || {},
      knowledgeProfile: data.knowledge_profile || {},
      message: 'Learning preferences updated successfully'
    });

  } catch (err) {
    console.error('Failed to update learning preferences:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, 'Failed to update learning preferences');
  }
};