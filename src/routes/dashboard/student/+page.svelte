<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import LogoutButton from '$lib/components/auth/LogoutButton.svelte';
	import KnowledgeProfile from '$lib/components/student/KnowledgeProfile.svelte';
	import PersonalizedRoadmap from '$lib/components/student/PersonalizedRoadmap.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { profile } = $derived(data);
	
	// Get active tab from URL params
	let activeTab = $derived($page.url.searchParams.get('tab') || 'overview');
	
	function setActiveTab(tab: string) {
		const url = new URL($page.url);
		url.searchParams.set('tab', tab);
		goto(url.toString(), { replaceState: true });
	}
</script>

<svelte:head>
	<title>Student Dashboard - Personalized LMS</title>
	<meta name="description" content="Your personalized learning dashboard" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Student Dashboard</h1>
					<p class="mt-1 text-sm text-gray-600">
						Welcome back, {profile?.first_name || 'Student'}!
					</p>
				</div>
				<div class="flex items-center space-x-4">
					<Button
						variant="secondary"
						onclick={() => goto('/profile')}
					>
						Profile
					</Button>
					<LogoutButton variant="secondary" />
				</div>
			</div>
		</div>
	</header>

	<!-- Navigation Tabs -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="border-b border-gray-200">
			<nav class="-mb-px flex space-x-8">
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm"
					class:border-blue-500={activeTab === 'overview'}
					class:text-blue-600={activeTab === 'overview'}
					class:border-transparent={activeTab !== 'overview'}
					class:text-gray-500={activeTab !== 'overview'}
					on:click={() => setActiveTab('overview')}
				>
					Overview
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm"
					class:border-blue-500={activeTab === 'knowledge-profile'}
					class:text-blue-600={activeTab === 'knowledge-profile'}
					class:border-transparent={activeTab !== 'knowledge-profile'}
					class:text-gray-500={activeTab !== 'knowledge-profile'}
					on:click={() => setActiveTab('knowledge-profile')}
				>
					Knowledge Profile
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm"
					class:border-blue-500={activeTab === 'courses'}
					class:text-blue-600={activeTab === 'courses'}
					class:border-transparent={activeTab !== 'courses'}
					class:text-gray-500={activeTab !== 'courses'}
					on:click={() => setActiveTab('courses')}
				>
					My Courses
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm"
					class:border-blue-500={activeTab === 'roadmap'}
					class:text-blue-600={activeTab === 'roadmap'}
					class:border-transparent={activeTab !== 'roadmap'}
					class:text-gray-500={activeTab !== 'roadmap'}
					on:click={() => setActiveTab('roadmap')}
				>
					Learning Roadmap
				</button>
			</nav>
		</div>
	</div>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			{#if activeTab === 'overview'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- My Courses -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
								</svg>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">My Courses</dt>
									<dd class="text-lg font-medium text-gray-900">0</dd>
								</dl>
							</div>
						</div>
					</div>
					<div class="bg-gray-50 px-5 py-3">
						<div class="text-sm">
							<Button
								variant="primary"
								size="sm"
								onclick={() => goto('/courses')}
							>
								Browse Courses
							</Button>
						</div>
					</div>
				</div>

				<!-- Progress -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Overall Progress</dt>
									<dd class="text-lg font-medium text-gray-900">0%</dd>
								</dl>
							</div>
						</div>
					</div>
					<div class="bg-gray-50 px-5 py-3">
						<div class="text-sm">
							<span class="text-gray-600">No active courses</span>
						</div>
					</div>
				</div>

				<!-- Assessments -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
								</svg>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Pending Assessments</dt>
									<dd class="text-lg font-medium text-gray-900">0</dd>
								</dl>
							</div>
						</div>
					</div>
					<div class="bg-gray-50 px-5 py-3">
						<div class="text-sm">
							<Button
								variant="primary"
								size="sm"
								onclick={() => goto('/assessments')}
							>
								View Assessments
							</Button>
						</div>
					</div>
				</div>

				<!-- Knowledge Assessment Card -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
								</svg>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Knowledge Profile</dt>
									<dd class="text-lg font-medium text-gray-900">Build Profile</dd>
								</dl>
							</div>
						</div>
					</div>
					<div class="bg-gray-50 px-5 py-3">
						<div class="text-sm">
							<Button
								variant="primary"
								size="sm"
								onclick={() => setActiveTab('knowledge-profile')}
							>
								View Profile
							</Button>
						</div>
					</div>
				</div>
			</div>

			<!-- Recent Activity -->
			<div class="mt-8">
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Recent Activity
						</h3>
						<div class="text-center py-12">
							<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
							</svg>
							<h3 class="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
							<p class="mt-1 text-sm text-gray-500">
								Start by enrolling in a course to see your learning activity here.
							</p>
							<div class="mt-6">
								<Button
									variant="primary"
									onclick={() => goto('/courses')}
								>
									Browse Courses
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
			{:else if activeTab === 'knowledge-profile'}
				<KnowledgeProfile studentId={profile?.id || ''} />
			{:else if activeTab === 'courses'}
				<div class="text-center py-12">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No courses yet</h3>
					<p class="mt-1 text-sm text-gray-500">
						Browse and enroll in courses to start your learning journey.
					</p>
					<div class="mt-6">
						<Button
							variant="primary"
							onclick={() => goto('/courses')}
						>
							Browse Courses
						</Button>
					</div>
				</div>
			{:else if activeTab === 'roadmap'}
				<PersonalizedRoadmap studentId={profile?.id || ''} />
			{/if}
		</div>
	</main>
</div>