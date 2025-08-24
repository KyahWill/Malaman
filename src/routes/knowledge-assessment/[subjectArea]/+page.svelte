<!--
  Knowledge Assessment Page
  
  This page allows students to take initial knowledge assessments
  for specific subject areas to build their learning profiles.
-->

<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import KnowledgeAssessment from '$lib/components/student/KnowledgeAssessment.svelte';
  import type { KnowledgeGap } from '$lib/services/knowledgeAssessment.js';

  // Get subject area from URL params
  $: subjectArea = decodeURIComponent($page.params.subjectArea || '');

  function handleAssessmentComplete(gaps: KnowledgeGap[]) {
    // Navigate to knowledge profile page to show results
    goto('/dashboard/student?tab=knowledge-profile');
  }
</script>

<svelte:head>
  <title>Knowledge Assessment: {subjectArea} | Personalized LMS</title>
  <meta name="description" content="Take a knowledge assessment in {subjectArea} to create your personalized learning profile." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <KnowledgeAssessment 
    {subjectArea} 
    onComplete={handleAssessmentComplete}
  />
</div>