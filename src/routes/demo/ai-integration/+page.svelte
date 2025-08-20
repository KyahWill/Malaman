<script lang="ts">
  import { onMount } from 'svelte';
  import { getAIClient } from '$lib/services/aiClient.js';
  import { Button, Card, Input, Label, Loading } from '$lib/components/ui/index.js';

  let aiClient = getAIClient();
  let aiStatus: any = null;
  let loading = false;
  let error = '';

  // Content Analysis Demo
  let analysisContent = `JavaScript is a versatile programming language that runs in web browsers and on servers. 
It supports object-oriented, functional, and procedural programming paradigms. 
Key concepts include variables, functions, objects, arrays, and event handling.
Modern JavaScript includes features like arrow functions, async/await, and modules.`;
  let analysisResult: any = null;
  let analyzingContent = false;

  // Assessment Generation Demo
  let assessmentInput = {
    contentBlocks: [
      {
        type: 'rich_text',
        content: {
          plain_text: 'Introduction to Variables in JavaScript. Variables are containers for storing data values. In JavaScript, you can declare variables using var, let, or const keywords.'
        }
      }
    ],
    learningObjectives: [
      'Understand what variables are',
      'Learn different ways to declare variables',
      'Understand the difference between var, let, and const'
    ],
    difficulty: 'beginner' as const,
    questionTypes: ['multiple_choice', 'true_false'] as ('multiple_choice' | 'true_false' | 'short_answer' | 'essay')[],
    questionCount: 3
  };
  let assessmentResult: any = null;
  let generatingAssessment = false;

  // Roadmap Generation Demo
  let roadmapInput = {
    studentProfile: {
      knowledgeProfile: {
        programming: 'beginner',
        javascript: 'none',
        webDevelopment: 'beginner'
      },
      learningPreferences: {
        preferred_pace: 'medium',
        preferred_media_types: ['text', 'video'],
        learning_style: 'visual'
      },
      completedContent: [],
      assessmentHistory: []
    },
    availableCourses: [
      {
        id: 'js-basics',
        title: 'JavaScript Fundamentals',
        description: 'Learn the basics of JavaScript programming',
        difficulty_level: 'beginner',
        estimated_duration: 120
      },
      {
        id: 'web-dev',
        title: 'Web Development Basics',
        description: 'Introduction to HTML, CSS, and JavaScript',
        difficulty_level: 'beginner',
        estimated_duration: 180
      }
    ]
  };
  let roadmapResult: any = null;
  let generatingRoadmap = false;

  onMount(async () => {
    await checkAIStatus();
  });

  async function checkAIStatus() {
    loading = true;
    error = '';
    
    try {
      const { status } = await aiClient.getStatus();
      aiStatus = status;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to check AI status';
    } finally {
      loading = false;
    }
  }

  async function analyzeContent() {
    analyzingContent = true;
    error = '';
    
    try {
      const { analysis, metadata } = await aiClient.analyzeContent(
        analysisContent,
        'content_analysis'
      );
      analysisResult = { analysis, metadata };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Content analysis failed';
    } finally {
      analyzingContent = false;
    }
  }

  async function generateAssessment() {
    generatingAssessment = true;
    error = '';
    
    try {
      const { assessment, metadata } = await aiClient.generateAssessment(assessmentInput);
      assessmentResult = { assessment, metadata };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Assessment generation failed';
    } finally {
      generatingAssessment = false;
    }
  }

  async function generateRoadmap() {
    generatingRoadmap = true;
    error = '';
    
    try {
      const { roadmap, metadata } = await aiClient.generateRoadmap(roadmapInput);
      roadmapResult = { roadmap, metadata };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Roadmap generation failed';
    } finally {
      generatingRoadmap = false;
    }
  }
</script>

<svelte:head>
  <title>AI Integration Demo - Personalized LMS</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">AI Integration Demo</h1>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      <strong>Error:</strong> {error}
    </div>
  {/if}

  <!-- AI Status -->
  <Card class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">AI Service Status</h2>
      <Button on:click={checkAIStatus} disabled={loading} variant="outline" size="sm">
        {#if loading}
          <Loading size="sm" class="mr-2" />
        {/if}
        Refresh
      </Button>
    </div>
    
    {#if aiStatus}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><strong>Provider:</strong> {aiStatus.provider}</p>
          <p><strong>Available:</strong> 
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {aiStatus.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              {aiStatus.isAvailable ? 'Yes' : 'No'}
            </span>
          </p>
          <p><strong>Using Fallback:</strong> 
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {aiStatus.usingFallback ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
              {aiStatus.usingFallback ? 'Yes' : 'No'}
            </span>
          </p>
        </div>
        
        {#if aiStatus.rateLimiting}
          <div>
            <p><strong>Requests Used:</strong> {aiStatus.rateLimiting.requestsInLastMinute} / {aiStatus.rateLimiting.requestsInLastMinute + aiStatus.rateLimiting.requestsRemaining}</p>
            <p><strong>Tokens Used:</strong> {aiStatus.rateLimiting.tokensInLastMinute.toLocaleString()} / {(aiStatus.rateLimiting.tokensInLastMinute + aiStatus.rateLimiting.tokensRemaining).toLocaleString()}</p>
          </div>
        {/if}
      </div>
    {/if}
  </Card>

  <!-- Content Analysis Demo -->
  <Card class="mb-8">
    <h2 class="text-xl font-semibold mb-4">Content Analysis</h2>
    
    <div class="mb-4">
      <Label for="analysis-content">Content to Analyze</Label>
      <textarea
        id="analysis-content"
        bind:value={analysisContent}
        class="w-full p-3 border border-gray-300 rounded-md"
        rows="4"
        placeholder="Enter educational content to analyze..."
      ></textarea>
    </div>
    
    <Button on:click={analyzeContent} disabled={analyzingContent}>
      {#if analyzingContent}
        <Loading size="sm" class="mr-2" />
      {/if}
      Analyze Content
    </Button>
    
    {#if analysisResult}
      <div class="mt-4 p-4 bg-gray-50 rounded-md">
        <h3 class="font-semibold mb-2">Analysis Results:</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Difficulty:</strong> {analysisResult.analysis.difficulty}</p>
            <p><strong>Content Type:</strong> {analysisResult.analysis.contentType}</p>
            <p><strong>Reading Time:</strong> {analysisResult.analysis.estimatedReadingTime} minutes</p>
          </div>
          <div>
            <p><strong>Key Topics:</strong></p>
            <ul class="list-disc list-inside">
              {#each analysisResult.analysis.keyTopics as topic}
                <li>{topic}</li>
              {/each}
            </ul>
          </div>
        </div>
        
        <div class="mt-4">
          <p><strong>Learning Objectives:</strong></p>
          <ul class="list-disc list-inside">
            {#each analysisResult.analysis.learningObjectives as objective}
              <li>{objective}</li>
            {/each}
          </ul>
        </div>
        
        {#if analysisResult.metadata.usingFallback}
          <div class="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded">
            <strong>Note:</strong> This analysis was generated using the fallback system.
          </div>
        {/if}
      </div>
    {/if}
  </Card>

  <!-- Assessment Generation Demo -->
  <Card class="mb-8">
    <h2 class="text-xl font-semibold mb-4">Assessment Generation</h2>
    
    <div class="mb-4">
      <p class="text-sm text-gray-600 mb-2">
        This demo will generate assessment questions based on the predefined content about JavaScript variables.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Difficulty</Label>
          <select bind:value={assessmentInput.difficulty} class="w-full p-2 border border-gray-300 rounded">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div>
          <Label>Question Count</Label>
          <Input type="number" bind:value={assessmentInput.questionCount} min="1" max="10" />
        </div>
        
        <div>
          <Label>Question Types</Label>
          <div class="flex flex-wrap gap-2 mt-1">
            <label class="flex items-center">
              <input type="checkbox" bind:group={assessmentInput.questionTypes} value="multiple_choice" class="mr-1" />
              Multiple Choice
            </label>
            <label class="flex items-center">
              <input type="checkbox" bind:group={assessmentInput.questionTypes} value="true_false" class="mr-1" />
              True/False
            </label>
          </div>
        </div>
      </div>
    </div>
    
    <Button on:click={generateAssessment} disabled={generatingAssessment}>
      {#if generatingAssessment}
        <Loading size="sm" class="mr-2" />
      {/if}
      Generate Assessment
    </Button>
    
    {#if assessmentResult}
      <div class="mt-4 p-4 bg-gray-50 rounded-md">
        <h3 class="font-semibold mb-2">Generated Assessment:</h3>
        
        {#each assessmentResult.assessment.questions as question, index}
          <div class="mb-4 p-3 bg-white rounded border">
            <p class="font-medium">Question {index + 1}: {question.question_text}</p>
            
            {#if question.type === 'multiple_choice' && question.options}
              <ul class="mt-2 ml-4">
                {#each question.options as option}
                  <li class="list-disc {option === question.correct_answer ? 'font-semibold text-green-600' : ''}">
                    {option}
                  </li>
                {/each}
              </ul>
            {:else if question.type === 'true_false'}
              <p class="mt-2 ml-4">
                <strong>Answer:</strong> 
                <span class="font-semibold text-green-600">{question.correct_answer}</span>
              </p>
            {/if}
            
            <p class="mt-2 text-sm text-gray-600">
              <strong>Explanation:</strong> {question.explanation}
            </p>
          </div>
        {/each}
        
        {#if assessmentResult.metadata.usingFallback}
          <div class="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded">
            <strong>Note:</strong> This assessment was generated using the fallback system.
          </div>
        {/if}
      </div>
    {/if}
  </Card>

  <!-- Roadmap Generation Demo -->
  <Card class="mb-8">
    <h2 class="text-xl font-semibold mb-4">Personalized Roadmap Generation</h2>
    
    <div class="mb-4">
      <p class="text-sm text-gray-600 mb-2">
        This demo will generate a personalized learning roadmap for a beginner JavaScript student.
      </p>
    </div>
    
    <Button on:click={generateRoadmap} disabled={generatingRoadmap}>
      {#if generatingRoadmap}
        <Loading size="sm" class="mr-2" />
      {/if}
      Generate Roadmap
    </Button>
    
    {#if roadmapResult}
      <div class="mt-4 p-4 bg-gray-50 rounded-md">
        <h3 class="font-semibold mb-2">Personalized Learning Roadmap:</h3>
        
        {#if roadmapResult.roadmap.personalization_reasoning}
          <div class="mb-4 p-3 bg-blue-50 rounded">
            <p class="text-sm"><strong>Reasoning:</strong> {roadmapResult.roadmap.personalization_reasoning}</p>
          </div>
        {/if}
        
        <div class="space-y-3">
          {#each roadmapResult.roadmap.learning_path as item, index}
            <div class="p-3 bg-white rounded border">
              <div class="flex items-center justify-between">
                <h4 class="font-medium">Step {index + 1}: {item.title}</h4>
                <span class="text-sm text-gray-500">{item.estimated_time} min</span>
              </div>
              
              {#if item.personalization_notes}
                <p class="text-sm text-gray-600 mt-1">{item.personalization_notes}</p>
              {/if}
              
              {#if item.learning_objectives && item.learning_objectives.length > 0}
                <div class="mt-2">
                  <p class="text-sm font-medium">Objectives:</p>
                  <ul class="text-sm text-gray-600 list-disc list-inside">
                    {#each item.learning_objectives as objective}
                      <li>{objective}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/each}
        </div>
        
        <div class="mt-4 p-3 bg-green-50 rounded">
          <p class="text-sm">
            <strong>Total Estimated Time:</strong> {roadmapResult.roadmap.total_estimated_time} minutes
            ({Math.round(roadmapResult.roadmap.total_estimated_time / 60)} hours)
          </p>
        </div>
        
        {#if roadmapResult.metadata.usingFallback}
          <div class="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded">
            <strong>Note:</strong> This roadmap was generated using the fallback system.
          </div>
        {/if}
      </div>
    {/if}
  </Card>
</div>

<style>
  .container {
    max-width: 1200px;
  }
</style>