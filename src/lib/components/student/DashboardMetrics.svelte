<!--
  Dashboard Metrics Component
  
  Displays comprehensive learning metrics and progress indicators
  for the student dashboard with visual progress tracking.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import { StudentAnalyticsService, type DashboardMetrics } from '$lib/services/studentAnalytics.js';

  // Props
  export let studentId: string;

  // State
  let metrics: DashboardMetrics | null = null;
  let loading = true;
  let error: string | null = null;

  // Load metrics on mount
  onMount(async () => {
    await loadMetrics();
  });

  async function loadMetrics() {
    try {
      loading = true;
      error = null;
      metrics = await StudentAnalyticsService.getDashboardMetrics(studentId);
    } catch (err: any) {
      error = err.message;
      console.error('Error loading dashboard metrics:', err);
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function getProgressColor(percentage: number): 'success' | 'warning' | 'primary' {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'primary';
    return 'warning';
  }

  function getStreakEmoji(streak: number): string {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '💪';
    return '🌱';
  }
</script>

{#if loading}
  <div class="flex items-center justify-center p-8">
    <Loading />
    <span class="ml-2 text-gray-600">Loading metrics...</span>
  </div>
{:else if error}
  <Card class="border-red-200 bg-red-50">
    <div class="flex items-center space-x-3">
      <div class="text-red-500">⚠️</div>
      <div>
        <h3 class="font-medium text-red-800">Failed to Load Metrics</h3>
        <p class="text-sm text-red-600">{error}</p>
        <button 
          class="mt-2 text-sm text-red-700 underline hover:text-red-800"
          on:click={loadMetrics}
        >
          Try Again
        </button>
      </div>
    </div>
  </Card>
{:else if metrics}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Overall Progress -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <div class="p-2 bg-blue-100 rounded-lg">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <h3 class="text-sm font-medium text-gray-700">Overall Progress</h3>
        </div>
        <Badge variant={getProgressColor(metrics.overallProgress)} size="sm">
          {metrics.overallProgress}%
        </Badge>
      </div>
      <ProgressBar 
        value={metrics.overallProgress} 
        variant={getProgressColor(metrics.overallProgress)}
        size="lg"
        showLabel={false}
        class="mb-2"
      />
      <p class="text-xs text-gray-500">
        {metrics.activeCourses} active • {metrics.completedCourses} completed
      </p>
    </Card>

    <!-- Learning Time -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <div class="p-2 bg-green-100 rounded-lg">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-sm font-medium text-gray-700">Time Spent</h3>
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {formatTime(metrics.totalTimeSpent)}
      </div>
      <p class="text-xs text-gray-500">Total learning time</p>
    </Card>

    <!-- Assessment Performance -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <div class="p-2 bg-purple-100 rounded-lg">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-sm font-medium text-gray-700">Assessments</h3>
        </div>
        <Badge variant={metrics.averageScore >= 80 ? 'success' : metrics.averageScore >= 70 ? 'primary' : 'warning'} size="sm">
          {metrics.averageScore}%
        </Badge>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {metrics.assessmentsPassed}/{metrics.totalAssessments}
      </div>
      <p class="text-xs text-gray-500">Passed assessments</p>
    </Card>

    <!-- Learning Streak -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <div class="p-2 bg-orange-100 rounded-lg">
            <div class="text-xl">{getStreakEmoji(metrics.currentStreak)}</div>
          </div>
          <h3 class="text-sm font-medium text-gray-700">Current Streak</h3>
        </div>
      </div>
      <div class="text-2xl font-bold text-gray-900 mb-1">
        {metrics.currentStreak} days
      </div>
      <p class="text-xs text-gray-500">
        Best: {metrics.longestStreak} days
      </p>
    </Card>
  </div>

  <!-- Goals Progress -->
  <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Weekly Goal -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Weekly Goal</h3>
        <Badge variant={metrics.weeklyGoalProgress >= 100 ? 'success' : 'primary'} size="sm">
          {metrics.weeklyGoalProgress}%
        </Badge>
      </div>
      <ProgressBar 
        value={metrics.weeklyGoalProgress} 
        variant={metrics.weeklyGoalProgress >= 100 ? 'success' : 'primary'}
        size="md"
        showLabel={false}
        class="mb-3"
      />
      <p class="text-sm text-gray-600">
        {#if metrics.weeklyGoalProgress >= 100}
          🎉 Goal achieved! Great work this week.
        {:else}
          Keep going! You're making great progress.
        {/if}
      </p>
    </Card>

    <!-- Monthly Goal -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Monthly Goal</h3>
        <Badge variant={metrics.monthlyGoalProgress >= 100 ? 'success' : 'primary'} size="sm">
          {metrics.monthlyGoalProgress}%
        </Badge>
      </div>
      <ProgressBar 
        value={metrics.monthlyGoalProgress} 
        variant={metrics.monthlyGoalProgress >= 100 ? 'success' : 'primary'}
        size="md"
        showLabel={false}
        class="mb-3"
      />
      <p class="text-sm text-gray-600">
        {#if metrics.monthlyGoalProgress >= 100}
          🏆 Monthly goal completed! Excellent dedication.
        {:else}
          You're on track for a successful month!
        {/if}
      </p>
    </Card>
  </div>
{/if}