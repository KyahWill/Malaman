<script lang="ts">
  import type { Assessment, Question, QuestionType } from '$lib/types/database.js';
  import { Button, Input, Label, Card, Modal } from '$lib/components/ui/index.js';
  import { RichTextEditor } from '$lib/components/ui/index.js';
  import { validateAssessment } from '$lib/utils/validation.js';
  import { toastHelpers as toast } from '$lib/stores/toast.js';

  // Props
  let {
    assessment = {
      title: '',
      description: '',
      questions: [],
      is_mandatory: true,
      minimum_passing_score: 70,
      max_attempts: null,
      time_limit: null,
      ai_generated: false,
      source_content_ids: []
    },
    lessonId = null,
    courseId = null,
    isEditing = false,
    onSave,
    onCancel,
    onPreview
  }: {
    assessment?: Partial<Assessment>;
    lessonId?: string | null;
    courseId?: string | null;
    isEditing?: boolean;
    onSave?: (assessment: Assessment) => void;
    onCancel?: () => void;
    onPreview?: (assessment: Assessment) => void;
  } = $props();

  // Make assessment reactive
  let assessmentState = $state(assessment);

  // State
  let showQuestionModal = $state(false);
  let showAIGenerationModal = $state(false);
  let editingQuestion = $state<Question | null>(null);
  let editingQuestionIndex = $state(-1);
  let validationErrors = $state<string[]>([]);
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

  // Question types configuration
  const questionTypes: { value: QuestionType; label: string; description: string }[] = [
    {
      value: 'multiple_choice',
      label: 'Multiple Choice',
      description: 'Single correct answer from multiple options'
    },
    {
      value: 'true_false',
      label: 'True/False',
      description: 'Simple true or false question'
    },
    {
      value: 'short_answer',
      label: 'Short Answer',
      description: 'Brief text response (1-2 sentences)'
    },
    {
      value: 'essay',
      label: 'Essay',
      description: 'Extended written response requiring manual grading'
    }
  ];

  // Initialize assessment properties
  $effect(() => {
    if (lessonId) assessmentState.lesson_id = lessonId;
    if (courseId) assessmentState.course_id = courseId;
  });

  // Calculate total points
  let totalPoints = $derived(assessmentState.questions?.reduce((sum, q) => sum + q.points, 0) || 0);

  function addQuestion() {
    editingQuestion = {
      id: crypto.randomUUID(),
      type: 'true_false',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      difficulty_level: 1,
      topics: [],
      points: 1
    };
    editingQuestionIndex = -1;
    showQuestionModal = true;
  }

  function editQuestion(question: Question, index: number) {
    editingQuestion = { ...question };
    editingQuestionIndex = index;
    showQuestionModal = true;
  }

  function saveQuestion(closeModal = true) {
    if (!editingQuestion) return;
    console.log(editingQuestion)
    const validation = validateQuestion(editingQuestion);
    if (!validation.isValid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    if (!assessment.questions) assessment.questions = [];

    if (editingQuestionIndex >= 0) {
      assessment.questions[editingQuestionIndex] = editingQuestion;
    } else {
      assessment.questions = [...assessment.questions, editingQuestion];
    }

    toast.success('Question saved!');

    if (closeModal) {
      closeQuestionModal();
    }
  }

  function saveAndContinue() {
    saveQuestion(false);
    addQuestion();
  }

  function deleteQuestion(index: number) {
    if (!assessment.questions) return;
    assessment.questions = assessment.questions.filter((_, i) => i !== index);
  }

  function closeQuestionModal() {
    showQuestionModal = false;
    editingQuestion = null;
    editingQuestionIndex = -1;
  }

  function validateQuestion(question: Question): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!question.question_text.trim()) {
      errors.push('Question text is required');
    }

    if (question.type === 'multiple_choice') {
      if (!question.options || question.options.length < 2) {
        errors.push('Multiple choice questions need at least 2 options');
      }
      if (!question.correct_answer) {
        errors.push('Correct answer must be selected');
      }
    }

    if (question.type === 'true_false') {
      if (!['true', 'false'].includes(question.correct_answer as string)) {
        errors.push('True/False questions must have true or false as correct answer');
      }
    }

    if (!question.explanation.trim()) {
      errors.push('Explanation is required for all questions');
    }

    if (question.points <= 0) {
      errors.push('Points must be greater than 0');
    }

    return { isValid: errors.length === 0, errors };
  }

  function handleSave() {
    const validation = validateAssessment(assessmentState as Assessment);
    if (!validation.isValid) {
      validationErrors = validation.errors.map(e => typeof e === 'string' ? e : e.message || 'Validation error');
      toast.error('Please fix validation errors before saving');
      return;
    }

    validationErrors = [];
    onSave?.(assessmentState as Assessment);
  }

  function handlePreview() {
    const validation = validateAssessment(assessmentState as Assessment);
    if (!validation.isValid) {
      toast.error('Please fix validation errors before previewing');
      return;
    }

    onPreview?.(assessmentState as Assessment);
  }

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
        // Merge AI-generated data with current assessment
        assessment = {
          ...assessment,
          ...result.assessment,
          // Preserve user-set values
          title: assessment.title || result.assessment.title,
          description: assessment.description || result.assessment.description
        };

        toast.success(`Assessment generated successfully! ${result.metadata.questionsGenerated} questions created from ${result.metadata.contentAnalyzed} content blocks.`);
        closeAIGenerationModal();
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate assessment. Please try again.');
    } finally {
      isGeneratingAI = false;
    }
  }

  async function regenerateQuestion(questionIndex: number) {
    if (!assessment.questions || questionIndex >= assessment.questions.length) {
      toast.error('Question not found');
      return;
    }

    const originalQuestion = assessment.questions[questionIndex];
    
    try {
      const response = await fetch('/api/ai/regenerate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assessmentId: assessment.id,
          questionIndex,
          options: {
            difficulty: aiGenerationOptions.difficulty,
            reason: 'Manual regeneration request'
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to regenerate question');
        return;
      }

      if (result.success && result.question) {
        // Replace the question at the specified index
        assessment.questions[questionIndex] = result.question;
        toast.success('Question regenerated successfully!');
      }
    } catch (error) {
      console.error('Question regeneration error:', error);
      toast.error('Failed to regenerate question. Please try again.');
    }
  }

  // Question type specific handlers
  function handleQuestionTypeChange() {
    if (!editingQuestion) return;

    // Reset type-specific fields
    if (editingQuestion.type === 'multiple_choice') {
      editingQuestion.options = ['', '', '', ''];
      editingQuestion.correct_answer = '';
    } else if (editingQuestion.type === 'true_false') {
      editingQuestion.options = undefined;
      editingQuestion.correct_answer = 'true';
    } else {
      editingQuestion.options = undefined;
      editingQuestion.correct_answer = '';
    }
  }

  function addOption() {
    if (!editingQuestion?.options) return;
    editingQuestion.options = [...editingQuestion.options, ''];
  }

  function removeOption(index: number) {
    if (!editingQuestion?.options) return;
    editingQuestion.options = editingQuestion.options.filter((_, i) => i !== index);
  }
</script>

<div class="space-y-6">
  <!-- Assessment Header -->
  <Card class="p-6 ">
    <h2 class="text-2xl font-bold mb-4">
      {isEditing ? 'Edit Assessment' : 'Create Assessment'}
    </h2>

    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <h3 class="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
        <ul class="text-red-700 text-sm space-y-1">
          {#each validationErrors as error}
            <li>• {error}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Basic Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <Label for="title">Assessment Title *</Label>
        <Input
          id="title"
          value={assessment.title}
          oninput={(e) => assessmentState.title = (e.target as HTMLInputElement).value}
          placeholder="Enter assessment title"
          required
        />
      </div>

      <div>
        <Label for="passing-score">Minimum Passing Score (%) *</Label>
        <Input
          id="passing-score"
          type="number"
          min="1"
          max="100"
          value={assessment.minimum_passing_score?.toString()}
          oninput={(e) => assessment.minimum_passing_score = parseInt(e.target.value)}
          required
        />
      </div>
    </div>

    <div class="mb-6">
      <Label for="description">Description</Label>
      <RichTextEditor
        bind:content={assessment.description}
        placeholder="Describe what this assessment covers..."
        class="min-h-[100px]"
      />
    </div>

    <!-- Assessment Configuration -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <Label for="max-attempts">Max Attempts</Label>
        <Input
          id="max-attempts"
          type="number"
          min="1"
          value={assessment.max_attempts?.toString() || ''}
          oninput={(e) => assessment.max_attempts = e.target.value ? parseInt(e.target.value) : null}
          placeholder="Unlimited"
        />
        <p class="text-sm text-gray-600 mt-1">Leave empty for unlimited attempts</p>
      </div>

      <div>
        <Label for="time-limit">Time Limit (minutes)</Label>
        <Input
          id="time-limit"
          type="number"
          min="1"
          value={assessment.time_limit?.toString() || ''}
          oninput={(e) => assessment.time_limit = e.target.value ? parseInt(e.target.value) : null}
          placeholder="No limit"
        />
        <p class="text-sm text-gray-600 mt-1">Leave empty for no time limit</p>
      </div>

      <div class="flex items-center space-x-2 pt-6">
        <input
          id="mandatory"
          type="checkbox"
          checked={assessment.is_mandatory}
          onchange={(e) => assessment.is_mandatory = e.target.checked}
          class="rounded border-gray-300"
        />
        <Label for="mandatory">Mandatory Assessment</Label>
      </div>
    </div>
  </Card>

  <!-- Questions Section -->
  <Card class="p-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-xl font-semibold">Questions</h3>
        <p class="text-gray-600">
          {assessment.questions?.length || 0} questions • {totalPoints} total points
        </p>
        {#if assessment.ai_generated}
          <p class="text-sm text-blue-600 flex items-center mt-1">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            AI Generated Assessment
          </p>
        {/if}
      </div>
      <div class="flex space-x-2">
        {#if (lessonId || courseId) && (!assessment.questions || assessment.questions.length === 0)}
          <Button onclick={openAIGenerationModal} variant="outline" class="bg-blue-50 text-blue-700 hover:bg-blue-100">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            Generate with AI
          </Button>
        {/if}
        <Button onclick={addQuestion} variant="primary">
          Add Question
        </Button>
      </div>
    </div>

    <!-- Questions List -->
    {#if assessment.questions && assessment.questions.length > 0}
      <div class="space-y-4">
        {#each assessment.questions as question, index}
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {questionTypes.find(t => t.value === question.type)?.label}
                  </span>
                  <span class="text-sm text-gray-600">{question.points} points</span>
                  <span class="text-sm text-gray-600">
                    Difficulty: {question.difficulty_level}/5
                  </span>
                </div>
                <p class="font-medium mb-2">{question.question_text}</p>
                
                {#if question.type === 'multiple_choice' && question.options}
                  <ul class="text-sm text-gray-600 space-y-1">
                    {#each question.options as option, optIndex}
                      <li class="flex items-center space-x-2">
                        <span class="w-4 h-4 rounded-full border-2 {
                          question.correct_answer === option ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }"></span>
                        <span>{option}</span>
                      </li>
                    {/each}
                  </ul>
                {/if}

                {#if question.type === 'true_false'}
                  <p class="text-sm text-gray-600">
                    Correct answer: <span class="font-medium">{question.correct_answer}</span>
                  </p>
                {/if}
              </div>

              <div class="flex space-x-2">
                <Button
                  onclick={() => editQuestion(question, index)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
                {#if assessment.ai_generated}
                  <Button
                    onclick={() => regenerateQuestion(index)}
                    variant="outline"
                    size="sm"
                    class="text-blue-600 hover:text-blue-700"
                    title="Regenerate this question with AI"
                  >
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                    </svg>
                  </Button>
                {/if}
                <Button
                  onclick={() => deleteQuestion(index)}
                  variant="outline"
                  size="sm"
                  class="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-8 text-gray-500">
        <p>No questions added yet.</p>
        <p class="text-sm">Click "Add Question" to get started.</p>
      </div>
    {/if}
  </Card>

  <!-- Actions -->
  <div class="flex justify-between">
    <Button onclick={() => onCancel?.()} variant="outline">
      Cancel
    </Button>

    <div class="space-x-2">
      <Button onclick={handlePreview} variant="outline">
        Preview
      </Button>
      <Button onclick={handleSave} variant="primary">
        {isEditing ? 'Update Assessment' : 'Create Assessment'}
      </Button>
    </div>
  </div>
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
            onchange={(e) => aiGenerationOptions.difficulty = e.target.value}
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
            oninput={(e) => aiGenerationOptions.questionCount = parseInt(e.target.value)}
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
              onchange={(e) => {
                if (e.target.checked) {
                  aiGenerationOptions.questionTypes = [...aiGenerationOptions.questionTypes, 'multiple_choice'];
                } else {
                  aiGenerationOptions.questionTypes = aiGenerationOptions.questionTypes.filter(t => t !== 'multiple_choice');
                }
              }}
              class="rounded border-gray-300"
            />
            <span class="text-sm">Multiple Choice</span>
          </label>
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={aiGenerationOptions.questionTypes.includes('true_false')}
              onchange={(e) => {
                if (e.target.checked) {
                  aiGenerationOptions.questionTypes = [...aiGenerationOptions.questionTypes, 'true_false'];
                } else {
                  aiGenerationOptions.questionTypes = aiGenerationOptions.questionTypes.filter(t => t !== 'true_false');
                }
              }}
              class="rounded border-gray-300"
            />
            <span class="text-sm">True/False</span>
          </label>
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={aiGenerationOptions.questionTypes.includes('short_answer')}
              onchange={(e) => {
                if (e.target.checked) {
                  aiGenerationOptions.questionTypes = [...aiGenerationOptions.questionTypes, 'short_answer'];
                } else {
                  aiGenerationOptions.questionTypes = aiGenerationOptions.questionTypes.filter(t => t !== 'short_answer');
                }
              }}
              class="rounded border-gray-300"
            />
            <span class="text-sm">Short Answer</span>
          </label>
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={aiGenerationOptions.questionTypes.includes('essay')}
              onchange={(e) => {
                if (e.target.checked) {
                  aiGenerationOptions.questionTypes = [...aiGenerationOptions.questionTypes, 'essay'];
                } else {
                  aiGenerationOptions.questionTypes = aiGenerationOptions.questionTypes.filter(t => t !== 'essay');
                }
              }}
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
            oninput={(e) => aiGenerationOptions.minimumPassingScore = parseInt(e.target.value)}
          />
        </div>

        <div>
          <Label for="ai-max-attempts">Max Attempts</Label>
          <Input
            id="ai-max-attempts"
            type="number"
            min="1"
            value={aiGenerationOptions.maxAttempts?.toString() || ''}
            oninput={(e) => aiGenerationOptions.maxAttempts = e.target.value ? parseInt(e.target.value) : null}
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
            oninput={(e) => aiGenerationOptions.timeLimit = e.target.value ? parseInt(e.target.value) : null}
            placeholder="No limit"
          />
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <input
          id="ai-mandatory"
          type="checkbox"
          checked={aiGenerationOptions.isMandatory}
          onchange={(e) => aiGenerationOptions.isMandatory = e.target.checked}
          class="rounded border-gray-300"
        />
        <Label for="ai-mandatory">Mandatory Assessment</Label>
      </div>
    </div>

    <div slot="footer" class="flex justify-end space-x-2">
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

<!-- Question Modal -->
{#if showQuestionModal && editingQuestion}
  <Modal
    open={showQuestionModal}
    onClose={closeQuestionModal}
    title={editingQuestionIndex >= 0 ? 'Edit Question' : 'Add Question'}
    size="lg"
  >
    <div class="space-y-4">
      <!-- Question Type -->
      <div>
        <Label for="question-type">Question Type *</Label>
        <select
          id="question-type"
          bind:value={editingQuestion.type}
          onchange={handleQuestionTypeChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each questionTypes as type}
            <option value={type.value}>{type.label} - {type.description}</option>
          {/each}
        </select>
      </div>

      <!-- Question Text -->
      <div>
        <Label for="question-text">Question Text *</Label>
        <RichTextEditor
          bind:content={editingQuestion.question_text}
          placeholder="Enter your question..."
          class="min-h-[100px]"
        />
      </div>

      <!-- Multiple Choice Options -->
      {#if editingQuestion.type === 'multiple_choice'}
        <div>
          <Label>Answer Options *</Label>
          {#if editingQuestion.options}
            {#each editingQuestion.options as option, index}
              <div class="flex items-center space-x-2 mb-2">
                <input
                  type="radio"
                  name="correct-answer"
                  value={option}
                  bind:group={editingQuestion.correct_answer}
                  class="text-blue-600"
                />
                <Input
                  bind:value={editingQuestion.options[index]}
                  placeholder={`Option ${index + 1}`}
                  class="flex-1"
                />
                {#if editingQuestion.options.length > 2}
                  <Button
                    onclick={() => removeOption(index)}
                    variant="outline"
                    size="sm"
                    class="text-red-600"
                  >
                    Remove
                  </Button>
                {/if}
              </div>
            {/each}
          {/if}
          <Button onclick={addOption} variant="outline" size="sm">
            Add Option
          </Button>
        </div>
      {/if}

      <!-- True/False Options -->
      {#if editingQuestion.type === 'true_false'}
        <div>
          <Label>Correct Answer *</Label>
          <div class="flex space-x-4">
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={editingQuestion.correct_answer}
                value="true"
                class="text-blue-600"
              />
              <span>True</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={editingQuestion.correct_answer}
                value="false"
                class="text-blue-600"
              />
              <span>False</span>
            </label>
          </div>
        </div>
      {/if}

      <!-- Short Answer/Essay Correct Answer -->
       <!--
        TODO: Remove Essay and Short Answer as they are irrelevant.
        {#if editingQuestion.type === 'short_answer' || editingQuestion.type === 'essay'}
          <div>
            <Label for="correct-answer">
              {editingQuestion.type === 'essay' ? 'Sample Answer' : 'Correct Answer'} *
            </Label>
            <RichTextEditor
              content={editingQuestion.correct_answer}
              placeholder={editingQuestion.type === 'essay' 
                ? 'Provide a sample answer or key points...' 
                : 'Enter the correct answer...'
              }
              class="min-h-[100px]"
            />
          </div>
        {/if}
       -->

      <!-- Question Configuration -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="points">Points *</Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={editingQuestion.points.toString()}
            required
          />
        </div>

        <div>
          <Label for="difficulty">Difficulty Level (1-5) *</Label>
          <Input
            id="difficulty"
            type="number"
            min="1"
            max="5"
            value={editingQuestion.difficulty_level.toString()}
            required
          />
        </div>
      </div>

      <!-- Explanation -->
      <div>
        <Label for="explanation">Explanation *</Label>
        <RichTextEditor
          bind:content={editingQuestion.explanation}
          placeholder="Explain why this is the correct answer..."
          class="min-h-[100px]"
        />
      </div>

      <!-- Topics -->
      <div>
        <Label for="topics">Topics (comma-separated)</Label>
        <Input
          id="topics"
          value={editingQuestion.topics}
          placeholder="e.g., algebra, equations, problem-solving"
          oninput={(e) => {
            if (editingQuestion) {
              editingQuestion.topics = e.target.value.split(',').map(t => t.trim()).filter(t => t);
            }
          }}
        />
      </div>
    </div>

    <div class="flex justify-end space-x-2">
      <Button onclick={closeQuestionModal} variant="outline">
        Cancel
      </Button>
      {#if editingQuestionIndex < 0}
        <Button onclick={saveAndContinue} variant="outline">
          Save & Add Another
        </Button>
      {/if}
      <Button onclick={() => saveQuestion(true)} variant="primary">
        {editingQuestionIndex >= 0 ? 'Update Question' : 'Save & Close'}
      </Button>
    </div>
  </Modal>
{/if}