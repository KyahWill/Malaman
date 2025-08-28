/**
 * Data Deletion API
 * Handles user data deletion requests for privacy compliance
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dataDeletionService } from '$lib/services/security/dataDeletion';
import { auditLogger } from '$lib/services/security/auditLogger';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user) {
      throw error(401, 'Authentication required');
    }

    const { 
      deletion_type = 'soft',
      retention_period_days = 30 
    } = await request.json();

    if (!['soft', 'hard'].includes(deletion_type)) {
      throw error(400, 'Invalid deletion type');
    }

    if (retention_period_days < 1 || retention_period_days > 365) {
      throw error(400, 'Retention period must be between 1 and 365 days');
    }

    // Request data deletion
    const requestId = await dataDeletionService.requestDataDeletion(
      session.user.id,
      deletion_type,
      retention_period_days,
      request
    );

    return json({
      success: true,
      request_id: requestId,
      message: 'Data deletion request submitted. You will receive a confirmation email to complete the process.'
    });
  } catch (err) {
    console.error('Data deletion request failed:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    throw error(500, 'Failed to request data deletion');
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
      // Get specific deletion request status
      const deletionRequest = await dataDeletionService.getDeletionStatus(requestId);
      
      if (!deletionRequest) {
        throw error(404, 'Deletion request not found');
      }

      // Verify user owns this request
      if (deletionRequest.user_id !== session.user.id) {
        throw error(403, 'Access denied');
      }

      return json({
        success: true,
        deletion_request: deletionRequest
      });
    } else {
      // Get all deletion requests for user
      const deletionRequests = await dataDeletionService.getUserDeletionRequests(session.user.id);
      
      return json({
        success: true,
        deletion_requests: deletionRequests
      });
    }
  } catch (err) {
    console.error('Failed to get deletion requests:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Access denied')) {
      throw error(403, err.message);
    }
    
    if (err instanceof Error && err.message.includes('not found')) {
      throw error(404, err.message);
    }
    
    throw error(500, 'Failed to get deletion requests');
  }
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user) {
      throw error(401, 'Authentication required');
    }

    const { request_id, action, confirmation_token } = await request.json();

    if (!request_id || !action) {
      throw error(400, 'Request ID and action are required');
    }

    if (action === 'confirm') {
      if (!confirmation_token) {
        throw error(400, 'Confirmation token is required');
      }

      await dataDeletionService.confirmDataDeletion(
        request_id,
        confirmation_token,
        request
      );

      return json({
        success: true,
        message: 'Data deletion confirmed and processing has begun'
      });
    } else if (action === 'cancel') {
      await dataDeletionService.cancelDeletionRequest(request_id, session.user.id);

      return json({
        success: true,
        message: 'Data deletion request cancelled'
      });
    } else {
      throw error(400, 'Invalid action');
    }
  } catch (err) {
    console.error('Failed to update deletion request:', err);
    
    if (err instanceof Error && err.message.includes('Authentication')) {
      throw error(401, err.message);
    }
    
    if (err instanceof Error && err.message.includes('Invalid confirmation')) {
      throw error(400, err.message);
    }
    
    throw error(500, 'Failed to update deletion request');
  }
};