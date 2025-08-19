<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import LessonEditor from '$lib/components/instructor/LessonEditor.svelte';
	import { toastHelpers } from '$lib/stores/toast.js';

	// Get course ID from query parameters
	let courseId = $state('');

	onMount(() => {
		const urlCourseId = $page.url.searchParams.get('courseId');
		if (!urlCourseId) {
			toastHelpers.error('Course ID is required to create a lesson');
			goto('/dashboard/instructor');
			return;
		}
		courseId = urlCourseId;
	});
</script>

<svelte:head>
	<title>Create New Lesson - Personalized LMS</title>
	<meta name="description" content="Create a new lesson with rich content including text, images, videos, and files." />
</svelte:head>

{#if courseId}
	<LessonEditor {courseId} />
{:else}
	<div class="flex justify-center items-center min-h-screen">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
	</div>
{/if}