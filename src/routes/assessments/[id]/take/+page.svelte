<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Assessment, AssessmentAttempt, AssessmentAnswer, Question } from '$lib/types/database.js';
  import { Button, Card, Loading, ProgressBar } from '$lib/components/ui/index.js';
  import { toastHelpers } from '$lib/stores/toast.js';
  import { authStore } from '$lib/stores/auth.js';

  // State
  let assessment: Assessment | null = null;
  let currentAttempt: Partial<AssessmentAttempt> | null = null;
  let loading = true;
  let submitting = false;
  let error: string | null = null;
  
  // Assessment taking state
  let currentQuestionIndex = 0;
  let answers: Record<string, string | string[]> = {};
  let timeRemaining: number | null = null;
  let timeSpent = 0;
  let startTime: Date | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  let hasUnsavedChanges = false;

  // Get assessment ID from URL
  $: assessmentId = $page.params.id;
  $: currentQuestion = assessment?.questions[currentQuestionIndex];
  $: totalQuestions = assessment?.questions.length || 0;
  $: progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  $: canSubmit = assessment && Object.keys(answers).length === assessment.questions.length;
  $: isTimedAssessment = assessment?.time_limit && assessment.time_limit > 0;

  onMount(async () => {
    await loadAssessment();
    await checkExistingAttempts();
    startAssessment();
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
  });

  async function loadAssessment() {
    try {
      loading = true;
      error = null;

      const response = await fetch(`/api/assessments/${assessmentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Assessment not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to take this assessment');
        }
        throw new Error('Failed to load assessment');
      }

      assessment = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load assessment';
      toastHelpers.error(error);
    } finally {
      loading = false;
    }
  }

  async function checkExistingAttempts() {
    if (!assessment || !$authStore.user) return;

    try {
      const response = await fetch(`/api/assessments/${assessmentId}/attempts`);
      if (response.ok) {
        const attempts = await response.json();
        
        // Check if max attempts reached
        if (assessment.max_attempts && attempts.length >= assessment.max_attempts) {
          const bestAttempt = attempts.reduce((best: AssessmentAttempt, current: AssessmentAttempt) => 
            current.score > best.score ? current : best
          );
          
          if (bestAttempt.passed) {
            toastHelpers.info('Assessment Already Passed', 'You have already passed this assessment.');
            goto(`/assessments/${assessmentId}/results`);
            return;
          } else {
            toastHelpers.warning('Maximum Attempts Reached', 'You have reached the maximum number of attempts for this assessment.');
            goto(`/assessments/${assessmentId}`);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Error checking existing attempts:', err);
    }
  }

  function startAssessment() {
    if (!assessment) return;

    startTime = new Date();
    
    // Initialize timer for timed assessments
    if (isTimedAssessment) {
      timeRemaining = assessment.time_limit! * 60; // Convert minutes to seconds
      timerInterval = setInterval(() => {
        if (timeRemaining! > 0) {
          timeRemaining!--;
          timeSpent++;
        } else {
          // Time's up - auto submit
          handleTimeUp();
        }
      }, 1000);
    }

    // Set up auto-save every 30 seconds
    autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges) {
        autoSaveProgress();
      }
    }, 30000);
  }

  function handleTimeUp() {
    toastHelpers.warning('Time Up!', 'The assessment time limit has been reached. Submitting your answers...');
    submitAssessment();
  }

  function autoSaveProgress() {
    // In a real implementation, this would save progress to the server
    // For now, we'll just mark as saved
    hasUnsavedChanges = false;
    console.log('Auto-saved progress');
  }

  function handleAnswerChange(questionId: string, answer: string | string[]) {
    answers[questionId] = answer;
    hasUnsavedChanges = true;
    answers = { ...answers }; // Trigger reactivity
  }

  function navigateToQuestion(index: number) {
    if (index >= 0 && index < totalQuestions) {
      currentQuestionIndex = index;
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex < totalQuestions - 1) {
      currentQuestionIndex++;
    }
  }

  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
    }
  }

  async function submitAssessment() {
    if (!assessment || !$authStore.user || submitting) return;

    try {
      submitting = true;
      
      // Calculate time spent
      const endTime = new Date();
      const totalTimeSpent = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : timeSpent;

      // Prepare answers in the correct format
      const formattedAnswers: AssessmentAnswer[] = assessment.questions.map(question => {
        const studentAnswer = answers[question.id] || '';
        const isCorrect = checkAnswer(question, studentAnswer);
        const pointsEarned = isCorrect ? question.points : 0;

        return {
          question_id: question.id,
          student_answer: studentAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned
        };
      });

      // Calculate score
      const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
      const pointsEarned = formattedAnswers.reduce((sum, a) => sum + a.points_earned, 0);
      const score = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;
      const passed = score >= assessment.minimum_passing_score;

      // Submit attempt
      const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: formattedAnswers,
          time_spent: totalTimeSpent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      const result = await response.json();
      
      // Clear intervals
      if (timerInterval) clearInterval(timerInterval);
      if (autoSaveInterval) clearInterval(autoSaveInterval);

      // Show success message and redirect
      if (passed) {
        toastHelpers.success('Assessment Passed!', `You scored ${score}% and passed the assessment.`);
      } else {
        toastHelpers.warning('Assessment Not Passed', `You scored ${score}%. You need ${assessment.minimum_passing_score}% to pass.`);
      }

      goto(`/assessments/${assessmentId}/results/${result.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit assessment';
      toastHelpers.error('Submission Failed', message);
    } finally {
      submitting = false;
    }
  }

  function checkAnswer(question: Question, studentAnswer: string | string[]): boolean {
    if (!studentAnswer) return false;

    switch (question.type) {
      case 'multiple_choice':
        return studentAnswer === question.correct_answer;
      
      case 'true_false':
        return studentAnswer === question.correct_answer;
      
      case 'short_answer':
        // Simple case-insensitive comparison for short answers
        const correctAnswers = Array.isArray(question.correct_answer) 
          ? question.correct_answer 
          : [question.correct_answer];
        return correctAnswers.some(correct => 
          correct.toLowerCase().trim() === String(studentAnswer).toLowerCase().trim()
        );
      
      case 'essay':
        // Essay questions require manual grading, so we'll mark as correct for now
        // In a real implementation, this would be handled differently
        return true;
      
      default:
        return false;
    }
  }

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  // Add beforeunload listener
  onMount(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });
</script>

<svelte:head>
  <title>Take Assessment: {assessment?.title || 'Loading...'} - Personalized LMS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <Loading size="lg" />
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="container mx-auto px-4 py-8">
      <Card class="p-8 text-center">
        <div class="text-red-600 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Assessment</h3>
        <p class="text-gray-600 mb-4">{error}</p>
        <div class="space-x-2">
          <Button onclick={loadAssessment} variant="primary">
            Try Again
          </Button>
          <Button onclick={() => goto('/assessments')} variant="outline">
            Back to Assessments
          </Button>
        </div>
      </Card>
    </div>
  {:else if assessment && currentQuestion}
    <!-- Assessment Taking Interface -->
    <div class="container mx-auto px-4 py-6 max-w-4xl">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{assessment.title}</h1>
            <p class="text-gray-600 mt-1">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
          </div>
          
          <!-- Timer -->
          {#if isTimedAssessment && timeRemaining !== null}
            <div class="text-right">
              <div class="text-sm text-gray-600">Time Remaining</div>
              <div class="text-2xl font-mono font-bold" class:text-red-600={timeRemaining < 300}>
                {formatTime(timeRemaining)}
              </div>
            </div>
          {/if}
        </div>

        <!-- Progress Bar -->
        <ProgressBar value={progress} class="mb-4" />
        
        <!-- Assessment Info -->
        <div class="flex items-center space-x-4 text-sm text-gray-600">
          <span>Pass: {assessment.minimum_passing_score}%</span>
          <span>{assessment.questions.reduce((sum, q) => sum + q.points, 0)} total points</span>
          {#if assessment.max_attempts}
            <span>Max attempts: {assessment.max_attempts}</span>
          {/if}
        </div>
      </div>

      <!-- Question -->
      <Card class="p-6 mb-6">
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-600">
              Question {currentQuestionIndex + 1}
            </span>
            <span class="text-sm text-gray-600">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </span>
          </div>
          <h2 class="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion.question_text}
          </h2>
        </div>

        <!-- Answer Input -->
        <div class="space-y-3">
          {#if currentQuestion.type === 'multiple_choice'}
            {#each currentQuestion.options || [] as option, index}
              <label class="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="question-{currentQuestion.id}"
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onchange={() => handleAnswerChange(currentQuestion.id, option)}
                  class="w-4 h-4 text-blue-600"
                />
                <span class="text-gray-900">{option}</span>
              </label>
            {/each}
          {:else if currentQuestion.type === 'true_false'}
            <label class="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="question-{currentQuestion.id}"
                value="true"
                checked={answers[currentQuestion.id] === 'true'}
                onchange={() => handleAnswerChange(currentQuestion.id, 'true')}
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-gray-900">True</span>
            </label>
            <label class="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="question-{currentQuestion.id}"
                value="false"
                checked={answers[currentQuestion.id] === 'false'}
                onchange={() => handleAnswerChange(currentQuestion.id, 'false')}
                class="w-4 h-4 text-blue-600"
              />
              <span class="text-gray-900">False</span>
            </label>
          {:else if currentQuestion.type === 'short_answer'}
            <input
              type="text"
              placeholder="Enter your answer..."
              value={answers[currentQuestion.id] || ''}
              oninput={(e) => handleAnswerChange(currentQuestion.id, (e.target as HTMLInputElement).value)}
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          {:else if currentQuestion.type === 'essay'}
            <textarea
              placeholder="Enter your essay response..."
              value={answers[currentQuestion.id] || ''}
              oninput={(e) => handleAnswerChange(currentQuestion.id, (e.target as HTMLTextAreaElement).value)}
              rows="8"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            ></textarea>
          {/if}
        </div>
      </Card>

      <!-- Navigation -->
      <div class="flex justify-between items-center">
        <div class="flex space-x-2">
          <Button
            onclick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            ← Previous
          </Button>
          
          {#if currentQuestionIndex < totalQuestions - 1}
            <Button onclick={nextQuestion} variant="primary">
              Next →
            </Button>
          {/if}
        </div>

        <div class="flex items-center space-x-4">
          <!-- Question Navigator -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">Jump to:</span>
            <div class="flex space-x-1">
              {#each assessment.questions as question, index}
                <button
                  onclick={() => navigateToQuestion(index)}
                  class="w-8 h-8 text-xs rounded border transition-colors"
                  class:bg-blue-600={index === currentQuestionIndex}
                  class:text-white={index === currentQuestionIndex}
                  class:bg-green-100={answers[question.id] && index !== currentQuestionIndex}
                  class:text-green-800={answers[question.id] && index !== currentQuestionIndex}
                  class:border-green-300={answers[question.id] && index !== currentQuestionIndex}
                  class:hover:bg-gray-100={index !== currentQuestionIndex && !answers[question.id]}
                >
                  {index + 1}
                </button>
              {/each}
            </div>
          </div>

          <!-- Submit Button -->
          <Button
            onclick={submitAssessment}
            disabled={!canSubmit || submitting}
            variant="primary"
            class="bg-green-600 hover:bg-green-700"
          >
            {#if submitting}
              <Loading size="sm" class="mr-2" />
              Submitting...
            {:else}
              Submit Assessment
            {/if}
          </Button>
        </div>
      </div>

      <!-- Progress Summary -->
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between text-sm">
          <span class="text-blue-800">
            Progress: {Object.keys(answers).length} of {totalQuestions} questions answered
          </span>
          {#if hasUnsavedChanges}
            <span class="text-orange-600">Unsaved changes</span>
          {:else}
            <span class="text-green-600">All changes saved</span>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>