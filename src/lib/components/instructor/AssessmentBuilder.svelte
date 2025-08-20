<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Assessment, Question, QuestionType } from '$lib/types/database.js';
  import { Button, Input, Label, Card, Modal } from '$lib/components/ui/index.js';
  import { RichTextEditor } from '$lib/components/ui/index.js';
  import { validateAssessment } from '$lib/utils/validation.js';
  import { showToast } from '$lib/stores/toast.js';

  // Props
  export let assessment: Partial<Assessment> = {
    title: '',
    description: '',
    questions: [],
    is_mandatory: true,
    minimum_passing_score: 70,
    max_attempts: null,
    time_limit: null,
    ai_generated: false,
    source_content_ids: []
  };
  export let lessonId: string | null = null;
  export let courseId: string | null = null;
  export let isEditing = false;

  const dispatch = createEventDispatcher<{
    save: Assessment;
    cancel: void;
    preview: Assessment;
  }>();

  // State
  let showQuestionModal = false;
  let editingQuestion: Question | null = null;
  let editingQuestionIndex = -1;
  let validationErrors: string[] = [];

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
  $: {
    if (lessonId) assessment.lesson_id = lessonId;
    if (courseId) assessment.course_id = courseId;
  }

  // Calculate total points
  $: totalPoints = assessment.questions?.reduce((sum, q) => sum + q.points, 0) || 0;

  function addQuestion() {
    editingQuestion = {
      id: crypto.randomUUID(),
      type: 'multiple_choice',
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

  function saveQuestion() {
    if (!editingQuestion) return;

    const validation = validateQuestion(editingQuestion);
    if (!validation.isValid) {
      showToast(validation.errors.join(', '), 'error');
      return;
    }

    if (!assessment.questions) assessment.questions = [];

    if (editingQuestionIndex >= 0) {
      assessment.questions[editingQuestionIndex] = editingQuestion;
    } else {
      assessment.questions = [...assessment.questions, editingQuestion];
    }

    closeQuestionModal();
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
    const validation = validateAssessment(assessment as Assessment);
    if (!validation.isValid) {
      validationErrors = validation.errors;
      showToast('Please fix validation errors before saving', 'error');
      return;
    }

    validationErrors = [];
    dispatch('save', assessment as Assessment);
  }

  function handlePreview() {
    const validation = validateAssessment(assessment as Assessment);
    if (!validation.isValid) {
      showToast('Please fix validation errors before previewing', 'error');
      return;
    }

    dispatch('preview', assessment as Assessment);
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
  <Card class="p-6">
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
          bind:value={assessment.title}
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
          bind:value={assessment.minimum_passing_score}
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
          bind:value={assessment.max_attempts}
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
          bind:value={assessment.time_limit}
          placeholder="No limit"
        />
        <p class="text-sm text-gray-600 mt-1">Leave empty for no time limit</p>
      </div>

      <div class="flex items-center space-x-2 pt-6">
        <input
          id="mandatory"
          type="checkbox"
          bind:checked={assessment.is_mandatory}
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
      </div>
      <Button on:click={addQuestion} variant="primary">
        Add Question
      </Button>
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
                  on:click={() => editQuestion(question, index)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
                <Button
                  on:click={() => deleteQuestion(index)}
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
    <Button on:click={() => dispatch('cancel')} variant="outline">
      Cancel
    </Button>

    <div class="space-x-2">
      <Button on:click={handlePreview} variant="outline">
        Preview
      </Button>
      <Button on:click={handleSave} variant="primary">
        {isEditing ? 'Update Assessment' : 'Create Assessment'}
      </Button>
    </div>
  </div>
</div>

<!-- Question Modal -->
{#if showQuestionModal && editingQuestion}
  <Modal
    isOpen={showQuestionModal}
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
          on:change={handleQuestionTypeChange}
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
                    on:click={() => removeOption(index)}
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
          <Button on:click={addOption} variant="outline" size="sm">
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
      {#if editingQuestion.type === 'short_answer' || editingQuestion.type === 'essay'}
        <div>
          <Label for="correct-answer">
            {editingQuestion.type === 'essay' ? 'Sample Answer' : 'Correct Answer'} *
          </Label>
          <RichTextEditor
            bind:content={editingQuestion.correct_answer}
            placeholder={editingQuestion.type === 'essay' 
              ? 'Provide a sample answer or key points...' 
              : 'Enter the correct answer...'
            }
            class="min-h-[100px]"
          />
        </div>
      {/if}

      <!-- Question Configuration -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="points">Points *</Label>
          <Input
            id="points"
            type="number"
            min="1"
            bind:value={editingQuestion.points}
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
            bind:value={editingQuestion.difficulty_level}
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
          bind:value={editingQuestion.topics}
          placeholder="e.g., algebra, equations, problem-solving"
          on:input={(e) => {
            if (editingQuestion) {
              editingQuestion.topics = e.target.value.split(',').map(t => t.trim()).filter(t => t);
            }
          }}
        />
      </div>
    </div>

    <div slot="footer" class="flex justify-end space-x-2">
      <Button on:click={closeQuestionModal} variant="outline">
        Cancel
      </Button>
      <Button on:click={saveQuestion} variant="primary">
        {editingQuestionIndex >= 0 ? 'Update Question' : 'Add Question'}
      </Button>
    </div>
  </Modal>
{/if}