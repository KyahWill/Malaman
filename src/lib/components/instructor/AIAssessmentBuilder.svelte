<script lang="ts">
  import type { Assessment, Question, QuestionType } from '$lib/types/database.js';
  import { Button, Input, Label, Card, Modal } from '$lib/components/ui/index.js';
  import { toastHelpers as toast } from '$lib/stores/toast.js';

  // Props
  let {
    lessonId = null,
    courseId = null,
    onAssessmentGenerated
  }: {
    lessonId?: string | null;
    courseId?: string | null;
    onAssessmentGenerated?: (assessment: Partial<Assessment>) => void;
  } = $props();

  // State
  let showAIGenerationModal = $state(false);
  let isGeneratingAI = $state(false);
  let aiGenerationOptions = $state({
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    questionTypes: ['multiple_choice', 'true_false', 'short_answer'] as QuestionType[],
    questionCount: 10,
    isMandatory: true,
    minimumPassingScore: 70,
    maxAttempts: null as number | null,
    timeLimit: null as number | null
  });

  function openAIGenerationModal() {
    showAIGenerationModal = true;
  }

  function closeAIGenerationModal() {
    showAIGenerationModal = false;
  }

  async function generateAIAssessment() {
    if (!lessonId && !courseId) {
      toast.error('No content available for AI generation');
      return;
    }

    isGeneratingAI = true;

    try {
      const response = await fetch('/api/ai/generate-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lessonId,
          courseId,
          options: aiGenerationOptions
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(`AI service rate limit exceeded. ${result.retryAfter ? `Try again in ${result.retryAfter} seconds.` : ''}`);
        } else if (response.status === 503) {
          toast.error('AI service temporarily unavailable. Using fallback generation.');
        } else {
          toast.error(result.error || 'Failed to generate assessment');
        }
        
        if (!result.fallbackAvailable) {
          return;
        }
      }

      if (result.success && result.assessment) {
        toast.success(`Assessment generated successfully! ${result.metadata.questionsGenerated} questions created from ${result.metadata.contentAnalyzed} content blocks.`);
        onAssessmentGenerated?.(result.assessment);
        closeAIGenerationModal();
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate assessment. Please try again.');
    } finally {
      isGeneratingAI = false;
    }
  }

  function handleQuestionTypeChange(questionType: QuestionType, checked: boolean) {
    if (checked) {
      aiGenerationOptions.questionTypes = [...aiGenerationOptions.questionTypes, questionType];
    } else {
      aiGenerationOptions.questionTypes = aiGenerationOptions.questionTypes.filter(t => t !== questionType);
    }
  }
</script>

<div class="space-y-6">
  <Card class="p-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">AI Assessment Generation</h3>
        <p class="text-sm text-gray-600 mt-1">
          Generate assessment questions automatically using AI analysis of your {lessonId ? 'lesson' : 'course'} content.
        </p>
      </div>
      <Button onclick={openAIGenerationModal} variant="primary" class="bg-blue-600 hover:bg-blue-700">
        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
        </svg>
        Generate with AI
      </Button>
    </div>
  </Card>
</div>

<!-- AI Generation Modal -->
{#if showAIGenerationModal}
  <Modal
    open={showAIGenerationModal}
    title="Generate Assessment with AI"
    size="lg"
    onClose={closeAIGenerationModal}
  >
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
          </svg>
          <div>
            <h4 class="text-blue-800 font-medium">AI Assessment Generation</h4>
            <p class="text-blue-700 text-sm mt-1">
              AI will analyze your {lessonId ? 'lesson' : 'course'} content and generate relevant questions automatically. 
              You can review and edit all questions before saving.
            </p>
          </div>
        </div>
      </div>

      <!-- Generation Options -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label for="ai-difficulty">Difficulty Level</Label>
          <select
            id="ai-difficulty"
            value={aiGenerationOptions.difficulty}
            onchange={(e) => aiGenerationOptions.difficulty = (e.target as HTMLSelectElement).value as 'beginner' | 'intermediate' | 'advanced'}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <Label for="ai-question-count">Number of Questions</Label>
          <Input
            id="ai-question-count"
            type="number"
            min="1"
            max="50"
            value={aiGenerationOptions.questionCount.toString()}
            oninput={(e) => aiGenerationOptions.questionCount = parseInt((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      <!-- Question Types -->
      <div>
        <Label>Question Types</Label>
        <div class="grid grid-cols-2 gap-2 mt-2">
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={aiGenerationOptions.questionTypes.includes('multiple_choice')}
              onchange={(e) => handleQuestionTypeChange('multiple_choice', (e.target as HTMLInputElement).checked)}
              class="rounded border-gray-300"
            />
            <span class="text-sm">Multiple Choice</span>
          </label>
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={aiGenerationOptions.questionTypes.includes('true_false')}
              onchange={(e) => handleQuestionTypeChange('true_false', (e.target as HTMLInputElement).checked)}
              class="rounded border-gray-300"
            />
            <span class="text-sm">True/False</span>
          </label>
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={aiGenerationOptions.questionTypes.includes('short_answer')}
              onchange={(e) => handleQuestionTypeChange('short_answer', (e.target as HTMLInputElement).checked)}
              class="rounded border-gray-300"
            />
            <span class="text-sm">Short Answer</span>
          </label>
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={aiGenerationOptions.questionTypes.includes('essay')}
              onchange={(e) => handleQuestionTypeChange('essay', (e.target as HTMLInputElement).checked)}
              class="rounded border-gray-300"
            />
            <span class="text-sm">Essay</span>
          </label>
        </div>
      </div>

      <!-- Assessment Settings -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label for="ai-passing-score">Passing Score (%)</Label>
          <Input
            id="ai-passing-score"
            type="number"
            min="1"
            max="100"
            value={aiGenerationOptions.minimumPassingScore.toString()}
            oninput={(e) => aiGenerationOptions.minimumPassingScore = parseInt((e.target as HTMLInputElement).value)}
          />
        </div>

        <div>
          <Label for="ai-max-attempts">Max Attempts</Label>
          <Input
            id="ai-max-attempts"
            type="number"
            min="1"
            value={aiGenerationOptions.maxAttempts?.toString() || ''}
            oninput={(e) => {
              const value = (e.target as HTMLInputElement).value;
              aiGenerationOptions.maxAttempts = value ? parseInt(value) : null;
            }}
            placeholder="Unlimited"
          />
        </div>

        <div>
          <Label for="ai-time-limit">Time Limit (min)</Label>
          <Input
            id="ai-time-limit"
            type="number"
            min="1"
            value={aiGenerationOptions.timeLimit?.toString() || ''}
            oninput={(e) => {
              const value = (e.target as HTMLInputElement).value;
              aiGenerationOptions.timeLimit = value ? parseInt(value) : null;
            }}
            placeholder="No limit"
          />
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <input
          id="ai-mandatory"
          type="checkbox"
          checked={aiGenerationOptions.isMandatory}
          onchange={(e) => aiGenerationOptions.isMandatory = (e.target as HTMLInputElement).checked}
          class="rounded border-gray-300"
        />
        <Label for="ai-mandatory">Mandatory Assessment</Label>
      </div>
    </div>

    <div  class="flex justify-end space-x-2">
      <Button onclick={closeAIGenerationModal} variant="outline" disabled={isGeneratingAI}>
        Cancel
      </Button>
      <Button onclick={generateAIAssessment} variant="primary" disabled={isGeneratingAI || aiGenerationOptions.questionTypes.length === 0}>
        {#if isGeneratingAI}
          <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating...
        {:else}
          Generate Assessment
        {/if}
      </Button>
    </div>
  </Modal>
{/if}