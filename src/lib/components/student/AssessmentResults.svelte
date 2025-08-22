<script lang="ts">
  import { onMount } from 'svelte';
  import type { Assessment, AssessmentAttempt, AssessmentRecord } from '$lib/types/database.js';
  import { Button, Card, Loading, Badge, Modal } from '$lib/components/ui/index.js';
  import { toastHelpers } from '$lib/stores/toast.js';

  // Props
  export let assessmentId: string;
  export let attemptId: string | null = null;
  export let showHistory = true;
  export let showCertificate = true;

  // State
  let assessment: Assessment | null = null;
  let attempts: AssessmentAttempt[] = [];
  let selectedAttempt: AssessmentAttempt | null = null;
  let loading = true;
  let error: string | null = null;
  let showCertificateModal = false;
  let certificateData: AssessmentRecord | null = null;
  let generatingCertificate = false;

  // Computed
  $: bestAttempt = attempts.length > 0 
    ? attempts.reduce((best, current) => current.score > best.score ? current : best)
    : null;
  $: latestAttempt = attempts.length > 0 
    ? attempts[attempts.length - 1]
    : null;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
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

      // Select specific attempt or latest
      if (attemptId) {
        selectedAttempt = attempts.find(a => a.id === attemptId) || null;
      } else {
        selectedAttempt = latestAttempt;
      }

      if (attempts.length === 0) {
        error = 'No assessment attempts found.';
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

  async function generateCertificate(attempt: AssessmentAttempt) {
    if (!attempt.passed) {
      toastHelpers.warning('Certificate Not Available', 'Certificates are only available for passed assessments.');
      return;
    }

    try {
      generatingCertificate = true;
      
      const response = await fetch(`/api/assessments/attempts/${attempt.id}/certificate`);
      if (!response.ok) {
        throw new Error('Failed to generate certificate');
      }
      
      certificateData = await response.json();
      showCertificateModal = true;
      
    } catch (err) {
      toastHelpers.error('Failed to generate certificate');
    } finally {
      generatingCertificate = false;
    }
  }

  async function downloadCertificate(format: 'json' | 'pdf' = 'json') {
    if (!selectedAttempt) return;

    try {
      const response = await fetch(`/api/assessments/attempts/${selectedAttempt.id}/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const result = await response.json();
      
      if (format === 'json') {
        // Download JSON certificate
        const blob = new Blob([JSON.stringify(result.certificate, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assessment-certificate-${selectedAttempt.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toastHelpers.success('Certificate Downloaded', 'Your certificate has been downloaded as a JSON file.');
      } else {
        toastHelpers.info('PDF Generation', result.message);
      }
    } catch (err) {
      toastHelpers.error('Failed to download certificate');
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

  function getQuestionResult(questionId: string, attempt: AssessmentAttempt) {
    return attempt.answers.find(a => a.question_id === questionId);
  }

  function getPerformanceInsights(attempt: AssessmentAttempt): { 
    topicPerformance: Array<{ topic: string; correct: number; total: number; percentage: number }>;
    questionTypePerformance: Array<{ type: string; correct: number; total: number; percentage: number }>;
  } {
    if (!assessment) return { topicPerformance: [], questionTypePerformance: [] };

    const topicStats = new Map<string, { correct: number; total: number }>();
    const typeStats = new Map<string, { correct: number; total: number }>();

    assessment.questions.forEach(question => {
      const answer = attempt.answers.find(a => a.question_id === question.id);
      const isCorrect = answer?.is_correct || false;

      // Track by topic
      question.topics.forEach(topic => {
        if (!topicStats.has(topic)) {
          topicStats.set(topic, { correct: 0, total: 0 });
        }
        const stats = topicStats.get(topic)!;
        stats.total++;
        if (isCorrect) stats.correct++;
      });

      // Track by question type
      if (!typeStats.has(question.type)) {
        typeStats.set(question.type, { correct: 0, total: 0 });
      }
      const stats = typeStats.get(question.type)!;
      stats.total++;
      if (isCorrect) stats.correct++;
    });

    return {
      topicPerformance: Array.from(topicStats.entries()).map(([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100)
      })),
      questionTypePerformance: Array.from(typeStats.entries()).map(([type, stats]) => ({
        type,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100)
      }))
    };
  }
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
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Results</h3>
      <p class="text-gray-600 mb-4">{error}</p>
      <Button onclick={loadData} variant="primary">Try Again</Button>
    </Card>
  {:else if assessment && attempts.length > 0}
    <!-- Results Content -->
    
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Attempt History -->
      {#if showHistory}
        <div class="lg:col-span-1">
          <Card class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Attempt History</h3>
            <div class="space-y-3">
              {#each attempts.reverse() as attempt}
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
                    {#if showCertificate && attempt.passed}
                      <button
                        onclick={(e) => { e.stopPropagation(); generateCertificate(attempt); }}
                        class="text-xs text-blue-600 hover:text-blue-800"
                        disabled={generatingCertificate}
                      >
                        Certificate
                      </button>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          </Card>
        </div>
      {/if}

      <!-- Selected Attempt Details -->
      <div class="lg:col-span-2">
        {#if selectedAttempt}
          {@const insights = getPerformanceInsights(selectedAttempt)}
          
          <Card class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-semibold text-gray-900">
                Attempt {selectedAttempt.attempt_number} Details
              </h3>
              <div class="flex items-center space-x-3">
                {#if showCertificate && selectedAttempt.passed}
                  <Button 
                    onclick={() => selectedAttempt && generateCertificate(selectedAttempt)}
                    variant="outline"
                    size="sm"
                    disabled={generatingCertificate}
                  >
                    {generatingCertificate ? 'Generating...' : 'View Certificate'}
                  </Button>
                {/if}
                <div class="text-right">
                  <div class="text-2xl font-bold {getScoreColor(selectedAttempt.score, assessment.minimum_passing_score)}">
                    {selectedAttempt.score}%
                  </div>
                  <div class="text-sm text-gray-600">
                    {selectedAttempt.points_earned} / {selectedAttempt.total_points} points
                  </div>
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

            <!-- Performance Insights -->
            {#if insights.topicPerformance.length > 0}
              <div class="mb-6">
                <h4 class="text-md font-semibold text-gray-900 mb-3">Performance by Topic</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {#each insights.topicPerformance as topic}
                    <div class="p-3 bg-gray-50 rounded-lg">
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-medium text-gray-900">{topic.topic}</span>
                        <span class="text-sm {topic.percentage >= 70 ? 'text-green-600' : 'text-red-600'}">
                          {topic.percentage}%
                        </span>
                      </div>
                      <div class="text-xs text-gray-600">
                        {topic.correct} / {topic.total} correct
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          class="h-2 rounded-full {topic.percentage >= 70 ? 'bg-green-500' : 'bg-red-500'}"
                          style="width: {topic.percentage}%"
                        ></div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Detailed Feedback -->
            {#if selectedAttempt.feedback}
              <div class="mb-6">
                <h4 class="text-md font-semibold text-gray-900 mb-3">Detailed Feedback</h4>
                <div class="space-y-4">
                  <!-- Overall Feedback -->
                  <div class="p-4 bg-blue-50 rounded-lg">
                    <h5 class="font-medium text-blue-900 mb-2">Overall Performance</h5>
                    <p class="text-blue-800">{selectedAttempt.feedback.overall_feedback}</p>
                  </div>

                  <!-- Strengths -->
                  {#if selectedAttempt.feedback.strengths.length > 0}
                    <div>
                      <h5 class="font-medium text-green-800 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Strengths
                      </h5>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {#each selectedAttempt.feedback.strengths as strength}
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
                  {#if selectedAttempt.feedback.areas_for_improvement.length > 0}
                    <div>
                      <h5 class="font-medium text-orange-800 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Areas for Improvement
                      </h5>
                      <div class="space-y-2">
                        {#each selectedAttempt.feedback.areas_for_improvement as area}
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
                  {#if selectedAttempt.feedback.recommended_resources.length > 0}
                    <div>
                      <h5 class="font-medium text-blue-800 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Recommended Study Materials
                      </h5>
                      <div class="space-y-2">
                        {#each selectedAttempt.feedback.recommended_resources as resource}
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
                    <h5 class="font-medium text-gray-800 mb-2 flex items-center">
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Next Steps
                    </h5>
                    <p class="text-gray-700">{selectedAttempt.feedback.next_steps}</p>
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
                      <div class="flex items-center space-x-3">
                        <span class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
                              class:bg-green-100={result?.is_correct}
                              class:text-green-800={result?.is_correct}
                              class:bg-red-100={!result?.is_correct}
                              class:text-red-800={!result?.is_correct}>
                          {index + 1}
                        </span>
                        <span class="text-sm font-medium text-gray-600">
                          Question {index + 1} • {question.type.replace('_', ' ')}
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
                    
                    <h5 class="text-gray-900 font-medium mb-4">{question.question_text}</h5>
                    
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

                      <!-- Individual Question Feedback -->
                      {#if result?.feedback}
                        <div class="p-3 bg-purple-50 rounded-lg">
                          <span class="text-sm font-medium text-purple-800">Feedback:</span>
                          <div class="mt-1 text-sm text-purple-700">{result.feedback}</div>
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

<!-- Certificate Modal -->
{#if showCertificateModal && certificateData}
  <Modal show={showCertificateModal} title="Assessment Certificate" onClose={() => showCertificateModal = false}>
    <div class="space-y-6">
      <!-- Certificate Header -->
      <div class="text-center border-b pb-6">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Certificate of Completion</h3>
        <p class="text-gray-600">{certificateData.certificate_data.assessment_title}</p>
      </div>

      <!-- Certificate Details -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-sm font-medium text-gray-600">Score:</span>
          <div class="text-lg font-semibold text-green-600">{certificateData.score}%</div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-600">Questions:</span>
          <div class="text-lg font-semibold text-gray-900">{certificateData.certificate_data.questions_count}</div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-600">Time Spent:</span>
          <div class="text-lg font-semibold text-gray-900">{formatTime(certificateData.certificate_data.time_spent)}</div>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-600">Completed:</span>
          <div class="text-lg font-semibold text-gray-900">{formatDate(certificateData.completed_at)}</div>
        </div>
      </div>

      <!-- Certificate ID -->
      <div class="text-center text-sm text-gray-500">
        Certificate ID: {certificateData.id}
      </div>

      <!-- Actions -->
      <div class="flex justify-center space-x-3 pt-4 border-t">
        <Button onclick={() => downloadCertificate('json')} variant="outline">
          Download JSON
        </Button>
        <Button onclick={() => downloadCertificate('pdf')} variant="primary">
          Download PDF
        </Button>
      </div>
    </div>
  </Modal>
{/if}