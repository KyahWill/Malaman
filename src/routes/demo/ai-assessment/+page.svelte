<script lang="ts">
  import { AIAssessmentBuilder } from '$lib/components/instructor/index.js';
  import { Card } from '$lib/components/ui/index.js';
  import type { Assessment } from '$lib/types/database.js';

  let generatedAssessment = $state<Partial<Assessment> | null>(null);

  // Mock lesson/course IDs for testing
  const mockLessonId = 'demo-lesson-123';

  function handleAssessmentGenerated(assessment: Partial<Assessment>) {
    console.log('Assessment generated:', assessment);
    generatedAssessment = assessment;
  }
</script>

<svelte:head>
  <title>AI Assessment Generation Demo</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-4">AI Assessment Generation Demo</h1>
    <p class="text-gray-600 mb-6">
      This demo showcases the AI-powered assessment generation system. The system can analyze lesson or course content 
      and automatically generate relevant questions across multiple question types.
    </p>

    <Card class="p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Demo Features</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium text-gray-900 mb-2">AI Generation Capabilities</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• Automatic content analysis</li>
            <li>• Multiple question types (MC, T/F, Short Answer, Essay)</li>
            <li>• Difficulty level adjustment</li>
            <li>• Learning objective mapping</li>
            <li>• Quality explanations for answers</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium text-gray-900 mb-2">Review & Editing</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• Individual question regeneration</li>
            <li>• Manual editing capabilities</li>
            <li>• Assessment preview functionality</li>
            <li>• Validation and error checking</li>
            <li>• Fallback generation system</li>
          </ul>
        </div>
      </div>
    </Card>

    <Card class="p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">How to Test</h2>
      <div class="space-y-3 text-sm text-gray-600">
        <p>
          <strong>1. AI Generation:</strong> Click the "Generate with AI" button to simulate AI-powered question generation.
          The system will use mock content to demonstrate the generation process.
        </p>
        <p>
          <strong>2. Question Review:</strong> Once questions are generated, you can edit individual questions or regenerate 
          specific ones using the regenerate button (🔄).
        </p>
        <p>
          <strong>3. Manual Creation:</strong> You can also add questions manually using the "Add Question" button to see 
          the full question creation interface.
        </p>
        <p>
          <strong>4. Assessment Settings:</strong> Configure assessment parameters like passing score, time limits, and 
          attempt restrictions.
        </p>
      </div>
    </Card>
  </div>

  <AIAssessmentBuilder
    lessonId={mockLessonId}
    courseId={null}
    onAssessmentGenerated={handleAssessmentGenerated}
  />

  {#if generatedAssessment}
    <Card class="p-6 mt-6">
      <h2 class="text-xl font-semibold mb-4">Generated Assessment</h2>
      <div class="space-y-4">
        <div>
          <h3 class="font-medium text-gray-900">Title:</h3>
          <p class="text-gray-700">{generatedAssessment.title}</p>
        </div>
        
        <div>
          <h3 class="font-medium text-gray-900">Description:</h3>
          <p class="text-gray-700">{generatedAssessment.description}</p>
        </div>

        <div>
          <h3 class="font-medium text-gray-900">Questions ({generatedAssessment.questions?.length || 0}):</h3>
          {#if generatedAssessment.questions}
            <div class="space-y-3 mt-2">
              {#each generatedAssessment.questions as question, index}
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-start justify-between mb-2">
                    <span class="text-sm font-medium text-blue-600">Question {index + 1} ({question.type})</span>
                    <span class="text-sm text-gray-500">{question.points} points</span>
                  </div>
                  <p class="font-medium mb-2">{question.question_text}</p>
                  
                  {#if question.type === 'multiple_choice' && question.options}
                    <ul class="text-sm text-gray-600 space-y-1 mb-2">
                      {#each question.options as option}
                        <li class="flex items-center space-x-2">
                          <span class="w-4 h-4 rounded-full border-2 {
                            question.correct_answer === option ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }"></span>
                          <span>{option}</span>
                        </li>
                      {/each}
                    </ul>
                  {:else if question.type === 'true_false'}
                    <p class="text-sm text-gray-600 mb-2">
                      Correct answer: <span class="font-medium">{question.correct_answer}</span>
                    </p>
                  {/if}

                  <div class="text-sm text-gray-600">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-900">Passing Score:</span>
            <span class="text-gray-700">{generatedAssessment.minimum_passing_score}%</span>
          </div>
          <div>
            <span class="font-medium text-gray-900">Max Attempts:</span>
            <span class="text-gray-700">{generatedAssessment.max_attempts || 'Unlimited'}</span>
          </div>
          <div>
            <span class="font-medium text-gray-900">Time Limit:</span>
            <span class="text-gray-700">{generatedAssessment.time_limit ? `${generatedAssessment.time_limit} min` : 'No limit'}</span>
          </div>
          <div>
            <span class="font-medium text-gray-900">Mandatory:</span>
            <span class="text-gray-700">{generatedAssessment.is_mandatory ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </Card>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
  }
</style>