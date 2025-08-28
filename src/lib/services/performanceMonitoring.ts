/**
 * Performance Monitoring Service
 * Tracks and analyzes application performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PageLoadMetrics {
  url: string;
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  timestamp: number;
}

interface APIMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  cached: boolean;
  timestamp: number;
}

interface DatabaseMetrics {
  query: string;
  duration: number;
  rowCount?: number;
  cached: boolean;
  timestamp: number;
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private pageLoadMetrics: PageLoadMetrics[] = [];
  private apiMetrics: APIMetrics[] = [];
  private databaseMetrics: DatabaseMetrics[] = [];
  private memoryMetrics: MemoryMetrics[] = [];
  private observer: PerformanceObserver | null = null;
  private maxMetrics = 1000; // Limit stored metrics to prevent memory issues

  constructor() {
    this.initializePerformanceObserver();
    this.startMemoryMonitoring();
  }

  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
    } catch (error) {
      console.warn('Failed to initialize PerformanceObserver:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.recordPageLoad(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.recordPaintMetric(entry);
        break;
      case 'largest-contentful-paint':
        this.recordLCP(entry);
        break;
      case 'layout-shift':
        this.recordCLS(entry);
        break;
      case 'first-input':
        this.recordFID(entry);
        break;
    }
  }

  private recordPageLoad(entry: PerformanceNavigationTiming): void {
    const metrics: PageLoadMetrics = {
      url: window.location.pathname,
      loadTime: entry.loadEventEnd - entry.navigationStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
      timestamp: Date.now()
    };

    this.pageLoadMetrics.push(metrics);
    this.trimArray(this.pageLoadMetrics);
  }

  private recordPaintMetric(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      const lastPageLoad = this.pageLoadMetrics[this.pageLoadMetrics.length - 1];
      if (lastPageLoad) {
        lastPageLoad.firstContentfulPaint = entry.startTime;
      }
    }
  }

  private recordLCP(entry: any): void {
    const lastPageLoad = this.pageLoadMetrics[this.pageLoadMetrics.length - 1];
    if (lastPageLoad) {
      lastPageLoad.largestContentfulPaint = entry.startTime;
    }
  }

  private recordCLS(entry: any): void {
    const lastPageLoad = this.pageLoadMetrics[this.pageLoadMetrics.length - 1];
    if (lastPageLoad && !entry.hadRecentInput) {
      lastPageLoad.cumulativeLayoutShift = (lastPageLoad.cumulativeLayoutShift || 0) + entry.value;
    }
  }

  private recordFID(entry: any): void {
    const lastPageLoad = this.pageLoadMetrics[this.pageLoadMetrics.length - 1];
    if (lastPageLoad) {
      lastPageLoad.firstInputDelay = entry.processingStart - entry.startTime;
    }
  }

  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('performance' in window) || !('memory' in (window.performance as any))) {
      return;
    }

    const recordMemory = () => {
      const memory = (window.performance as any).memory;
      this.memoryMetrics.push({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });
      this.trimArray(this.memoryMetrics);
    };

    // Record memory usage every 30 seconds
    setInterval(recordMemory, 30000);
    recordMemory(); // Initial recording
  }

  private trimArray<T>(array: T[]): void {
    if (array.length > this.maxMetrics) {
      array.splice(0, array.length - this.maxMetrics);
    }
  }

  // Public methods for recording custom metrics
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    });
    this.trimArray(this.metrics);
  }

  recordAPICall(endpoint: string, method: string, duration: number, status: number, cached = false): void {
    this.apiMetrics.push({
      endpoint,
      method,
      duration,
      status,
      cached,
      timestamp: Date.now()
    });
    this.trimArray(this.apiMetrics);
  }

  recordDatabaseQuery(query: string, duration: number, rowCount?: number, cached = false): void {
    // Sanitize query to remove sensitive data
    const sanitizedQuery = this.sanitizeQuery(query);
    
    this.databaseMetrics.push({
      query: sanitizedQuery,
      duration,
      rowCount,
      cached,
      timestamp: Date.now()
    });
    this.trimArray(this.databaseMetrics);
  }

  private sanitizeQuery(query: string): string {
    // Remove potential sensitive data from queries
    return query
      .replace(/('[^']*')/g, "'***'") // Replace string literals
      .replace(/(\$\d+)/g, '$***') // Replace parameterized values
      .substring(0, 200); // Limit length
  }

  // Analysis methods
  getPageLoadStats(): {
    averageLoadTime: number;
    medianLoadTime: number;
    slowestPages: PageLoadMetrics[];
    coreWebVitals: {
      averageFCP?: number;
      averageLCP?: number;
      averageCLS?: number;
      averageFID?: number;
    };
  } {
    if (this.pageLoadMetrics.length === 0) {
      return {
        averageLoadTime: 0,
        medianLoadTime: 0,
        slowestPages: [],
        coreWebVitals: {}
      };
    }

    const loadTimes = this.pageLoadMetrics.map(m => m.loadTime).sort((a, b) => a - b);
    const averageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    const medianLoadTime = loadTimes[Math.floor(loadTimes.length / 2)];
    
    const slowestPages = [...this.pageLoadMetrics]
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 10);

    // Core Web Vitals
    const fcpValues = this.pageLoadMetrics.filter(m => m.firstContentfulPaint).map(m => m.firstContentfulPaint!);
    const lcpValues = this.pageLoadMetrics.filter(m => m.largestContentfulPaint).map(m => m.largestContentfulPaint!);
    const clsValues = this.pageLoadMetrics.filter(m => m.cumulativeLayoutShift).map(m => m.cumulativeLayoutShift!);
    const fidValues = this.pageLoadMetrics.filter(m => m.firstInputDelay).map(m => m.firstInputDelay!);

    return {
      averageLoadTime,
      medianLoadTime,
      slowestPages,
      coreWebVitals: {
        averageFCP: fcpValues.length > 0 ? fcpValues.reduce((sum, val) => sum + val, 0) / fcpValues.length : undefined,
        averageLCP: lcpValues.length > 0 ? lcpValues.reduce((sum, val) => sum + val, 0) / lcpValues.length : undefined,
        averageCLS: clsValues.length > 0 ? clsValues.reduce((sum, val) => sum + val, 0) / clsValues.length : undefined,
        averageFID: fidValues.length > 0 ? fidValues.reduce((sum, val) => sum + val, 0) / fidValues.length : undefined
      }
    };
  }

  getAPIStats(): {
    averageResponseTime: number;
    slowestEndpoints: APIMetrics[];
    errorRate: number;
    cacheHitRate: number;
  } {
    if (this.apiMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        slowestEndpoints: [],
        errorRate: 0,
        cacheHitRate: 0
      };
    }

    const averageResponseTime = this.apiMetrics.reduce((sum, metric) => sum + metric.duration, 0) / this.apiMetrics.length;
    
    const slowestEndpoints = [...this.apiMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const errorCount = this.apiMetrics.filter(m => m.status >= 400).length;
    const errorRate = errorCount / this.apiMetrics.length;

    const cacheHits = this.apiMetrics.filter(m => m.cached).length;
    const cacheHitRate = cacheHits / this.apiMetrics.length;

    return {
      averageResponseTime,
      slowestEndpoints,
      errorRate,
      cacheHitRate
    };
  }

  getDatabaseStats(): {
    averageQueryTime: number;
    slowestQueries: DatabaseMetrics[];
    cacheHitRate: number;
    totalQueries: number;
  } {
    if (this.databaseMetrics.length === 0) {
      return {
        averageQueryTime: 0,
        slowestQueries: [],
        cacheHitRate: 0,
        totalQueries: 0
      };
    }

    const averageQueryTime = this.databaseMetrics.reduce((sum, metric) => sum + metric.duration, 0) / this.databaseMetrics.length;
    
    const slowestQueries = [...this.databaseMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const cacheHits = this.databaseMetrics.filter(m => m.cached).length;
    const cacheHitRate = cacheHits / this.databaseMetrics.length;

    return {
      averageQueryTime,
      slowestQueries,
      cacheHitRate,
      totalQueries: this.databaseMetrics.length
    };
  }

  getMemoryStats(): {
    currentUsage: number;
    averageUsage: number;
    peakUsage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (this.memoryMetrics.length === 0) {
      return {
        currentUsage: 0,
        averageUsage: 0,
        peakUsage: 0,
        trend: 'stable'
      };
    }

    const latest = this.memoryMetrics[this.memoryMetrics.length - 1];
    const currentUsage = latest.usedJSHeapSize;
    
    const averageUsage = this.memoryMetrics.reduce((sum, metric) => sum + metric.usedJSHeapSize, 0) / this.memoryMetrics.length;
    const peakUsage = Math.max(...this.memoryMetrics.map(m => m.usedJSHeapSize));

    // Determine trend from last 10 measurements
    const recentMetrics = this.memoryMetrics.slice(-10);
    if (recentMetrics.length >= 2) {
      const firstHalf = recentMetrics.slice(0, Math.floor(recentMetrics.length / 2));
      const secondHalf = recentMetrics.slice(Math.floor(recentMetrics.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / secondHalf.length;
      
      const difference = secondAvg - firstAvg;
      const threshold = averageUsage * 0.05; // 5% threshold
      
      if (difference > threshold) {
        return { currentUsage, averageUsage, peakUsage, trend: 'increasing' };
      } else if (difference < -threshold) {
        return { currentUsage, averageUsage, peakUsage, trend: 'decreasing' };
      }
    }

    return { currentUsage, averageUsage, peakUsage, trend: 'stable' };
  }

  // Export metrics for external analysis
  exportMetrics(): {
    pageLoad: PageLoadMetrics[];
    api: APIMetrics[];
    database: DatabaseMetrics[];
    memory: MemoryMetrics[];
    custom: PerformanceMetric[];
  } {
    return {
      pageLoad: [...this.pageLoadMetrics],
      api: [...this.apiMetrics],
      database: [...this.databaseMetrics],
      memory: [...this.memoryMetrics],
      custom: [...this.metrics]
    };
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.pageLoadMetrics = [];
    this.apiMetrics = [];
    this.databaseMetrics = [];
    this.memoryMetrics = [];
  }

  // Performance alerts
  checkPerformanceAlerts(): {
    type: 'warning' | 'critical';
    message: string;
    metric: string;
    value: number;
  }[] {
    const alerts: any[] = [];

    // Check page load times
    const pageStats = this.getPageLoadStats();
    if (pageStats.averageLoadTime > 3000) {
      alerts.push({
        type: pageStats.averageLoadTime > 5000 ? 'critical' : 'warning',
        message: 'Average page load time is high',
        metric: 'averageLoadTime',
        value: pageStats.averageLoadTime
      });
    }

    // Check API response times
    const apiStats = this.getAPIStats();
    if (apiStats.averageResponseTime > 1000) {
      alerts.push({
        type: apiStats.averageResponseTime > 2000 ? 'critical' : 'warning',
        message: 'Average API response time is high',
        metric: 'averageResponseTime',
        value: apiStats.averageResponseTime
      });
    }

    // Check error rates
    if (apiStats.errorRate > 0.05) {
      alerts.push({
        type: apiStats.errorRate > 0.1 ? 'critical' : 'warning',
        message: 'API error rate is high',
        metric: 'errorRate',
        value: apiStats.errorRate
      });
    }

    // Check memory usage
    const memoryStats = this.getMemoryStats();
    if (memoryStats.trend === 'increasing') {
      alerts.push({
        type: 'warning',
        message: 'Memory usage is increasing',
        metric: 'memoryTrend',
        value: memoryStats.currentUsage
      });
    }

    return alerts;
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy performance tracking
export const trackPerformance = {
  pageLoad: () => {
    // Automatically tracked by PerformanceObserver
  },

  apiCall: async <T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>,
    cached = false
  ): Promise<T> => {
    const startTime = performance.now();
    let status = 200;
    
    try {
      const result = await apiCall();
      return result;
    } catch (error: any) {
      status = error.status || 500;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      performanceMonitor.recordAPICall(endpoint, method, duration, status, cached);
    }
  },

  databaseQuery: async <T>(
    query: string,
    queryFn: () => Promise<T>,
    cached = false
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      // Try to determine row count if result is an array
      const rowCount = Array.isArray(result) ? result.length : undefined;
      
      performanceMonitor.recordDatabaseQuery(query, duration, rowCount, cached);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordDatabaseQuery(query, duration, 0, cached);
      throw error;
    }
  },

  customMetric: (name: string, value: number, metadata?: Record<string, any>) => {
    performanceMonitor.recordMetric(name, value, metadata);
  }
};