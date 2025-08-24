<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import type { ContentRecommendation } from '$lib/services/instructorAnalytics.js';

	let { courseId }: { courseId: string } = $props();

	let recommendations = $state<ContentRecommendation[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let selectedPriority = $state('all');
	let selectedType = $state('all');

	const priorityFilters = [
		{ value: 'all', label: 'All Priorities' },
		{ value: 'high', label: 'High Priority' },
		{ value: 'medium', label: 'Medium Priority' },
		{ value: 'low', label: 'Low Priority' }
	];

	const typeFilters = [
		{ value: 'all', label: 'All Types' },
		{ value: 'improvement', label: 'Improvements' },
		{ value: 'optimization', label: 'Optimizations' },
		{ value: 'engagement', label: 'Engagement' },
		{ value: 'difficulty', label: 'Difficulty' }
	];

	onMount(async () => {
		await loadRecommendations();
	});

	async function loadRecommendations() {
		try {
			isLoading = true;
			error = null;

			const response = await fetch(`/api/courses/${courseId}/recommendations`);
			if (!response.ok) {
				throw new Error('Failed to load recommendations');
			}

			const data = await response.json();
			recommendations = data.recommendations || [];
		} catch (err) {
			console.error('Error loading recommendations:', err);
			error = err instanceof Error ? err.message : 'Failed to load recommendations';
		} finally {
			isLoading = false;
		}
	}

	let filteredRecommendations = $derived(() => {
		let filtered = recommendations;

		if (selectedPriority !== 'all') {
			filtered = filtered.filter(r => r.priority === selectedPriority);
		}

		if (selectedType !== 'all') {
			filtered = filtered.filter(r => r.type === selectedType);
		}

		// Sort by priority (high -> medium -> low)
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

		return filtered;
	});

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-800 border-red-200';
			case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
			default: return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function getTypeIcon(type: string): string {
		switch (type) {
			case 'improvement':
				return 'M13 10V3L4 14h7v7l9-11h-7z';
			case 'optimization':
				return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z';
			case 'engagement':
				return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
			case 'difficulty':
				return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z';
			default:
				return 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z';
		}
	}

	function getTypeColor(type: string): string {
		switch (type) {
			case 'improvement': return 'text-red-600';
			case 'optimization': return 'text-blue-600';
			case 'engagement': return 'text-purple-600';
			case 'difficulty': return 'text-orange-600';
			default: return 'text-gray-600';
		}
	}

	function getTypeLabel(type: string): string {
		switch (type) {
			case 'improvement': return 'Improvement';
			case 'optimization': return 'Optimization';
			case 'engagement': return 'Engagement';
			case 'difficulty': return 'Difficulty';
			default: return 'General';
		}
	}

	async function markAsImplemented(recommendationIndex: number) {
		// This would typically update the backend to track implemented recommendations
		recommendations = recommendations.filter((_, index) => index !== recommendationIndex);
	}

	async function dismissRecommendation(recommendationIndex: number) {
		// This would typically update the backend to track dismissed recommendations
		recommendations = recommendations.filter((_, index) => index !== recommendationIndex);
	}

	async function viewContent(contentId: string) {
		if (contentId) {
			window.location.href = `/lessons/${contentId}/edit`;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header and Filters -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
		<div>
			<h3 class="text-lg font-medium text-gray-900">Content Recommendations</h3>
			<p class="text-sm text-gray-600">AI-powered suggestions to improve your course content</p>
		</div>
		<Button variant="outline" onclick={loadRecommendations}>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
			</svg>
			Refresh
		</Button>
	</div>

	<!-- Filters -->
	<Card class="p-4">
		<div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
				<select
					class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					bind:value={selectedPriority}
				>
					{#each priorityFilters as filter}
						<option value={filter.value}>{filter.label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
				<select
					class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					bind:value={selectedType}
				>
					{#each typeFilters as filter}
						<option value={filter.value}>{filter.label}</option>
					{/each}
				</select>
			</div>
		</div>
	</Card>

	{#if isLoading}
		<div class="flex justify-center py-12">
			<Loading size="lg" />
		</div>
	{:else if error}
		<Card variant="outlined" class="p-6 text-center">
			<div class="text-red-600 mb-4">
				<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Recommendations</h3>
			<p class="text-gray-600 mb-4">{error}</p>
			<Button onclick={loadRecommendations}>Try Again</Button>
		</Card>
	{:else if filteredRecommendations.length === 0}
		<Card class="p-6 text-center">
			<svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">Great Job!</h3>
			<p class="mt-1 text-sm text-gray-500">
				{selectedPriority !== 'all' || selectedType !== 'all' 
					? 'No recommendations match your current filters.' 
					: 'Your course is performing well. No recommendations at this time.'}
			</p>
		</Card>
	{:else}
		<!-- Recommendations List -->
		<div class="space-y-4">
			{#each filteredRecommendations as recommendation, index}
				<Card class="p-6 border-l-4 {recommendation.priority === 'high' ? 'border-red-500' : recommendation.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'}">
					<div class="flex items-start justify-between">
						<div class="flex items-start space-x-4 flex-1">
							<!-- Icon -->
							<div class="flex-shrink-0 mt-1">
								<div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
									<svg class="w-5 h-5 {getTypeColor(recommendation.type)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{getTypeIcon(recommendation.type)}"></path>
									</svg>
								</div>
							</div>

							<!-- Content -->
							<div class="flex-1">
								<div class="flex items-center space-x-2 mb-2">
									<h4 class="text-lg font-medium text-gray-900">{recommendation.title}</h4>
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getPriorityColor(recommendation.priority)}">
										{recommendation.priority} priority
									</span>
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
										{getTypeLabel(recommendation.type)}
									</span>
								</div>
								
								<p class="text-gray-600 mb-4">{recommendation.description}</p>
								
								<!-- Suggested Actions -->
								<div class="mb-4">
									<h5 class="text-sm font-medium text-gray-900 mb-2">Suggested Actions:</h5>
									<ul class="list-disc list-inside space-y-1">
										{#each recommendation.suggested_actions as action}
											<li class="text-sm text-gray-600">{action}</li>
										{/each}
									</ul>
								</div>
								
								<!-- Expected Impact -->
								<div class="p-3 bg-blue-50 rounded-lg mb-4">
									<p class="text-sm text-blue-800">
										<strong>Expected Impact:</strong> {recommendation.expected_impact}
									</p>
								</div>
							</div>
						</div>

						<!-- Actions -->
						<div class="flex flex-col space-y-2 ml-4">
							{#if recommendation.content_id}
								<Button
									variant="primary"
									size="sm"
									onclick={() => viewContent(recommendation.content_id)}
								>
									View Content
								</Button>
							{/if}
							<Button
								variant="outline"
								size="sm"
								onclick={() => markAsImplemented(index)}
							>
								Mark as Done
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => dismissRecommendation(index)}
							>
								Dismiss
							</Button>
						</div>
					</div>
				</Card>
			{/each}
		</div>

		<!-- Summary -->
		<Card class="p-6 bg-gray-50">
			<h4 class="text-lg font-medium text-gray-900 mb-4">Recommendation Summary</h4>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div class="text-center">
					<p class="text-2xl font-bold text-red-600">
						{recommendations.filter(r => r.priority === 'high').length}
					</p>
					<p class="text-sm text-gray-600">High Priority</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-yellow-600">
						{recommendations.filter(r => r.priority === 'medium').length}
					</p>
					<p class="text-sm text-gray-600">Medium Priority</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-blue-600">
						{recommendations.filter(r => r.priority === 'low').length}
					</p>
					<p class="text-sm text-gray-600">Low Priority</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-gray-600">
						{recommendations.length}
					</p>
					<p class="text-sm text-gray-600">Total</p>
				</div>
			</div>
		</Card>
	{/if}
</div>