<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Assessment, Question } from '$lib/types/database.js';
  import { Button, Card } from '$lib/components/ui/index.js';
  import { RichTextRenderer } from '$lib/components/ui/index.js';

  // Props
  let {assessment}: { assessment: Assessment } = $props();

  const dispatch = createEventDispatcher<{
    close: void;
    edit: void;
    publish: void;
  }>();

  // State
  let selectedAnswers: Record<string, string | string[]> =$state({}) ;
  let showResults = $state(false);

  // Calculate total points and estimated time
  let totalPoints = $derived(assessment.questions?.reduce((sum, q) => sum + q.points, 0));
  let estimatedTime = $derived(Math.max(assessment.questions?.length * 2, 10)); // 2 minutes per question, minimum 10 minutes

  function handleAnswerChange(questionId: string, answer: string | string[]) {
    selectedAnswers[questionId] = answer;
  }

  function submitPreview() {
    showResults = true;
  }

  function resetPreview() {
    selectedAnswers = {};
    showResults = false;
  }

  function calculateScore(): { score: number; correctAnswers: number } {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    assessment.questions?.forEach(question => {
      totalPoints += question.points;
      const studentAnswer = selectedAnswers[question.id];
      
      if (isAnswerCorrect(question, studentAnswer)) {
        correctAnswers++;
        earnedPoints += question.points;
      }
    });

    return {
      score: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
      correctAnswers
    };
  }

  function isAnswerCorrect(question: Question, studentAnswer: string | string[]): boolean {
    if (!studentAnswer) return false;

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      return studentAnswer === question.correct_answer;
    }

    // For short answer and essay, we can't automatically grade in preview
    // This is just for demonstration purposes
    return false;
  }

  function getQuestionTypeLabel(type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'): string {
    const labels = {
      multiple_choice: 'Multiple Choice',
      true_false: 'True/False',
      short_answer: 'Short Answer',
      essay: 'Essay'
    };
    return labels[type];
  }

  let results = $derived(showResults ? calculateScore() : null);
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Assessment Header -->
  <Card class="p-6">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h1 class="text-3xl font-bold mb-2">{assessment.title}</h1>
        <div class="flex items-center space-x-4 text-sm text-gray-600">
          <span>{assessment.questions.length} questions</span>
          <span>{totalPoints} points</span>
          <span>~{estimatedTime} minutes</span>
          {#if assessment.time_limit}
            <span class="text-orange-600">Time limit: {assessment.time_limit} minutes</span>
          {/if}
        </div>
      </div>
      
      <div class="flex space-x-2">
        <Button onclick={() => dispatch('edit')} variant="outline">
          Edit Assessment
        </Button>
        <Button onclick={() => dispatch('close')} variant="outline">
          Close Preview
        </Button>
      </div>
    </div>

    {#if assessment.description}
      <div class="prose max-w-none">
        <RichTextRenderer html={assessment.description} />
      </div>
    {/if}

    <!-- Assessment Configuration Info -->
    <div class="mt-4 p-4 bg-blue-50 rounded-lg">
      <h3 class="font-medium text-blue-900 mb-2">Assessment Configuration</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-blue-700">Passing Score:</span>
          <span class="font-medium ml-1">{assessment.minimum_passing_score}%</span>
        </div>
        <div>
          <span class="text-blue-700">Max Attempts:</span>
          <span class="font-medium ml-1">{assessment.max_attempts || 'Unlimited'}</span>
        </div>
        <div>
          <span class="text-blue-700">Time Limit:</span>
          <span class="font-medium ml-1">{assessment.time_limit ? `${assessment.time_limit} min` : 'None'}</span>
        </div>
        <div>
          <span class="text-blue-700">Type:</span>
          <span class="font-medium ml-1">{assessment.is_mandatory ? 'Mandatory' : 'Optional'}</span>
        </div>
      </div>
    </div>
  </Card>

  <!-- Results Display -->
  {#if showResults && results}
    <Card class="p-6 border-l-4 {results.score >= assessment.minimum_passing_score ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}">
      <h2 class="text-xl font-bold mb-4 {results.score >= assessment.minimum_passing_score ? 'text-green-800' : 'text-red-800'}">
        Preview Results
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <span class="text-gray-600">Score:</span>
          <span class="font-bold text-lg ml-2">{results.score}%</span>
        </div>
        <div>
          <span class="text-gray-600">Correct:</span>
          <span class="font-medium ml-2">{results.correctAnswers}/{assessment.questions.length}</span>
        </div>
        <div>
          <span class="text-gray-600">Status:</span>
          <span class="font-medium ml-2 {results.score >= assessment.minimum_passing_score ? 'text-green-600' : 'text-red-600'}">
            {results.score >= assessment.minimum_passing_score ? 'PASSED' : 'FAILED'}
          </span>
        </div>
        <div>
          <span class="text-gray-600">Required:</span>
          <span class="font-medium ml-2">{assessment.minimum_passing_score}%</span>
        </div>
      </div>
      
      <div class="flex space-x-2">
        <Button onclick={resetPreview} variant="outline">
          Try Again
        </Button>
        <Button onclick={() => dispatch('publish')} variant="primary">
          Publish Assessment
        </Button>
      </div>
    </Card>
  {/if}

  <!-- Questions -->
  <div class="space-y-6">
    {#each assessment.questions as question, index}
      <Card class="p-6">
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold">Question {index + 1}</h3>
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <span class="bg-gray-100 px-2 py-1 rounded">{getQuestionTypeLabel(question.type)}</span>
              <span>{question.points} {question.points === 1 ? 'point' : 'points'}</span>
              <span>Difficulty: {question.difficulty_level}/5</span>
            </div>
          </div>
          
          <div class="prose max-w-none">
            <RichTextRenderer html={question.question_text} />
          </div>
        </div>

        <!-- Question Input Based on Type -->
        {#if !showResults}
          {#if question.type === 'multiple_choice' && question.options}
            <div class="space-y-2">
              {#each question.options as option, optIndex}
                <label class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="question-{question.id}"
                    value={option}
                    onchange={() => handleAnswerChange(question.id, option)}
                    class="text-blue-600"
                  />
                  <span>{option}</span>
                </label>
              {/each}
            </div>
          {:else if question.type === 'true_false'}
            <div class="space-y-2">
              <label class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="question-{question.id}"
                  value="true"
                  onchange={() => handleAnswerChange(question.id, 'true')}
                  class="text-blue-600"
                />
                <span>True</span>
              </label>
              <label class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="question-{question.id}"
                  value="false"
                  onchange={() => handleAnswerChange(question.id, 'false')}
                  class="text-blue-600"
                />
                <span>False</span>
              </label>
            </div>
          {:else if question.type === 'short_answer'}
            <textarea
              placeholder="Enter your answer..."
              oninput={(e) => handleAnswerChange(question.id, e.target.value)}
              class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          {:else if question.type === 'essay'}
            <textarea
              placeholder="Write your essay response..."
              oninput={(e) => handleAnswerChange(question.id, e.target.value)}
              class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="8"
            ></textarea>
          {/if}
        {:else}
          <!-- Show Results -->
          <div class="space-y-3">
            <!-- Student Answer -->
            <div class="p-3 bg-gray-50 rounded-lg">
              <span class="text-sm font-medium text-gray-700">Your Answer:</span>
              <div class="mt-1">
                {#if selectedAnswers[question.id]}
                  <span class="text-gray-900">{selectedAnswers[question.id]}</span>
                {:else}
                  <span class="text-gray-500 italic">No answer provided</span>
                {/if}
              </div>
            </div>

            <!-- Correct Answer -->
            <div class="p-3 bg-green-50 rounded-lg">
              <span class="text-sm font-medium text-green-700">Correct Answer:</span>
              <div class="mt-1 text-green-900">{question.correct_answer}</div>
            </div>

            <!-- Explanation -->
            {#if question.explanation}
              <div class="p-3 bg-blue-50 rounded-lg">
                <span class="text-sm font-medium text-blue-700">Explanation:</span>
                <div class="mt-1 prose prose-sm max-w-none">
                  <RichTextRenderer html={question.explanation} />
                </div>
              </div>
            {/if}

            <!-- Result Indicator -->
            <div class="flex items-center space-x-2">
              {#if isAnswerCorrect(question, selectedAnswers[question.id])}
                <div class="flex items-center text-green-600">
                  <svg class="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-medium">Correct (+{question.points} points)</span>
                </div>
              {:else}
                <div class="flex items-center text-red-600">
                  <svg class="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-medium">Incorrect (0 points)</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </Card>
    {/each}
  </div>

  <!-- Submit Button -->
  {#if !showResults}
    <div class="flex justify-center">
      <Button onclick={submitPreview} variant="primary" size="lg">
        Submit Preview
      </Button>
    </div>
  {/if}
</div>