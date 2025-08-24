<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import CourseAnalytics from '$lib/components/instructor/CourseAnalytics.svelte';
	import StudentPerformanceTracker from '$lib/components/instructor/StudentPerformanceTracker.svelte';
	import ContentRecommendations from '$lib/components/instructor/ContentRecommendations.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { course, profile } = $derived(data);

	let selectedTab = $state('analytics');

	const tabs = [
		{ id: 'analytics', label: 'Course Analytics', icon: 'chart-bar' },
		{ id: 'students', label: 'Student Performance', icon: 'users' },
		{ id: 'recommendations', label: 'Recommendations', icon: 'light-bulb' }
	];

	function getTabIcon(iconName: string): string {
		switch (iconName) {
			case 'chart-bar':
				return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
			case 'users':
				return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z';
			case 'light-bulb':
				return 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z';
			default:
				return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
		}
	}
</script>

<svelte:head>
	<title>Course Analytics - {course?.title || 'Course'} - Personalized LMS</title>
	<meta name="description" content="Analytics and insights for {course?.title || 'your course'}" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div>
					<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
						<button onclick={() => goto('/courses')} class="hover:text-gray-700">Courses</button>
						<span>/</span>
						<button onclick={() => goto(`/courses/${course?.id}`)} class="hover:text-gray-700">{course?.title}</button>
						<span>/</span>
						<span class="text-gray-900">Analytics</span>
					</nav>
					<h1 class="text-3xl font-bold text-gray-900">Course Analytics</h1>
					<p class="mt-1 text-sm text-gray-600">
						Comprehensive insights for "{course?.title}"
					</p>
				</div>
				<div class="flex items-center space-x-4">
					<Button
						variant="outline"
						onclick={() => goto(`/courses/${course?.id}`)}
					>
						Back to Course
					</Button>
					<Button
						variant="secondary"
						onclick={() => goto(`/courses/${course?.id}/edit`)}
					>
						Edit Course
					</Button>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Tab Navigation -->
			<div class="border-b border-gray-200 mb-6">
				<nav class="-mb-px flex space-x-8">
					{#each tabs as tab}
						<button
							class="py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 {selectedTab === tab.id 
								? 'border-blue-500 text-blue-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
							onclick={() => selectedTab = tab.id}
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{getTabIcon(tab.icon)}"></path>
							</svg>
							<span>{tab.label}</span>
						</button>
					{/each}
				</nav>
			</div>

			<!-- Tab Content -->
			{#if selectedTab === 'analytics'}
				<CourseAnalytics courseId={course?.id || ''} courseName={course?.title} />
			{:else if selectedTab === 'students'}
				<StudentPerformanceTracker courseId={course?.id || ''} />
			{:else if selectedTab === 'recommendations'}
				<ContentRecommendations courseId={course?.id || ''} />
			{/if}
		</div>
	</main>
</div>