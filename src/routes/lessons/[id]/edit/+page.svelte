<script lang="ts">
	import type { PageData } from './$types';
	import LessonEditor from '$lib/components/instructor/LessonEditor.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Edit Lesson: {data.lesson.title} - Personalized LMS</title>
	<meta name="description" content="Edit lesson content and structure." />
</svelte:head>

<LessonEditor
	lesson={data.lesson}
	courseId={data.lesson.course_id}
	isEditing={true}
/>