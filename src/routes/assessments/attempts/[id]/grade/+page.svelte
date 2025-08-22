<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AssessmentGrading from '$lib/components/instructor/AssessmentGrading.svelte';
  import { Button } from '$lib/components/ui/index.js';

  $: attemptId = $page.params.id!;

  function handleGradingComplete() {
    // Redirect back to assessment results or instructor dashboard
    goto('/dashboard/instructor');
  }
</script>

<svelte:head>
  <title>Grade Assessment Attempt - Personalized LMS</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Breadcrumb -->
  <div class="flex items-center space-x-2 text-sm text-gray-600 mb-6">
    <a href="/dashboard/instructor" class="hover:text-blue-600">Instructor Dashboard</a>
    <span>›</span>
    <span>Grade Assessment</span>
  </div>

  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Grade Assessment Attempt</h1>
      <p class="text-gray-600 mt-1">Review and grade essay questions</p>
    </div>
    
    <Button onclick={() => goto('/dashboard/instructor')} variant="outline">
      Back to Dashboard
    </Button>
  </div>

  <!-- Grading Interface -->
  <AssessmentGrading {attemptId} onGradingComplete={handleGradingComplete} />
</div>