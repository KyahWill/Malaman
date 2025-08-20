<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Assessment } from '$lib/types/database.js';
  import { AssessmentBuilder, AssessmentPreview } from '$lib/components/instructor/index.js';
  import { Loading, Card } from '$lib/components/ui/index.js';
  import { showToast } from '$lib/stores/toast.js';
  import { authStore } from '$lib/stores/auth.js';

  // State
  let currentView: 'builder' | 'preview' = 'builder';
  let assessment: Assessment | null = null;
  let loading = true;
  let saving = false;
  let error: string | null = null;

  // Get assessment ID from URL
  $: assessmentId = $page.params.id;

  onMount(async () => {
    // Check authentication
    if (!$authStore.user || !['instructor', 'admin'].includes($authStore.user.role)) {
      goto('/dashboard');
      return;
    }

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
          throw new Error('You do not have permission to edit this assessment');
        }
        throw new Error('Failed to load assessment');
      }

      assessment = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load assessment';
      showToast(error, 'error');
    } finally {
      loading = false;
    }
  }

  async function handleSave(event: CustomEvent<Assessment>) {
    try {
      saving = true;
      const assessmentData = event.detail;

      const response = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assessmentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update assessment');
      }

      const updatedAssessment = await response.json();
      assessment = updatedAssessment;
      
      showToast('Assessment updated successfully', 'success');
      
      // Redirect to the assessment view
      goto(`/assessments/${assessmentId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update assessment';
      showToast(message, 'error');
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    // Check if there are unsaved changes
    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
      goto(`/assessments/${assessmentId}`);
    }
  }

  function handlePreview(event: CustomEvent<Assessment>) {
    assessment = event.detail;
    currentView = 'preview';
  }

  function handleBackToBuilder() {
    currentView = 'builder';
  }

  async function handlePublish() {
    // In a real implementation, this would publish the assessment
    // For now, we'll just save it
    if (assessment) {
      const saveEvent = new CustomEvent('save', { detail: assessment });
      await handleSave(saveEvent);
    }
  }
</script>

<svelte:head>
  <title>Edit {assessment?.title || 'Assessment'} - Personalized LMS</title>
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
        <Button on:click={loadAssessment} variant="primary">
          Try Again
        </Button>
        <Button on:click={() => goto('/assessments')} variant="outline">
          Back to Assessments
        </Button>
      </div>
    </Card>
  {:else if assessment}
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-2 text-sm text-gray-600 mb-2">
        <a href="/assessments" class="hover:text-blue-600">Assessments</a>
        <span>›</span>
        <a href="/assessments/{assessmentId}" class="hover:text-blue-600">{assessment.title}</a>
        <span>›</span>
        <span>Edit</span>
      </div>
      
      <h1 class="text-3xl font-bold text-gray-900">Edit Assessment</h1>
      <p class="text-gray-600 mt-2">Make changes to "{assessment.title}"</p>
    </div>

    <!-- Content -->
    {#if currentView === 'builder'}
      <AssessmentBuilder
        bind:assessment
        lessonId={assessment.lesson_id}
        courseId={assessment.course_id}
        isEditing={true}
        on:save={handleSave}
        on:cancel={handleCancel}
        on:preview={handlePreview}
      />
    {:else if currentView === 'preview'}
      <AssessmentPreview
        {assessment}
        on:close={handleBackToBuilder}
        on:edit={handleBackToBuilder}
        on:publish={handlePublish}
      />
    {/if}

    <!-- Loading Overlay -->
    {#if saving}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="text-gray-700">Updating assessment...</span>
        </div>
      </div>
    {/if}
  {/if}
</div>