<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import type { CourseAnalytics } from '$lib/services/instructorAnalytics.js';

	let { courseId, courseName }: { courseId: string; courseName?: string } = $props();

	let analytics = $state<CourseAnalytics | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let selectedTab = $state('overview');

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: 'chart-bar' },
		{ id: 'students', label: 'Student Performance', icon: 'users' },
		{ id: 'content', label: 'Content Effectiveness', icon: 'document-text' },
		{ id: 'engagement', label: 'Engagement', icon: 'heart' },
		{ id: 'recommendations', label: 'Recommendations', icon: 'light-bulb' }
	];

	onMount(async () => {
		await loadAnalytics();
	});

	async function loadAnalytics() {
		try {
			isLoading = true;
			error = null;

			const response = await fetch(`/api/courses/${courseId}/analytics/detailed`);
			if (!response.ok) {
				throw new Error('Failed to load course analytics');
			}

			const data = await response.json();
			analytics = data.analytics;
		} catch (err) {
			console.error('Error loading course analytics:', err);
			error = err instanceof Error ? err.message : 'Failed to load analytics';
		} finally {
			isLoading = false;
		}
	}

	function formatPercentage(value: number): string {
		return `${Math.round(value * 100) / 100}%`;
	}

	function formatNumber(value: number): string {
		return new Intl.NumberFormat().format(value);
	}

	function formatDuration(minutes: number): string {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	}

	function getScoreColor(score: number): string {
		if (score >= 85) return 'text-green-600';
		if (score >= 70) return 'text-yellow-600';
		return 'text-red-600';
	}

	function getCompletionColor(rate: number): string {
		if (rate >= 80) return 'bg-green-500';
		if (rate >= 60) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-800 border-red-200';
			case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
			default: return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function getRecommendationIcon(type: string): string {
		switch (type) {
			case 'improvement': return 'M13 10V3L4 14h7v7l9-11h-7z';
			case 'optimization': return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z';
			case 'engagement': return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
			case 'difficulty': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z';
			default: return 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z';
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-bold text-gray-900">Course Analytics</h2>
			{#if courseName}
				<p class="text-sm text-gray-600 mt-1">{courseName}</p>
			{/if}
		</div>
		<div class="flex space-x-2">
			<Button variant="outline" size="sm" onclick={loadAnalytics}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
				</svg>
				Refresh
			</Button>
			<Button variant="outline" size="sm">
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
				</svg>
				Export Report
			</Button>
		</div>
	</div>

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
			<h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Analytics</h3>
			<p class="text-gray-600 mb-4">{error}</p>
			<Button onclick={loadAnalytics}>Try Again</Button>
		</Card>
	{:else if analytics}
		<!-- Tab Navigation -->
		<div class="border-b border-gray-200">
			<nav class="-mb-px flex space-x-8">
				{#each tabs as tab}
					<button
						class="py-2 px-1 border-b-2 font-medium text-sm {selectedTab === tab.id 
							? 'border-blue-500 text-blue-600' 
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						onclick={() => selectedTab = tab.id}
					>
						{tab.label}
					</button>
				{/each}
			</nav>
		</div>

		<!-- Tab Content -->
		{#if selectedTab === 'overview'}
			<!-- Overview Tab -->
			<div class="space-y-6">
				<!-- Key Metrics -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Card class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">Total Enrollments</p>
								<p class="text-2xl font-semibold text-gray-900">{formatNumber(analytics.overview.total_enrollments)}</p>
							</div>
						</div>
					</Card>

					<Card class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">Completion Rate</p>
								<p class="text-2xl font-semibold {getScoreColor(analytics.overview.completion_rate)}">{formatPercentage(analytics.overview.completion_rate)}</p>
							</div>
						</div>
					</Card>

					<Card class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">Average Score</p>
								<p class="text-2xl font-semibold {getScoreColor(analytics.overview.average_score)}">{formatPercentage(analytics.overview.average_score)}</p>
							</div>
						</div>
					</Card>

					<Card class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">Engagement Rate</p>
								<p class="text-2xl font-semibold {getScoreColor(analytics.overview.engagement_rate)}">{formatPercentage(analytics.overview.engagement_rate)}</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- Additional Overview Metrics -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card class="p-6">
						<h4 class="text-lg font-medium text-gray-900 mb-4">Active Students</h4>
						<div class="text-center">
							<p class="text-3xl font-bold text-blue-600">{formatNumber(analytics.overview.active_students)}</p>
							<p class="text-sm text-gray-500 mt-1">out of {formatNumber(analytics.overview.total_enrollments)} enrolled</p>
						</div>
					</Card>

					<Card class="p-6">
						<h4 class="text-lg font-medium text-gray-900 mb-4">Average Progress</h4>
						<div class="text-center">
							<p class="text-3xl font-bold text-green-600">{formatPercentage(analytics.overview.average_progress)}</p>
							<ProgressBar value={analytics.overview.average_progress} class="mt-2" />
						</div>
					</Card>

					<Card class="p-6">
						<h4 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
						<div class="text-center">
							<p class="text-3xl font-bold text-purple-600">{formatNumber(analytics.overview.recent_enrollments)}</p>
							<p class="text-sm text-gray-500 mt-1">new enrollments (30 days)</p>
						</div>
					</Card>
				</div>
			</div>

		{:else if selectedTab === 'students'}
			<!-- Student Performance Tab -->
			<div class="space-y-6">
				<!-- Performance Overview -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Card class="p-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">High Performers</h4>
						<p class="text-2xl font-semibold text-green-600">{formatNumber(analytics.student_performance.high_performers)}</p>
						<p class="text-xs text-gray-500 mt-1">85%+ average score</p>
					</Card>

					<Card class="p-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">Struggling Students</h4>
						<p class="text-2xl font-semibold text-red-600">{formatNumber(analytics.student_performance.struggling_students)}</p>
						<p class="text-xs text-gray-500 mt-1">&lt;60% average score</p>
					</Card>

					<Card class="p-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">Avg. Completion Time</h4>
						<p class="text-2xl font-semibold text-blue-600">{formatDuration(analytics.student_performance.average_time_to_complete)}</p>
						<p class="text-xs text-gray-500 mt-1">per student</p>
					</Card>

					<Card class="p-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">Dropout Rate</h4>
						<p class="text-2xl font-semibold text-orange-600">{formatPercentage(analytics.student_performance.dropout_rate)}</p>
						<p class="text-xs text-gray-500 mt-1">students who left</p>
					</Card>
				</div>

				<!-- Score Distribution -->
				<Card class="p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Score Distribution</h3>
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-700">Excellent (90-100%)</span>
							<div class="flex items-center space-x-2">
								<div class="w-32 bg-gray-200 rounded-full h-2">
									<div class="bg-green-500 h-2 rounded-full" style="width: {(analytics.student_performance.score_distribution.excellent / analytics.overview.total_enrollments) * 100}%"></div>
								</div>
								<span class="text-sm text-gray-600">{formatNumber(analytics.student_performance.score_distribution.excellent)}</span>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-700">Good (80-89%)</span>
							<div class="flex items-center space-x-2">
								<div class="w-32 bg-gray-200 rounded-full h-2">
									<div class="bg-blue-500 h-2 rounded-full" style="width: {(analytics.student_performance.score_distribution.good / analytics.overview.total_enrollments) * 100}%"></div>
								</div>
								<span class="text-sm text-gray-600">{formatNumber(analytics.student_performance.score_distribution.good)}</span>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-700">Satisfactory (70-79%)</span>
							<div class="flex items-center space-x-2">
								<div class="w-32 bg-gray-200 rounded-full h-2">
									<div class="bg-yellow-500 h-2 rounded-full" style="width: {(analytics.student_performance.score_distribution.satisfactory / analytics.overview.total_enrollments) * 100}%"></div>
								</div>
								<span class="text-sm text-gray-600">{formatNumber(analytics.student_performance.score_distribution.satisfactory)}</span>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-700">Needs Improvement (60-69%)</span>
							<div class="flex items-center space-x-2">
								<div class="w-32 bg-gray-200 rounded-full h-2">
									<div class="bg-orange-500 h-2 rounded-full" style="width: {(analytics.student_performance.score_distribution.needs_improvement / analytics.overview.total_enrollments) * 100}%"></div>
								</div>
								<span class="text-sm text-gray-600">{formatNumber(analytics.student_performance.score_distribution.needs_improvement)}</span>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-700">Failing (&lt;60%)</span>
							<div class="flex items-center space-x-2">
								<div class="w-32 bg-gray-200 rounded-full h-2">
									<div class="bg-red-500 h-2 rounded-full" style="width: {(analytics.student_performance.score_distribution.failing / analytics.overview.total_enrollments) * 100}%"></div>
								</div>
								<span class="text-sm text-gray-600">{formatNumber(analytics.student_performance.score_distribution.failing)}</span>
							</div>
						</div>
					</div>
				</Card>
			</div>

		{:else if selectedTab === 'content'}
			<!-- Content Effectiveness Tab -->
			<div class="space-y-6">
				<!-- Lesson Performance -->
				<Card class="p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Lesson Completion Rates</h3>
					{#if analytics.content_effectiveness.lesson_completion_rates.length > 0}
						<div class="space-y-4">
							{#each analytics.content_effectiveness.lesson_completion_rates as lesson}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900">{lesson.lesson_title}</h4>
										<div class="flex items-center space-x-4 mt-1">
											<span class="text-sm text-gray-500">Avg. time: {formatDuration(lesson.average_time_spent)}</span>
											<span class="text-sm text-gray-500">Difficulty: {lesson.difficulty_rating}/5</span>
										</div>
									</div>
									<div class="text-right">
										<p class="text-sm font-medium {getScoreColor(lesson.completion_rate)}">{formatPercentage(lesson.completion_rate)}</p>
										<div class="w-20 bg-gray-200 rounded-full h-2 mt-1">
											<div class="{getCompletionColor(lesson.completion_rate)} h-2 rounded-full" style="width: {lesson.completion_rate}%"></div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-gray-500 text-center py-8">No lesson data available</p>
					{/if}
				</Card>

				<!-- Assessment Performance -->
				<Card class="p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Assessment Performance</h3>
					{#if analytics.content_effectiveness.assessment_performance.length > 0}
						<div class="space-y-4">
							{#each analytics.content_effectiveness.assessment_performance as assessment}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900">{assessment.assessment_title}</h4>
										<div class="flex items-center space-x-4 mt-1">
											<span class="text-sm text-gray-500">Avg. attempts: {assessment.average_attempts}</span>
											<span class="text-sm text-gray-500">Time: {formatDuration(assessment.time_to_complete)}</span>
										</div>
									</div>
									<div class="text-right">
										<div class="flex space-x-4">
											<div>
												<p class="text-xs text-gray-500">Pass Rate</p>
												<p class="text-sm font-medium {getScoreColor(assessment.pass_rate)}">{formatPercentage(assessment.pass_rate)}</p>
											</div>
											<div>
												<p class="text-xs text-gray-500">Avg. Score</p>
												<p class="text-sm font-medium {getScoreColor(assessment.average_score)}">{formatPercentage(assessment.average_score)}</p>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-gray-500 text-center py-8">No assessment data available</p>
					{/if}
				</Card>
			</div>

		{:else if selectedTab === 'engagement'}
			<!-- Engagement Tab -->
			<div class="space-y-6">
				<Card class="p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Engagement Patterns</h3>
					<div class="text-center py-12">
						<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
						</svg>
						<h3 class="mt-2 text-sm font-medium text-gray-900">Engagement Analytics Coming Soon</h3>
						<p class="mt-1 text-sm text-gray-500">
							Detailed engagement patterns and activity tracking will be available once interaction tracking is implemented.
						</p>
					</div>
				</Card>
			</div>

		{:else if selectedTab === 'recommendations'}
			<!-- Recommendations Tab -->
			<div class="space-y-6">
				{#if analytics.recommendations.length > 0}
					<div class="space-y-4">
						{#each analytics.recommendations as recommendation}
							<Card class="p-6 border-l-4 {recommendation.priority === 'high' ? 'border-red-500' : recommendation.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'}">
								<div class="flex items-start space-x-4">
									<div class="flex-shrink-0">
										<div class="w-10 h-10 rounded-lg {getPriorityColor(recommendation.priority)} flex items-center justify-center">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{getRecommendationIcon(recommendation.type)}"></path>
											</svg>
										</div>
									</div>
									<div class="flex-1">
										<div class="flex items-center justify-between">
											<h4 class="text-lg font-medium text-gray-900">{recommendation.title}</h4>
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getPriorityColor(recommendation.priority)}">
												{recommendation.priority} priority
											</span>
										</div>
										<p class="text-gray-600 mt-1">{recommendation.description}</p>
										
										<div class="mt-4">
											<h5 class="text-sm font-medium text-gray-900 mb-2">Suggested Actions:</h5>
											<ul class="list-disc list-inside space-y-1">
												{#each recommendation.suggested_actions as action}
													<li class="text-sm text-gray-600">{action}</li>
												{/each}
											</ul>
										</div>
										
										<div class="mt-4 p-3 bg-blue-50 rounded-lg">
											<p class="text-sm text-blue-800">
												<strong>Expected Impact:</strong> {recommendation.expected_impact}
											</p>
										</div>
									</div>
								</div>
							</Card>
						{/each}
					</div>
				{:else}
					<Card class="p-6">
						<div class="text-center py-12">
							<svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<h3 class="mt-2 text-sm font-medium text-gray-900">Great Job!</h3>
							<p class="mt-1 text-sm text-gray-500">
								Your course is performing well. No immediate recommendations at this time.
							</p>
						</div>
					</Card>
				{/if}
			</div>
		{/if}
	{/if}
</div>