<script lang="ts">
  import { onMount } from 'svelte';
  import { performanceMonitor } from '$lib/services/performanceMonitoring';
  import { cacheService } from '$lib/services/caching';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';

  let pageLoadStats = {
    averageLoadTime: 0,
    medianLoadTime: 0,
    slowestPages: [],
    coreWebVitals: {}
  };

  let apiStats = {
    averageResponseTime: 0,
    slowestEndpoints: [],
    errorRate: 0,
    cacheHitRate: 0
  };

  let databaseStats = {
    averageQueryTime: 0,
    slowestQueries: [],
    cacheHitRate: 0,
    totalQueries: 0
  };

  let memoryStats = {
    currentUsage: 0,
    averageUsage: 0,
    peakUsage: 0,
    trend: 'stable' as 'increasing' | 'decreasing' | 'stable'
  };

  let cacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0
  };

  let performanceAlerts: any[] = [];
  let isLoading = true;

  onMount(() => {
    loadPerformanceData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadPerformanceData, 30000);
    
    return () => clearInterval(interval);
  });

  async function loadPerformanceData() {
    try {
      pageLoadStats = performanceMonitor.getPageLoadStats();
      apiStats = performanceMonitor.getAPIStats();
      databaseStats = performanceMonitor.getDatabaseStats();
      memoryStats = performanceMonitor.getMemoryStats();
      cacheStats = cacheService.getStats();
      performanceAlerts = performanceMonitor.checkPerformanceAlerts();
      
      isLoading = false;
    } catch (error) {
      console.error('Failed to load performance data:', error);
      isLoading = false;
    }
  }

  function clearMetrics() {
    performanceMonitor.clearMetrics();
    cacheService.clear();
    loadPerformanceData();
  }

  function exportMetrics() {
    const metrics = performanceMonitor.exportMetrics();
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatTime(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function getPerformanceColor(value: number, thresholds: { good: number; warning: number }): string {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
    <div class="flex gap-2">
      <Button variant="outline" on:click={exportMetrics}>
        Export Metrics
      </Button>
      <Button variant="outline" on:click={clearMetrics}>
        Clear Metrics
      </Button>
      <Button variant="outline" on:click={loadPerformanceData}>
        Refresh
      </Button>
    </div>
  </div>

  {#if performanceAlerts.length > 0}
    <Card class="border-red-200 bg-red-50">
      <div class="p-4">
        <h2 class="text-lg font-semibold text-red-800 mb-3">Performance Alerts</h2>
        <div class="space-y-2">
          {#each performanceAlerts as alert}
            <div class="flex items-center gap-2 text-sm">
              <span class="w-2 h-2 rounded-full {alert.type === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}"></span>
              <span class="font-medium">{alert.metric}:</span>
              <span>{alert.message}</span>
              <span class="text-gray-600">({alert.value})</span>
            </div>
          {/each}
        </div>
      </div>
    </Card>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Page Load Performance -->
    <Card>
      <div class="p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-2">Average Page Load</h3>
        <div class="text-2xl font-bold {getPerformanceColor(pageLoadStats.averageLoadTime, { good: 2000, warning: 3000 })}">
          {formatTime(pageLoadStats.averageLoadTime)}
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Median: {formatTime(pageLoadStats.medianLoadTime)}
        </p>
      </div>
    </Card>

    <!-- API Performance -->
    <Card>
      <div class="p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-2">API Response Time</h3>
        <div class="text-2xl font-bold {getPerformanceColor(apiStats.averageResponseTime, { good: 500, warning: 1000 })}">
          {formatTime(apiStats.averageResponseTime)}
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Error Rate: {(apiStats.errorRate * 100).toFixed(1)}%
        </p>
      </div>
    </Card>

    <!-- Database Performance -->
    <Card>
      <div class="p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-2">Database Query Time</h3>
        <div class="text-2xl font-bold {getPerformanceColor(databaseStats.averageQueryTime, { good: 100, warning: 500 })}">
          {formatTime(databaseStats.averageQueryTime)}
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Total Queries: {databaseStats.totalQueries}
        </p>
      </div>
    </Card>

    <!-- Cache Performance -->
    <Card>
      <div class="p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-2">Cache Hit Rate</h3>
        <div class="text-2xl font-bold {getPerformanceColor(100 - (cacheStats.hitRate * 100), { good: 20, warning: 50 })}">
          {(cacheStats.hitRate * 100).toFixed(1)}%
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Size: {cacheStats.size} items
        </p>
      </div>
    </Card>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Core Web Vitals -->
    <Card>
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Core Web Vitals</h3>
        <div class="space-y-4">
          {#if pageLoadStats.coreWebVitals.averageFCP}
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>First Contentful Paint</span>
                <span class="{getPerformanceColor(pageLoadStats.coreWebVitals.averageFCP, { good: 1800, warning: 3000 })}">
                  {formatTime(pageLoadStats.coreWebVitals.averageFCP)}
                </span>
              </div>
              <ProgressBar 
                value={Math.min(pageLoadStats.coreWebVitals.averageFCP / 3000 * 100, 100)} 
                class="h-2"
              />
            </div>
          {/if}

          {#if pageLoadStats.coreWebVitals.averageLCP}
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>Largest Contentful Paint</span>
                <span class="{getPerformanceColor(pageLoadStats.coreWebVitals.averageLCP, { good: 2500, warning: 4000 })}">
                  {formatTime(pageLoadStats.coreWebVitals.averageLCP)}
                </span>
              </div>
              <ProgressBar 
                value={Math.min(pageLoadStats.coreWebVitals.averageLCP / 4000 * 100, 100)} 
                class="h-2"
              />
            </div>
          {/if}

          {#if pageLoadStats.coreWebVitals.averageCLS}
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>Cumulative Layout Shift</span>
                <span class="{getPerformanceColor(pageLoadStats.coreWebVitals.averageCLS * 1000, { good: 100, warning: 250 })}">
                  {pageLoadStats.coreWebVitals.averageCLS.toFixed(3)}
                </span>
              </div>
              <ProgressBar 
                value={Math.min(pageLoadStats.coreWebVitals.averageCLS / 0.25 * 100, 100)} 
                class="h-2"
              />
            </div>
          {/if}

          {#if pageLoadStats.coreWebVitals.averageFID}
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>First Input Delay</span>
                <span class="{getPerformanceColor(pageLoadStats.coreWebVitals.averageFID, { good: 100, warning: 300 })}">
                  {formatTime(pageLoadStats.coreWebVitals.averageFID)}
                </span>
              </div>
              <ProgressBar 
                value={Math.min(pageLoadStats.coreWebVitals.averageFID / 300 * 100, 100)} 
                class="h-2"
              />
            </div>
          {/if}
        </div>
      </div>
    </Card>

    <!-- Memory Usage -->
    <Card>
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Memory Usage</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Current Usage</span>
              <span>{formatBytes(memoryStats.currentUsage)}</span>
            </div>
            <ProgressBar 
              value={memoryStats.currentUsage / memoryStats.peakUsage * 100} 
              class="h-2"
            />
          </div>

          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Average Usage</span>
              <span>{formatBytes(memoryStats.averageUsage)}</span>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Peak Usage</span>
              <span>{formatBytes(memoryStats.peakUsage)}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <span>Trend:</span>
            <span class="flex items-center gap-1">
              {#if memoryStats.trend === 'increasing'}
                <span class="text-red-600">↗ Increasing</span>
              {:else if memoryStats.trend === 'decreasing'}
                <span class="text-green-600">↘ Decreasing</span>
              {:else}
                <span class="text-gray-600">→ Stable</span>
              {/if}
            </span>
          </div>
        </div>
      </div>
    </Card>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Slowest Pages -->
    <Card>
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Slowest Pages</h3>
        <div class="space-y-2">
          {#each pageLoadStats.slowestPages.slice(0, 5) as page}
            <div class="flex justify-between items-center text-sm">
              <span class="truncate flex-1 mr-2">{page.url}</span>
              <span class="font-mono {getPerformanceColor(page.loadTime, { good: 2000, warning: 3000 })}">
                {formatTime(page.loadTime)}
              </span>
            </div>
          {/each}
          {#if pageLoadStats.slowestPages.length === 0}
            <p class="text-gray-500 text-sm">No data available</p>
          {/if}
        </div>
      </div>
    </Card>

    <!-- Slowest API Endpoints -->
    <Card>
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Slowest API Endpoints</h3>
        <div class="space-y-2">
          {#each apiStats.slowestEndpoints.slice(0, 5) as endpoint}
            <div class="flex justify-between items-center text-sm">
              <div class="flex-1 mr-2">
                <span class="font-medium">{endpoint.method}</span>
                <span class="truncate">{endpoint.endpoint}</span>
              </div>
              <span class="font-mono {getPerformanceColor(endpoint.duration, { good: 500, warning: 1000 })}">
                {formatTime(endpoint.duration)}
              </span>
            </div>
          {/each}
          {#if apiStats.slowestEndpoints.length === 0}
            <p class="text-gray-500 text-sm">No data available</p>
          {/if}
        </div>
      </div>
    </Card>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Slowest Database Queries -->
    <Card>
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Slowest Database Queries</h3>
        <div class="space-y-2">
          {#each databaseStats.slowestQueries.slice(0, 5) as query}
            <div class="text-sm">
              <div class="flex justify-between items-start mb-1">
                <span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded truncate flex-1 mr-2">
                  {query.query}
                </span>
                <span class="font-mono {getPerformanceColor(query.duration, { good: 100, warning: 500 })}">
                  {formatTime(query.duration)}
                </span>
              </div>
              {#if query.rowCount !== undefined}
                <span class="text-xs text-gray-500">Rows: {query.rowCount}</span>
              {/if}
            </div>
          {/each}
          {#if databaseStats.slowestQueries.length === 0}
            <p class="text-gray-500 text-sm">No data available</p>
          {/if}
        </div>
      </div>
    </Card>

    <!-- Cache Statistics -->
    <Card>
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Cache Statistics</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Cache Hits</span>
              <div class="text-lg font-semibold text-green-600">{cacheStats.hits}</div>
            </div>
            <div>
              <span class="text-gray-500">Cache Misses</span>
              <div class="text-lg font-semibold text-red-600">{cacheStats.misses}</div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Hit Rate</span>
              <span class="font-semibold">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
            </div>
            <ProgressBar value={cacheStats.hitRate * 100} class="h-2" />
          </div>

          <div class="text-sm">
            <span class="text-gray-500">Cache Size: </span>
            <span class="font-semibold">{cacheStats.size} items</span>
          </div>
        </div>
      </div>
    </Card>
  </div>
</div>

<style>
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>