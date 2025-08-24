<!--
  Recent Activity Component
  
  Displays student's recent learning activities including lessons completed,
  assessments taken, courses enrolled, and achievements earned.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import { StudentAnalyticsService, type RecentActivity } from '$lib/services/studentAnalytics.js';

  // Props
  export let studentId: string;
  export let limit: number = 10;
  export let showViewAll: boolean = true;

  // State
  let activities: RecentActivity[] = [];
  let loading = true;
  let error: string | null = null;

  // Load activities on mount
  onMount(async () => {
    await loadActivities();
  });

  async function loadActivities() {
    try {
      loading = true;
      error = null;
      activities = await StudentAnalyticsService.getRecentActivity(studentId, limit);
    } catch (err: any) {
      error = err.message;
      console.error('Error loading recent activity:', err);
    } finally {
      loading = false;
    }
  }

  function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return time.toLocaleDateString();
  }

  function getActivityTypeLabel(type: string): string {
    switch (type) {
      case 'lesson_completed': return 'Lesson Completed';
      case 'assessment_passed': return 'Assessment Passed';
      case 'assessment_failed': return 'Assessment Attempted';
      case 'course_enrolled': return 'Course Enrolled';
      case 'course_completed': return 'Course Completed';
      default: return 'Activity';
    }
  }

  function getActivityTypeColor(type: string): 'success' | 'primary' | 'warning' | 'info' | 'default' {
    switch (type) {
      case 'lesson_completed': return 'success';
      case 'assessment_passed': return 'success';
      case 'assessment_failed': return 'warning';
      case 'course_enrolled': return 'info';
      case 'course_completed': return 'primary';
      default: return 'default';
    }
  }

  function handleActivityClick(activity: RecentActivity) {
    // Navigate to relevant content based on activity type
    switch (activity.type) {
      case 'lesson_completed':
        // Navigate to lesson or course
        if (activity.data?.lessonId) {
          goto(`/lessons/${activity.data.lessonId}`);
        }
        break;
      case 'assessment_passed':
      case 'assessment_failed':
        // Navigate to assessment results
        if (activity.data?.assessmentId) {
          goto(`/assessments/${activity.data.assessmentId}/results`);
        }
        break;
      case 'course_enrolled':
      case 'course_completed':
        // Navigate to course
        if (activity.data?.courseId) {
          goto(`/courses/${activity.data.courseId}`);
        }
        break;
    }
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
    {#if showViewAll && activities.length > 0}
      <Button variant="outline" size="sm" onclick={() => goto('/dashboard/student?tab=activity')}>
        View All
      </Button>
    {/if}
  </div>

  <!-- Activity List -->
  {#if loading}
    <div class="flex items-center justify-center p-8">
      <Loading />
      <span class="ml-2 text-gray-600">Loading activity...</span>
    </div>
  {:else if error}
    <Card class="border-red-200 bg-red-50">
      <div class="flex items-center space-x-3">
        <div class="text-red-500">⚠️</div>
        <div>
          <h4 class="font-medium text-red-800">Failed to Load Activity</h4>
          <p class="text-sm text-red-600">{error}</p>
          <button 
            class="mt-2 text-sm text-red-700 underline hover:text-red-800"
            on:click={loadActivities}
          >
            Try Again
          </button>
        </div>
      </div>
    </Card>
  {:else if activities.length === 0}
    <Card class="p-8 text-center">
      <div class="text-4xl mb-4">📚</div>
      <h4 class="text-lg font-medium text-gray-900 mb-2">No activity yet</h4>
      <p class="text-gray-600 mb-4">
        Start learning to see your activity here. Your progress will be tracked automatically.
      </p>
      <Button variant="primary" onclick={() => goto('/courses')}>
        Browse Courses
      </Button>
    </Card>
  {:else}
    <div class="space-y-3">
      {#each activities as activity}
        <Card 
          class="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onclick={() => handleActivityClick(activity)}
        >
          <div class="flex items-start space-x-3">
            <!-- Activity Icon -->
            <div class="flex-shrink-0 text-2xl">
              {activity.icon}
            </div>

            <!-- Activity Content -->
            <div class="flex-grow min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex-grow">
                  <div class="flex items-center space-x-2 mb-1">
                    <h4 class="font-medium text-gray-900 truncate">
                      {activity.title}
                    </h4>
                    <Badge variant={getActivityTypeColor(activity.type)} size="sm">
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </div>
                  
                  <p class="text-sm text-gray-600 mb-2">
                    {activity.description}
                  </p>

                  <!-- Additional Info -->
                  <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                    {#if activity.courseTitle}
                      <span>• {activity.courseTitle}</span>
                    {/if}
                    {#if activity.score !== undefined}
                      <span>• Score: {activity.score}%</span>
                    {/if}
                  </div>
                </div>

                <!-- Score Badge (for assessments) -->
                {#if activity.score !== undefined}
                  <div class="flex-shrink-0 ml-4">
                    <Badge 
                      variant={activity.score >= 80 ? 'success' : activity.score >= 70 ? 'primary' : 'warning'} 
                      size="sm"
                    >
                      {activity.score}%
                    </Badge>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </Card>
      {/each}
    </div>

    <!-- Load More Button -->
    {#if activities.length >= limit}
      <div class="text-center">
        <Button 
          variant="outline" 
          onclick={() => { limit += 10; loadActivities(); }}
        >
          Load More Activities
        </Button>
      </div>
    {/if}
  {/if}

  <!-- Activity Summary -->
  {#if activities.length > 0}
    <Card class="p-4 bg-gray-50">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div class="text-lg font-semibold text-green-600">
            {activities.filter(a => a.type === 'lesson_completed').length}
          </div>
          <div class="text-xs text-gray-500">Lessons</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-blue-600">
            {activities.filter(a => a.type === 'assessment_passed').length}
          </div>
          <div class="text-xs text-gray-500">Assessments</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-purple-600">
            {activities.filter(a => a.type === 'course_completed').length}
          </div>
          <div class="text-xs text-gray-500">Courses</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-orange-600">
            {activities.filter(a => a.score && a.score >= 90).length}
          </div>
          <div class="text-xs text-gray-500">High Scores</div>
        </div>
      </div>
    </Card>
  {/if}
</div>