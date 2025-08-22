<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AssessmentResults from '$lib/components/student/AssessmentResults.svelte';
  import { Button } from '$lib/components/ui/index.js';

  // Get assessment ID from URL
  $: assessmentId = $page.params.id!;
</script>

<svelte:head>
  <title>Assessment Results - Personalized LMS</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Breadcrumb -->
  <div class="flex items-center space-x-2 text-sm text-gray-600 mb-4">
    <a href="/assessments" class="hover:text-blue-600">Assessments</a>
    <span>›</span>
    <a href="/assessments/{assessmentId}" class="hover:text-blue-600">Assessment</a>
    <span>›</span>
    <span>Results</span>
  </div>

  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Assessment Results</h1>
      <p class="text-gray-600 mt-1">View your assessment performance and feedback</p>
    </div>

    <Button onclick={() => goto(`/assessments/${assessmentId}`)} variant="outline">
      Back to Assessment
    </Button>
  </div>

  <!-- Enhanced Assessment Results -->
  <AssessmentResults {assessmentId} />
</div>