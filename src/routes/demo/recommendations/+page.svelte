<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ContentRecommendations from '$lib/components/student/ContentRecommendations.svelte';
  import EngagementInsights from '$lib/components/student/EngagementInsights.svelte';
  import { getInteractionTracker } from '$lib/services/interactionTracker';

  let demoMode = $state('recommendations');
  let tracker: any = null;

  onMount(() => {
    tracker = getInteractionTracker();
  });

  function simulateInteraction(type: string) {
    if (!tracker) return;

    const contentId = 'demo-lesson-' + Math.random().toString(36).substr(2, 9);
    
    switch (type) {
      case 'view':
        tracker.trackContentView(contentId, 'lesson', { demo: true });
        break;
      case 'start':
        tracker.trackContentStart(contentId, 'lesson', { demo: true });
        break;
      case 'complete':
        tracker.trackContentComplete(contentId, 'lesson', { demo: true, score: 85 });
        break;
      case 'skip':
        tracker.trackContentSkip(contentId, 'lesson', { demo: true, reason: 'too_easy' });
        break;
    }
  }

  async function generateTestRecommendations() {
    try {
      const response = await fetch('/api/recommendations?limit=5');
      const data = await response.json();
      console.log('Test recommendations:', data);
    } catch (error) {
      console.error('Error generating test recommendations:', error);
    }
  }
</script>

<svelte:head>
  <title>Recommendation System Demo</title>
</svelte:head>

<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
  <div class="px-4 py-6 sm:px-0">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Recommendation System Demo</h1>
      <p class="mt-2 text-gray-600">
        Test and demonstrate the adaptive content recommendation engine.
      </p>
    </div>

    <!-- Demo Mode Selector -->
    <div class="mb-6">
      <div class="flex space-x-4">
        <Button 
          variant={demoMode === 'recommendations' ? 'primary' : 'outline'}
          onclick={() => demoMode = 'recommendations'}
        >
          Recommendations
        </Button>
        <Button 
          variant={demoMode === 'engagement' ? 'primary' : 'outline'}
          onclick={() => demoMode = 'engagement'}
        >
          Engagement Insights
        </Button>
        <Button 
          variant={demoMode === 'testing' ? 'primary' : 'outline'}
          onclick={() => demoMode = 'testing'}
        >
          Testing Tools
        </Button>
      </div>
    </div>

    <!-- Content based on selected mode -->
    {#if demoMode === 'recommendations'}
      <div class="space-y-8">
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">Content Recommendations</h2>
          <p class="text-gray-600 mb-4">
            This component shows personalized content recommendations based on your learning patterns.
          </p>
          <ContentRecommendations limit={6} showExplanations={true} />
        </Card>
      </div>

    {:else if demoMode === 'engagement'}
      <div class="space-y-8">
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">Engagement Insights</h2>
          <p class="text-gray-600 mb-4">
            This component analyzes your learning patterns and provides insights.
          </p>
          <EngagementInsights />
        </Card>
      </div>

    {:else if demoMode === 'testing'}
      <div class="space-y-8">
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">Testing Tools</h2>
          <p class="text-gray-600 mb-4">
            Use these tools to test the recommendation system functionality.
          </p>
          
          <div class="space-y-4">
            <div>
              <h3 class="font-medium mb-2">Simulate Interactions</h3>
              <div class="flex space-x-2">
                <Button size="sm" onclick={() => simulateInteraction('view')}>
                  Simulate View
                </Button>
                <Button size="sm" onclick={() => simulateInteraction('start')}>
                  Simulate Start
                </Button>
                <Button size="sm" onclick={() => simulateInteraction('complete')}>
                  Simulate Complete
                </Button>
                <Button size="sm" onclick={() => simulateInteraction('skip')}>
                  Simulate Skip
                </Button>
              </div>
            </div>

            <div>
              <h3 class="font-medium mb-2">API Testing</h3>
              <div class="flex space-x-2">
                <Button size="sm" onclick={generateTestRecommendations}>
                  Test Recommendations API
                </Button>
              </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-medium mb-2">System Status</h4>
              <div class="text-sm text-gray-600 space-y-1">
                <div>✅ Recommendation Engine: Active</div>
                <div>✅ Interaction Tracker: Active</div>
                <div>✅ Engagement Analysis: Active</div>
                <div>✅ Feedback System: Active</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    {/if}

    <!-- System Information -->
    <Card class="p-6 mt-8">
      <h2 class="text-xl font-semibold mb-4">System Information</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium mb-2">Recommendation Factors</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• Knowledge Gap Analysis (30%)</li>
            <li>• Learning Style Match (20%)</li>
            <li>• Difficulty Match (20%)</li>
            <li>• Engagement Patterns (20%)</li>
            <li>• Peer Success Rate (10%)</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Tracked Interactions</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• Content Views</li>
            <li>• Learning Sessions</li>
            <li>• Completion Events</li>
            <li>• Assessment Results</li>
            <li>• User Feedback</li>
          </ul>
        </div>
      </div>
    </Card>
  </div>
</div>