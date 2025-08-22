<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Assessment } from '$lib/types/database.js';
  import { AssessmentBuilder, AssessmentPreview } from '$lib/components/instructor/index.js';
  import { toastStore, type Toast } from '$lib/stores/toast.js';
  import { authStore } from '$lib/stores/auth.js';

  // State
  let currentView: 'builder' | 'preview' = $state('builder');
  let assessment: Partial<Assessment> = $state({
    title: '',
    description: '',
    questions: [],
    is_mandatory: true,
    minimum_passing_score: 70,
    max_attempts: null,
    time_limit: null,
    ai_generated: false,
    source_content_ids: []
  });
  let saving = $state(false);

  // URL parameters
  let lessonId = $derived( $page.url.searchParams.get('lesson'));
  let courseId = $derived($page.url.searchParams.get('courseId'));
  let duplicateId = $derived($page.url.searchParams.get('duplicate'));

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const newToast: Toast = {
      id: Date.now().toString(),
      title: "Assessment",
      message,
      type
    };
		toastStore.update(state => ({
			...state,
			toasts: [...state.toasts, newToast]
		}));
  } 

  onMount(async () => {
    // Check authentication
    if (!$authStore.user ) {
      goto('/dashboard');
      return;
    }
    if (!$authStore.user.role ) {
      goto('/dashboard');
      return;
    }
    if (!['instructor', 'admin'].includes($authStore.user.user_metadata.role)) {
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

  async function handleSave(assessment: Partial<Assessment>) {
    try {
      saving = true;
      const assessmentData = { ...assessment };

      if (courseId) {
        assessmentData.course_id = courseId;
      }

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
    // Check if the assessment exists and if the assessmente questions are more than zero
    // todo: add assessments.questions.length > 0 as a parameter
    if (assessment.title) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        goto('/assessments');
      }
    } else {
      goto('/assessments');
    }
  }

  function handlePreview(assessment:Assessment) {
    assessment = assessment;
    currentView = 'preview';
  }

  function handleBackToBuilder() {
    currentView = 'builder';
  }

  async function handlePublish() {
    // In a real implementation, this would publish the assessment
    // For now, we'll just save it
    const saveEvent = new CustomEvent('save', { detail: assessment });
    await handleSave(assessment);
  }

  // Page title based on context
  let pageTitle = $derived.by(()=>  duplicateId 
    ? 'Duplicate Assessment' 
    : lessonId 
      ? 'Create Lesson Assessment' 
      : courseId 
        ? 'Create Course Assessment' 
        : 'Create Assessment');
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
      assessment={assessment}
      {lessonId}
      {courseId}
      isEditing={false}
      onSave={handleSave}
      onCancel={handleCancel}
      onPreview={handlePreview}
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