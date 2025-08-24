<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import type { EngagementPattern } from '$lib/types';

  let engagementPattern: EngagementPattern | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    await loadEngagementData();
  });

  async function loadEngagementData() {
    try {
      loading = true;
      error = null;

      const response = await fetch('/api/recommendations/engagement');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load engagement data');
      }

      engagementPattern = data.engagementPattern;
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error loading engagement data:', err);
    } finally {
      loading = false;
    }
  }

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  function getPatternBadgeColor(pattern: string): string {
    const colorMap: Record<string, string> = {
      'high_completion': 'bg-green-100 text-green-800',
      'low_completion': 'bg-red-100 text-red-800',
      'high_performer': 'bg-blue-100 text-blue-800',
      'struggling_learner': 'bg-yellow-100 text-yellow-800',
      'thorough_learner': 'bg-purple-100 text-purple-800',
      'quick_learner': 'bg-indigo-100 text-indigo-800'
    };
    return colorMap[pattern] || 'bg-gray-100 text-gray-800';
  }

  function getPatternLabel(pattern: string): string {
    const labelMap: Record<string, string> = {
      'high_completion': 'High Completion Rate',
      'low_completion': 'Low Completion Rate',
      'high_performer': 'High Performer',
      'struggling_learner': 'Needs Support',
      'thorough_learner': 'Thorough Learner',
      'quick_learner': 'Quick Learner'
    };
    return labelMap[pattern] || pattern.replace('_', ' ');
  }

  function getContentTypeLabel(type: string): string {
    const labelMap: Record<string, string> = {
      'rich_text': 'Text Content',
      'video': 'Videos',
      'image': 'Images',
      'file': 'Files',
      'youtube': 'YouTube Videos'
    };
    return labelMap[type] || type;
  }
</script>

<Card class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-lg font-semibold text-gray-900">Your Learning Insights</h3>
    <Button 
      variant="outline" 
      size="sm" 
      onclick={loadEngagementData}
      disabled={loading}
    >
      Refresh
    </Button>
  </div>

  {#if loading}
    <div class="flex justify-center py-8">
      <Loading />
    </div>
  {:else if error}
    <div class="text-center py-8">
      <p class="text-red-600 mb-4">{error}</p>
      <Button onclick={loadEngagementData}>Try Again</Button>
    </div>
  {:else if !engagementPattern}
    <div class="text-center py-8">
      <p class="text-gray-600 mb-2">No engagement data available yet.</p>
      <p class="text-sm text-gray-500">
        Start learning to see your personalized insights!
      </p>
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Learning Patterns -->
      <div>
        <h4 class="font-medium text-gray-900 mb-3">Learning Patterns</h4>
        {#if engagementPattern.patterns.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each engagementPattern.patterns as pattern}
              <Badge class={getPatternBadgeColor(pattern)}>
                {getPatternLabel(pattern)}
              </Badge>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-gray-500">
            Complete more activities to identify your learning patterns.
          </p>
        {/if}
      </div>

      <!-- Key Metrics -->
      <div>
        <h4 class="font-medium text-gray-900 mb-3">Key Metrics</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {Math.round(engagementPattern.metrics.completionRate * 100)}%
            </div>
            <div class="text-sm text-gray-600">Completion Rate</div>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {formatTime(engagementPattern.metrics.timeSpent)}
            </div>
            <div class="text-sm text-gray-600">Total Time</div>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              {engagementPattern.metrics.interactionFrequency}
            </div>
            <div class="text-sm text-gray-600">Activities</div>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">
              {engagementPattern.metrics.assessmentScores.length > 0 
                ? Math.round(engagementPattern.metrics.assessmentScores.reduce((a, b) => a + b, 0) / engagementPattern.metrics.assessmentScores.length)
                : 'N/A'}
              {engagementPattern.metrics.assessmentScores.length > 0 ? '%' : ''}
            </div>
            <div class="text-sm text-gray-600">Avg Score</div>
          </div>
        </div>
      </div>

      <!-- Content Type Preferences -->
      {#if Object.keys(engagementPattern.metrics.contentTypePreferences).length > 0}
        <div>
          <h4 class="font-medium text-gray-900 mb-3">Content Preferences</h4>
          <div class="space-y-3">
            {#each Object.entries(engagementPattern.metrics.contentTypePreferences) as [type, preference]}
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-700">{getContentTypeLabel(type)}</span>
                  <span class="text-gray-500">{Math.round(preference * 100)}%</span>
                </div>
                <ProgressBar 
                  value={preference * 100} 
                  max={100}
                  class="h-2"
                />
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Difficulty Preferences -->
      {#if Object.keys(engagementPattern.metrics.difficultyPreferences).length > 0}
        <div>
          <h4 class="font-medium text-gray-900 mb-3">Difficulty Performance</h4>
          <div class="space-y-3">
            {#each Object.entries(engagementPattern.metrics.difficultyPreferences) as [difficulty, success]}
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-700 capitalize">{difficulty}</span>
                  <span class="text-gray-500">{Math.round(success * 100)}% success</span>
                </div>
                <ProgressBar 
                  value={success * 100} 
                  max={100}
                  class="h-2"
                />
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Learning Pace -->
      {#if engagementPattern.preferences?.pacePreference}
        <div>
          <h4 class="font-medium text-gray-900 mb-3">Learning Pace</h4>
          <div class="flex items-center gap-2">
            <Badge class={
              engagementPattern.preferences.pacePreference === 'fast' ? 'bg-red-100 text-red-800' :
              engagementPattern.preferences.pacePreference === 'slow' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }>
              {engagementPattern.preferences.pacePreference.charAt(0).toUpperCase() + 
               engagementPattern.preferences.pacePreference.slice(1)} Pace
            </Badge>
            <span class="text-sm text-gray-600">
              {engagementPattern.preferences.pacePreference === 'fast' ? 'You prefer quick, focused sessions' :
               engagementPattern.preferences.pacePreference === 'slow' ? 'You prefer thorough, detailed learning' :
               'You have a balanced learning pace'}
            </span>
          </div>
        </div>
      {/if}

      <div class="text-xs text-gray-500 pt-4 border-t">
        Last updated: {new Date(engagementPattern.lastUpdated).toLocaleDateString()}
      </div>
    </div>
  {/if}
</Card>