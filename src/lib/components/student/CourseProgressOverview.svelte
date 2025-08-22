<!--
  Course Progress Overview Component
  
  Displays comprehensive progress information for a course including
  lessons, assessments, and overall completion status.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ProgressionClient, ProgressionUtils } from '$lib/services/progressionClient.js';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';

  // Props
  export let courseId: string;
  export let showActions: boolean = true;

  // State
  let progressOverview: any = null;
  let loading = true;
  let error: string | null = null;

  // Load progress overview on mount
  onMount(async () => {
    await loadProgressOverview();
  });

  async function loadProgressOverview() {
    try {
      loading = true;
      error = null;
      progressOverview = await ProgressionClient.getCourseProgressOverview(courseId);
    } catch (err: any) {
      error = err.message;
      console.error('Error loading progress overview:', err);
    } finally {
      loading = false;
    }
  }

  function navigateToContent(contentId: string, contentType: 'lesson' | 'assessment') {
    if (contentType === 'lesson') {
      window.location.href = `/lessons/${contentId}`;
    } else {
      window.location.href = `/assessments/${contentId}`;
    }
  }

  function getNextAction() {
    if (!progressOverview) return null;
    return ProgressionUtils.getNextAvailableContent(progressOverview);
  }

  $: nextAction = getNextAction();
</script>

{#if loading}
  <div class="flex items-center justify-center p-8">
    <Loading />
    <span class="ml-2 text-gray-600">Loading progress overview...</span>
  </div>
{:else if error}
  <Card class="border-red-200 bg-red-50">
    <div class="flex items-center space-x-3">
      <div class="text-red-500">⚠️</div>
      <div>
        <h3 class="font-medium text-red-800">Failed to Load Progress</h3>
        <p class="text-sm text-red-600">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          class="mt-2"
          on:click={loadProgressOverview}
        >
          Retry
        </Button>
      </div>
    </div>
  </Card>
{:else if progressOverview}
  <div class="space-y-6">
    <!-- Overall Progress -->
    <Card>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Course Progress</h3>
          <span class="text-2xl font-bold text-blue-600">
            {progressOverview.overallProgress}%
          </span>
        </div>
        
        <ProgressBar 
          value={progressOverview.overallProgress} 
          max={100}
          class="h-3"
        />
        
        <div class="flex justify-between text-sm text-gray-600">
          <span>{progressOverview.completedLessons} of {progressOverview.totalLessons} lessons completed</span>
          {#if progressOverview.isCompleted}
            <span class="text-green-600 font-medium">✓ Course Completed</span>
          {/if}
        </div>
      </div>
    </Card>

    <!-- Next Action -->
    {#if nextAction && nextAction.id && showActions}
      <Card class="border-blue-200 bg-blue-50">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-blue-800">Continue Learning</h4>
            <p class="text-sm text-blue-600">
              Next: {nextAction.title}
            </p>
          </div>
          <Button 
            variant="primary"
            on:click={() => navigateToContent(nextAction.id, nextAction.type)}
          >
            {nextAction.type === 'lesson' ? 'Start Lesson' : 'Take Assessment'}
          </Button>
        </div>
      </Card>
    {/if}

    <!-- Lessons Progress -->
    <Card>
      <div class="space-y-4">
        <h4 class="font-medium">Lessons</h4>
        <div class="space-y-3">
          {#each progressOverview.lessons as lessonData, index}
            {@const lesson = lessonData.lesson}
            {@const progress = lessonData.progress}
            {@const canAccess = lessonData.canAccess}
            {@const assessment = lessonData.assessment}
            
            <div class="flex items-center space-x-4 p-3 border rounded-lg {canAccess ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}">
              <!-- Lesson Number -->
              <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium {
                progress?.status === 'completed' ? 'bg-green-100 text-green-800' :
                progress?.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                progress?.status === 'blocked' ? 'bg-red-100 text-red-800' :
                canAccess ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'
              }">
                {canAccess ? index + 1 : '🔒'}
              </div>

              <!-- Lesson Info -->
              <div class="flex-grow">
                <div class="flex items-center space-x-2">
                  <h5 class="font-medium {canAccess ? 'text-gray-900' : 'text-gray-500'}">
                    {lesson.title}
                  </h5>
                  <span class="text-sm {ProgressionUtils.getProgressStatusColor(progress?.status || 'not_started')}">
                    {ProgressionUtils.getProgressStatusIcon(progress?.status || 'not_started')}
                  </span>
                </div>
                
                {#if lesson.description}
                  <p class="text-sm text-gray-600 mt-1">{lesson.description}</p>
                {/if}

                {#if !canAccess && lessonData.blockedBy}
                  <p class="text-xs text-red-600 mt-1">
                    Blocked by: {lessonData.blockedBy.title}
                  </p>
                {/if}

                <!-- Assessment Status -->
                {#if assessment}
                  <div class="mt-2 flex items-center space-x-2 text-sm">
                    <span class="text-gray-500">Assessment:</span>
                    {#if assessment.passed}
                      <span class="text-green-600">✓ Passed ({assessment.progress?.best_score || 0}%)</span>
                    {:else if assessment.progress}
                      <span class="text-yellow-600">⏳ In Progress</span>
                    {:else if assessment.canAccess}
                      <span class="text-blue-600">📝 Available</span>
                    {:else}
                      <span class="text-gray-400">🔒 Locked</span>
                    {/if}
                  </div>
                {/if}
              </div>

              <!-- Actions -->
              {#if showActions && canAccess}
                <div class="flex-shrink-0">
                  {#if progress?.status === 'completed'}
                    <Button 
                      variant="outline" 
                      size="sm"
                      on:click={() => navigateToContent(lesson.id, 'lesson')}
                    >
                      Review
                    </Button>
                  {:else}
                    <Button 
                      variant="primary" 
                      size="sm"
                      on:click={() => navigateToContent(lesson.id, 'lesson')}
                    >
                      {progress?.status === 'in_progress' ? 'Continue' : 'Start'}
                    </Button>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </Card>

    <!-- Final Assessment -->
    {#if progressOverview.finalAssessment}
      <Card>
        <div class="space-y-4">
          <h4 class="font-medium">Final Assessment</h4>
          <div class="flex items-center justify-between p-3 border rounded-lg {
            progressOverview.finalAssessment.canAccess ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
          }">
            <div>
              <div class="flex items-center space-x-2">
                <h5 class="font-medium {progressOverview.finalAssessment.canAccess ? 'text-gray-900' : 'text-gray-500'}">
                  Course Final Assessment
                </h5>
                {#if progressOverview.finalAssessment.passed}
                  <span class="text-green-600">✓</span>
                {:else if !progressOverview.finalAssessment.canAccess}
                  <span class="text-gray-400">🔒</span>
                {/if}
              </div>
              
              {#if progressOverview.finalAssessment.passed}
                <p class="text-sm text-green-600 mt-1">
                  Completed with {progressOverview.finalAssessment.progress?.best_score || 0}%
                </p>
              {:else if !progressOverview.finalAssessment.canAccess}
                <p class="text-sm text-gray-500 mt-1">
                  Complete all lessons to unlock
                </p>
              {:else}
                <p class="text-sm text-blue-600 mt-1">
                  Ready to take final assessment
                </p>
              {/if}
            </div>

            {#if showActions && progressOverview.finalAssessment.canAccess}
              <Button 
                variant={progressOverview.finalAssessment.passed ? 'outline' : 'primary'}
                size="sm"
                on:click={() => navigateToContent(progressOverview.finalAssessment.id, 'assessment')}
              >
                {progressOverview.finalAssessment.passed ? 'Review Results' : 'Take Assessment'}
              </Button>
            {/if}
          </div>
        </div>
      </Card>
    {/if}
  </div>
{/if}