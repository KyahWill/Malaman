<!--
  Knowledge Assessment Component
  
  This component handles initial knowledge assessments for students,
  allowing them to take assessments that evaluate their current knowledge
  level and create personalized learning profiles.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import type { Assessment, AssessmentAnswer } from '$lib/types/database.js';
  import type { KnowledgeGap } from '$lib/services/knowledgeAssessment.js';

  // Props
  export let subjectArea: string;
  export let onComplete: ((gaps: KnowledgeGap[]) => void) | null = null;

  // State
  let assessment: Assessment | null = null;
  let currentQuestionIndex = 0;
  let answers: AssessmentAnswer[] = [];
  let timeRemaining = 0;
  let isLoading = true;
  let isSubmitting = false;
  let showResults = false;
  let knowledgeGaps: KnowledgeGap[] = [];
  let error = '';
  let timer: NodeJS.Timeout | null = null;
  let startTime: Date | null = null;

  // Reactive values
  $: currentQuestion = assessment?.questions[currentQuestionIndex];
  $: progress = assessment ? ((currentQuestionIndex + 1) / assessment.questions.length) * 100 : 0;
  $: isLastQuestion = assessment ? currentQuestionIndex === assessment.questions.length - 1 : false;
  $: canProceed = answers[currentQuestionIndex]?.student_answer !== undefined;

  onMount(async () => {
    await loadAssessment();
  });

  async function loadAssessment() {
    try {
      isLoading = true;
      error = '';

      const response = await fetch(`/api/knowledge-assessment/${encodeURIComponent(subjectArea)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load assessment');
      }

      if (!result.data) {
        // No assessment exists, show message
        error = `No knowledge assessment available for ${subjectArea}. Please contact your instructor.`;
        return;
      }

      assessment = result.data;
      
      // Initialize answers array
      answers = assessment.questions.map(q => ({
        question_id: q.id,
        student_answer: '',
        is_correct: false,
        points_earned: 0
      }));

      // Start timer if assessment has time limit
      if (assessment.time_limit) {
        timeRemaining = assessment.time_limit * 60; // Convert to seconds
        startTimer();
      }

      startTime = new Date();
    } catch (err: any) {
      console.error('Error loading assessment:', err);
      error = err.message || 'Failed to load assessment';
    } finally {
      isLoading = false;
    }
  }

  function startTimer() {
    timer = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        submitAssessment();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function selectAnswer(answer: string) {
    if (!currentQuestion) return;

    answers[currentQuestionIndex] = {
      question_id: currentQuestion.id,
      student_answer: answer,
      is_correct: false, // Will be calculated on server
      points_earned: 0 // Will be calculated on server
    };

    // Auto-advance after short delay for better UX
    setTimeout(() => {
      if (!isLastQuestion) {
        nextQuestion();
      }
    }, 500);
  }

  function nextQuestion() {
    if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
      currentQuestionIndex++;
    }
  }

  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
    }
  }

  async function submitAssessment() {
    if (!assessment || !startTime) return;

    try {
      isSubmitting = true;
      stopTimer();

      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      // Submit assessment attempt
      const submitResponse = await fetch(`/api/assessments/${assessment.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          time_spent: timeSpent
        })
      });

      const submitResult = await submitResponse.json();
      if (!submitResponse.ok) {
        throw new Error(submitResult.message || 'Failed to submit assessment');
      }

      const attemptId = submitResult.data.id;

      // Analyze knowledge gaps
      const analyzeResponse = await fetch('/api/knowledge-assessment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: assessment.id,
          attemptId
        })
      });

      const analyzeResult = await analyzeResponse.json();
      if (!analyzeResponse.ok) {
        throw new Error(analyzeResult.message || 'Failed to analyze results');
      }

      knowledgeGaps = analyzeResult.data.knowledge_gaps;

      // Update knowledge profile
      await fetch('/api/knowledge-assessment/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentAttemptIds: [attemptId],
          knowledgeGaps
        })
      });

      showResults = true;

      // Call completion callback if provided
      if (onComplete) {
        onComplete(knowledgeGaps);
      }

    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      error = err.message || 'Failed to submit assessment';
    } finally {
      isSubmitting = false;
    }
  }

  function closeResults() {
    showResults = false;
    if (onComplete) {
      // If callback provided, let parent handle navigation
      return;
    }
    // Otherwise navigate to dashboard
    goto('/dashboard');
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  {#if isLoading}
    <div class="flex justify-center items-center min-h-64">
      <Loading size="lg" />
    </div>
  {:else if error}
    <Card class="text-center p-8">
      <div class="text-red-600 mb-4">
        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold mb-2">Assessment Not Available</h2>
      <p class="text-gray-600 mb-4">{error}</p>
      <Button onclick={() => goto('/dashboard')}>
        Return to Dashboard
      </Button>
    </Card>
  {:else if assessment && !showResults}
    <div class="space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-2xl font-bold mb-2">{assessment.title}</h1>
        <p class="text-gray-600 mb-4">{assessment.description}</p>
        
        <!-- Progress and Timer -->
        <div class="flex justify-between items-center mb-4">
          <div class="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {assessment.questions.length}
          </div>
          {#if assessment.time_limit && timeRemaining > 0}
            <div class="text-sm font-medium" class:text-red-600={timeRemaining < 300}>
              Time remaining: {formatTime(timeRemaining)}
            </div>
          {/if}
        </div>
        
        <ProgressBar value={progress} class="mb-6" />
      </div>

      <!-- Question -->
      {#if currentQuestion}
        <Card class="p-6">
          <h2 class="text-lg font-semibold mb-4">{currentQuestion.question_text}</h2>
          
          {#if currentQuestion.type === 'multiple_choice' && currentQuestion.options}
            <div class="space-y-3">
              {#each currentQuestion.options as option, index}
                <button
                  class="w-full p-4 text-left border rounded-lg transition-colors hover:bg-gray-50"
                  class:bg-blue-50={answers[currentQuestionIndex]?.student_answer === option}
                  class:border-blue-500={answers[currentQuestionIndex]?.student_answer === option}
                  on:click={() => selectAnswer(option)}
                >
                  <div class="flex items-center">
                    <div class="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center"
                         class:bg-blue-500={answers[currentQuestionIndex]?.student_answer === option}
                         class:border-blue-500={answers[currentQuestionIndex]?.student_answer === option}>
                      {#if answers[currentQuestionIndex]?.student_answer === option}
                        <div class="w-2 h-2 bg-white rounded-full"></div>
                      {/if}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              {/each}
            </div>
          {:else if currentQuestion.type === 'true_false'}
            <div class="space-y-3">
              {#each ['True', 'False'] as option}
                <button
                  class="w-full p-4 text-left border rounded-lg transition-colors hover:bg-gray-50"
                  class:bg-blue-50={answers[currentQuestionIndex]?.student_answer === option}
                  class:border-blue-500={answers[currentQuestionIndex]?.student_answer === option}
                  on:click={() => selectAnswer(option)}
                >
                  <div class="flex items-center">
                    <div class="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center"
                         class:bg-blue-500={answers[currentQuestionIndex]?.student_answer === option}
                         class:border-blue-500={answers[currentQuestionIndex]?.student_answer === option}>
                      {#if answers[currentQuestionIndex]?.student_answer === option}
                        <div class="w-2 h-2 bg-white rounded-full"></div>
                      {/if}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </Card>
      {/if}

      <!-- Navigation -->
      <div class="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={currentQuestionIndex === 0}
          onclick={previousQuestion}
        >
          Previous
        </Button>

        <div class="flex space-x-3">
          {#if !isLastQuestion}
            <Button
              disabled={!canProceed}
              onclick={nextQuestion}
            >
              Next
            </Button>
          {:else}
            <Button
              disabled={!canProceed || isSubmitting}
              onclick={submitAssessment}
            >
              {#if isSubmitting}
                <Loading size="sm" class="mr-2" />
              {/if}
              Submit Assessment
            </Button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Results Modal -->
<Modal open={showResults} title="Knowledge Assessment Results" onClose={() => showResults = false}>
  <div class="space-y-6">
    <div class="text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold mb-2">Assessment Complete!</h3>
      <p class="text-gray-600">Your knowledge profile has been updated based on your responses.</p>
    </div>

    {#if knowledgeGaps.length > 0}
      <div>
        <h4 class="font-semibold mb-3">Identified Knowledge Gaps:</h4>
        <div class="space-y-3">
          {#each knowledgeGaps as gap}
            <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div class="font-medium text-yellow-800">{gap.topic}</div>
              <div class="text-sm text-yellow-600 mt-1">
                Proficiency: {Math.round(gap.proficiency_level * 10)}% | 
                Recommended level: {gap.recommended_difficulty}
              </div>
              {#if gap.prerequisite_skills.length > 0}
                <div class="text-xs text-yellow-600 mt-2">
                  Prerequisites: {gap.prerequisite_skills.join(', ')}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-green-800">Great job! No significant knowledge gaps were identified.</p>
      </div>
    {/if}

    <div class="flex justify-center">
      <Button onclick={closeResults}>
        Continue
      </Button>
    </div>
  </div>
</Modal>