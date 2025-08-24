<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PersonalizedRoadmap, LearningPathItem } from '$lib/services/roadmapService.js';
  import { Button, Card, ProgressBar, Badge, Modal } from '$lib/components/ui/index.js';
  import { CheckCircle, Clock, Lock, AlertCircle, BookOpen, Target, TrendingUp } from 'lucide-svelte';

  export let studentId: string;
  
  let roadmap: PersonalizedRoadmap | null = null;
  let loading = true;
  let error = '';
  let showReasoningModal = false;
  let selectedItem: LearningPathItem | null = null;
  let showItemModal = false;

  onMount(async () => {
    await loadRoadmap();
  });

  async function loadRoadmap() {
    try {
      loading = true;
      error = '';
      
      const response = await fetch(`/api/roadmap/${studentId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load roadmap');
      }
      
      roadmap = result.roadmap;
    } catch (err) {
      console.error('Failed to load roadmap:', err);
      error = err instanceof Error ? err.message : 'Failed to load roadmap';
    } finally {
      loading = false;
    }
  }

  async function generateNewRoadmap() {
    try {
      loading = true;
      error = '';
      
      const response = await fetch(`/api/roadmap/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId,
          forceRegenerate: true 
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate roadmap');
      }
      
      roadmap = result.roadmap;
    } catch (err) {
      console.error('Failed to generate roadmap:', err);
      error = err instanceof Error ? err.message : 'Failed to generate roadmap';
    } finally {
      loading = false;
    }
  }

  function getStatusIcon(item: LearningPathItem) {
    switch (item.completion_status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'failed':
        return AlertCircle;
      default:
        return item.is_unlocked ? BookOpen : Lock;
    }
  }

  function getStatusColor(item: LearningPathItem) {
    switch (item.completion_status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return item.is_unlocked ? 'text-gray-600' : 'text-gray-400';
    }
  }

  function getDifficultyColor(level: string) {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  function calculateProgress(): number {
    if (!roadmap?.roadmap_data.learning_path) return 0;
    
    const completed = roadmap.roadmap_data.learning_path.filter(
      item => item.completion_status === 'completed'
    ).length;
    
    return Math.round((completed / roadmap.roadmap_data.learning_path.length) * 100);
  }

  function handleItemClick(item: LearningPathItem) {
    if (!item.is_unlocked) return;
    
    selectedItem = item;
    showItemModal = true;
  }

  function navigateToContent(item: LearningPathItem) {
    if (!item.is_unlocked) return;
    
    switch (item.content_type) {
      case 'course':
        goto(`/courses/${item.content_id}`);
        break;
      case 'lesson':
        goto(`/lessons/${item.content_id}`);
        break;
      case 'assessment':
        goto(`/assessments/${item.content_id}`);
        break;
    }
  }
</script>

<div class="space-y-6">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading your personalized roadmap...</span>
    </div>
  {:else if error}
    <Card class="p-6 border-red-200 bg-red-50">
      <div class="flex items-center space-x-3">
        <AlertCircle class="h-5 w-5 text-red-600" />
        <div>
          <h3 class="text-sm font-medium text-red-800">Error Loading Roadmap</h3>
          <p class="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
      <div class="mt-4">
        <Button variant="outline" size="sm" on:click={loadRoadmap}>
          Try Again
        </Button>
      </div>
    </Card>
  {:else if !roadmap}
    <Card class="p-8 text-center">
      <BookOpen class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Roadmap Found</h3>
      <p class="text-gray-600 mb-6">
        Let's create a personalized learning roadmap tailored to your knowledge and goals.
      </p>
      <Button on:click={generateNewRoadmap}>
        Generate My Roadmap
      </Button>
    </Card>
  {:else}
    <!-- Roadmap Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold mb-2">Your Learning Roadmap</h2>
          <p class="text-blue-100">
            Personalized path with {roadmap.roadmap_data.learning_path.length} learning steps
          </p>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold">{calculateProgress()}%</div>
          <div class="text-blue-100 text-sm">Complete</div>
        </div>
      </div>
      
      <div class="mt-4">
        <ProgressBar value={calculateProgress()} class="bg-blue-500" />
      </div>
      
      <div class="flex items-center justify-between mt-4">
        <div class="flex items-center space-x-4 text-sm">
          <div class="flex items-center space-x-1">
            <Clock class="h-4 w-4" />
            <span>{formatTime(roadmap.roadmap_data.total_estimated_time)} total</span>
          </div>
          <div class="flex items-center space-x-1">
            <Target class="h-4 w-4" />
            <span>{roadmap.roadmap_data.learning_path.length} steps</span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            class="text-white border-white hover:bg-white hover:text-blue-600"
            on:click={() => showReasoningModal = true}
          >
            Why This Path?
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            class="text-white border-white hover:bg-white hover:text-blue-600"
            on:click={generateNewRoadmap}
          >
            Regenerate
          </Button>
        </div>
      </div>
    </div>

    <!-- Learning Path -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <TrendingUp class="h-5 w-5 mr-2" />
        Your Learning Path
      </h3>
      
      <div class="relative">
        <!-- Progress Line -->
        <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {#each roadmap.roadmap_data.learning_path as item, index}
          <div class="relative flex items-start space-x-4 pb-6">
            <!-- Step Indicator -->
            <div class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 
                        {item.completion_status === 'completed' ? 'bg-green-100 border-green-500' :
                         item.completion_status === 'in_progress' ? 'bg-blue-100 border-blue-500' :
                         item.completion_status === 'failed' ? 'bg-red-100 border-red-500' :
                         item.is_unlocked ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}">
              <svelte:component 
                this={getStatusIcon(item)} 
                class="h-6 w-6 {getStatusColor(item)}" 
              />
            </div>
            
            <!-- Content Card -->
            <Card 
              class="flex-1 p-4 cursor-pointer transition-all hover:shadow-md
                     {item.is_unlocked ? 'hover:border-blue-300' : 'opacity-60 cursor-not-allowed'}"
              on:click={() => handleItemClick(item)}
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <h4 class="font-medium text-gray-900">{item.title}</h4>
                    <Badge class={getDifficultyColor(item.difficulty_level)}>
                      {item.difficulty_level}
                    </Badge>
                    <Badge variant="outline" class="text-xs">
                      {item.content_type}
                    </Badge>
                  </div>
                  
                  {#if item.learning_objectives.length > 0}
                    <div class="text-sm text-gray-600 mb-2">
                      <strong>Objectives:</strong> {item.learning_objectives.slice(0, 2).join(', ')}
                      {#if item.learning_objectives.length > 2}
                        <span class="text-gray-400">+{item.learning_objectives.length - 2} more</span>
                      {/if}
                    </div>
                  {/if}
                  
                  {#if item.personalization_notes}
                    <div class="text-sm text-blue-600 bg-blue-50 rounded p-2 mt-2">
                      <strong>Why this step:</strong> {item.personalization_notes}
                    </div>
                  {/if}
                </div>
                
                <div class="text-right text-sm text-gray-500 ml-4">
                  <div class="flex items-center space-x-1">
                    <Clock class="h-4 w-4" />
                    <span>{formatTime(item.estimated_time)}</span>
                  </div>
                  {#if !item.is_unlocked}
                    <div class="flex items-center space-x-1 mt-1 text-gray-400">
                      <Lock class="h-3 w-3" />
                      <span class="text-xs">Locked</span>
                    </div>
                  {/if}
                </div>
              </div>
              
              {#if item.prerequisites.length > 0}
                <div class="mt-3 pt-3 border-t border-gray-100">
                  <div class="text-xs text-gray-500">
                    <strong>Prerequisites:</strong> Complete previous steps
                  </div>
                </div>
              {/if}
            </Card>
          </div>
        {/each}
      </div>
    </div>

    <!-- Success Metrics -->
    {#if roadmap.roadmap_data.success_metrics.length > 0}
      <Card class="p-4">
        <h4 class="font-medium text-gray-900 mb-3">Success Metrics</h4>
        <ul class="space-y-2">
          {#each roadmap.roadmap_data.success_metrics as metric}
            <li class="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle class="h-4 w-4 text-green-500" />
              <span>{metric}</span>
            </li>
          {/each}
        </ul>
      </Card>
    {/if}
  {/if}
</div>

<!-- AI Reasoning Modal -->
<Modal bind:open={showReasoningModal} title="Why This Learning Path?">
  {#if roadmap}
    <div class="space-y-4">
      <div>
        <h4 class="font-medium text-gray-900 mb-2">Personalization Reasoning</h4>
        <p class="text-gray-700">{roadmap.roadmap_data.personalization_reasoning}</p>
      </div>
      
      {#if roadmap.roadmap_data.personalization_factors.knowledge_gaps.length > 0}
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Identified Knowledge Gaps</h4>
          <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
            {#each roadmap.roadmap_data.personalization_factors.knowledge_gaps as gap}
              <li>{gap}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      {#if roadmap.roadmap_data.personalization_factors.learning_preferences.length > 0}
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Considered Preferences</h4>
          <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
            {#each roadmap.roadmap_data.personalization_factors.learning_preferences as pref}
              <li>{pref}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      {#if roadmap.roadmap_data.alternative_paths.length > 0}
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Alternative Approaches</h4>
          <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
            {#each roadmap.roadmap_data.alternative_paths as path}
              <li>{path}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {/if}
</Modal>

<!-- Learning Item Details Modal -->
<Modal bind:open={showItemModal} title={selectedItem?.title || ''}>
  {#if selectedItem}
    <div class="space-y-4">
      <div class="flex items-center space-x-2">
        <Badge class={getDifficultyColor(selectedItem.difficulty_level)}>
          {selectedItem.difficulty_level}
        </Badge>
        <Badge variant="outline">
          {selectedItem.content_type}
        </Badge>
        <span class="text-sm text-gray-500">
          {formatTime(selectedItem.estimated_time)}
        </span>
      </div>
      
      {#if selectedItem.learning_objectives.length > 0}
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Learning Objectives</h4>
          <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
            {#each selectedItem.learning_objectives as objective}
              <li>{objective}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      {#if selectedItem.personalization_notes}
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Why This Step</h4>
          <p class="text-sm text-gray-700">{selectedItem.personalization_notes}</p>
        </div>
      {/if}
      
      {#if selectedItem.prerequisites.length > 0}
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Prerequisites</h4>
          <p class="text-sm text-gray-600">
            Complete the previous steps in your learning path before accessing this content.
          </p>
        </div>
      {/if}
      
      <div class="flex space-x-3 pt-4">
        {#if selectedItem.is_unlocked}
          <Button on:click={() => navigateToContent(selectedItem)}>
            Start Learning
          </Button>
        {:else}
          <Button disabled>
            <Lock class="h-4 w-4 mr-2" />
            Locked
          </Button>
        {/if}
        <Button variant="outline" on:click={() => showItemModal = false}>
          Close
        </Button>
      </div>
    </div>
  {/if}
</Modal>