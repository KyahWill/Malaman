import { config, isProduction } from '$lib/config/environment';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface MetricEntry {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  timestamp: string;
}

class MonitoringService {
  private logs: LogEntry[] = [];
  private metrics: MetricEntry[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();

  // Logging methods
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  private log(level: LogEntry['level'], message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    // Add to local storage for debugging
    this.logs.push(entry);
    
    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Console logging based on environment
    if (this.shouldLog(level)) {
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn : 
                       level === 'info' ? console.info : console.debug;
      
      logMethod(`[${level.toUpperCase()}] ${message}`, context || '');
    }

    // Send to external monitoring service in production
    if (isProduction() && (level === 'error' || level === 'warn')) {
      this.sendToExternalService(entry);
    }
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = config.monitoring.logLevel;
    return levels.indexOf(level) >= levels.indexOf(configLevel);
  }

  // Metrics collection
  recordMetric(name: string, value: number, unit: string = 'count', tags?: Record<string, string>): void {
    const metric: MetricEntry = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
    };

    this.metrics.push(metric);
    
    // Keep only last 10000 metrics in memory
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }

    // Send to external monitoring service
    if (config.monitoring.enabled) {
      this.sendMetricToExternalService(metric);
    }
  }

  // Performance monitoring
  startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}.duration`, duration, 'ms');
    };
  }

  // Health checks
  async checkHealth(service: string, healthCheckFn: () => Promise<boolean>): Promise<HealthCheck> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    
    try {
      const isHealthy = await healthCheckFn();
      const responseTime = performance.now() - startTime;
      
      const healthCheck: HealthCheck = {
        service,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        timestamp,
      };
      
      this.healthChecks.set(service, healthCheck);
      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        service,
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
      
      this.healthChecks.set(service, healthCheck);
      this.error(`Health check failed for ${service}`, { error });
      return healthCheck;
    }
  }

  getHealthStatus(): Record<string, HealthCheck> {
    return Object.fromEntries(this.healthChecks);
  }

  // Error tracking
  captureException(error: Error, context?: Record<string, any>): void {
    this.error(error.message, {
      stack: error.stack,
      name: error.name,
      ...context,
    });

    // Send to external error tracking service
    if (isProduction()) {
      this.sendErrorToExternalService(error, context);
    }
  }

  // User activity tracking
  trackUserAction(action: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ...metadata,
    });

    this.recordMetric('user.action', 1, 'count', {
      action,
      userId: userId || 'anonymous',
    });
  }

  // Performance tracking
  trackPageLoad(page: string, loadTime: number): void {
    this.recordMetric('page.load_time', loadTime, 'ms', { page });
    this.info(`Page loaded: ${page}`, { loadTime });
  }

  trackApiCall(endpoint: string, method: string, responseTime: number, status: number): void {
    this.recordMetric('api.response_time', responseTime, 'ms', {
      endpoint,
      method,
      status: status.toString(),
    });

    this.recordMetric('api.calls', 1, 'count', {
      endpoint,
      method,
      status: status.toString(),
    });
  }

  // External service integration (placeholder implementations)
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implement integration with external logging service (e.g., Sentry, LogRocket)
    // For now, just store in localStorage for debugging
    if (typeof window !== 'undefined') {
      const existingLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      existingLogs.push(entry);
      localStorage.setItem('app_logs', JSON.stringify(existingLogs.slice(-100)));
    }
  }

  private async sendMetricToExternalService(metric: MetricEntry): Promise<void> {
    // Implement integration with external metrics service (e.g., DataDog, New Relic)
    // For now, just log to console in development
    if (!isProduction()) {
      console.debug('Metric:', metric);
    }
  }

  private async sendErrorToExternalService(error: Error, context?: Record<string, any>): Promise<void> {
    // Implement integration with external error tracking service (e.g., Sentry)
    // For now, just log to console
    console.error('Captured exception:', error, context);
  }

  // Cleanup methods
  clearLogs(): void {
    this.logs = [];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getLogs(level?: LogEntry['level']): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  getMetrics(name?: string): MetricEntry[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }
}

export const monitoring = new MonitoringService();

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    monitoring.captureException(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    monitoring.captureException(new Error(event.reason), {
      type: 'unhandledrejection',
    });
  });
}

export default monitoring;