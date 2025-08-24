<!--
  Interactive Roadmap Component
  
  Displays an interactive visualization of the student's personalized learning roadmap
  with progress tracking, milestones, and navigation capabilities.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';

  // Props
  export let studentId: string;
  export let showControls: boolean = true;

  // State
  let roadmapData: any = null;
  let loading = true;
  let error: string | null = null;
  let selectedPath: 'main' | 'alternative' = 'main';
  let viewMode: 'timeline' | 'tree' | 'list' = 'timeline';

  // Mock roadmap data (in real implementation, this would come from the roadmap service)
  const mockRoadmapData = {
    id: 'roadmap-1',
    student_id: studentId,
    generated_at: new Date().toISOString(),
    status: 'active',
    ai_reasoning: 'Based on your knowledge profile and learning preferences, this roadmap focuses on building foundational concepts before advancing to complex topics.',
    roadmap_data: {
      learning_path: [
        {
          content_id: 'lesson-1',
          content_type: 'lesson',
          title: 'Introduction to Programming',
          order_index: 0,
          estimated_time: 45,
          prerequisites: [],
          learning_objectives: ['Understand basic programming concepts', 'Learn syntax fundamentals'],
          personalization_notes: 'Starting with visual examples based on your learning style',
          is_unlocked: true,
          completion_status: 'completed',
          difficulty: 'beginner',
          course_title: 'Programming Fundamentals'
        },
        {
          content_id: 'assessment-1',
          content_type: 'assessment',
          title: 'Programming Basics Quiz',
          order_index: 1,
          estimated_time: 20,
          prerequisites: ['lesson-1'],
          learning_objectives: ['Validate understanding of basic concepts'],
          personalization_notes: 'Multiple choice format to build confidence',
          is_unlocked: true,
          completion_status: 'completed',
          difficulty: 'beginner',
          score: 85
        },
        {
          content_id: 'lesson-2',
          content_type: 'lesson',
          title: 'Variables and Data Types',
          order_index: 2,
          estimated_time: 60,
          prerequisites: ['assessment-1'],
          learning_objectives: ['Master variable declaration', 'Understand data types'],
          personalization_notes: 'Interactive examples to reinforce learning',
          is_unlocked: true,
          completion_status: 'in_progress',
          difficulty: 'beginner',
          course_title: 'Programming Fundamentals'
        },
        {
          content_id: 'lesson-3',
          content_type: 'lesson',
          title: 'Control Structures',
          order_index: 3,
          estimated_time: 75,
          prerequisites: ['lesson-2'],
          learning_objectives: ['Learn if/else statements', 'Understand loops'],
          personalization_notes: 'Step-by-step approach based on your preference',
          is_unlocked: false,
          completion_status: 'not_started',
          difficulty: 'intermediate',
          course_title: 'Programming Fundamentals'
        },
        {
          content_id: 'assessment-2',
          content_type: 'assessment',
          title: 'Control Structures Assessment',
          order_index: 4,
          estimated_time: 30,
          prerequisites: ['lesson-3'],
          learning_objectives: ['Apply control structure concepts'],
          personalization_notes: 'Practical coding exercises',
          is_unlocked: false,
          completion_status: 'not_started',
          difficulty: 'intermediate'
        },
        {
          content_id: 'lesson-4',
          content_type: 'lesson',
          title: 'Functions and Methods',
          order_index: 5,
          estimated_time: 90,
          prerequisites: ['assessment-2'],
          learning_objectives: ['Create reusable functions', 'Understand parameters'],
          personalization_notes: 'Building complexity gradually',
          is_unlocked: false,
          completion_status: 'not_started',
          difficulty: 'intermediate',
          course_title: 'Programming Fundamentals'
        }
      ],
      estimated_completion_time: 320,
      difficulty_progression: {
        start: 'beginner',
        end: 'intermediate',
        milestones: [
          { content_id: 'assessment-1', difficulty_level: 'beginner', skills_acquired: ['Basic syntax'] },
          { content_id: 'assessment-2', difficulty_level: 'intermediate', skills_acquired: ['Control flow'] }
        ]
      },
      personalization_factors: {
        knowledge_gaps: ['Functions', 'Object-oriented concepts'],
        learning_preferences: { preferred_pace: 'medium', learning_style: 'visual' },
        performance_patterns: [],
        engagement_metrics: { completion_rate: 75 }
      }
    }
  };

  onMount(async () => {
    await loadRoadmap();
  });

  async function loadRoadmap() {
    try {
      loading = true;
      error = null;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      roadmapData = mockRoadmapData;
    } catch (err: any) {
      error = err.message;
      console.error('Error loading roadmap:', err);
    } finally {
      loading = false;
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'not_started': return '⭕';
      default: return '❓';
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'not_started': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  }

  function getDifficultyColor(difficulty: string): 'success' | 'warning' | 'error' {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'success';
    }
  }

  function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function handleItemClick(item: any) {
    if (!item.is_unlocked) return;
    
    if (item.content_type === 'lesson') {
      goto(`/lessons/${item.content_id}`);
    } else if (item.content_type === 'assessment') {
      goto(`/assessments/${item.content_id}`);
    }
  }

  function calculateOverallProgress(): number {
    if (!roadmapData?.roadmap_data?.learning_path) return 0;
    
    const items = roadmapData.roadmap_data.learning_path;
    const completed = items.filter((item: any) => item.completion_status === 'completed').length;
    return Math.round((completed / items.length) * 100);
  }

  function getNextItem() {
    if (!roadmapData?.roadmap_data?.learning_path) return null;
    
    return roadmapData.roadmap_data.learning_path.find((item: any) => 
      item.is_unlocked && item.completion_status !== 'completed'
    );
  }
</script>

{#if loading}
  <div class="flex items-center justify-center p-8">
    <Loading />
    <span class="ml-2 text-gray-600">Loading your learning roadmap...</span>
  </div>
{:else if error}
  <Card class="border-red-200 bg-red-50">
    <div class="flex items-center space-x-3">
      <div class="text-red-500">⚠️</div>
      <div>
        <h3 class="font-medium text-red-800">Failed to Load Roadmap</h3>
        <p class="text-sm text-red-600">{error}</p>
        <button 
          class="mt-2 text-sm text-red-700 underline hover:text-red-800"
          on:click={loadRoadmap}
        >
          Try Again
        </button>
      </div>
    </div>
  </Card>
{:else if roadmapData}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Your Learning Roadmap</h2>
        <p class="text-sm text-gray-600 mt-1">
          Personalized path based on your knowledge profile and goals
        </p>
      </div>
      {#if showControls}
        <div class="flex items-center space-x-2">
          <select 
            bind:value={viewMode}
            class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="timeline">Timeline View</option>
            <option value="list">List View</option>
            <option value="tree">Tree View</option>
          </select>
        </div>
      {/if}
    </div>

    <!-- Progress Overview -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Overall Progress</h3>
        <Badge variant="primary" size="sm">{calculateOverallProgress()}% Complete</Badge>
      </div>
      
      <ProgressBar 
        value={calculateOverallProgress()} 
        variant="primary"
        size="lg"
        showLabel={false}
        class="mb-4"
      />
      
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div class="text-center">
          <div class="font-semibold text-green-600">
            {roadmapData.roadmap_data.learning_path.filter((item: any) => item.completion_status === 'completed').length}
          </div>
          <div class="text-gray-500">Completed</div>
        </div>
        <div class="text-center">
          <div class="font-semibold text-blue-600">
            {roadmapData.roadmap_data.learning_path.filter((item: any) => item.completion_status === 'in_progress').length}
          </div>
          <div class="text-gray-500">In Progress</div>
        </div>
        <div class="text-center">
          <div class="font-semibold text-gray-600">
            {formatTime(roadmapData.roadmap_data.estimated_completion_time)}
          </div>
          <div class="text-gray-500">Est. Time</div>
        </div>
      </div>
    </Card>

    <!-- Next Up -->
    {@const nextItem = getNextItem()}
    {#if nextItem}
      <Card class="p-6 border-blue-200 bg-blue-50">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-blue-900">Continue Learning</h3>
            <p class="text-blue-700 mt-1">{nextItem.title}</p>
            <p class="text-sm text-blue-600 mt-2">
              {nextItem.personalization_notes}
            </p>
          </div>
          <Button 
            variant="primary"
            onclick={() => handleItemClick(nextItem)}
          >
            {nextItem.completion_status === 'in_progress' ? 'Continue' : 'Start'}
          </Button>
        </div>
      </Card>
    {/if}

    <!-- AI Reasoning -->
    <Card class="p-6 bg-purple-50 border-purple-200">
      <div class="flex items-start space-x-3">
        <div class="text-2xl">🤖</div>
        <div>
          <h3 class="font-semibold text-purple-900 mb-2">AI Personalization</h3>
          <p class="text-sm text-purple-800">
            {roadmapData.ai_reasoning}
          </p>
        </div>
      </div>
    </Card>

    <!-- Learning Path -->
    <Card class="p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Learning Path</h3>
      
      {#if viewMode === 'timeline'}
        <!-- Timeline View -->
        <div class="relative">
          <!-- Timeline line -->
          <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div class="space-y-6">
            {#each roadmapData.roadmap_data.learning_path as item, index}
              <div class="relative flex items-start space-x-4">
                <!-- Timeline dot -->
                <div class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 {
                  item.completion_status === 'completed' ? 'bg-green-100 border-green-500' :
                  item.completion_status === 'in_progress' ? 'bg-blue-100 border-blue-500' :
                  item.is_unlocked ? 'bg-gray-100 border-gray-400' : 'bg-gray-50 border-gray-300'
                }">
                  <span class="text-2xl">{getStatusIcon(item.completion_status)}</span>
                </div>

                <!-- Content -->
                <div class="flex-grow min-w-0">
                  <div 
                    class="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md {
                      item.is_unlocked ? 'bg-white border-gray-200 hover:border-blue-300' : 'bg-gray-50 border-gray-200'
                    }"
                    class:opacity-50={!item.is_unlocked}
                    on:click={() => handleItemClick(item)}
                    role="button"
                    tabindex="0"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-grow">
                        <div class="flex items-center space-x-2 mb-1">
                          <h4 class="font-medium text-gray-900 {item.is_unlocked ? '' : 'text-gray-500'}">
                            {item.title}
                          </h4>
                          <Badge variant={getDifficultyColor(item.difficulty)} size="sm">
                            {item.difficulty}
                          </Badge>
                          {#if item.content_type === 'assessment' && item.score}
                            <Badge variant="success" size="sm">{item.score}%</Badge>
                          {/if}
                        </div>
                        
                        {#if item.course_title}
                          <p class="text-sm text-gray-600 mb-2">{item.course_title}</p>
                        {/if}
                        
                        <p class="text-sm text-gray-600 mb-2">
                          {item.personalization_notes}
                        </p>
                        
                        <div class="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatTime(item.estimated_time)}</span>
                          <span>• {item.content_type}</span>
                          {#if !item.is_unlocked}
                            <span>• 🔒 Locked</span>
                          {/if}
                        </div>
                      </div>
                    </div>

                    <!-- Learning Objectives -->
                    {#if item.learning_objectives.length > 0}
                      <div class="mt-3">
                        <p class="text-xs font-medium text-gray-700 mb-1">Learning Objectives:</p>
                        <ul class="text-xs text-gray-600 space-y-1">
                          {#each item.learning_objectives as objective}
                            <li>• {objective}</li>
                          {/each}
                        </ul>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

      {:else if viewMode === 'list'}
        <!-- List View -->
        <div class="space-y-3">
          {#each roadmapData.roadmap_data.learning_path as item, index}
            <div 
              class="flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md {
                item.is_unlocked ? 'bg-white border-gray-200 hover:border-blue-300' : 'bg-gray-50 border-gray-200'
              }"
              class:opacity-50={!item.is_unlocked}
              on:click={() => handleItemClick(item)}
              role="button"
              tabindex="0"
            >
              <div class="flex-shrink-0 text-2xl">
                {getStatusIcon(item.completion_status)}
              </div>
              
              <div class="flex-grow min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <h4 class="font-medium text-gray-900 {item.is_unlocked ? '' : 'text-gray-500'}">
                    {index + 1}. {item.title}
                  </h4>
                  <Badge variant={getDifficultyColor(item.difficulty)} size="sm">
                    {item.difficulty}
                  </Badge>
                </div>
                <p class="text-sm text-gray-600">
                  {formatTime(item.estimated_time)} • {item.content_type}
                </p>
              </div>

              {#if item.content_type === 'assessment' && item.score}
                <Badge variant="success" size="sm">{item.score}%</Badge>
              {/if}
            </div>
          {/each}
        </div>

      {:else}
        <!-- Tree View (simplified) -->
        <div class="space-y-4">
          {#each roadmapData.roadmap_data.difficulty_progression.milestones as milestone, index}
            <div class="border rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-2">
                Milestone {index + 1}: {milestone.difficulty_level}
              </h4>
              <div class="space-y-2">
                {#each roadmapData.roadmap_data.learning_path.filter(item => item.difficulty === milestone.difficulty_level) as item}
                  <div class="flex items-center space-x-2 text-sm">
                    <span class="text-lg">{getStatusIcon(item.completion_status)}</span>
                    <span class={item.is_unlocked ? 'text-gray-900' : 'text-gray-500'}>
                      {item.title}
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  </div>
{/if}