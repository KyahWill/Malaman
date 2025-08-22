<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AssessmentResults from '$lib/components/student/AssessmentResults.svelte';
  import { Button } from '$lib/components/ui/index.js';

  // Get IDs from URL
  $: assessmentId = $page.params.id!;
  $: attemptId = $page.params.attemptId!;
</script>

<svelte:head>
  <title>Assessment Result - Personalized LMS</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Breadcrumb -->
  <div class="flex items-center space-x-2 text-sm text-gray-600 mb-4">
    <a href="/assessments" class="hover:text-blue-600">Assessments</a>
    <span>›</span>
    <a href="/assessments/{assessmentId}" class="hover:text-blue-600">Assessment</a>
    <span>›</span>
    <a href="/assessments/{assessmentId}/results" class="hover:text-blue-600">Results</a>
    <span>›</span>
    <span>Attempt Details</span>
  </div>

  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Assessment Result</h1>
      <p class="text-gray-600 mt-1">Detailed attempt results</p>
    </div>

    <Button onclick={() => goto(`/assessments/${assessmentId}/results`)} variant="outline">
      All Results
    </Button>
  </div>

  <!-- Enhanced Assessment Results -->
  <AssessmentResults {assessmentId} {attemptId} showHistory={false} />
</div>