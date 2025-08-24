<!--
  Progress Visualization Component
  
  Displays interactive charts and visualizations for student learning progress,
  including daily activity, weekly trends, and skill development.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import { StudentAnalyticsService, type ProgressVisualization } from '$lib/services/studentAnalytics.js';

  // Props
  export let studentId: string;

  // State
  let visualization: ProgressVisualization | null = null;
  let loading = true;
  let error: string | null = null;
  let activeTab: 'activity' | 'trends' | 'subjects' | 'skills' = 'activity';

  // Load visualization data on mount
  onMount(async () => {
    await loadVisualization();
  });

  async function loadVisualization() {
    try {
      loading = true;
      error = null;
      visualization = await StudentAnalyticsService.getProgressVisualization(studentId);
    } catch (err: any) {
      error = err.message;
      console.error('Error loading progress visualization:', err);
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

  function getActivityIntensity(timeSpent: number): string {
    if (timeSpent >= 120) return 'bg-green-500';
    if (timeSpent >= 60) return 'bg-green-400';
    if (timeSpent >= 30) return 'bg-green-300';
    if (timeSpent >= 15) return 'bg-green-200';
    if (timeSpent > 0) return 'bg-green-100';
    return 'bg-gray-100';
  }

  function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  }

  function getDifficultyColor(difficulty: 'beginner' | 'intermediate' | 'advanced'): 'success' | 'warning' | 'error' {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
    }
  }
</script>

{#if loading}
  <div class="flex items-center justify-center p-8">
    <Loading />
    <span class="ml-2 text-gray-600">Loading progress visualization...</span>
  </div>
{:else if error}
  <Card class="border-red-200 bg-red-50">
    <div class="flex items-center space-x-3">
      <div class="text-red-500">⚠️</div>
      <div>
        <h3 class="font-medium text-red-800">Failed to Load Visualization</h3>
        <p class="text-sm text-red-600">{error}</p>
        <button 
          class="mt-2 text-sm text-red-700 underline hover:text-red-800"
          on:click={loadVisualization}
        >
          Try Again
        </button>
      </div>
    </div>
  </Card>
{:else if visualization}
  <div class="space-y-6">
    <!-- Tab Navigation -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
          class:border-blue-500={activeTab === 'activity'}
          class:text-blue-600={activeTab === 'activity'}
          class:border-transparent={activeTab !== 'activity'}
          class:text-gray-500={activeTab !== 'activity'}
          on:click={() => activeTab = 'activity'}
        >
          Daily Activity
        </button>
        <button
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
          class:border-blue-500={activeTab === 'trends'}
          class:text-blue-600={activeTab === 'trends'}
          class:border-transparent={activeTab !== 'trends'}
          class:text-gray-500={activeTab !== 'trends'}
          on:click={() => activeTab = 'trends'}
        >
          Weekly Trends
        </button>
        <button
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
          class:border-blue-500={activeTab === 'subjects'}
          class:text-blue-600={activeTab === 'subjects'}
          class:border-transparent={activeTab !== 'subjects'}
          class:text-gray-500={activeTab !== 'subjects'}
          on:click={() => activeTab = 'subjects'}
        >
          Subject Progress
        </button>
        <button
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
          class:border-blue-500={activeTab === 'skills'}
          class:text-blue-600={activeTab === 'skills'}
          class:border-transparent={activeTab !== 'skills'}
          class:text-gray-500={activeTab !== 'skills'}
          on:click={() => activeTab = 'skills'}
        >
          Skill Development
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    {#if activeTab === 'activity'}
      <Card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Daily Learning Activity</h3>
        <p class="text-sm text-gray-600 mb-6">Your learning activity over the past 30 days</p>
        
        <!-- Activity Heatmap -->
        <div class="grid grid-cols-7 gap-1 mb-4">
          {#each visualization.dailyActivity.slice(-28) as day, index}
            <div 
              class="w-8 h-8 rounded {getActivityIntensity(day.timeSpent)} border border-gray-200 flex items-center justify-center text-xs font-medium"
              title="{day.date}: {formatTime(day.timeSpent)}, {day.lessonsCompleted} lessons"
            >
              {new Date(day.date).getDate()}
            </div>
          {/each}
        </div>

        <!-- Legend -->
        <div class="flex items-center justify-between text-xs text-gray-500 mb-6">
          <span>Less</span>
          <div class="flex space-x-1">
            <div class="w-3 h-3 bg-gray-100 rounded"></div>
            <div class="w-3 h-3 bg-green-100 rounded"></div>
            <div class="w-3 h-3 bg-green-200 rounded"></div>
            <div class="w-3 h-3 bg-green-300 rounded"></div>
            <div class="w-3 h-3 bg-green-400 rounded"></div>
            <div class="w-3 h-3 bg-green-500 rounded"></div>
          </div>
          <span>More</span>
        </div>

        <!-- Recent Activity Summary -->
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">
              {visualization.dailyActivity.slice(-7).reduce((sum, day) => sum + day.timeSpent, 0)}m
            </div>
            <div class="text-sm text-gray-500">This Week</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">
              {visualization.dailyActivity.slice(-7).reduce((sum, day) => sum + day.lessonsCompleted, 0)}
            </div>
            <div class="text-sm text-gray-500">Lessons</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">
              {visualization.dailyActivity.slice(-7).reduce((sum, day) => sum + day.assessmentsTaken, 0)}
            </div>
            <div class="text-sm text-gray-500">Assessments</div>
          </div>
        </div>
      </Card>

    {:else if activeTab === 'trends'}
      <Card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Weekly Learning Trends</h3>
        <p class="text-sm text-gray-600 mb-6">Your progress over the past 4 weeks</p>
        
        <div class="space-y-4">
          {#each visualization.weeklyProgress as week}
            <div class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium text-gray-900">{week.week}</h4>
                <Badge variant="primary" size="sm">{formatTime(week.timeSpent)}</Badge>
              </div>
              
              <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div class="text-gray-500">Lessons</div>
                  <div class="font-semibold">{week.lessonsCompleted}</div>
                </div>
                <div>
                  <div class="text-gray-500">Assessments</div>
                  <div class="font-semibold">{week.assessmentsPassed}</div>
                </div>
                <div>
                  <div class="text-gray-500">Avg Score</div>
                  <div class="font-semibold">{week.averageScore}%</div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Monthly Trends -->
        <div class="mt-6">
          <h4 class="font-medium text-gray-900 mb-3">Monthly Insights</h4>
          <div class="space-y-2">
            {#each visualization.monthlyTrends as trend}
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-2">
                  <span class="text-lg">{getTrendIcon(trend.trend)}</span>
                  <span class="font-medium">{trend.metric}</span>
                </div>
                <div class="text-right">
                  <div class="font-semibold">{trend.value}</div>
                  <div class="text-sm text-gray-500">
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </Card>

    {:else if activeTab === 'subjects'}
      <Card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Subject Progress</h3>
        <p class="text-sm text-gray-600 mb-6">Your progress across different subjects</p>
        
        <div class="space-y-4">
          {#each visualization.subjectProgress as subject}
            <div class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <h4 class="font-medium text-gray-900">{subject.subject}</h4>
                  <Badge variant={getDifficultyColor(subject.difficulty)} size="sm">
                    {subject.difficulty}
                  </Badge>
                </div>
                <div class="text-sm text-gray-500">
                  {formatTime(subject.timeSpent)}
                </div>
              </div>
              
              <ProgressBar 
                value={subject.progress} 
                variant="primary"
                size="md"
                showLabel={true}
                class="mb-2"
              />
              
              <div class="text-sm text-gray-600">
                <strong>Next:</strong> {subject.nextMilestone}
              </div>
            </div>
          {/each}
        </div>
      </Card>

    {:else if activeTab === 'skills'}
      <Card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Skill Development</h3>
        <p class="text-sm text-gray-600 mb-6">Track your skill progression and improvements</p>
        
        <div class="space-y-4">
          {#each visualization.skillDevelopment as skill}
            <div class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium text-gray-900">{skill.skill}</h4>
                <div class="flex items-center space-x-2">
                  {#if skill.recentImprovement > 0}
                    <Badge variant="success" size="sm">+{skill.recentImprovement}%</Badge>
                  {/if}
                  <span class="text-sm text-gray-500">
                    Level {skill.currentLevel}/{skill.targetLevel}
                  </span>
                </div>
              </div>
              
              <!-- Current Level Indicator -->
              <div class="flex items-center space-x-2 mb-2">
                {#each Array(10) as _, i}
                  <div 
                    class="w-3 h-3 rounded-full {i < skill.currentLevel ? 'bg-blue-500' : i < skill.targetLevel ? 'bg-gray-300' : 'bg-gray-100'}"
                    title="Level {i + 1}"
                  ></div>
                {/each}
              </div>
              
              <!-- Progress to Target -->
              <ProgressBar 
                value={skill.progress} 
                variant="primary"
                size="sm"
                label="Progress to target level"
                showLabel={true}
                class="mb-2"
              />
              
              <div class="text-xs text-gray-500">
                {skill.targetLevel - skill.currentLevel} levels to target
              </div>
            </div>
          {/each}
        </div>
      </Card>
    {/if}
  </div>
{/if}