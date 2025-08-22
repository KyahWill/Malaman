<script lang="ts">
  import { onMount } from 'svelte';
  import type { Assessment, AssessmentAttempt, Question, AssessmentAnswer } from '$lib/types/database.js';
  import { Button, Card, Loading, Badge, Modal } from '$lib/components/ui/index.js';
  import { toastHelpers } from '$lib/stores/toast.js';

  // Props
  export let attemptId: string;
  export let onGradingComplete: (() => void) | null = null;

  // State
  let gradingData: any = null;
  let loading = true;
  let error: string | null = null;
  let saving = false;
  let grades: Record<string, { is_correct: boolean; points_earned: number; feedback: string }> = {};

  onMount(async () => {
    await loadGradingData();
  });

  async function loadGradingData() {
    try {
      loading = true;
      error = null;

      const response = await fetch(`/api/assessments/attempts/${attemptId}/grade`);
      if (!response.ok) {
        throw new Error('Failed to load grading data');
      }
      
      gradingData = await response.json();
      
      // Initialize grades for essay questions
      gradingData.essay_questions.forEach((item: any) => {
        if (item.answer) {
          grades[item.question.id] = {
            is_correct: item.answer.is_correct || false,
            points_earned: item.answer.points_earned || 0,
            feedback: item.answer.feedback || ''
          };
        } else {
          grades[item.question.id] = {
            is_correct: false,
            points_earned: 0,
            feedback: ''
          };
        }
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load grading data';
      toastHelpers.error(error);
    } finally {
      loading = false;
    }
  }

  async function saveGrades() {
    try {
      saving = true;
      
      const questionGrades = Object.entries(grades).map(([questionId, grade]) => ({
        question_id: questionId,
        ...grade
      }));

      const response = await fetch(`/api/assessments/attempts/${attemptId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_grades: questionGrades })
      });

      if (!response.ok) {
        throw new Error('Failed to save grades');
      }

      const result = await response.json();
      toastHelpers.success('Grades Saved', 'Assessment has been graded successfully.');
      
      if (onGradingComplete) {
        onGradingComplete();
      }
    } catch (err) {
      toastHelpers.error('Failed to save grades');
    } finally {
      saving = false;
    }
  }

  function updateGrade(questionId: string, field: keyof typeof grades[string], value: any) {
    grades[questionId] = {
      ...grades[questionId],
      [field]: value
    };
  }

  function setQuickGrade(questionId: string, points: number, maxPoints: number) {
    const isCorrect = points === maxPoints;
    grades[questionId] = {
      ...grades[questionId],
      is_correct: isCorrect,
      points_earned: points
    };
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  $: totalPossiblePoints = gradingData?.essay_questions.reduce((sum: number, item: any) => sum + item.question.points, 0) || 0;
  $: totalEarnedPoints = Object.values(grades).reduce((sum, grade) => sum + grade.points_earned, 0);
  $: hasUngradedQuestions = gradingData?.essay_questions.some((item: any) => 
    grades[item.question.id]?.points_earned === 0 && !grades[item.question.id]?.is_correct
  ) || false;
</script>

<div class="space-y-6">
  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center py-12">
      <Loading size="lg" />
    </div>
  {:else if error}
    <!-- Error State -->
    <Card class="p-8 text-center">
      <div class="text-red-600 mb-4">
        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Grading Data</h3>
      <p class="text-gray-600 mb-4">{error}</p>
      <Button onclick={loadGradingData} variant="primary">Try Again</Button>
    </Card>
  {:else if gradingData}
    <!-- Grading Interface -->
    
    <!-- Header -->
    <Card class="p-6">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h2 class="text-xl font-bold text-gray-900">{gradingData.assessment_title}</h2>
          <p class="text-gray-600">Manual Grading Interface</p>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-600">Submitted: {formatDate(gradingData.submitted_at)}</div>
          <div class="text-sm text-gray-600">Student ID: {gradingData.student_id}</div>
        </div>
      </div>

      <!-- Grading Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <span class="text-sm font-medium text-gray-600">Essay Questions:</span>
          <div class="text-lg font-semibold text-gray-900">{gradingData.essay_questions.length}</div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-600">Points Available:</span>
          <div class="text-lg font-semibold text-gray-900">{totalPossiblePoints}</div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-600">Points Awarded:</span>
          <div class="text-lg font-semibold text-blue-600">{totalEarnedPoints}</div>
        </div>
      </div>

      <!-- Current Score Display -->
      <div class="mt-4 p-3 bg-blue-50 rounded-lg">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-blue-800">Current Total Score:</span>
          <span class="text-lg font-bold text-blue-900">
            {gradingData.current_score}% → {Math.round(((gradingData.points_earned - gradingData.essay_questions.reduce((sum: number, item: any) => sum + (item.answer?.points_earned || 0), 0) + totalEarnedPoints) / gradingData.total_points) * 100)}%
          </span>
        </div>
        <div class="text-xs text-blue-700 mt-1">
          Updated score includes manual grading of essay questions
        </div>
      </div>
    </Card>

    <!-- Essay Questions -->
    <div class="space-y-6">
      {#each gradingData.essay_questions as item, index}
        {@const question = item.question}
        {@const answer = item.answer}
        {@const grade = grades[question.id]}
        
        <Card class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center space-x-3">
              <span class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                {index + 1}
              </span>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Essay Question {index + 1}</h3>
                <div class="flex items-center space-x-2 mt-1">
                  <Badge variant={item.needs_grading ? 'warning' : 'info'} size="sm">
                    {item.needs_grading ? 'Needs Grading' : 'Graded'}
                  </Badge>
                  <span class="text-sm text-gray-600">
                    {question.points} points available
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Quick Grade Buttons -->
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">Quick Grade:</span>
              <Button 
                onclick={() => setQuickGrade(question.id, 0, question.points)}
                variant="outline" 
                size="sm"
                class={grade.points_earned === 0 ? 'bg-red-50 border-red-200' : ''}
              >
                0
              </Button>
              <Button 
                onclick={() => setQuickGrade(question.id, Math.floor(question.points * 0.5), question.points)}
                variant="outline" 
                size="sm"
                class={grade.points_earned === Math.floor(question.points * 0.5) ? 'bg-yellow-50 border-yellow-200' : ''}
              >
                {Math.floor(question.points * 0.5)}
              </Button>
              <Button 
                onclick={() => setQuickGrade(question.id, question.points, question.points)}
                variant="outline" 
                size="sm"
                class={grade.points_earned === question.points ? 'bg-green-50 border-green-200' : ''}
              >
                {question.points}
              </Button>
            </div>
          </div>

          <!-- Question Text -->
          <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Question:</h4>
            <p class="text-gray-800">{question.question_text}</p>
            {#if question.topics.length > 0}
              <div class="mt-2">
                <span class="text-sm text-gray-600">Topics: </span>
                {#each question.topics as topic}
                  <Badge variant="info" size="sm" class="mr-1">{topic}</Badge>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Student Answer -->
          <div class="mb-4 p-4 border rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Student Answer:</h4>
            {#if answer?.student_answer}
              <div class="text-gray-800 whitespace-pre-wrap">{answer.student_answer}</div>
            {:else}
              <div class="text-gray-500 italic">No answer provided</div>
            {/if}
          </div>

          <!-- Grading Controls -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Points and Correctness -->
            <div class="space-y-4">
              <div>
                <label for="points-{question.id}" class="block text-sm font-medium text-gray-700 mb-2">
                  Points Earned (0 - {question.points})
                </label>
                <input
                  id="points-{question.id}"
                  type="number"
                  min="0"
                  max={question.points}
                  bind:value={grade.points_earned}
                  onchange={() => updateGrade(question.id, 'is_correct', grade.points_earned === question.points)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="correct-{question.id}"
                  bind:checked={grade.is_correct}
                  onchange={() => updateGrade(question.id, 'points_earned', grade.is_correct ? question.points : 0)}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="correct-{question.id}" class="ml-2 text-sm text-gray-700">
                  Mark as completely correct
                </label>
              </div>
            </div>

            <!-- Feedback -->
            <div>
              <label for="feedback-{question.id}" class="block text-sm font-medium text-gray-700 mb-2">
                Feedback for Student
              </label>
              <textarea
                id="feedback-{question.id}"
                bind:value={grade.feedback}
                placeholder="Provide specific feedback on the student's answer..."
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>

          <!-- Model Answer (if available) -->
          {#if question.explanation}
            <div class="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 class="font-medium text-blue-900 mb-2">Model Answer / Explanation:</h4>
              <p class="text-blue-800">{question.explanation}</p>
            </div>
          {/if}
        </Card>
      {/each}
    </div>

    <!-- Save Button -->
    <div class="flex justify-between items-center">
      <div class="text-sm text-gray-600">
        {#if hasUngradedQuestions}
          <span class="text-orange-600">⚠️ Some questions still need grading</span>
        {:else}
          <span class="text-green-600">✓ All questions have been graded</span>
        {/if}
      </div>
      
      <Button 
        onclick={saveGrades}
        variant="primary"
        disabled={saving}
        class="min-w-32"
      >
        {saving ? 'Saving...' : 'Save Grades'}
      </Button>
    </div>
  {/if}
</div>