<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Assessment } from '$lib/types/database.js';
  import { AssessmentBuilder, AssessmentPreview } from '$lib/components/instructor/index.js';
  import { showToast } from '$lib/stores/toast.js';
  import { authStore } from '$lib/stores/auth.js';

  // State
  let currentView: 'builder' | 'preview' = 'builder';
  let assessment: Partial<Assessment> = {
    title: '',
    description: '',
    questions: [],
    is_mandatory: true,
    minimum_passing_score: 70,
    max_attempts: null,
    time_limit: null,
    ai_generated: false,
    source_content_ids: []
  };
  let saving = false;
  let duplicateId: string | null = null;

  // URL parameters
  $: lessonId = $page.url.searchParams.get('lesson');
  $: courseId = $page.url.searchParams.get('course');
  $: duplicateId = $page.url.searchParams.get('duplicate');

  onMount(async () => {
    // Check authentication
    if (!$authStore.user || !['instructor', 'admin'].includes($authStore.user.role)) {
      goto('/dashboard');
      return;
    }

    // Load duplicate assessment if specified
    if (duplicateId) {
      await loadDuplicateAssessment(duplicateId);
    }
  });

  async function loadDuplicateAssessment(id: string) {
    try {
      const response = await fetch(`/api/assessments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load assessment for duplication');
      }

      const originalAssessment = await response.json();
      
      // Create a copy with new ID and modified title
      assessment = {
        ...originalAssessment,
        id: undefined, // Remove ID to create new assessment
        title: `${originalAssessment.title} (Copy)`,
        lesson_id: lessonId || null,
        course_id: courseId || null,
        created_at: undefined,
        updated_at: undefined
      };

      showToast('Assessment loaded for duplication', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load assessment';
      showToast(message, 'error');
    }
  }

  async function handleSave(event: CustomEvent<Assessment>) {
    try {
      saving = true;
      const assessmentData = event.detail;

      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assessmentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create assessment');
      }

      const createdAssessment = await response.json();
      showToast('Assessment created successfully', 'success');
      
      // Redirect to the assessment view
      goto(`/assessments/${createdAssessment.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create assessment';
      showToast(message, 'error');
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    // Check if there are unsaved changes
    if (assessment.title || assessment.questions?.length > 0) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        goto('/assessments');
      }
    } else {
      goto('/assessments');
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
    const saveEvent = new CustomEvent('save', { detail: assessment });
    await handleSave(saveEvent);
  }

  // Page title based on context
  $: pageTitle = duplicateId 
    ? 'Duplicate Assessment' 
    : lessonId 
      ? 'Create Lesson Assessment' 
      : courseId 
        ? 'Create Course Assessment' 
        : 'Create Assessment';
</script>

<svelte:head>
  <title>{pageTitle} - Personalized LMS</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center space-x-2 text-sm text-gray-600 mb-2">
      <a href="/assessments" class="hover:text-blue-600">Assessments</a>
      <span>›</span>
      <span>{pageTitle}</span>
    </div>
    
    <h1 class="text-3xl font-bold text-gray-900">{pageTitle}</h1>
    
    {#if lessonId}
      <p class="text-gray-600 mt-2">Creating assessment for lesson</p>
    {:else if courseId}
      <p class="text-gray-600 mt-2">Creating final assessment for course</p>
    {:else if duplicateId}
      <p class="text-gray-600 mt-2">Duplicating existing assessment</p>
    {:else}
      <p class="text-gray-600 mt-2">Create a standalone assessment</p>
    {/if}
  </div>

  <!-- Content -->
  {#if currentView === 'builder'}
    <AssessmentBuilder
      bind:assessment
      {lessonId}
      {courseId}
      isEditing={false}
      on:save={handleSave}
      on:cancel={handleCancel}
      on:preview={handlePreview}
    />
  {:else if currentView === 'preview'}
    <AssessmentPreview
      assessment={assessment}
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
        <span class="text-gray-700">Creating assessment...</span>
      </div>
    </div>
  {/if}
</div>