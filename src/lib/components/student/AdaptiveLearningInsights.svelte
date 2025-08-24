<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { Card, Button, Badge, Loading } from '$lib/components/ui';
  
  interface LearningPattern {
    pattern_type: 'struggle_area' | 'strength_area' | 'learning_pace' | 'content_preference';
    pattern_data: {
      topic?: string;
      difficulty_level?: string;
      content_type?: string;
      engagement_score?: number;
      completion_time?: number;
      retry_count?: number;
    };
    confidence_score: number;
    detected_at: string;
    last_updated: string;
  }

  interface AlternativePath {
    id: string;
    original_content_id: string;
    alternative_content: any[];
    reason: string;
    difficulty_adjustment: 'easier' | 'different_approach' | 'more_practice';
    estimated_time_difference: number;
  }

  export let studentId: string;
  export let showAlternativePaths = false;
  export let currentContentId: string | null = null;
  export let strugglingTopics: string[] = [];

  let loading = false;
  let error: string | null = null;
  let patterns: LearningPattern[] = [];
  let alternativePaths: AlternativePath[] = [];
  let showInsights = false;

  onMount(() => {
    loadLearningPatterns();
  });

  async function loadLearningPatterns() {
    loading = true;
    error = null;

    try {
      const response = await fetch(`/api/adaptive/assessment-failure?studentId=${studentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load learning patterns');
      }

      patterns = data.learning_patterns || [];
    } catch (err) {
      console.error('Error loading learning patterns:', err);
      error = err instanceof Error ? err.message : 'Failed to load insights';
    } finally {
      loading = false;
    }
  }

  async function loadAlternativePaths() {
    if (!currentContentId || strugglingTopics.length === 0) return;

    loading = true;
    error = null;

    try {
      const response = await fetch('/api/adaptive/alternative-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          currentContentId,
          strugglingTopics
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate alternative paths');
      }

      alternativePaths = data.alternative_paths || [];
    } catch (err) {
      console.error('Error loading alternative paths:', err);
      error = err instanceof Error ? err.message : 'Failed to load alternative paths';
    } finally {
      loading = false;
    }
  }

  async function triggerMonitoring() {
    loading = true;
    error = null;

    try {
      const response = await fetch('/api/adaptive/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          triggerType: 'continuous_monitoring'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger monitoring');
      }

      // Reload patterns after monitoring
      await loadLearningPatterns();
    } catch (err) {
      console.error('Error triggering monitoring:', err);
      error = err instanceof Error ? err.message : 'Failed to trigger monitoring';
    } finally {
      loading = false;
    }
  }

  function getPatternIcon(patternType: string): string {
    switch (patternType) {
      case 'struggle_area': return '⚠️';
      case 'strength_area': return '💪';
      case 'learning_pace': return '⏱️';
      case 'content_preference': return '❤️';
      default: return '📊';
    }
  }

  function getPatternColor(patternType: string): string {
    switch (patternType) {
      case 'struggle_area': return 'warning';
      case 'strength_area': return 'success';
      case 'learning_pace': return 'info';
      case 'content_preference': return 'primary';
      default: return 'secondary';
    }
  }

  function formatPatternDescription(pattern: LearningPattern): string {
    const { pattern_type, pattern_data } = pattern;
    
    switch (pattern_type) {
      case 'struggle_area':
        return pattern_data.topic 
          ? `Struggling with ${pattern_data.topic}` 
          : 'Areas needing improvement identified';
      
      case 'strength_area':
        return pattern_data.topic 
          ? `Strong performance in ${pattern_data.topic}` 
          : 'Strengths identified';
      
      case 'learning_pace':
        const time = pattern_data.completion_time;
        if (time && time > 1800) return 'Prefers slower, thorough learning';
        if (time && time < 300) return 'Fast learner, may need more challenges';
        return 'Learning pace analyzed';
      
      case 'content_preference':
        return pattern_data.content_type 
          ? `Prefers ${pattern_data.content_type} content` 
          : 'Content preferences identified';
      
      default:
        return 'Learning pattern detected';
    }
  }

  function formatConfidenceScore(score: number): string {
    return `${Math.round(score * 100)}% confidence`;
  }

  $: if (showAlternativePaths && currentContentId && strugglingTopics.length > 0) {
    loadAlternativePaths();
  }
</script>

<div class="adaptive-insights">
  <Card>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        🧠 Adaptive Learning Insights
      </h3>
      <Button 
        variant="outline" 
        size="sm" 
        on:click={() => showInsights = !showInsights}
      >
        {showInsights ? 'Hide' : 'Show'} Insights
      </Button>
    </div>

    {#if showInsights}
      <div class="space-y-4">
        <!-- Learning Patterns Section -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900 dark:text-gray-100">
              Learning Patterns
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              on:click={triggerMonitoring}
              disabled={loading}
            >
              {#if loading}
                <Loading size="sm" />
              {:else}
                🔄 Update
              {/if}
            </Button>
          </div>

          {#if loading && patterns.length === 0}
            <div class="flex items-center justify-center py-8">
              <Loading />
              <span class="ml-2">Analyzing your learning patterns...</span>
            </div>
          {:else if error}
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p class="text-red-700 dark:text-red-300">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                class="mt-2" 
                on:click={loadLearningPatterns}
              >
                Try Again
              </Button>
            </div>
          {:else if patterns.length === 0}
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No learning patterns detected yet.</p>
              <p class="text-sm mt-1">Complete more assessments to see personalized insights.</p>
            </div>
          {:else}
            <div class="grid gap-3">
              {#each patterns as pattern}
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div class="flex items-start justify-between">
                    <div class="flex items-start gap-3">
                      <span class="text-xl">{getPatternIcon(pattern.pattern_type)}</span>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-gray-100">
                          {formatPatternDescription(pattern)}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Detected {new Date(pattern.detected_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getPatternColor(pattern.pattern_type)} size="sm">
                      {formatConfidenceScore(pattern.confidence_score)}
                    </Badge>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Alternative Paths Section -->
        {#if showAlternativePaths && currentContentId}
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-medium text-gray-900 dark:text-gray-100">
                Alternative Learning Paths
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                on:click={loadAlternativePaths}
                disabled={loading || strugglingTopics.length === 0}
              >
                {#if loading}
                  <Loading size="sm" />
                {:else}
                  🔄 Generate
                {/if}
              </Button>
            </div>

            {#if strugglingTopics.length === 0}
              <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                <p class="text-sm">No struggling topics identified.</p>
              </div>
            {:else if alternativePaths.length === 0}
              <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                <p class="text-sm">Click "Generate" to find alternative learning approaches.</p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each alternativePaths as path}
                  <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <h5 class="font-medium text-gray-900 dark:text-gray-100">
                        Alternative Approach
                      </h5>
                      <Badge variant="info" size="sm">
                        {path.difficulty_adjustment}
                      </Badge>
                    </div>
                    
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {path.reason}
                    </p>

                    <div class="space-y-2">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Suggested Content:
                      </p>
                      {#each path.alternative_content.slice(0, 3) as content}
                        <div class="flex items-center gap-2 text-sm">
                          <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>{content.title}</span>
                          <span class="text-gray-500">({content.estimated_time}min)</span>
                        </div>
                      {/each}
                      
                      {#if path.alternative_content.length > 3}
                        <p class="text-sm text-gray-500">
                          +{path.alternative_content.length - 3} more items
                        </p>
                      {/if}
                    </div>

                    {#if path.estimated_time_difference !== 0}
                      <div class="mt-3 text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Time adjustment:</span>
                        <span class="ml-1" class:text-green-600={path.estimated_time_difference < 0} class:text-orange-600={path.estimated_time_difference > 0}>
                          {path.estimated_time_difference > 0 ? '+' : ''}{path.estimated_time_difference} minutes
                        </span>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Recommendations Section -->
        {#if patterns.some(p => p.pattern_type === 'struggle_area')}
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Personalized Recommendations
            </h4>
            <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {#each patterns.filter(p => p.pattern_type === 'struggle_area') as pattern}
                <li>• Consider reviewing {pattern.pattern_data.topic || 'fundamental concepts'} before proceeding</li>
              {/each}
              <li>• Take breaks between study sessions to improve retention</li>
              <li>• Try different learning approaches if you're struggling with the current method</li>
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </Card>
</div>

<style>
  .adaptive-insights {
    @apply w-full;
  }
</style>