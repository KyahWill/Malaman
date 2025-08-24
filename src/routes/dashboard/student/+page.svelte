<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import LogoutButton from '$lib/components/auth/LogoutButton.svelte';
	import KnowledgeProfile from '$lib/components/student/KnowledgeProfile.svelte';
	import PersonalizedRoadmap from '$lib/components/student/PersonalizedRoadmap.svelte';
	import AdaptiveLearningInsights from '$lib/components/student/AdaptiveLearningInsights.svelte';
	import DashboardMetrics from '$lib/components/student/DashboardMetrics.svelte';
	import ProgressVisualization from '$lib/components/student/ProgressVisualization.svelte';
	import NotificationCenter from '$lib/components/student/NotificationCenter.svelte';
	import ContentRecommendations from '$lib/components/student/ContentRecommendations.svelte';
	import EngagementInsights from '$lib/components/student/EngagementInsights.svelte';
	import LearningGoals from '$lib/components/student/LearningGoals.svelte';
	import RecentActivity from '$lib/components/student/RecentActivity.svelte';
	import InteractiveRoadmap from '$lib/components/student/InteractiveRoadmap.svelte';
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
			<nav class="-mb-px flex space-x-8 overflow-x-auto">
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
					class:border-blue-500={activeTab === 'overview'}
					class:text-blue-600={activeTab === 'overview'}
					class:border-transparent={activeTab !== 'overview'}
					class:text-gray-500={activeTab !== 'overview'}
					on:click={() => setActiveTab('overview')}
				>
					Overview
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
					class:border-blue-500={activeTab === 'progress'}
					class:text-blue-600={activeTab === 'progress'}
					class:border-transparent={activeTab !== 'progress'}
					class:text-gray-500={activeTab !== 'progress'}
					on:click={() => setActiveTab('progress')}
				>
					Progress & Analytics
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
					class:border-blue-500={activeTab === 'roadmap'}
					class:text-blue-600={activeTab === 'roadmap'}
					class:border-transparent={activeTab !== 'roadmap'}
					class:text-gray-500={activeTab !== 'roadmap'}
					on:click={() => setActiveTab('roadmap')}
				>
					Learning Roadmap
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
					class:border-blue-500={activeTab === 'goals'}
					class:text-blue-600={activeTab === 'goals'}
					class:border-transparent={activeTab !== 'goals'}
					class:text-gray-500={activeTab !== 'goals'}
					on:click={() => setActiveTab('goals')}
				>
					Goals & Achievements
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
					class:border-blue-500={activeTab === 'notifications'}
					class:text-blue-600={activeTab === 'notifications'}
					class:border-transparent={activeTab !== 'notifications'}
					class:text-gray-500={activeTab !== 'notifications'}
					on:click={() => setActiveTab('notifications')}
				>
					Notifications
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
					class:border-blue-500={activeTab === 'recommendations'}
					class:text-blue-600={activeTab === 'recommendations'}
					class:border-transparent={activeTab !== 'recommendations'}
					class:text-gray-500={activeTab !== 'recommendations'}
					on:click={() => setActiveTab('recommendations')}
				>
					Recommendations
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
					class:border-blue-500={activeTab === 'knowledge-profile'}
					class:text-blue-600={activeTab === 'knowledge-profile'}
					class:border-transparent={activeTab !== 'knowledge-profile'}
					class:text-gray-500={activeTab !== 'knowledge-profile'}
					on:click={() => setActiveTab('knowledge-profile')}
				>
					Knowledge Profile
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
					class:border-blue-500={activeTab === 'courses'}
					class:text-blue-600={activeTab === 'courses'}
					class:border-transparent={activeTab !== 'courses'}
					class:text-gray-500={activeTab !== 'courses'}
					on:click={() => setActiveTab('courses')}
				>
					My Courses
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
					class:border-blue-500={activeTab === 'adaptive'}
					class:text-blue-600={activeTab === 'adaptive'}
					class:border-transparent={activeTab !== 'adaptive'}
					class:text-gray-500={activeTab !== 'adaptive'}
					on:click={() => setActiveTab('adaptive')}
				>
					Learning Insights
				</button>
			</nav>
		</div>
	</div>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			{#if activeTab === 'overview'}
				<div class="space-y-8">
					<!-- Dashboard Metrics -->
					<DashboardMetrics studentId={profile?.id || ''} />
					
					<!-- Recent Activity -->
					<RecentActivity studentId={profile?.id || ''} limit={5} />
				</div>

			{:else if activeTab === 'progress'}
				<div class="space-y-8">
					<!-- Progress Visualization -->
					<ProgressVisualization studentId={profile?.id || ''} />
				</div>

			{:else if activeTab === 'roadmap'}
				<div class="space-y-8">
					<!-- Interactive Roadmap -->
					<InteractiveRoadmap studentId={profile?.id || ''} />
					
					<!-- Original Roadmap Component for comparison -->
					<div class="mt-8">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">Alternative View</h2>
						<PersonalizedRoadmap studentId={profile?.id || ''} />
					</div>
				</div>

			{:else if activeTab === 'goals'}
				<div class="space-y-8">
					<!-- Learning Goals -->
					<LearningGoals studentId={profile?.id || ''} />
				</div>

			{:else if activeTab === 'notifications'}
				<div class="space-y-8">
					<!-- Notification Center -->
					<NotificationCenter studentId={profile?.id || ''} />
				</div>

			{:else if activeTab === 'recommendations'}
				<div class="space-y-8">
					<!-- Content Recommendations -->
					<ContentRecommendations limit={8} showExplanations={true} />
					
					<!-- Engagement Insights -->
					<EngagementInsights />
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

			{:else if activeTab === 'adaptive'}
				<div class="space-y-6">
					<AdaptiveLearningInsights 
						studentId={profile?.id || ''} 
						showAlternativePaths={true}
					/>
				</div>
			{/if}
		</div>
	</main>
</div>