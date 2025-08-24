<script lang="ts">
  import AssessmentBuilder from '$lib/components/instructor/AssessmentBuilder.svelte';
  import Card from '$lib/components/ui/Card.svelte';

  let testAssessment = {
    title: 'Test Assessment',
    description: 'This is a test assessment',
    // Intentionally not including questions to test the fix
  };

  function handleSave(assessment) {
    console.log('Assessment saved:', assessment);
  }

  function handleCancel() {
    console.log('Assessment cancelled');
  }

  function handlePreview(assessment) {
    console.log('Assessment preview:', assessment);
  }
</script>

<svelte:head>
  <title>Assessment Builder Test</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-6 px-4">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Assessment Builder Test</h1>
    <p class="mt-2 text-gray-600">
      Testing the AssessmentBuilder component with various scenarios.
    </p>
  </div>

  <Card class="p-6">
    <h2 class="text-xl font-semibold mb-4">Test Case: Assessment without questions array</h2>
    <p class="text-gray-600 mb-4">
      This test case passes an assessment object without a questions array to verify the fix.
    </p>
    
    <AssessmentBuilder
      assessment={testAssessment}
      lessonId="test-lesson-id"
      onSave={handleSave}
      onCancel={handleCancel}
      onPreview={handlePreview}
    />
  </Card>
</div>