import { text } from '@sveltejs/kit';
import { monitoring } from '$lib/services/monitoring';
import type { RequestHandler } from './$types';

// Prometheus metrics registry
class MetricsRegistry {
  private metrics: Map<string, any> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, { buckets: number[]; counts: number[]; sum: number; count: number }> = new Map();

  // Counter methods
  incrementCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.getMetricKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  // Gauge methods
  setGauge(name: string, labels: Record<string, string> = {}, value: number): void {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);
  }

  // Histogram methods
  observeHistogram(name: string, labels: Record<string, string> = {}, value: number): void {
    const key = this.getMetricKey(name, labels);
    const buckets = [0.1, 0.5, 1, 2, 5, 10, 30, 60]; // Default buckets in seconds
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        buckets,
        counts: new Array(buckets.length + 1).fill(0),
        sum: 0,
        count: 0
      });
    }

    const histogram = this.histograms.get(key)!;
    histogram.sum += value;
    histogram.count += 1;

    // Update bucket counts
    for (let i = 0; i < buckets.length; i++) {
      if (value <= buckets[i]) {
        histogram.counts[i] += 1;
      }
    }
    histogram.counts[buckets.length] += 1; // +Inf bucket
  }

  private getMetricKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  // Generate Prometheus format output
  generatePrometheusFormat(): string {
    const lines: string[] = [];

    // Add counters
    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Add gauges
    for (const [key, value] of this.gauges.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Add histograms
    for (const [key, histogram] of this.histograms.entries()) {
      const baseName = key.split('{')[0];
      const labels = key.includes('{') ? key.split('{')[1].split('}')[0] : '';
      const labelPrefix = labels ? `{${labels},` : '{';

      // Bucket counts
      for (let i = 0; i < histogram.buckets.length; i++) {
        const le = histogram.buckets[i];
        lines.push(`${baseName}_bucket${labelPrefix}le="${le}"} ${histogram.counts[i]}`);
      }
      lines.push(`${baseName}_bucket${labelPrefix}le="+Inf"} ${histogram.counts[histogram.buckets.length]}`);
      
      // Sum and count
      lines.push(`${baseName}_sum${labels ? `{${labels}}` : ''} ${histogram.sum}`);
      lines.push(`${baseName}_count${labels ? `{${labels}}` : ''} ${histogram.count}`);
    }

    return lines.join('\n') + '\n';
  }
}

// Global metrics registry
const metricsRegistry = new MetricsRegistry();

// Application metrics collection
function collectApplicationMetrics(): void {
  // System metrics
  if (typeof process !== 'undefined') {
    metricsRegistry.setGauge('nodejs_memory_usage_bytes', { type: 'rss' }, process.memoryUsage().rss);
    metricsRegistry.setGauge('nodejs_memory_usage_bytes', { type: 'heapUsed' }, process.memoryUsage().heapUsed);
    metricsRegistry.setGauge('nodejs_memory_usage_bytes', { type: 'heapTotal' }, process.memoryUsage().heapTotal);
    metricsRegistry.setGauge('nodejs_memory_usage_bytes', { type: 'external' }, process.memoryUsage().external);
    
    if (process.uptime) {
      metricsRegistry.setGauge('nodejs_process_uptime_seconds', {}, process.uptime());
    }
  }

  // Get metrics from monitoring service
  const logs = monitoring.getLogs();
  const errorCount = logs.filter(log => log.level === 'error').length;
  const warnCount = logs.filter(log => log.level === 'warn').length;
  
  metricsRegistry.setGauge('application_log_entries_total', { level: 'error' }, errorCount);
  metricsRegistry.setGauge('application_log_entries_total', { level: 'warn' }, warnCount);

  // Health check metrics
  const healthStatus = monitoring.getHealthStatus();
  for (const [service, health] of Object.entries(healthStatus)) {
    metricsRegistry.setGauge('service_health_status', { service }, health.status === 'healthy' ? 1 : 0);
    if (health.responseTime) {
      metricsRegistry.observeHistogram('service_health_response_time_seconds', { service }, health.responseTime / 1000);
    }
  }
}

// Custom metrics for LMS
export function recordUserAction(action: string, userId?: string): void {
  metricsRegistry.incrementCounter('user_actions_total', { 
    action, 
    user_type: userId ? 'authenticated' : 'anonymous' 
  });
}

export function recordAssessmentSubmission(success: boolean, assessmentType: string): void {
  metricsRegistry.incrementCounter('assessment_submissions_total', { 
    status: success ? 'success' : 'failed',
    type: assessmentType
  });
}

export function recordAIServiceCall(service: string, success: boolean, responseTime: number): void {
  metricsRegistry.incrementCounter('ai_service_requests_total', { 
    service,
    status: success ? 'success' : 'failed'
  });
  metricsRegistry.observeHistogram('ai_service_response_time_seconds', { service }, responseTime / 1000);
}

export function recordDatabaseQuery(operation: string, table: string, responseTime: number): void {
  metricsRegistry.incrementCounter('database_queries_total', { operation, table });
  metricsRegistry.observeHistogram('database_query_duration_seconds', { operation, table }, responseTime / 1000);
}

export function recordHttpRequest(method: string, route: string, status: number, responseTime: number): void {
  metricsRegistry.incrementCounter('http_requests_total', { 
    method, 
    route, 
    status: status.toString() 
  });
  metricsRegistry.observeHistogram('http_request_duration_seconds', { 
    method, 
    route 
  }, responseTime / 1000);
}

export function recordUserRegistration(): void {
  metricsRegistry.incrementCounter('user_registrations_total');
}

export function recordLoginAttempt(success: boolean): void {
  metricsRegistry.incrementCounter('auth_login_attempts_total', { 
    status: success ? 'success' : 'failed' 
  });
}

export function recordSecurityIncident(type: string): void {
  metricsRegistry.incrementCounter('security_incidents_total', { type });
}

export const GET: RequestHandler = async ({ url }) => {
  const startTime = Date.now();
  
  try {
    // Collect current application metrics
    collectApplicationMetrics();
    
    // Generate Prometheus format
    const metricsOutput = metricsRegistry.generatePrometheusFormat();
    
    // Add some basic metadata
    const metadata = [
      '# HELP application_info Application information',
      '# TYPE application_info gauge',
      'application_info{version="1.0.0",environment="production"} 1',
      '',
      '# HELP http_requests_total Total number of HTTP requests',
      '# TYPE http_requests_total counter',
      '',
      '# HELP http_request_duration_seconds HTTP request duration in seconds',
      '# TYPE http_request_duration_seconds histogram',
      '',
      '# HELP user_actions_total Total number of user actions',
      '# TYPE user_actions_total counter',
      '',
      '# HELP assessment_submissions_total Total number of assessment submissions',
      '# TYPE assessment_submissions_total counter',
      '',
      '# HELP ai_service_requests_total Total number of AI service requests',
      '# TYPE ai_service_requests_total counter',
      '',
      '# HELP service_health_status Health status of services (1=healthy, 0=unhealthy)',
      '# TYPE service_health_status gauge',
      '',
    ].join('\n');

    const responseTime = Date.now() - startTime;
    
    // Record this metrics request
    recordHttpRequest('GET', '/api/metrics', 200, responseTime);
    
    monitoring.info('Metrics endpoint accessed', { responseTime });

    return text(metadata + metricsOutput, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    monitoring.error('Failed to generate metrics', { error });
    
    return text('# Error generating metrics\n', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
};

// Export metrics functions for use in other parts of the application
export {
  metricsRegistry,
  collectApplicationMetrics,
};