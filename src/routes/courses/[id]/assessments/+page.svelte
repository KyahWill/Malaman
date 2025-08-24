<script lang="ts">
    import { goto } from '$app/navigation';
    import Button from '$lib/components/ui/Button.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    import { toastHelpers as toast } from '$lib/stores/toast.js';
    import type { Assessment, Course } from '$lib/types';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';
  
    let { data }: { data: PageData } = $props();
	  let { course, assessments } = $derived(data);

    onMount(()=>{
      console.log(course)
    })
      $effect(() => console.log(course))
    async function deleteAssessment(assessmentId: string) {
      if (!confirm('Are you sure you want to delete this assessment?')) {
        return;
      }
  
      try {
        const response = await fetch(`/api/assessments/${assessmentId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete assessment');
        }
  
        toast.success('Assessment deleted successfully');
        assessments = assessments.filter(a => a.id !== assessmentId);
      } catch (error) {
        console.error('Error deleting assessment:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete assessment');
      }
    }
  </script>
  
  <svelte:head>
    <title>Manage Assessments for {course.title}</title>
  </svelte:head>
  
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Manage Assessments</h1>
        <p class="text-gray-600">For course: {course.title}</p>
      </div>
      <Button onclick={() => goto(`/assessments/create?courseId=${course.id}`)}>
        Create New Assessment
      </Button>
    </div>
  
    <Card>
      {#if assessments.length > 0}
        <ul class="divide-y divide-gray-200">
          {#each assessments as assessment}
            <li class="p-4 flex justify-between items-center">
              <div>
                <h3 class="font-semibold">{assessment.title}</h3>
                <p class="text-sm text-gray-500">{assessment.questions.length} questions</p>
              </div>
              <div class="flex space-x-2">
                <Button size="sm" variant="outline" onclick={() => goto(`/assessments/${assessment.id}/edit`)}>
                  Edit
                </Button>
                <Button size="sm" variant="secondary" onclick={() => deleteAssessment(assessment.id)}>
                  Delete
                </Button>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="text-center py-12">
          <h2 class="text-xl font-semibold">No assessments found for this course.</h2>
          <p class="text-gray-500 mt-2">
            Get started by creating a new assessment.
          </p>
          <Button class="mt-4" onclick={() => goto(`/assessments/create?courseId=${course.id}`)}>
            Create Assessment
          </Button>
        </div>
      {/if}
    </Card>
  </div>