<!--
  Knowledge Assessment Builder Component
  
  This component allows instructors to create initial knowledge assessments
  for different subject areas, configuring topics, difficulty levels,
  and assessment parameters.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Label from '$lib/components/ui/Label.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import type { KnowledgeAssessmentConfig } from '$lib/services/knowledgeAssessment.js';
  import type { DifficultyLevel } from '$lib/types/database.js';

  const dispatch = createEventDispatcher();

  // State
  let config: KnowledgeAssessmentConfig = $state({
    subject_area: '',
    topics: [],
    difficulty_levels: ['beginner', 'intermediate', 'advanced'],
    question_count: 10,
    time_limit: 30
  });
  
  let questionCountStr = $state('10');
  let timeLimitStr = $state('30');
  
  let newTopic = $state('');
  let isCreating = $state(false);
  let error = $state('');

  // Reactive values
  let canCreate = $derived(config.subject_area.trim() && config.topics.length > 0 && config.question_count > 0)

  function addTopic() {
    const topic = newTopic.trim();
    if (topic && !config.topics.includes(topic)) {
      config.topics = [...config.topics, topic];
      newTopic = '';
    }
  }

  function removeTopic(topic: string) {
    config.topics = config.topics.filter(t => t !== topic);
  }

  function toggleDifficultyLevel(level: DifficultyLevel) {
    if (config.difficulty_levels.includes(level)) {
      config.difficulty_levels = config.difficulty_levels.filter(l => l !== level);
    } else {
      config.difficulty_levels = [...config.difficulty_levels, level];
    }
  }

  function handleTopicKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTopic();
    }
  }

  async function createAssessment() {
    if (!canCreate) return;

    try {
      isCreating = true;
      error = '';

      const response = await fetch('/api/knowledge-assessment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create assessment');
      }

      dispatch('created', result.data);
      
      // Reset form
      config = {
        subject_area: '',
        topics: [],
        difficulty_levels: ['beginner', 'intermediate', 'advanced'],
        question_count: 10,
        time_limit: 30
      };

    } catch (err: any) {
      console.error('Error creating knowledge assessment:', err);
      error = err.message || 'Failed to create knowledge assessment';
    } finally {
      isCreating = false;
    }
  }

  function getDifficultyColor(level: DifficultyLevel): string {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }
</script>

<Card class="p-6">
  <h2 class="text-xl font-semibold mb-6">Create Knowledge Assessment</h2>

  <form onsubmit={(event)=> {event.preventDefault();createAssessment()}} class="space-y-6">
    <!-- Subject Area -->
    <div>
      <Label for="subject-area">Subject Area *</Label>
      <Input
        id="subject-area"
        bind:value={config.subject_area}
        placeholder="e.g., Mathematics, Computer Science, Biology"
        required
      />
      <div class="text-sm text-gray-500 mt-1">
        The main subject area this assessment will evaluate
      </div>
    </div>

    <!-- Topics -->
    <div>
      <Label for="topics">Topics *</Label>
      <div class="flex space-x-2 mb-2">
        <Input
          id="topics"
          bind:value={newTopic}
          placeholder="Enter a topic and press Enter"
          onkeydown={handleTopicKeydown}
          class="flex-1"
        />
        <Button type="button" variant="outline" onclick={addTopic}>
          Add Topic
        </Button>
      </div>
      
      {#if config.topics.length > 0}
        <div class="flex flex-wrap gap-2 mt-2">
          {#each config.topics as topic}
            <Badge class="bg-blue-100 text-blue-800 flex items-center space-x-1">
              <span>{topic}</span>
              <button
                type="button"
                class="ml-1 text-blue-600 hover:text-blue-800"
                onclick={() => removeTopic(topic)}
              >
                ×
              </button>
            </Badge>
          {/each}
        </div>
      {/if}
      
      <div class="text-sm text-gray-500 mt-1">
        Specific topics within the subject area to assess
      </div>
    </div>

    <!-- Difficulty Levels -->
    <div>
      <Label>Difficulty Levels to Include *</Label>
      <div class="flex flex-wrap gap-2 mt-2">
        {#each ['beginner', 'intermediate', 'advanced'] as level}
          <button
            type="button"
            class="px-3 py-1 rounded-full border-2 transition-colors {getDifficultyColor(level)}"
            class:opacity-50={!config.difficulty_levels.includes(level)}
            onclick={() => toggleDifficultyLevel(level as DifficultyLevel)}
          >
            {level}
          </button>
        {/each}
      </div>
      <div class="text-sm text-gray-500 mt-1">
        Select which difficulty levels to include in the assessment
      </div>
    </div>

    <!-- Question Count -->
    <div>
      <Label for="question-count">Number of Questions *</Label>
      <Input
        id="question-count"
        type="number"
        bind:value={questionCountStr}
        min="1"
        max="50"
        required
        oninput={() => config.question_count = parseInt(questionCountStr) || 10}
      />
      <div class="text-sm text-gray-500 mt-1">
        Total number of questions in the assessment (1-50)
      </div>
    </div>

    <!-- Time Limit -->
    <div>
      <Label for="time-limit">Time Limit (minutes)</Label>
      <Input
        id="time-limit"
        type="number"
        bind:value={timeLimitStr}
        min="5"
        max="180"
        oninput={() => config.time_limit = parseInt(timeLimitStr) || 30}
      />
      <div class="text-sm text-gray-500 mt-1">
        Optional time limit for the assessment (leave empty for no limit)
      </div>
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    {/if}

    <!-- Submit Button -->
    <div class="flex justify-end space-x-3">
      <Button type="button" variant="outline" onclick={() => dispatch('cancel')}>
        Cancel
      </Button>
      <Button type="submit" disabled={!canCreate || isCreating}>
        {#if isCreating}
          <Loading size="sm" class="mr-2" />
        {/if}
        Create Assessment
      </Button>
    </div>
  </form>
</Card>

<!-- Preview Section -->
{#if config.subject_area && config.topics.length > 0}
  <Card class="p-6 mt-6">
    <h3 class="text-lg font-semibold mb-4">Assessment Preview</h3>
    
    <div class="space-y-3">
      <div>
        <span class="font-medium">Title:</span>
        Initial Knowledge Assessment: {config.subject_area}
      </div>
      
      <div>
        <span class="font-medium">Topics:</span>
        {config.topics.join(', ')}
      </div>
      
      <div>
        <span class="font-medium">Difficulty Levels:</span>
        {config.difficulty_levels.join(', ')}
      </div>
      
      <div>
        <span class="font-medium">Questions:</span>
        {config.question_count} questions
      </div>
      
      <div>
        <span class="font-medium">Time Limit:</span>
        {config.time_limit ? `${config.time_limit} minutes` : 'No limit'}
      </div>
      
      <div class="text-sm text-gray-600 mt-4">
        This assessment will help students identify their current knowledge level in {config.subject_area} 
        and create personalized learning profiles based on their performance across the selected topics.
      </div>
    </div>
  </Card>
{/if}