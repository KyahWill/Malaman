<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Assessment } from '$lib/types/database.js';
  import { Button, Card, Loading } from '$lib/components/ui/index.js';
  import { AssessmentPreview } from '$lib/components/instructor/index.js';
  import { toastHelpers as toast } from '$lib/stores/toast.js';
  import { authStore } from '$lib/stores/auth.js';

  // State
  let assessment: Assessment | null = $state(null);
  let loading = $state(true);
  let error: string | null = $state(null);

  // Get assessment ID from URL
  let assessmentId = $derived($page.params.id);

  onMount(async () => {
    await loadAssessment();
  });

  async function loadAssessment() {
    try {
      loading = true;
      error = null;

      const response = await fetch(`/api/assessments/${assessmentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Assessment not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this assessment');
        }
        throw new Error('Failed to load assessment');
      }

      assessment = await response.json();
      console.log(assessment)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load assessment';
      toast.error(error)
    } finally {
      loading = false;
    }
  }

  function handleEdit() {
    if (assessment) {
      goto(`/assessments/${assessment.id}/edit`);
    }
  }

  function handleClose() {
    goto('/assessments');
  }

  async function handlePublish() {
    if (!assessment) return;

    try {
      // In a real implementation, this would update the assessment status
      toast.success("Successfully published assessment")
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish assessment';
      toast.error(message)
    }
  }

  function handleTakeAssessment() {
    if (assessment) {
      goto(`/assessments/${assessment.id}/take`);
    }
  }

  function handleViewResults() {
    if (assessment) {
      goto(`/assessments/${assessment.id}/results`);
    }
  }

  let canEdit = $derived($authStore.user?.role === 'instructor' || $authStore.user?.role === 'admin');
  let canTake = $derived($authStore.user?.role === 'student');
  let canViewResults = $derived(canEdit);
</script>

<svelte:head>
  <title>{assessment?.title || 'Assessment'} - Personalized LMS</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center py-12">
      <Loading size="lg" />
    </div>
  {:else if error}
    <!-- Error State -->
    <Card class="p-8 text-center">
      <div class="text-red-600 mb-4">
        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Assessment</h3>
      <p class="text-gray-600 mb-4">{error}</p>
      <div class="space-x-2">
        <Button onclick={loadAssessment} variant="primary">
          Try Again
        </Button>
        <Button onclick={handleClose} variant="outline">
          Back to Assessments
        </Button>
      </div>
    </Card>
  {:else if assessment}
    <!-- Assessment Content -->
    <div class="mb-6">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <a href="/assessments" class="hover:text-blue-600">Assessments</a>
        <span>›</span>
        <span>{assessment.title}</span>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{assessment.title}</h1>
          <div class="flex items-center space-x-4 text-sm text-gray-600 mt-2">
            <span>{assessment.questions.length} questions</span>
            <span>{assessment.questions.reduce((sum, q) => sum + q.points, 0)} points</span>
            <span>Pass: {assessment.minimum_passing_score}%</span>
            {#if assessment.time_limit}
              <span>Time: {assessment.time_limit} min</span>
            {/if}
            {#if assessment.is_mandatory}
              <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Mandatory</span>
            {/if}
            {#if assessment.ai_generated}
              <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">AI Generated</span>
            {/if}
          </div>
        </div>

        <div class="flex space-x-2">
          {#if canTake}
            <Button onclick={handleTakeAssessment} variant="primary">
              Take Assessment
            </Button>
          {/if}
          
          {#if canViewResults}
            <Button onclick={handleViewResults} variant="outline">
              View Results
            </Button>
          {/if}
          
          {#if canEdit}
            <Button onclick={handleEdit} variant="outline">
              Edit Assessment
            </Button>
          {/if}
          
          <Button onclick={handleClose} variant="outline">
            Back to List
          </Button>
        </div>
      </div>
    </div>

    <!-- Assessment Preview -->
    <AssessmentPreview
      {assessment}
      on:close={handleClose}
      on:edit={handleEdit}
      on:publish={handlePublish}
    />
  {/if}
</div>