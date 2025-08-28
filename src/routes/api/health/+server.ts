import { json } from '@sveltejs/kit';
import { monitoring } from '$lib/services/monitoring';
import { supabase } from '$lib/supabase';
import { config } from '$lib/config/environment';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbHealth = await monitoring.checkHealth('database', async () => {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      return !error;
    });

    // Check Supabase Auth
    const authHealth = await monitoring.checkHealth('auth', async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        return !error;
      } catch {
        return false;
      }
    });

    // Check Supabase Storage
    const storageHealth = await monitoring.checkHealth('storage', async () => {
      try {
        const { data, error } = await supabase.storage.listBuckets();
        return !error && Array.isArray(data);
      } catch {
        return false;
      }
    });

    // Check AI service (if enabled)
    let aiHealth = null;
    if (config.ai.enabled) {
      aiHealth = await monitoring.checkHealth('ai_service', async () => {
        // Simple check - just verify API key is configured
        return !!config.ai.apiKey;
      });
    }

    const responseTime = Date.now() - startTime;
    const allHealthy = [dbHealth, authHealth, storageHealth, aiHealth]
      .filter(Boolean)
      .every(check => check!.status === 'healthy');

    const healthStatus = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: config.app.version,
      environment: config.app.environment,
      responseTime,
      services: {
        database: dbHealth,
        auth: authHealth,
        storage: storageHealth,
        ...(aiHealth && { ai_service: aiHealth }),
      },
      uptime: process.uptime?.() || 0,
    };

    monitoring.info('Health check completed', {
      status: healthStatus.status,
      responseTime,
    });

    return json(healthStatus, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    monitoring.error('Health check failed', { error });
    
    return json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    }, {
      status: 503,
    });
  }
};