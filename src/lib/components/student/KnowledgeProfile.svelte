<!--
  Knowledge Profile Component
  
  This component displays a student's knowledge profile, including
  subject areas, skill levels, knowledge gaps, and recommendations
  for improvement.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import type { KnowledgeProfile, SubjectKnowledge, SkillLevel } from '$lib/types/database.js';
  import type { KnowledgeGap } from '$lib/services/knowledgeAssessment.js';

  // Props
  export let studentId: string;
  export let showActions = true;

  // State
  let knowledgeProfile: KnowledgeProfile | null = null;
  let knowledgeGaps: KnowledgeGap[] = [];
  let isLoading = true;
  let error = '';

  // Reactive values
  $: hasProfile = !!knowledgeProfile;
  $: totalSubjects = knowledgeProfile?.subject_areas.length || 0;
  $: totalSkills = knowledgeProfile?.skill_levels.length || 0;
  $: totalGaps = knowledgeGaps.length;

  onMount(async () => {
    await loadKnowledgeProfile();
  });

  async function loadKnowledgeProfile() {
    try {
      isLoading = true;
      error = '';

      const response = await fetch(`/api/knowledge-assessment/profile/${studentId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load knowledge profile');
      }

      knowledgeProfile = result.data.knowledge_profile;
      knowledgeGaps = result.data.knowledge_gaps || [];

    } catch (err: any) {
      console.error('Error loading knowledge profile:', err);
      error = err.message || 'Failed to load knowledge profile';
    } finally {
      isLoading = false;
    }
  }

  function getDifficultyColor(level: string): string {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getProficiencyColor(level: number): string {
    if (level >= 8) return 'bg-green-500';
    if (level >= 6) return 'bg-yellow-500';
    if (level >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  async function takeKnowledgeAssessment(subjectArea: string) {
    // Navigate to knowledge assessment
    window.location.href = `/knowledge-assessment/${encodeURIComponent(subjectArea)}`;
  }

  async function generatePersonalizedAssessment(subjectArea: string) {
    try {
      const response = await fetch('/api/knowledge-assessment/personalized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectArea })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate assessment');
      }

      // Navigate to the generated assessment
      window.location.href = `/assessments/${result.data.id}/take`;
    } catch (err: any) {
      console.error('Error generating personalized assessment:', err);
      alert(err.message || 'Failed to generate personalized assessment');
    }
  }
</script>

<div class="space-y-6">
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
      <h2 class="text-xl font-semibold mb-2">Error Loading Profile</h2>
      <p class="text-gray-600 mb-4">{error}</p>
      <Button onclick={loadKnowledgeProfile}>
        Try Again
      </Button>
    </Card>
  {:else if !hasProfile}
    <Card class="text-center p-8">
      <div class="text-blue-600 mb-4">
        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold mb-2">No Knowledge Profile</h2>
      <p class="text-gray-600 mb-4">
        Take a knowledge assessment to create your personalized learning profile.
      </p>
      {#if showActions}
        <Button onclick={() => takeKnowledgeAssessment('General')}>
          Take Knowledge Assessment
        </Button>
      {/if}
    </Card>
  {:else}
    <!-- Profile Overview -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold mb-4">Knowledge Profile Overview</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{totalSubjects}</div>
          <div class="text-sm text-blue-600">Subject Areas</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{totalSkills}</div>
          <div class="text-sm text-green-600">Skills Assessed</div>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">{totalGaps}</div>
          <div class="text-sm text-yellow-600">Knowledge Gaps</div>
        </div>
      </div>

      <div class="text-sm text-gray-500">
        Last assessed: {formatDate(knowledgeProfile.last_assessed)}
      </div>
    </Card>

    <!-- Subject Areas -->
    {#if knowledgeProfile.subject_areas.length > 0}
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Subject Areas</h3>
        <div class="space-y-4">
          {#each knowledgeProfile.subject_areas as subject}
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h4 class="font-medium">{subject.subject}</h4>
                  <div class="text-sm text-gray-500">
                    Last updated: {formatDate(subject.last_updated)}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium">
                    {Math.round(subject.proficiency_level * 10)}% Proficiency
                  </div>
                  <ProgressBar 
                    value={subject.proficiency_level * 10} 
                    class="w-24 mt-1"
                  />
                </div>
              </div>

              {#if subject.topics.length > 0}
                <div>
                  <div class="text-sm font-medium mb-2">Topics:</div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {#each subject.topics as topic}
                      <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span class="text-sm">{topic.topic}</span>
                        <div class="flex items-center space-x-2">
                          <span class="text-xs text-gray-500">
                            {Math.round(topic.confidence_level * 10)}%
                          </span>
                          <div class="w-12 h-2 bg-gray-200 rounded-full">
                            <div 
                              class="h-2 rounded-full {getProficiencyColor(topic.confidence_level)}"
                              style="width: {topic.confidence_level * 10}%"
                            ></div>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              {#if showActions}
                <div class="mt-3 flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onclick={() => takeKnowledgeAssessment(subject.subject)}
                  >
                    Retake Assessment
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onclick={() => generatePersonalizedAssessment(subject.subject)}
                  >
                    Personalized Practice
                  </Button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </Card>
    {/if}

    <!-- Skill Levels -->
    {#if knowledgeProfile.skill_levels.length > 0}
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Skill Levels</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each knowledgeProfile.skill_levels as skill}
            <div class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium">{skill.skill}</h4>
                <Badge class={getDifficultyColor(skill.level)}>
                  {skill.level}
                </Badge>
              </div>
              
              {#if skill.evidence.length > 0}
                <div class="text-xs text-gray-500 mb-2">
                  Evidence: {skill.evidence[0]}
                  {#if skill.evidence.length > 1}
                    <span class="text-gray-400">+{skill.evidence.length - 1} more</span>
                  {/if}
                </div>
              {/if}
              
              <div class="text-xs text-gray-400">
                Verified: {formatDate(skill.verified_at)}
              </div>
            </div>
          {/each}
        </div>
      </Card>
    {/if}

    <!-- Knowledge Gaps -->
    {#if knowledgeGaps.length > 0}
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Knowledge Gaps & Recommendations</h3>
        <div class="space-y-4">
          {#each knowledgeGaps as gap}
            <div class="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h4 class="font-medium text-yellow-800">{gap.topic}</h4>
                  <div class="text-sm text-yellow-600">{gap.subject_area}</div>
                </div>
                <Badge class={getDifficultyColor(gap.recommended_difficulty)}>
                  {gap.recommended_difficulty}
                </Badge>
              </div>
              
              <div class="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div class="text-xs text-yellow-600">Proficiency</div>
                  <ProgressBar 
                    value={gap.proficiency_level * 10} 
                    class="mt-1"
                  />
                  <div class="text-xs text-yellow-600 mt-1">
                    {Math.round(gap.proficiency_level * 10)}%
                  </div>
                </div>
                <div>
                  <div class="text-xs text-yellow-600">Confidence</div>
                  <ProgressBar 
                    value={gap.confidence_level * 10} 
                    class="mt-1"
                  />
                  <div class="text-xs text-yellow-600 mt-1">
                    {Math.round(gap.confidence_level * 10)}%
                  </div>
                </div>
              </div>

              {#if gap.prerequisite_skills.length > 0}
                <div class="mb-3">
                  <div class="text-xs font-medium text-yellow-700 mb-1">Prerequisites:</div>
                  <div class="flex flex-wrap gap-1">
                    {#each gap.prerequisite_skills as skill}
                      <Badge class="bg-yellow-100 text-yellow-700 text-xs">
                        {skill}
                      </Badge>
                    {/each}
                  </div>
                </div>
              {/if}

              {#if showActions}
                <Button 
                  size="sm" 
                  variant="outline"
                  onclick={() => generatePersonalizedAssessment(gap.subject_area)}
                >
                  Practice {gap.topic}
                </Button>
              {/if}
            </div>
          {/each}
        </div>
      </Card>
    {/if}
  {/if}
</div>