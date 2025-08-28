/**
 * Security Incidents API
 * Handles security incident reporting and management
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { incidentResponseService } from '$lib/services/security/incidentResponse';
import type { IncidentType, IncidentSeverity } from '$lib/services/security/incidentResponse';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user) {
      throw error(401, 'Authentication required');
    }

    // Check if user is admin (only admins can report incidents via API)
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw error(403, 'Admin access required');
    }

    const {
      type,
      severity,
      title,
      description,
      affected_users = [],
      affected_resources = []
    } = await request.json();

    if (!type || !severity || !title || !description) {
      throw error(400, 'Type, severity, title, and description are required');
    }

    const validTypes: IncidentType[] = [
      'data_breach', 'unauthorized_access', 'system_compromise', 'malware_detection',
      'ddos_attack', 'phishing_attempt', 'insider_threat', 'data_corruption',
      'service_disruption', 'privacy_violation', 'compliance_breach'
    ];

    const validSeverities: IncidentSeverity[] = ['low', 'medium', 'high', 'critical'];

    if (!validTypes.includes(type)) {
      throw error(400, 'Invalid incident type');
    }

    if (!validSeverities.includes(severity)) {
      throw error(400, 'Invalid incident severity');
    }

    // Report the incident
    const incidentId = await incidentResponseService.reportIncident(
      type,
      severity,
      title,
      description,
      affected_users,
      affected_resources,
      session.user.id
    );

    return json({
      success: true,
      incident_id: incidentId,
      message: 'Security incident reported successfully'
    });
  } catch (err) {
    console.error('Failed to report security incident:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Admin access')) {
      throw error(403, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Invalid')) {
      throw error(400, err.message);
    }
    
    throw error(500, 'Failed to report security incident');
  }
};

export const GET: RequestHandler = async ({ url, locals }) => {
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

    const type = url.searchParams.get('type') as IncidentType | null;
    const severity = url.searchParams.get('severity') as IncidentSeverity | null;
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const filters: any = {};
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;
    filters.limit = limit;
    filters.offset = offset;

    const incidents = await incidentResponseService.listIncidents(filters);

    return json({
      success: true,
      incidents,
      pagination: {
        limit,
        offset,
        total: incidents.length
      }
    });
  } catch (err) {
    console.error('Failed to list security incidents:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Admin access')) {
      throw error(403, err.message);
    }
    
    throw error(500, 'Failed to list security incidents');
  }
};