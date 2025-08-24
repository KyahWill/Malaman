<!--
  Create Knowledge Assessment Page
  
  This page allows instructors to create initial knowledge assessments
  for different subject areas.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import KnowledgeAssessmentBuilder from '$lib/components/instructor/KnowledgeAssessmentBuilder.svelte';
  import type { Assessment } from '$lib/types/database.js';

  function handleAssessmentCreated(assessment: Assessment) {
    // Navigate to assessment management page or show success
    goto(`/assessments/${assessment.id}`);
  }

  function handleCancel() {
    goto('/dashboard/instructor');
  }
</script>

<svelte:head>
  <title>Create Knowledge Assessment | Personalized LMS</title>
  <meta name="description" content="Create initial knowledge assessments to help students build personalized learning profiles." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Create Knowledge Assessment</h1>
      <p class="text-gray-600">
        Create initial knowledge assessments to help students identify their current skill levels 
        and build personalized learning profiles.
      </p>
    </div>

    <KnowledgeAssessmentBuilder 
      on:created={(event) => handleAssessmentCreated(event.detail)}
      on:cancel={handleCancel}
    />
  </div>
</div>