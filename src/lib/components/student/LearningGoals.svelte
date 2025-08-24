<!--
  Learning Goals Component
  
  Displays and manages student learning goals with progress tracking,
  goal setting, and motivational elements.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import { StudentAnalyticsService, type LearningGoals } from '$lib/services/studentAnalytics.js';

  // Props
  export let studentId: string;

  // State
  let goals: LearningGoals | null = null;
  let loading = true;
  let error: string | null = null;
  let showGoalSettings = false;
  let editingGoals = {
    daily: 60,
    weekly: 5,
    monthly: 2
  };

  // Load goals on mount
  onMount(async () => {
    await loadGoals();
  });

  async function loadGoals() {
    try {
      loading = true;
      error = null;
      goals = await StudentAnalyticsService.getLearningGoals(studentId);
    } catch (err: any) {
      error = err.message;
      console.error('Error loading learning goals:', err);
    } finally {
      loading = false;
    }
  }

  function getGoalStatus(progress: number): { color: string; message: string; emoji: string } {
    if (progress >= 100) {
      return { color: 'text-green-600', message: 'Goal achieved!', emoji: '🎉' };
    } else if (progress >= 80) {
      return { color: 'text-blue-600', message: 'Almost there!', emoji: '🚀' };
    } else if (progress >= 50) {
      return { color: 'text-yellow-600', message: 'Good progress', emoji: '💪' };
    } else if (progress >= 25) {
      return { color: 'text-orange-600', message: 'Keep going', emoji: '🌱' };
    } else {
      return { color: 'text-gray-600', message: 'Just getting started', emoji: '🎯' };
    }
  }

  function getStreakMessage(streak: number): { message: string; emoji: string; color: string } {
    if (streak >= 30) {
      return { message: 'Incredible dedication!', emoji: '🏆', color: 'text-purple-600' };
    } else if (streak >= 14) {
      return { message: 'On fire!', emoji: '🔥', color: 'text-red-600' };
    } else if (streak >= 7) {
      return { message: 'Great consistency!', emoji: '⚡', color: 'text-blue-600' };
    } else if (streak >= 3) {
      return { message: 'Building momentum!', emoji: '💪', color: 'text-green-600' };
    } else {
      return { message: 'Start your streak!', emoji: '🌱', color: 'text-gray-600' };
    }
  }

  function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  async function saveGoals() {
    try {
      // In a real implementation, this would save to the database
      console.log('Saving goals:', editingGoals);
      showGoalSettings = false;
      // Reload goals to reflect changes
      await loadGoals();
    } catch (err) {
      console.error('Error saving goals:', err);
    }
  }

  function openGoalSettings() {
    if (goals) {
      editingGoals = {
        daily: goals.daily.target,
        weekly: goals.weekly.target,
        monthly: goals.monthly.target
      };
    }
    showGoalSettings = true;
  }
</script>

{#if loading}
  <div class="flex items-center justify-center p-8">
    <Loading />
    <span class="ml-2 text-gray-600">Loading learning goals...</span>
  </div>
{:else if error}
  <Card class="border-red-200 bg-red-50">
    <div class="flex items-center space-x-3">
      <div class="text-red-500">⚠️</div>
      <div>
        <h3 class="font-medium text-red-800">Failed to Load Goals</h3>
        <p class="text-sm text-red-600">{error}</p>
        <button 
          class="mt-2 text-sm text-red-700 underline hover:text-red-800"
          on:click={loadGoals}
        >
          Try Again
        </button>
      </div>
    </div>
  </Card>
{:else if goals}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900">Learning Goals</h2>
      <Button variant="outline" size="sm" onclick={openGoalSettings}>
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        Settings
      </Button>
    </div>

    <!-- Daily Goal -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-blue-100 rounded-lg">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Daily Learning Goal</h3>
            <p class="text-sm text-gray-600">Study time target for today</p>
          </div>
        </div>
        {@const dailyStatus = getGoalStatus((goals.daily.current / goals.daily.target) * 100)}
        <div class="text-right">
          <div class="text-2xl">{dailyStatus.emoji}</div>
          <div class="text-sm {dailyStatus.color} font-medium">{dailyStatus.message}</div>
        </div>
      </div>

      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">
            {formatTime(goals.daily.current)} / {formatTime(goals.daily.target)}
          </span>
          <span class="text-sm text-gray-500">
            {Math.round((goals.daily.current / goals.daily.target) * 100)}%
          </span>
        </div>
        <ProgressBar 
          value={goals.daily.current} 
          max={goals.daily.target}
          variant={goals.daily.current >= goals.daily.target ? 'success' : 'primary'}
          size="lg"
          showLabel={false}
        />
      </div>

      <!-- Streak Information -->
      {@const streakInfo = getStreakMessage(goals.daily.streak)}
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center space-x-2">
          <span class="text-xl">{streakInfo.emoji}</span>
          <div>
            <div class="font-medium text-gray-900">{goals.daily.streak} day streak</div>
            <div class="text-sm {streakInfo.color}">{streakInfo.message}</div>
          </div>
        </div>
        {#if goals.daily.current >= goals.daily.target}
          <Badge variant="success" size="sm">Today's goal achieved!</Badge>
        {:else}
          <Badge variant="primary" size="sm">
            {formatTime(goals.daily.target - goals.daily.current)} to go
          </Badge>
        {/if}
      </div>
    </Card>

    <!-- Weekly Goal -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-green-100 rounded-lg">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Weekly Learning Goal</h3>
            <p class="text-sm text-gray-600">Lessons to complete this week</p>
          </div>
        </div>
        {@const weeklyStatus = getGoalStatus(goals.weekly.progress)}
        <div class="text-right">
          <div class="text-2xl">{weeklyStatus.emoji}</div>
          <div class="text-sm {weeklyStatus.color} font-medium">{weeklyStatus.message}</div>
        </div>
      </div>

      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">
            {goals.weekly.current} / {goals.weekly.target} lessons
          </span>
          <span class="text-sm text-gray-500">
            {Math.round(goals.weekly.progress)}%
          </span>
        </div>
        <ProgressBar 
          value={goals.weekly.progress} 
          variant={goals.weekly.progress >= 100 ? 'success' : 'primary'}
          size="lg"
          showLabel={false}
        />
      </div>

      <div class="text-sm text-gray-600">
        {#if goals.weekly.progress >= 100}
          🎉 Weekly goal completed! Excellent work this week.
        {:else}
          {goals.weekly.target - goals.weekly.current} more lessons to reach your weekly goal.
        {/if}
      </div>
    </Card>

    <!-- Monthly Goal -->
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-purple-100 rounded-lg">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Monthly Learning Goal</h3>
            <p class="text-sm text-gray-600">Courses to complete this month</p>
          </div>
        </div>
        {@const monthlyStatus = getGoalStatus(goals.monthly.progress)}
        <div class="text-right">
          <div class="text-2xl">{monthlyStatus.emoji}</div>
          <div class="text-sm {monthlyStatus.color} font-medium">{monthlyStatus.message}</div>
        </div>
      </div>

      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">
            {goals.monthly.current} / {goals.monthly.target} courses
          </span>
          <span class="text-sm text-gray-500">
            {Math.round(goals.monthly.progress)}%
          </span>
        </div>
        <ProgressBar 
          value={goals.monthly.progress} 
          variant={goals.monthly.progress >= 100 ? 'success' : 'primary'}
          size="lg"
          showLabel={false}
        />
      </div>

      <div class="text-sm text-gray-600">
        {#if goals.monthly.progress >= 100}
          🏆 Monthly goal achieved! Outstanding dedication this month.
        {:else}
          {goals.monthly.target - goals.monthly.current} more courses to reach your monthly goal.
        {/if}
      </div>
    </Card>

    <!-- Motivational Section -->
    <Card class="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div class="text-center">
        <div class="text-4xl mb-3">🌟</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Keep Up the Great Work!</h3>
        <p class="text-gray-600 mb-4">
          Consistency is key to learning success. Every minute of study brings you closer to your goals.
        </p>
        <div class="flex justify-center space-x-4 text-sm">
          <div class="text-center">
            <div class="font-semibold text-blue-600">{goals.daily.streak}</div>
            <div class="text-gray-500">Day Streak</div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-green-600">{goals.weekly.current}</div>
            <div class="text-gray-500">This Week</div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-purple-600">{goals.monthly.current}</div>
            <div class="text-gray-500">This Month</div>
          </div>
        </div>
      </div>
    </Card>
  </div>
{/if}

<!-- Goal Settings Modal -->
<Modal bind:show={showGoalSettings} title="Learning Goal Settings">
  <div class="space-y-6">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Daily study time goal (minutes)
      </label>
      <input 
        type="number" 
        bind:value={editingGoals.daily}
        min="15"
        max="480"
        step="15"
        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <p class="text-xs text-gray-500 mt-1">Recommended: 30-120 minutes per day</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Weekly lessons goal
      </label>
      <input 
        type="number" 
        bind:value={editingGoals.weekly}
        min="1"
        max="20"
        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <p class="text-xs text-gray-500 mt-1">Recommended: 3-7 lessons per week</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Monthly courses goal
      </label>
      <input 
        type="number" 
        bind:value={editingGoals.monthly}
        min="1"
        max="10"
        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <p class="text-xs text-gray-500 mt-1">Recommended: 1-3 courses per month</p>
    </div>

    <div class="bg-blue-50 p-4 rounded-lg">
      <h4 class="font-medium text-blue-900 mb-2">💡 Goal Setting Tips</h4>
      <ul class="text-sm text-blue-800 space-y-1">
        <li>• Set realistic goals that challenge but don't overwhelm you</li>
        <li>• Start small and gradually increase your targets</li>
        <li>• Consistency is more important than intensity</li>
        <li>• Adjust goals based on your schedule and commitments</li>
      </ul>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-3">
    <Button variant="outline" onclick={() => showGoalSettings = false}>
      Cancel
    </Button>
    <Button variant="primary" onclick={saveGoals}>
      Save Goals
    </Button>
  </div>
</Modal>