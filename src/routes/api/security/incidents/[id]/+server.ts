/**
 * Individual Security Incident API
 * Handles specific incident operations
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { incidentResponseService } from '$lib/services/security/incidentResponse';
import type { IncidentStatus } from '$lib/services/security/incidentResponse';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user) {
      throw error(401, 'Authentication required');
    }

    // Check if user is admin
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw error(403, 'Admin access required');
    }

    const incident = await incidentResponseService.getIncident(params.id);
    
    if (!incident) {
      throw error(404, 'Security incident not found');
    }

    return json({
      success: true,
      incident
    });
  } catch (err) {
    console.error('Failed to get security incident:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Admin access')) {
      throw error(403, err.message);
    }
    
    if (err instanceof Error && err.message.includes('not found')) {
      throw error(404, err.message);
    }
    
    throw error(500, 'Failed to get security incident');
  }
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user) {
      throw error(401, 'Authentication required');
    }

    // Check if user is admin
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw error(403, 'Admin access required');
    }

    const { action, status, resolution_notes, action_type, action_description, action_notes } = await request.json();

    if (action === 'update_status') {
      if (!status) {
        throw error(400, 'Status is required');
      }

      const validStatuses: IncidentStatus[] = [
        'detected', 'investigating', 'contained', 'mitigated', 'resolved', 'closed'
      ];

      if (!validStatuses.includes(status)) {
        throw error(400, 'Invalid status');
      }

      await incidentResponseService.updateIncidentStatus(
        params.id,
        status,
        resolution_notes,
        session.user.id
      );

      return json({
        success: true,
        message: 'Incident status updated successfully'
      });
    } else if (action === 'add_response_action') {
      if (!action_type || !action_description) {
        throw error(400, 'Action type and description are required');
      }

      await incidentResponseService.addResponseAction(
        params.id,
        action_type,
        action_description,
        session.user.id,
        'completed',
        action_notes
      );

      return json({
        success: true,
        message: 'Response action added successfully'
      });
    } else {
      throw error(400, 'Invalid action');
    }
  } catch (err) {
    console.error('Failed to update security incident:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Admin access')) {
      throw error(403, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Invalid')) {
      throw error(400, err.message);
    }
    
    throw error(500, 'Failed to update security incident');
  }
};