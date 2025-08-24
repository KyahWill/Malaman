<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import PersonalizedRoadmap from '$lib/components/student/PersonalizedRoadmap.svelte';
  import RoadmapSettings from '$lib/components/student/RoadmapSettings.svelte';
  import { Button, Card } from '$lib/components/ui/index.js';
  import { Map, Settings, BookOpen } from 'lucide-svelte';

  let currentView: 'roadmap' | 'settings' = 'roadmap';
  let studentId = '';

  onMount(() => {
    // Get student ID from session or page data
    studentId = $page.data.session?.user?.id || '';
  });
</script>

<svelte:head>
  <title>My Learning Roadmap - Personalized LMS</title>
  <meta name="description" content="View your personalized learning roadmap and customize your learning preferences" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Navigation Tabs -->
    <div class="mb-8">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                   {currentView === 'roadmap' 
                     ? 'border-blue-500 text-blue-600' 
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
            on:click={() => currentView = 'roadmap'}
          >
            <Map class="h-4 w-4 inline mr-2" />
            My Roadmap
          </button>
          <button
            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                   {currentView === 'settings' 
                     ? 'border-blue-500 text-blue-600' 
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
            on:click={() => currentView = 'settings'}
          >
            <Settings class="h-4 w-4 inline mr-2" />
            Preferences
          </button>
        </nav>
      </div>
    </div>

    <!-- Content -->
    {#if currentView === 'roadmap'}
      <PersonalizedRoadmap {studentId} />
    {:else if currentView === 'settings'}
      <RoadmapSettings {studentId} />
    {/if}
  </div>
</div>