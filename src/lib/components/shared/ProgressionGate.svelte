<!--
  Progression Gate Component
  
  This component checks content access permissions and displays appropriate
  messaging or blocks access based on progression rules.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ProgressionClient, ProgressionUtils } from '$lib/services/progressionClient.js';
  import type { ContentAccessResult } from '$lib/services/progressionControl.js';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';

  // Props
  export let contentId: string;
  export let contentType: 'lesson' | 'course' | 'assessment';
  export let contentTitle: string = '';
  export let showDetails: boolean = true;
  export let allowBypass: boolean = false; // For instructor override

  // State
  let accessResult: ContentAccessResult | null = null;
  let loading = true;
  let error: string | null = null;

  // Check access on mount
  onMount(async () => {
    await checkAccess();
  });

  async function checkAccess() {
    try {
      loading = true;
      error = null;
      accessResult = await ProgressionClient.checkAccess(contentId, contentType);
    } catch (err: any) {
      error = err.message;
      console.error('Error checking content access:', err);
    } finally {
      loading = false;
    }
  }

  function handleBypass() {
    // Emit event for parent to handle bypass
    const event = new CustomEvent('bypass', {
      detail: { contentId, contentType }
    });
    document.dispatchEvent(event);
  }

  $: isLocked = accessResult ? ProgressionUtils.isContentLocked(accessResult) : false;
  $: lockReason = accessResult ? ProgressionUtils.getLockReason(accessResult) : '';
</script>

{#if loading}
  <div class="flex items-center justify-center p-8">
    <Loading />
    <span class="ml-2 text-gray-600">Checking access permissions...</span>
  </div>
{:else if error}
  <Card class="border-red-200 bg-red-50">
    <div class="flex items-center space-x-3">
      <div class="text-red-500">⚠️</div>
      <div>
        <h3 class="font-medium text-red-800">Access Check Failed</h3>
        <p class="text-sm text-red-600">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          class="mt-2"
          on:click={checkAccess}
        >
          Retry
        </Button>
      </div>
    </div>
  </Card>
{:else if isLocked}
  <Card class="border-yellow-200 bg-yellow-50">
    <div class="space-y-4">
      <!-- Lock Icon and Title -->
      <div class="flex items-center space-x-3">
        <div class="text-2xl">🔒</div>
        <div>
          <h3 class="font-medium text-yellow-800">Content Locked</h3>
          <p class="text-sm text-yellow-700">{lockReason}</p>
        </div>
      </div>

      {#if showDetails && accessResult?.prerequisites}
        <!-- Prerequisites List -->
        <div class="space-y-2">
          <h4 class="font-medium text-yellow-800">Prerequisites:</h4>
          <div class="space-y-1">
            {#each accessResult.prerequisites as prereq}
              <div class="flex items-center space-x-2 text-sm">
                <span class={prereq.completed ? 'text-green-600' : 'text-red-600'}>
                  {prereq.completed ? '✓' : '✗'}
                </span>
                <span class={prereq.completed ? 'text-green-700' : 'text-red-700'}>
                  {prereq.title}
                </span>
                {#if prereq.score !== undefined && prereq.required_score !== undefined}
                  <span class="text-xs text-gray-500">
                    ({prereq.score}% / {prereq.required_score}% required)
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if accessResult?.blockedBy}
        <!-- Blocked By Information -->
        <div class="p-3 bg-yellow-100 rounded-md">
          <p class="text-sm text-yellow-800">
            <strong>Blocked by:</strong> {accessResult.blockedBy.title}
          </p>
          <p class="text-xs text-yellow-600 mt-1">
            Complete this {accessResult.blockedBy.type} to unlock access.
          </p>
        </div>
      {/if}

      {#if allowBypass}
        <!-- Instructor Override -->
        <div class="pt-3 border-t border-yellow-200">
          <Button 
            variant="outline" 
            size="sm"
            class="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            on:click={handleBypass}
          >
            Override Lock (Instructor)
          </Button>
        </div>
      {/if}
    </div>
  </Card>
{:else}
  <!-- Content is accessible -->
  <div class="flex items-center space-x-2 text-green-600 text-sm">
    <span>✓</span>
    <span>Access granted</span>
    {#if contentTitle}
      <span class="text-gray-500">• {contentTitle}</span>
    {/if}
  </div>
  
  <!-- Slot for actual content -->
  <slot />
{/if}

<style>
  /* Custom styles if needed */
</style>