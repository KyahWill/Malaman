/**
 * Data Export API
 * Handles user data export requests for privacy compliance
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dataExportService } from '$lib/services/security/dataExport';
import { auditLogger } from '$lib/services/security/auditLogger';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user) {
      throw error(401, 'Authentication required');
    }

    const { format = 'json' } = await request.json();

    if (!['json', 'csv', 'xml'].includes(format)) {
      throw error(400, 'Invalid export format');
    }

    // Request data export
    const requestId = await dataExportService.requestDataExport(
      session.user.id,
      format,
      request
    );

    return json({
      success: true,
      request_id: requestId,
      message: 'Data export request submitted. You will receive an email when it is ready.'
    });
  } catch (err) {
    console.error('Data export request failed:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    throw error(500, 'Failed to request data export');
  }
};

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user) {
      throw error(401, 'Authentication required');
    }

    const requestId = url.searchParams.get('request_id');

    if (requestId) {
      // Get specific export request status
      const exportRequest = await dataExportService.getExportStatus(requestId);
      
      if (!exportRequest) {
        throw error(404, 'Export request not found');
      }

      // Verify user owns this request
      if (exportRequest.user_id !== session.user.id) {
        throw error(403, 'Access denied');
      }

      return json({
        success: true,
        export_request: exportRequest
      });
    } else {
      // Get all export requests for user
      const exportRequests = await dataExportService.getUserExportRequests(session.user.id);
      
      return json({
        success: true,
        export_requests: exportRequests
      });
    }
  } catch (err) {
    console.error('Failed to get export requests:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Access denied')) {
      throw error(403, err.message);
    }
    
    if (err instanceof Error && err.message.includes('not found')) {
      throw error(404, err.message);
    }
    
    throw error(500, 'Failed to get export requests');
  }
};