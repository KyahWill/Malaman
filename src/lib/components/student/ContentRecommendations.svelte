<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import RecommendationFeedback from './RecommendationFeedback.svelte';
  import type { ContentRecommendation } from '$lib/types';

  interface Props {
    contentType?: 'lesson' | 'course' | 'assessment';
    limit?: number;
    showExplanations?: boolean;
  }

  let { 
    contentType = undefined, 
    limit = 5, 
    showExplanations = true 
  }: Props = $props();

  let recommendations: ContentRecommendation[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let selectedRecommendation: ContentRecommendation | null = $state(null);
  let showFeedback = $state(false);

  onMount(async () => {
    await loadRecommendations();
  });

  async function loadRecommendations() {
    try {
      loading = true;
      error = null;

      const params = new URLSearchParams();
      if (contentType) params.set('contentType', contentType);
      params.set('limit', limit.toString());

      const response = await fetch(`/api/recommendations?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load recommendations');
      }

      recommendations = data.recommendations;
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error loading recommendations:', err);
    } finally {
      loading = false;
    }
  }

  async function handleRecommendationClick(recommendation: ContentRecommendation) {
    try {
      const { handleRecommendationClick } = await import('$lib/utils/recommendationIntegration');
      await handleRecommendationClick(recommendation);
    } catch (err) {
      console.error('Error handling recommendation click:', err);
      // Fallback to direct navigation
      const contentUrl = getContentUrl(recommendation);
      if (contentUrl) {
        window.location.href = contentUrl;
      }
    }
  }

  async function handleRecommendationView(recommendation: ContentRecommendation) {
    if (recommendation.viewed) return;

    try {
      await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'view',
          recommendationId: recommendation.id,
          contentId: recommendation.contentId
        })
      });

      // Update local state
      recommendation.viewed = true;
    } catch (err) {
      console.error('Error tracking recommendation view:', err);
    }
  }

  function getContentUrl(recommendation: ContentRecommendation): string {
    switch (recommendation.contentType) {
      case 'lesson':
        return `/lessons/${recommendation.contentId}`;
      case 'course':
        return `/courses/${recommendation.contentId}`;
      case 'assessment':
        return `/assessments/${recommendation.contentId}`;
      default:
        return '#';
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-blue-100 text-blue-800';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }

  function getScoreLabel(score: number): string {
    if (score >= 0.8) return 'Highly Recommended';
    if (score >= 0.6) return 'Recommended';
    if (score >= 0.4) return 'Suggested';
    return 'Consider';
  }

  function openFeedback(recommendation: ContentRecommendation) {
    selectedRecommendation = recommendation;
    showFeedback = true;
  }

  function closeFeedback() {
    showFeedback = false;
    selectedRecommendation = null;
  }

  async function handleFeedbackSubmitted() {
    closeFeedback();
    // Optionally reload recommendations
    await loadRecommendations();
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-gray-900">
      Recommended for You
    </h3>
    <Button 
      variant="outline" 
      size="sm" 
      onclick={loadRecommendations}
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
    <Card class="p-6 text-center">
      <p class="text-red-600 mb-4">{error}</p>
      <Button onclick={loadRecommendations}>Try Again</Button>
    </Card>
  {:else if recommendations.length === 0}
    <Card class="p-6 text-center">
      <p class="text-gray-600">No recommendations available at the moment.</p>
      <p class="text-sm text-gray-500 mt-2">
        Complete more lessons to get personalized recommendations.
      </p>
    </Card>
  {:else}
    <div class="space-y-4">
      {#each recommendations as recommendation (recommendation.id)}
        <Card 
          class="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onclick={() => handleRecommendationView(recommendation)}
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <Badge variant="secondary" class="text-xs">
                  {recommendation.contentType}
                </Badge>
                <Badge class={`text-xs ${getScoreColor(recommendation.score)}`}>
                  {getScoreLabel(recommendation.score)}
                </Badge>
                <span class="text-xs text-gray-500">
                  {Math.round(recommendation.score * 100)}% match
                </span>
              </div>

              <h4 class="font-medium text-gray-900 mb-2">
                Content #{recommendation.contentId.slice(0, 8)}
              </h4>

              {#if showExplanations && recommendation.explanation}
                <p class="text-sm text-gray-600 mb-3">
                  {recommendation.explanation}
                </p>
              {/if}

              <div class="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onclick={() => handleRecommendationClick(recommendation)}
                >
                  Start Learning
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onclick={() => openFeedback(recommendation)}
                >
                  Feedback
                </Button>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1">
              {#if recommendation.viewed}
                <Badge variant="outline" class="text-xs">Viewed</Badge>
              {/if}
              {#if recommendation.clicked}
                <Badge variant="outline" class="text-xs">Clicked</Badge>
              {/if}
            </div>
          </div>

          {#if showExplanations && recommendation.factors}
            <details class="mt-3">
              <summary class="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                Why this was recommended
              </summary>
              <div class="mt-2 space-y-1">
                {#each recommendation.factors as factor}
                  <div class="text-xs text-gray-500 flex justify-between">
                    <span>{factor.description}</span>
                    <span>{Math.round(factor.value * factor.weight * 100)}%</span>
                  </div>
                {/each}
              </div>
            </details>
          {/if}
        </Card>
      {/each}
    </div>
  {/if}
</div>

{#if showFeedback && selectedRecommendation}
  <RecommendationFeedback
    recommendation={selectedRecommendation}
    onClose={closeFeedback}
    onSubmitted={handleFeedbackSubmitted}
  />
{/if}