/**
 * Security Incident Report API
 * Generates detailed incident reports
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { incidentResponseService } from '$lib/services/security/incidentResponse';

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

    const report = await incidentResponseService.generateIncidentReport(params.id);

    return new Response(report, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="incident-report-${params.id}.txt"`
      }
    });
  } catch (err) {
    console.error('Failed to generate incident report:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Admin access')) {
      throw error(403, err.message);
    }
    
    if (err instanceof Error && err.message.includes('not found')) {
      throw error(404, 'Incident not found');
    }
    
    throw error(500, 'Failed to generate incident report');
  }
};