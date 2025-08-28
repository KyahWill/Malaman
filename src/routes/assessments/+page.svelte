<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Assessment } from '$lib/types/database.js';
  import { Button, Card, Loading, Modal } from '$lib/components/ui/index.js';
  import { toastStore, type Toast } from '$lib/stores/toast.js';
  import { authStore } from '$lib/stores/auth.js';

  // State
  let assessments: Assessment[] = $state([]);
  let loading = $state(true);
  let error: string | null =$state(null);
  let showDeleteModal = $state(false);
  let assessmentToDelete: Assessment | null = $state(null);

  // Filters
  let filterType: 'all' | 'lesson' | 'course' = $state('all');
  let searchQuery = $state('');

  onMount(async () => {
    await loadAssessments();
  });
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

  async function loadAssessments() {
    try {
      loading = true;
      error = null;

      const response = await fetch('/api/assessments');
      if (!response.ok) {
        throw new Error('Failed to load assessments');
      }

      assessments = JSON.parse(JSON.stringify(await response.json()));
      console.log(assessments)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load assessments';
      showToast(error, 'error');
    } finally {
      loading = false;
    }
  }

  async function deleteAssessment(assessment: Assessment | null) {
    if (assessment == null) return;
    try {
      const response = await fetch(`/api/assessments/${assessment.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete assessment');
      }

      assessments = assessments.filter(a => a.id !== assessment.id);
      showToast('Assessment deleted successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete assessment';
      showToast(message, 'error');
    } finally {
      showDeleteModal = false;
      assessmentToDelete = null;
    }
  }

  function confirmDelete(assessment: Assessment) {
    assessmentToDelete = assessment;
    showDeleteModal = true;
  }

  function createAssessment() {
    goto('/assessments/create');
  }

  function editAssessment(assessment: Assessment) {
    goto(`/assessments/${assessment.id}/edit`);
  }

  function viewAssessment(assessment: Assessment) {
    goto(`/assessments/${assessment.id}`);
  }

  function duplicateAssessment(assessment: Assessment) {
    goto(`/assessments/create?duplicate=${assessment.id}`);
  }

  // Computed properties
  let filteredAssessments = $derived.by(() => assessments.filter(assessment => {
    // Type filter
    if (filterType === 'lesson' && !assessment.lesson_id) return false;
    if (filterType === 'course' && !assessment.course_id) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        assessment.title.toLowerCase().includes(query) ||
        assessment.description?.toLowerCase().includes(query)
      );
    }

    return true;
  }));

  let canCreateAssessment = $derived($authStore.user?.role === 'instructor' || $authStore.user?.role === 'admin');

  function getAssessmentType(assessment: Assessment): string {
    if (assessment.lesson_id) return 'Lesson Assessment';
    if (assessment.course_id) return 'Course Assessment';
    return 'Standalone Assessment';
  }

  function getAssessmentStatus(assessment: Assessment): { label: string; color: string } {
    // This would typically come from the database or be calculated
    // For now, we'll use a simple heuristic
    if (!assessment.questions || assessment.questions.length === 0) {
      return { label: 'Draft', color: 'gray' };
    }
    return { label: 'Published', color: 'green' };
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Assessments - Personalized LMS</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Assessments</h1>
      <p class="text-gray-600 mt-2">Manage your assessments and track student performance</p>
    </div>

    {#if canCreateAssessment}
      <Button onclick={createAssessment} variant="primary">
        Create Assessment
      </Button>
    {/if}
  </div>

  <!-- Filters and Search -->
  <Card class="p-6 mb-6">
    <div class="flex flex-col md:flex-row gap-4">
      <!-- Search -->
      <div class="flex-1">
        <input
          type="text"
          placeholder="Search assessments..."
          bind:value={searchQuery}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Type Filter -->
      <div class="flex space-x-2">
        <button
          onclick={() => filterType = 'all'}
          class="px-4 py-2 rounded-lg border {filterType === 'all' 
            ? 'bg-blue-500 text-white border-blue-500' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
        >
          All
        </button>
        <button
          onclick={() => filterType = 'lesson'}
          class="px-4 py-2 rounded-lg border {filterType === 'lesson' 
            ? 'bg-blue-500 text-white border-blue-500' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
        >
          Lesson
        </button>
        <button
          onclick={() => filterType = 'course'}
          class="px-4 py-2 rounded-lg border {filterType === 'course' 
            ? 'bg-blue-500 text-white border-blue-500' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
        >
          Course
        </button>
      </div>
    </div>
  </Card>

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
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Assessments</h3>
      <p class="text-gray-600 mb-4">{error}</p>
      <Button onclick={loadAssessments} variant="primary">
        Try Again
      </Button>
    </Card>
  {:else if filteredAssessments.length === 0}
    <!-- Empty State -->
    <Card class="p-8 text-center">
      <div class="text-gray-400 mb-4">
        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {searchQuery || filterType !== 'all' ? 'No matching assessments' : 'No assessments yet'}
      </h3>
      <p class="text-gray-600 mb-4">
        {searchQuery || filterType !== 'all' 
          ? 'Try adjusting your search or filters' 
          : 'Create your first assessment to get started'}
      </p>
      {#if canCreateAssessment && !searchQuery && filterType === 'all'}
        <Button onclick={createAssessment} variant="primary">
          Create Assessment
        </Button>
      {/if}
    </Card>
  {:else}
    <!-- Assessments Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredAssessments as assessment}
        {@const status = getAssessmentStatus(assessment)}
        <Card class="p-6 hover:shadow-lg transition-shadow">
          <!-- Assessment Header -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">
                {assessment.title}
              </h3>
              <div class="flex items-center space-x-2 text-sm text-gray-600">
                <span class="bg-gray-100 px-2 py-1 rounded text-xs">
                  {getAssessmentType(assessment)}
                </span>
                <span class="bg-{status.color}-100 text-{status.color}-800 px-2 py-1 rounded text-xs">
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          <!-- Assessment Stats -->
          <div class="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <div class="text-lg font-semibold text-gray-900">
                {assessment.questions?.length || 0}
              </div>
              <div class="text-xs text-gray-600">Questions</div>
            </div>
            <div>
              <div class="text-lg font-semibold text-gray-900">
                {assessment.questions?.reduce((sum, q) => sum + q.points, 0) || 0}
              </div>
              <div class="text-xs text-gray-600">Points</div>
            </div>
            <div>
              <div class="text-lg font-semibold text-gray-900">
                {assessment.minimum_passing_score}%
              </div>
              <div class="text-xs text-gray-600">Pass Rate</div>
            </div>
          </div>

          <!-- Assessment Description -->
          {#if assessment.description}
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">
              {assessment.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
            </p>
          {/if}

          <!-- Assessment Configuration -->
          <div class="space-y-2 mb-4 text-sm">
            {#if assessment.time_limit}
              <div class="flex items-center text-gray-600">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Time limit: {assessment.time_limit} minutes
              </div>
            {/if}
            
            {#if assessment.max_attempts}
              <div class="flex items-center text-gray-600">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Max attempts: {assessment.max_attempts}
              </div>
            {/if}

            {#if assessment.is_mandatory}
              <div class="flex items-center text-orange-600">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Mandatory
              </div>
            {/if}
          </div>

          <!-- Metadata -->
          <div class="text-xs text-gray-500 mb-4">
            Created {formatDate(assessment.created_at)}
            {#if assessment.ai_generated}
              <span class="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded">AI Generated</span>
            {/if}
          </div>

          <!-- Actions -->
          <div class="flex space-x-2">
            <Button
              onclick={() => viewAssessment(assessment)}
              variant="outline"
              size="sm"
              class="flex-1"
            >
              View
            </Button>
            
            {#if canCreateAssessment}
              <Button
                onclick={() => editAssessment(assessment)}
                variant="outline"
                size="sm"
                class="flex-1"
              >
                Edit
              </Button>
              
              <button
                onclick={() => duplicateAssessment(assessment)}
                class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Duplicate"
                aria-label="Duplicate assessment"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              
              <button
                onclick={() => confirmDelete(assessment)}
                class="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                title="Delete"
                aria-label="Delete assessment"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            {/if}
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && assessmentToDelete}
  <Modal
    open={showDeleteModal}
    onClose={() => { showDeleteModal = false; assessmentToDelete = null; }}
    title="Delete Assessment"
  >
    <div class="space-y-4">
      <p class="text-gray-700">
        Are you sure you want to delete the assessment "{assessmentToDelete.title}"?
      </p>
      
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="text-sm text-red-700">
            <p class="font-medium">This action cannot be undone.</p>
            <p>All student attempts and progress data will also be deleted.</p>
          </div>
        </div>
      </div>
    </div>
    <footer class="flex justify-end space-x-2">
      <Button
        onclick={() => { showDeleteModal = false; assessmentToDelete = null; }}
        variant="outline"
      >
        Cancel
      </Button>
      <Button
        onclick={() => deleteAssessment(assessmentToDelete)}
        variant="primary"
        class="bg-red-600 hover:bg-red-700"
      >
        Delete Assessment
      </Button>
    </footer>
  </Modal>
{/if}