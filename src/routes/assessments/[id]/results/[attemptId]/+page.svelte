<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Assessment, AssessmentAttempt } from '$lib/types/database.js';
  import { Button, Card, Loading, Badge } from '$lib/components/ui/index.js';
  import { toastHelpers } from '$lib/stores/toast.js';

  // State
  let assessment: Assessment | null = null;
  let attempt: AssessmentAttempt | null = null;
  let loading = true;
  let error: string | null = null;

  // Get IDs from URL
  $: assessmentId = $page.params.id;
  $: attemptId = $page.params.attemptId;

  onMount(async () => {
    await loadAttemptDetails();
  });

  async function loadAttemptDetails() {
    try {
      loading = true;
      error = null;

      // Load assessment
      const assessmentResponse = await fetch(`/api/assessments/${assessmentId}`);
      if (!assessmentResponse.ok) {
        throw new Error('Failed to load assessment');
      }
      assessment = await assessmentResponse.json();

      // Load specific attempt
      const attemptResponse = await fetch(`/api/assessments/attempts/${attemptId}`);
      if (!attemptResponse.ok) {
        throw new Error('Failed to load assessment attempt');
      }
      attempt = await attemptResponse.json();

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load attempt details';
      toastHelpers.error(error);
    } finally {
      loading = false;
    }
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

  function getQuestionResult(questionId: string) {
    return attempt?.answers.find(a => a.question_id === questionId);
  }

  function downloadCertificate() {
    // In a real implementation, this would generate and download a certificate
    toastHelpers.info('Certificate Download', 'Certificate generation feature coming soon!');
  }
</script>

<svelte:head>
  <title>Assessment Result - {assessment?.title || 'Loading...'} - Personalized LMS</title>
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
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Result</h3>
      <p class="text-gray-600 mb-4">{error}</p>
      <div class="space-x-2">
        <Button onclick={loadAttemptDetails} variant="primary">
          Try Again
        </Button>
        <Button onclick={() => goto('/assessments')} variant="outline">
          Back to Assessments
        </Button>
      </div>
    </Card>
  {:else if assessment && attempt}
    <!-- Result Content -->
    <div class="mb-6">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <a href="/assessments" class="hover:text-blue-600">Assessments</a>
        <span>›</span>
        <a href="/assessments/{assessmentId}" class="hover:text-blue-600">{assessment.title}</a>
        <span>›</span>
        <a href="/assessments/{assessmentId}/results" class="hover:text-blue-600">Results</a>
        <span>›</span>
        <span>Attempt {attempt.attempt_number}</span>
      </div>

      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{assessment.title}</h1>
          <p class="text-gray-600 mt-1">Attempt {attempt.attempt_number} Result</p>
        </div>

        <div class="flex space-x-2">
          {#if attempt.passed}
            <Button onclick={downloadCertificate} variant="primary">
              Download Certificate
            </Button>
          {/if}
          <Button onclick={() => goto(`/assessments/${assessmentId}/results`)} variant="outline">
            All Results
          </Button>
        </div>
      </div>
    </div>

    <!-- Score Card -->
    <Card class="p-8 mb-8 text-center">
      <div class="mb-4">
        {#if attempt.passed}
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-green-600 mb-2">Congratulations!</h2>
          <p class="text-gray-600">You passed the assessment</p>
        {:else}
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-red-600 mb-2">Not Passed</h2>
          <p class="text-gray-600">You need {assessment.minimum_passing_score}% to pass</p>
        {/if}
      </div>

      <div class="text-6xl font-bold {getScoreColor(attempt.score, assessment.minimum_passing_score)} mb-2">
        {attempt.score}%
      </div>
      
      <div class="text-gray-600 mb-4">
        {attempt.points_earned} out of {attempt.total_points} points
      </div>

      <div class="flex justify-center space-x-8 text-sm text-gray-600">
        <div>
          <span class="font-medium">Submitted:</span>
          {formatDate(attempt.submitted_at)}
        </div>
        <div>
          <span class="font-medium">Time Spent:</span>
          {formatTime(attempt.time_spent)}
        </div>
      </div>
    </Card>

    <!-- Feedback Section -->
    {#if attempt.feedback}
      <Card class="p-6 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Detailed Feedback</h3>
        
        <div class="space-y-6">
          <!-- Overall Feedback -->
          <div class="p-4 bg-blue-50 rounded-lg">
            <h4 class="font-medium text-blue-900 mb-2">Overall Performance</h4>
            <p class="text-blue-800">{attempt.feedback.overall_feedback}</p>
          </div>

          <!-- Strengths -->
          {#if attempt.feedback.strengths.length > 0}
            <div>
              <h4 class="font-medium text-green-800 mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Strengths
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each attempt.feedback.strengths as strength}
                  <div class="flex items-center p-3 bg-green-50 rounded-lg">
                    <svg class="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-green-800 text-sm">{strength}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Areas for Improvement -->
          {#if attempt.feedback.areas_for_improvement.length > 0}
            <div>
              <h4 class="font-medium text-orange-800 mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Areas for Improvement
              </h4>
              <div class="space-y-2">
                {#each attempt.feedback.areas_for_improvement as area}
                  <div class="flex items-center p-3 bg-orange-50 rounded-lg">
                    <svg class="w-4 h-4 text-orange-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span class="text-orange-800 text-sm">{area}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Recommended Resources -->
          {#if attempt.feedback.recommended_resources.length > 0}
            <div>
              <h4 class="font-medium text-blue-800 mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Recommended Study Materials
              </h4>
              <div class="space-y-2">
                {#each attempt.feedback.recommended_resources as resource}
                  <div class="flex items-center p-3 bg-blue-50 rounded-lg">
                    <svg class="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="text-blue-800 text-sm">{resource}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Next Steps -->
          <div class="p-4 bg-gray-100 rounded-lg">
            <h4 class="font-medium text-gray-800 mb-2 flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Next Steps
            </h4>
            <p class="text-gray-700">{attempt.feedback.next_steps}</p>
          </div>
        </div>
      </Card>
    {/if}

    <!-- Question-by-Question Results -->
    <Card class="p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-6">Question-by-Question Results</h3>
      
      <div class="space-y-6">
        {#each assessment.questions as question, index}
          {@const result = getQuestionResult(question.id)}
          <div class="border rounded-lg p-6">
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center space-x-3">
                <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
                      class:bg-green-100={result?.is_correct}
                      class:text-green-800={result?.is_correct}
                      class:bg-red-100={!result?.is_correct}
                      class:text-red-800={!result?.is_correct}>
                  {index + 1}
                </span>
                <span class="text-sm font-medium text-gray-600">
                  Question {index + 1}
                </span>
              </div>
              
              <div class="flex items-center space-x-3">
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
            
            <h4 class="text-gray-900 font-medium mb-4">{question.question_text}</h4>
            
            <div class="space-y-4">
              <!-- Your Answer -->
              <div class="p-3 rounded-lg"
                   class:bg-green-50={result?.is_correct}
                   class:bg-red-50={!result?.is_correct}>
                <span class="text-sm font-medium"
                      class:text-green-800={result?.is_correct}
                      class:text-red-800={!result?.is_correct}>
                  Your Answer:
                </span>
                <div class="mt-1 text-sm"
                     class:text-green-700={result?.is_correct}
                     class:text-red-700={!result?.is_correct}>
                  {#if Array.isArray(result?.student_answer)}
                    {result.student_answer.join(', ')}
                  {:else}
                    {result?.student_answer || 'No answer provided'}
                  {/if}
                </div>
              </div>
              
              <!-- Correct Answer (if incorrect) -->
              {#if !result?.is_correct}
                <div class="p-3 bg-green-50 rounded-lg">
                  <span class="text-sm font-medium text-green-800">Correct Answer:</span>
                  <div class="mt-1 text-sm text-green-700">
                    {#if Array.isArray(question.correct_answer)}
                      {question.correct_answer.join(', ')}
                    {:else}
                      {question.correct_answer}
                    {/if}
                  </div>
                </div>
              {/if}
              
              <!-- Explanation -->
              {#if question.explanation}
                <div class="p-3 bg-blue-50 rounded-lg">
                  <span class="text-sm font-medium text-blue-800">Explanation:</span>
                  <div class="mt-1 text-sm text-blue-700">{question.explanation}</div>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </Card>
  {/if}
</div>