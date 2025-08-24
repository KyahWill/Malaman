<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import type { InstructorDashboardData, CoursePerformance, StudentAlert, ContentInsight } from '$lib/services/instructorAnalytics.js';

	let { instructorId }: { instructorId: string } = $props();

	let dashboardData = $state<InstructorDashboardData | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let selectedTimeRange = $state('30d');

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			isLoading = true;
			error = null;

			const response = await fetch(`/api/instructor/analytics?instructor_id=${instructorId}&range=${selectedTimeRange}`);
			if (!response.ok) {
				throw new Error('Failed to load analytics data');
			}

			dashboardData = await response.json();
		} catch (err) {
			console.error('Error loading dashboard data:', err);
			error = err instanceof Error ? err.message : 'Failed to load analytics';
		} finally {
			isLoading = false;
		}
	}

	function getAlertSeverityColor(severity: string) {
		switch (severity) {
			case 'high': return 'bg-red-100 text-red-800 border-red-200';
			case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
			default: return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function getInsightTypeColor(type: string) {
		switch (type) {
			case 'high_dropout': return 'bg-red-100 text-red-800';
			case 'low_engagement': return 'bg-yellow-100 text-yellow-800';
			case 'difficult_content': return 'bg-orange-100 text-orange-800';
			case 'popular_content': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function formatPercentage(value: number): string {
		return `${Math.round(value * 100) / 100}%`;
	}

	function formatNumber(value: number): string {
		return new Intl.NumberFormat().format(value);
	}

	async function handleTimeRangeChange(range: string) {
		selectedTimeRange = range;
		await loadDashboardData();
	}
</script>

<div class="space-y-6">
	<!-- Header with Time Range Selector -->
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
			<p class="text-sm text-gray-600 mt-1">Comprehensive insights into your teaching performance</p>
		</div>
		<div class="flex space-x-2">
			{#each [
				{ value: '7d', label: '7 Days' },
				{ value: '30d', label: '30 Days' },
				{ value: '90d', label: '90 Days' },
				{ value: '1y', label: '1 Year' }
			] as range}
				<Button
					variant={selectedTimeRange === range.value ? 'primary' : 'outline'}
					size="sm"
					onclick={() => handleTimeRangeChange(range.value)}
				>
					{range.label}
				</Button>
			{/each}
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
			<Button onclick={loadDashboardData}>Try Again</Button>
		</Card>
	{:else if dashboardData}
		<!-- Overview Metrics -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<Card class="p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-500">Total Courses</p>
						<p class="text-2xl font-semibold text-gray-900">{formatNumber(dashboardData.overview.total_courses)}</p>
					</div>
				</div>
			</Card>

			<Card class="p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-500">Total Students</p>
						<p class="text-2xl font-semibold text-gray-900">{formatNumber(dashboardData.overview.total_students)}</p>
					</div>
				</div>
			</Card>

			<Card class="p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-500">Total Assessments</p>
						<p class="text-2xl font-semibold text-gray-900">{formatNumber(dashboardData.overview.total_assessments)}</p>
					</div>
				</div>
			</Card>

			<Card class="p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-500">Pending Reviews</p>
						<p class="text-2xl font-semibold text-gray-900">{formatNumber(dashboardData.overview.pending_reviews)}</p>
					</div>
				</div>
			</Card>
		</div>

		<!-- Recent Activity -->
		<Card class="p-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity (Last 7 Days)</h3>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div class="text-center">
					<p class="text-2xl font-semibold text-blue-600">{formatNumber(dashboardData.recent_activity.new_enrollments)}</p>
					<p class="text-sm text-gray-500">New Enrollments</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-semibold text-green-600">{formatNumber(dashboardData.recent_activity.completed_assessments)}</p>
					<p class="text-sm text-gray-500">Completed Assessments</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-semibold text-purple-600">{formatNumber(dashboardData.recent_activity.student_messages)}</p>
					<p class="text-sm text-gray-500">Student Messages</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-semibold text-orange-600">{formatNumber(dashboardData.recent_activity.course_views)}</p>
					<p class="text-sm text-gray-500">Course Views</p>
				</div>
			</div>
		</Card>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Top Performing Courses -->
			<Card class="p-6">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-medium text-gray-900">Top Performing Courses</h3>
					<Button variant="ghost" size="sm">View All</Button>
				</div>
				
				{#if dashboardData.top_performing_courses.length > 0}
					<div class="space-y-4">
						{#each dashboardData.top_performing_courses.slice(0, 5) as course}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<div class="flex-1">
									<h4 class="font-medium text-gray-900 truncate">{course.course_title}</h4>
									<div class="flex items-center space-x-4 mt-1">
										<span class="text-sm text-gray-500">{formatNumber(course.enrollment_count)} students</span>
										<span class="text-sm text-gray-500">Avg: {formatPercentage(course.average_score)}</span>
									</div>
								</div>
								<div class="text-right">
									<p class="text-sm font-medium text-green-600">{formatPercentage(course.completion_rate)}</p>
									<p class="text-xs text-gray-500">completion</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<p class="text-gray-500">No course data available</p>
					</div>
				{/if}
			</Card>

			<!-- Student Alerts -->
			<Card class="p-6">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-medium text-gray-900">Student Alerts</h3>
					<Button variant="ghost" size="sm">View All</Button>
				</div>
				
				{#if dashboardData.struggling_students.length > 0}
					<div class="space-y-3">
						{#each dashboardData.struggling_students.slice(0, 5) as alert}
							<div class="flex items-start space-x-3 p-3 border rounded-lg {getAlertSeverityColor(alert.severity)}">
								<div class="flex-shrink-0 mt-1">
									{#if alert.severity === 'high'}
										<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
										</svg>
									{:else}
										<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
										</svg>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium">{alert.student_name}</p>
									<p class="text-xs text-gray-600 truncate">{alert.course_title}</p>
									<p class="text-xs mt-1">{alert.suggested_action}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<svg class="mx-auto h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<p class="text-gray-500 mt-2">No student alerts</p>
						<p class="text-xs text-gray-400">All students are performing well!</p>
					</div>
				{/if}
			</Card>
		</div>

		<!-- Content Insights -->
		<Card class="p-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Content Insights</h3>
			
			{#if dashboardData.content_insights.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each dashboardData.content_insights as insight}
						<div class="p-4 border rounded-lg">
							<div class="flex items-center justify-between mb-2">
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getInsightTypeColor(insight.insight_type)}">
									{insight.insight_type.replace('_', ' ')}
								</span>
								<span class="text-sm font-medium text-gray-900">
									{insight.insight_type === 'high_dropout' || insight.insight_type === 'low_engagement' 
										? formatPercentage(insight.metric_value)
										: formatNumber(insight.metric_value)
									}
								</span>
							</div>
							<h4 class="font-medium text-gray-900 mb-1 truncate">{insight.content_title}</h4>
							<p class="text-sm text-gray-600">{insight.recommendation}</p>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8">
					<svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
					</svg>
					<p class="text-gray-500 mt-2">No content insights available</p>
					<p class="text-xs text-gray-400">Insights will appear as you gather more data</p>
				</div>
			{/if}
		</Card>

		<!-- Action Items -->
		<Card class="p-6 bg-blue-50 border-blue-200">
			<h3 class="text-lg font-medium text-blue-900 mb-4">Recommended Actions</h3>
			<div class="space-y-3">
				{#if dashboardData.overview.pending_reviews > 0}
					<div class="flex items-center justify-between p-3 bg-white rounded-lg border">
						<div>
							<p class="font-medium text-gray-900">Review Pending Assessments</p>
							<p class="text-sm text-gray-600">{dashboardData.overview.pending_reviews} assessments need your review</p>
						</div>
						<Button variant="primary" size="sm">Review Now</Button>
					</div>
				{/if}
				
				{#if dashboardData.struggling_students.length > 0}
					<div class="flex items-center justify-between p-3 bg-white rounded-lg border">
						<div>
							<p class="font-medium text-gray-900">Support Struggling Students</p>
							<p class="text-sm text-gray-600">{dashboardData.struggling_students.length} students may need additional help</p>
						</div>
						<Button variant="secondary" size="sm">View Students</Button>
					</div>
				{/if}
				
				{#if dashboardData.content_insights.filter(i => i.insight_type === 'high_dropout').length > 0}
					<div class="flex items-center justify-between p-3 bg-white rounded-lg border">
						<div>
							<p class="font-medium text-gray-900">Improve Content Engagement</p>
							<p class="text-sm text-gray-600">Some content has high dropout rates</p>
						</div>
						<Button variant="secondary" size="sm">View Content</Button>
					</div>
				{/if}
			</div>
		</Card>
	{/if}
</div>