/**
 * Performance Statistics API
 * Provides performance metrics and statistics
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { performanceMonitor } from '$lib/services/performanceMonitoring';
import { cacheService } from '$lib/services/caching';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Check if user is authenticated and has admin role
    const session = locals.session;
    if (!session) {
      throw error(401, 'Authentication required');
    }

    // Only allow admin users to access performance stats
    if (session.user.role !== 'admin') {
      throw error(403, 'Admin access required');
    }

    const type = url.searchParams.get('type') || 'all';

    let stats: any = {};

    switch (type) {
      case 'page-load':
        stats = performanceMonitor.getPageLoadStats();
        break;
      
      case 'api':
        stats = performanceMonitor.getAPIStats();
        break;
      
      case 'database':
        stats = performanceMonitor.getDatabaseStats();
        break;
      
      case 'memory':
        stats = performanceMonitor.getMemoryStats();
        break;
      
      case 'cache':
        stats = cacheService.getStats();
        break;
      
      case 'alerts':
        stats = performanceMonitor.checkPerformanceAlerts();
        break;
      
      case 'all':
      default:
        stats = {
          pageLoad: performanceMonitor.getPageLoadStats(),
          api: performanceMonitor.getAPIStats(),
          database: performanceMonitor.getDatabaseStats(),
          memory: performanceMonitor.getMemoryStats(),
          cache: cacheService.getStats(),
          alerts: performanceMonitor.checkPerformanceAlerts(),
          timestamp: new Date().toISOString()
        };
        break;
    }

    return json(stats);

  } catch (err: any) {
    console.error('Performance stats error:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, 'Failed to retrieve performance statistics');
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    const session = locals.session;
    if (!session) {
      throw error(401, 'Authentication required');
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'record-metric':
        if (!data.name || typeof data.value !== 'number') {
          throw error(400, 'Invalid metric data');
        }
        performanceMonitor.recordMetric(data.name, data.value, data.metadata);
        break;
      
      case 'record-api-call':
        if (!data.endpoint || !data.method || typeof data.duration !== 'number') {
          throw error(400, 'Invalid API call data');
        }
        performanceMonitor.recordAPICall(
          data.endpoint,
          data.method,
          data.duration,
          data.status || 200,
          data.cached || false
        );
        break;
      
      case 'clear-metrics':
        // Only allow admin users to clear metrics
        if (session.user.role !== 'admin') {
          throw error(403, 'Admin access required');
        }
        performanceMonitor.clearMetrics();
        break;
      
      case 'clear-cache':
        // Only allow admin users to clear cache
        if (session.user.role !== 'admin') {
          throw error(403, 'Admin access required');
        }
        cacheService.clear(true); // Clear both memory and browser cache
        break;
      
      default:
        throw error(400, 'Invalid action');
    }

    return json({ success: true, timestamp: new Date().toISOString() });

  } catch (err: any) {
    console.error('Performance action error:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, 'Failed to perform action');
  }
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication and admin role
    const session = locals.session;
    if (!session || session.user.role !== 'admin') {
      throw error(403, 'Admin access required');
    }

    const type = url.searchParams.get('type');

    switch (type) {
      case 'metrics':
        performanceMonitor.clearMetrics();
        break;
      
      case 'cache':
        cacheService.clear(true);
        break;
      
      case 'all':
        performanceMonitor.clearMetrics();
        cacheService.clear(true);
        break;
      
      default:
        throw error(400, 'Invalid type parameter');
    }

    return json({ 
      success: true, 
      message: `Cleared ${type || 'all'} performance data`,
      timestamp: new Date().toISOString() 
    });

  } catch (err: any) {
    console.error('Performance delete error:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, 'Failed to clear performance data');
  }
};