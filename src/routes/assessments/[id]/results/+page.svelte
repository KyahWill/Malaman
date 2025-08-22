<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Assessment, AssessmentAttempt } from '$lib/types/database.js';
  import { Button, Card, Loading, Badge } from '$lib/components/ui/index.js';
  import { toastHelpers } from '$lib/stores/toast.js';
  import { authStore } from '$lib/stores/auth.js';

  // State
  let assessment: Assessment | null = null;
  let attempts: AssessmentAttempt[] = [];
  let selectedAttempt: AssessmentAttempt | null = null;
  let loading = true;
  let error: string | null = null;

  // Get assessment ID from URL
  $: assessmentId = $page.params.id;
  $: bestAttempt = attempts.length > 0 
    ? attempts.reduce((best, current) => current.score > best.score ? current : best)
    : null;
  $: latestAttempt = attempts.length > 0 
    ? attempts[attempts.length - 1]
    : null;

  onMount(async () => {
    await loadAssessmentAndResults();
  });

  async function loadAssessmentAndResults() {
    try {
      loading = true;
      error = null;

      // Load assessment
      const assessmentResponse = await fetch(`/api/assessments/${assessmentId}`);
      if (!assessmentResponse.ok) {
        throw new Error('Failed to load assessment');
      }
      assessment = await assessmentResponse.json();

      // Load attempts
      const attemptsResponse = await fetch(`/api/assessments/${assessmentId}/attempts`);
      if (!attemptsResponse.ok) {
        throw new Error('Failed to load assessment attempts');
      }
      attempts = await attemptsResponse.json();

      // Select the latest attempt by default
      selectedAttempt = latestAttempt;

      if (attempts.length === 0) {
        error = 'No assessment attempts found. Please take the assessment first.';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load assessment results';
      toastHelpers.error(error);
    } finally {
      loading = false;
    }
  }

  function selectAttempt(attempt: AssessmentAttempt) {
    selectedAttempt = attempt;
  }

  function handleRetakeAssessment() {
    if (!assessment) return;
    
    // Check if max attempts reached
    if (assessment.max_attempts && attempts.length >= assessment.max_attempts) {
      toastHelpers.warning('Maximum Attempts Reached', 'You have reached the maximum number of attempts for this assessment.');
      return;
    }

    goto(`/assessments/${assessmentId}/take`);
  }

  function formatTime(seconds: number | null): string {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  function getScoreColor(score: number, passingScore: number): string {
    if (score >= passingScore) {
      if (score >= 90) return 'text-green-600';
      if (score >= 80) return 'text-blue-600';
      return 'text-green-600';
    }
    return 'text-red-600';
  }

  function getQuestionResult(questionId: string, attempt: AssessmentAttempt) {
    return attempt.answers.find(a => a.question_id === questionId);
  }
</script>

<svelte:head>
  <title>Assessment Results: {assessment?.title || 'Loading...'} - Personalized LMS</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
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
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Results</h3>
      <p class="text-gray-600 mb-4">{error}</p>
      <div class="space-x-2">
        <Button onclick={loadAssessmentAndResults} variant="primary">
          Try Again
        </Button>
        <Button onclick={() => goto('/assessments')} variant="outline">
          Back to Assessments
        </Button>
      </div>
    </Card>
  {:else if assessment && attempts.length > 0}
    <!-- Results Content -->
    <div class="mb-6">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <a href="/assessments" class="hover:text-blue-600">Assessments</a>
        <span>›</span>
        <a href="/assessments/{assessmentId}" class="hover:text-blue-600">{assessment.title}</a>
        <span>›</span>
        <span>Results</span>
      </div>

      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{assessment.title}</h1>
          <p class="text-gray-600 mt-1">Assessment Results</p>
        </div>

        <div class="flex space-x-2">
          {#if !bestAttempt?.passed && (!assessment.max_attempts || attempts.length < assessment.max_attempts)}
            <Button onclick={handleRetakeAssessment} variant="primary">
              Retake Assessment
            </Button>
          {/if}
          <Button onclick={() => goto(`/assessments/${assessmentId}`)} variant="outline">
            Back to Assessment
          </Button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Best Score -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Best Score</p>
            <p class="text-3xl font-bold {getScoreColor(bestAttempt?.score || 0, assessment.minimum_passing_score)}">
              {bestAttempt?.score || 0}%
            </p>
          </div>
          <div class="text-right">
            {#if bestAttempt?.passed}
              <Badge variant="success">Passed</Badge>
            {:else}
              <Badge variant="error">Not Passed</Badge>
            {/if}
          </div>
        </div>
      </Card>

      <!-- Attempts -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Attempts</p>
            <p class="text-3xl font-bold text-gray-900">
              {attempts.length}
              {#if assessment.max_attempts}
                <span class="text-lg text-gray-600">/ {assessment.max_attempts}</span>
              {/if}
            </p>
          </div>
        </div>
      </Card>

      <!-- Status -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Status</p>
            <p class="text-lg font-semibold text-gray-900">
              {#if bestAttempt?.passed}
                <span class="text-green-600">Completed</span>
              {:else if assessment.max_attempts && attempts.length >= assessment.max_attempts}
                <span class="text-red-600">Max Attempts Reached</span>
              {:else}
                <span class="text-orange-600">In Progress</span>
              {/if}
            </p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Attempt History -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Attempts List -->
      <div class="lg:col-span-1">
        <Card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Attempt History</h3>
          <div class="space-y-3">
            {#each attempts.reverse() as attempt, index}
              <button
                onclick={() => selectAttempt(attempt)}
                class="w-full text-left p-3 rounded-lg border transition-colors"
                class:bg-blue-50={selectedAttempt?.id === attempt.id}
                class:border-blue-200={selectedAttempt?.id === attempt.id}
                class:hover:bg-gray-50={selectedAttempt?.id !== attempt.id}
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="font-medium text-gray-900">
                    Attempt {attempt.attempt_number}
                  </span>
                  <span class="text-sm {getScoreColor(attempt.score, assessment.minimum_passing_score)}">
                    {attempt.score}%
                  </span>
                </div>
                <div class="text-sm text-gray-600">
                  {formatDate(attempt.submitted_at)}
                </div>
                <div class="flex items-center space-x-2 mt-1">
                  {#if attempt.passed}
                    <Badge variant="success" size="sm">Passed</Badge>
                  {:else}
                    <Badge variant="error" size="sm">Failed</Badge>
                  {/if}
                  {#if attempt === bestAttempt}
                    <Badge variant="info" size="sm">Best</Badge>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </Card>
      </div>

      <!-- Selected Attempt Details -->
      <div class="lg:col-span-2">
        {#if selectedAttempt}
          <Card class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-semibold text-gray-900">
                Attempt {selectedAttempt.attempt_number} Details
              </h3>
              <div class="text-right">
                <div class="text-2xl font-bold {getScoreColor(selectedAttempt.score, assessment.minimum_passing_score)}">
                  {selectedAttempt.score}%
                </div>
                <div class="text-sm text-gray-600">
                  {selectedAttempt.points_earned} / {selectedAttempt.total_points} points
                </div>
              </div>
            </div>

            <!-- Attempt Info -->
            <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <span class="text-sm font-medium text-gray-600">Submitted:</span>
                <div class="text-sm text-gray-900">{formatDate(selectedAttempt.submitted_at)}</div>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">Time Spent:</span>
                <div class="text-sm text-gray-900">{formatTime(selectedAttempt.time_spent)}</div>
              </div>
            </div>

            <!-- Feedback -->
            {#if selectedAttempt.feedback}
              <div class="mb-6">
                <h4 class="text-md font-semibold text-gray-900 mb-3">Feedback</h4>
                <div class="space-y-4">
                  <div class="p-4 bg-blue-50 rounded-lg">
                    <p class="text-gray-800">{selectedAttempt.feedback.overall_feedback}</p>
                  </div>

                  {#if selectedAttempt.feedback.strengths.length > 0}
                    <div>
                      <h5 class="font-medium text-green-800 mb-2">Strengths</h5>
                      <ul class="list-disc list-inside space-y-1">
                        {#each selectedAttempt.feedback.strengths as strength}
                          <li class="text-sm text-green-700">{strength}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}

                  {#if selectedAttempt.feedback.areas_for_improvement.length > 0}
                    <div>
                      <h5 class="font-medium text-orange-800 mb-2">Areas for Improvement</h5>
                      <ul class="list-disc list-inside space-y-1">
                        {#each selectedAttempt.feedback.areas_for_improvement as area}
                          <li class="text-sm text-orange-700">{area}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}

                  {#if selectedAttempt.feedback.recommended_resources.length > 0}
                    <div>
                      <h5 class="font-medium text-blue-800 mb-2">Recommended Resources</h5>
                      <ul class="list-disc list-inside space-y-1">
                        {#each selectedAttempt.feedback.recommended_resources as resource}
                          <li class="text-sm text-blue-700">{resource}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}

                  <div class="p-3 bg-gray-100 rounded-lg">
                    <h5 class="font-medium text-gray-800 mb-1">Next Steps</h5>
                    <p class="text-sm text-gray-700">{selectedAttempt.feedback.next_steps}</p>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Question Results -->
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-3">Question Results</h4>
              <div class="space-y-4">
                {#each assessment.questions as question, index}
                  {@const result = getQuestionResult(question.id, selectedAttempt)}
                  <div class="border rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                      <span class="text-sm font-medium text-gray-600">
                        Question {index + 1}
                      </span>
                      <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-600">
                          {result?.points_earned || 0} / {question.points} points
                        </span>
                        {#if result?.is_correct}
                          <Badge variant="success" size="sm">Correct</Badge>
                        {:else}
                          <Badge variant="error" size="sm">Incorrect</Badge>
                        {/if}
                      </div>
                    </div>
                    
                    <p class="text-gray-900 mb-3">{question.question_text}</p>
                    
                    <div class="space-y-2">
                      <div>
                        <span class="text-sm font-medium text-gray-600">Your Answer:</span>
                        <div class="text-sm text-gray-900 mt-1">
                          {#if Array.isArray(result?.student_answer)}
                            {result.student_answer.join(', ')}
                          {:else}
                            {result?.student_answer || 'No answer provided'}
                          {/if}
                        </div>
                      </div>
                      
                      {#if !result?.is_correct}
                        <div>
                          <span class="text-sm font-medium text-green-600">Correct Answer:</span>
                          <div class="text-sm text-green-700 mt-1">
                            {#if Array.isArray(question.correct_answer)}
                              {question.correct_answer.join(', ')}
                            {:else}
                              {question.correct_answer}
                            {/if}
                          </div>
                        </div>
                      {/if}
                      
                      {#if question.explanation}
                        <div>
                          <span class="text-sm font-medium text-blue-600">Explanation:</span>
                          <div class="text-sm text-blue-700 mt-1">{question.explanation}</div>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </Card>
        {/if}
      </div>
    </div>
  {/if}
</div>