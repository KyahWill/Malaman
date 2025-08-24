<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Badge, Loading, Modal } from '$lib/components/ui';
  
  interface StudentPattern {
    student_id: string;
    student_name: string;
    patterns: any[];
    last_updated: string;
    needs_attention: boolean;
  }

  interface AdaptiveAdjustment {
    id: string;
    student_id: string;
    student_name: string;
    trigger_event: string;
    adjustment_type: string;
    reasoning: string;
    applied_at: string;
    effectiveness_score?: number;
  }

  export let courseId: string;

  let loading = false;
  let error: string | null = null;
  let studentPatterns: StudentPattern[] = [];
  let recentAdjustments: AdaptiveAdjustment[] = [];
  let selectedStudent: StudentPattern | null = null;
  let showStudentModal = false;
  let activeTab: 'patterns' | 'adjustments' = 'patterns';

  onMount(() => {
    loadStudentPatterns();
    loadRecentAdjustments();
  });

  async function loadStudentPatterns() {
    loading = true;
    error = null;

    try {
      // Get enrolled students for this course
      const studentsResponse = await fetch(`/api/courses/${courseId}/students`);
      if (!studentsResponse.ok) {
        throw new Error('Failed to load students');
      }
      const studentsData = await studentsResponse.json();
      const students = studentsData.students || [];

      // Load patterns for each student
      const patternsPromises = students.map(async (student: any) => {
        try {
          const response = await fetch(`/api/adaptive/assessment-failure?studentId=${student.id}`);
          if (response.ok) {
            const data = await response.json();
            return {
              student_id: student.id,
              student_name: `${student.first_name} ${student.last_name}`,
              patterns: data.learning_patterns || [],
              last_updated: new Date().toISOString(),
              needs_attention: (data.learning_patterns || []).some((p: any) => 
                p.pattern_type === 'struggle_area' && p.confidence_score > 0.7
              )
            };
          }
        } catch (err) {
          console.error(`Failed to load patterns for student ${student.id}:`, err);
        }
        
        return {
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          patterns: [],
          last_updated: new Date().toISOString(),
          needs_attention: false
        };
      });

      studentPatterns = await Promise.all(patternsPromises);
    } catch (err) {
      console.error('Error loading student patterns:', err);
      error = err instanceof Error ? err.message : 'Failed to load student patterns';
    } finally {
      loading = false;
    }
  }

  async function loadRecentAdjustments() {
    try {
      // This would typically load from a database table
      // For now, we'll simulate recent adjustments
      recentAdjustments = [
        {
          id: '1',
          student_id: 'student1',
          student_name: 'John Doe',
          trigger_event: 'assessment_failure',
          adjustment_type: 'add_remedial',
          reasoning: 'Student struggled with algebra concepts, added review materials',
          applied_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          effectiveness_score: 0.8
        },
        {
          id: '2',
          student_id: 'student2',
          student_name: 'Jane Smith',
          trigger_event: 'repeated_struggles',
          adjustment_type: 'alternative_path',
          reasoning: 'Multiple failed attempts, switched to visual learning approach',
          applied_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          effectiveness_score: 0.9
        }
      ];
    } catch (err) {
      console.error('Error loading recent adjustments:', err);
    }
  }

  async function triggerMonitoringForStudent(studentId: string) {
    try {
      const response = await fetch('/api/adaptive/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          triggerType: 'continuous_monitoring'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger monitoring');
      }

      // Reload patterns after monitoring
      await loadStudentPatterns();
    } catch (err) {
      console.error('Error triggering monitoring:', err);
      error = err instanceof Error ? err.message : 'Failed to trigger monitoring';
    }
  }

  async function generateAlternativePathsForStudent(studentId: string, strugglingTopics: string[]) {
    try {
      const response = await fetch('/api/adaptive/alternative-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          currentContentId: courseId, // Using course as current content
          strugglingTopics
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate alternative paths');
      }

      const data = await response.json();
      console.log('Generated alternative paths:', data);
      
      // You could show these paths in a modal or update the UI
      alert(`Generated ${data.paths_count} alternative learning paths for the student.`);
    } catch (err) {
      console.error('Error generating alternative paths:', err);
      error = err instanceof Error ? err.message : 'Failed to generate alternative paths';
    }
  }

  function openStudentModal(student: StudentPattern) {
    selectedStudent = student;
    showStudentModal = true;
  }

  function closeStudentModal() {
    selectedStudent = null;
    showStudentModal = false;
  }

  function getPatternIcon(patternType: string): string {
    switch (patternType) {
      case 'struggle_area': return '⚠️';
      case 'strength_area': return '💪';
      case 'learning_pace': return '⏱️';
      case 'content_preference': return '❤️';
      default: return '📊';
    }
  }

  function getPatternColor(patternType: string): string {
    switch (patternType) {
      case 'struggle_area': return 'warning';
      case 'strength_area': return 'success';
      case 'learning_pace': return 'info';
      case 'content_preference': return 'primary';
      default: return 'secondary';
    }
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Recently';
    }
  }

  function getEffectivenessColor(score?: number): string {
    if (!score) return 'secondary';
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'danger';
  }
</script>

<div class="adaptive-adjustment-manager">
  <Card>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold flex items-center gap-2">
        🧠 Adaptive Learning Management
      </h2>
      <Button 
        variant="outline" 
        on:click={loadStudentPatterns}
        disabled={loading}
      >
        {#if loading}
          <Loading size="sm" />
        {:else}
          🔄 Refresh
        {/if}
      </Button>
    </div>

    <!-- Tab Navigation -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      <button
        class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
        class:border-blue-500={activeTab === 'patterns'}
        class:text-blue-600={activeTab === 'patterns'}
        class:border-transparent={activeTab !== 'patterns'}
        class:text-gray-500={activeTab !== 'patterns'}
        on:click={() => activeTab = 'patterns'}
      >
        Student Patterns ({studentPatterns.length})
      </button>
      <button
        class="px-4 py-2 font-medium text-sm border-b-2 transition-colors ml-4"
        class:border-blue-500={activeTab === 'adjustments'}
        class:text-blue-600={activeTab === 'adjustments'}
        class:border-transparent={activeTab !== 'adjustments'}
        class:text-gray-500={activeTab !== 'adjustments'}
        on:click={() => activeTab = 'adjustments'}
      >
        Recent Adjustments ({recentAdjustments.length})
      </button>
    </div>

    {#if error}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p class="text-red-700 dark:text-red-300">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          class="mt-2" 
          on:click={() => { error = null; loadStudentPatterns(); }}
        >
          Try Again
        </Button>
      </div>
    {/if}

    <!-- Student Patterns Tab -->
    {#if activeTab === 'patterns'}
      {#if loading && studentPatterns.length === 0}
        <div class="flex items-center justify-center py-12">
          <Loading />
          <span class="ml-2">Loading student learning patterns...</span>
        </div>
      {:else if studentPatterns.length === 0}
        <div class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No student patterns available.</p>
          <p class="text-sm mt-1">Students need to complete assessments to generate learning patterns.</p>
        </div>
      {:else}
        <div class="grid gap-4">
          {#each studentPatterns as student}
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <h3 class="font-medium text-gray-900 dark:text-gray-100">
                    {student.student_name}
                  </h3>
                  {#if student.needs_attention}
                    <Badge variant="warning" size="sm">Needs Attention</Badge>
                  {/if}
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">
                    {student.patterns.length} pattern{student.patterns.length !== 1 ? 's' : ''}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    on:click={() => openStudentModal(student)}
                  >
                    View Details
                  </Button>
                </div>
              </div>

              {#if student.patterns.length > 0}
                <div class="flex flex-wrap gap-2 mb-3">
                  {#each student.patterns.slice(0, 3) as pattern}
                    <div class="flex items-center gap-1 text-sm">
                      <span>{getPatternIcon(pattern.pattern_type)}</span>
                      <Badge variant={getPatternColor(pattern.pattern_type)} size="sm">
                        {pattern.pattern_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  {/each}
                  {#if student.patterns.length > 3}
                    <Badge variant="secondary" size="sm">
                      +{student.patterns.length - 3} more
                    </Badge>
                  {/if}
                </div>
              {/if}

              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>Last updated: {formatTimeAgo(student.last_updated)}</span>
                <div class="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    on:click={() => triggerMonitoringForStudent(student.student_id)}
                  >
                    Update Patterns
                  </Button>
                  {#if student.patterns.some(p => p.pattern_type === 'struggle_area')}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      on:click={() => {
                        const strugglingTopics = student.patterns
                          .filter(p => p.pattern_type === 'struggle_area')
                          .map(p => p.pattern_data.topic)
                          .filter(Boolean);
                        generateAlternativePathsForStudent(student.student_id, strugglingTopics);
                      }}
                    >
                      Generate Alternatives
                    </Button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- Recent Adjustments Tab -->
    {#if activeTab === 'adjustments'}
      {#if recentAdjustments.length === 0}
        <div class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No recent adaptive adjustments.</p>
          <p class="text-sm mt-1">Adjustments will appear here when students struggle with assessments.</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each recentAdjustments as adjustment}
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {adjustment.student_name}
                  </h3>
                  <div class="flex items-center gap-2 mb-2">
                    <Badge variant="info" size="sm">
                      {adjustment.trigger_event.replace('_', ' ')}
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      {adjustment.adjustment_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                {#if adjustment.effectiveness_score}
                  <Badge variant={getEffectivenessColor(adjustment.effectiveness_score)} size="sm">
                    {Math.round(adjustment.effectiveness_score * 100)}% effective
                  </Badge>
                {/if}
              </div>

              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {adjustment.reasoning}
              </p>

              <div class="text-xs text-gray-500">
                Applied {formatTimeAgo(adjustment.applied_at)}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </Card>
</div>

<!-- Student Detail Modal -->
{#if showStudentModal && selectedStudent}
  <Modal bind:open={showStudentModal} title={`Learning Patterns - ${selectedStudent.student_name}`}>
    <div class="space-y-4">
      {#if selectedStudent.patterns.length === 0}
        <p class="text-gray-500 dark:text-gray-400">
          No learning patterns detected for this student yet.
        </p>
      {:else}
        {#each selectedStudent.patterns as pattern}
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-start gap-3 mb-3">
              <span class="text-xl">{getPatternIcon(pattern.pattern_type)}</span>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900 dark:text-gray-100">
                    {pattern.pattern_type.replace('_', ' ').toUpperCase()}
                  </h4>
                  <Badge variant={getPatternColor(pattern.pattern_type)} size="sm">
                    {Math.round(pattern.confidence_score * 100)}% confidence
                  </Badge>
                </div>
                
                {#if pattern.pattern_data.topic}
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Topic: {pattern.pattern_data.topic}
                  </p>
                {/if}
                
                {#if pattern.pattern_data.completion_time}
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Average time: {Math.round(pattern.pattern_data.completion_time / 60)} minutes
                  </p>
                {/if}
                
                {#if pattern.pattern_data.retry_count}
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Retry attempts: {pattern.pattern_data.retry_count}
                  </p>
                {/if}
                
                <p class="text-xs text-gray-500">
                  Detected: {new Date(pattern.detected_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <div slot="footer" class="flex justify-end gap-2">
      <Button variant="outline" on:click={closeStudentModal}>
        Close
      </Button>
      <Button 
        variant="primary" 
        on:click={() => triggerMonitoringForStudent(selectedStudent.student_id)}
      >
        Update Patterns
      </Button>
    </div>
  </Modal>
{/if}

<style>
  .adaptive-adjustment-manager {
    @apply w-full;
  }
</style>