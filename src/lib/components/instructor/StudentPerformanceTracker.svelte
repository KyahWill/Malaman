<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';

	let { courseId }: { courseId: string } = $props();

	let students = $state<any[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let sortBy = $state('progress');
	let sortOrder = $state('desc');
	let filterStatus = $state('all');
	let searchQuery = $state('');

	const statusFilters = [
		{ value: 'all', label: 'All Students' },
		{ value: 'active', label: 'Active' },
		{ value: 'struggling', label: 'Struggling' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'inactive', label: 'Inactive' }
	];

	const sortOptions = [
		{ value: 'progress', label: 'Progress' },
		{ value: 'score', label: 'Score' },
		{ value: 'name', label: 'Name' },
		{ value: 'last_activity', label: 'Last Activity' },
		{ value: 'enrolled_at', label: 'Enrollment Date' }
	];

	onMount(async () => {
		await loadStudentData();
	});

	async function loadStudentData() {
		try {
			isLoading = true;
			error = null;

			const response = await fetch(`/api/courses/${courseId}/students/performance`);
			if (!response.ok) {
				throw new Error('Failed to load student performance data');
			}

			const data = await response.json();
			students = data.students || [];
		} catch (err) {
			console.error('Error loading student data:', err);
			error = err instanceof Error ? err.message : 'Failed to load student data';
		} finally {
			isLoading = false;
		}
	}

	let filteredAndSortedStudents = $derived(() => {
		let filtered = students;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(student => 
				student.name.toLowerCase().includes(query) ||
				student.email.toLowerCase().includes(query)
			);
		}

		// Apply status filter
		if (filterStatus !== 'all') {
			filtered = filtered.filter(student => {
				switch (filterStatus) {
					case 'active':
						return student.status === 'active' && student.completion_percentage < 100;
					case 'struggling':
						return student.average_score < 60 || student.completion_percentage < 20;
					case 'completed':
						return student.completion_percentage >= 100;
					case 'inactive':
						return student.status === 'inactive';
					default:
						return true;
				}
			});
		}

		// Apply sorting
		filtered.sort((a, b) => {
			let aValue, bValue;
			
			switch (sortBy) {
				case 'progress':
					aValue = a.completion_percentage || 0;
					bValue = b.completion_percentage || 0;
					break;
				case 'score':
					aValue = a.average_score || 0;
					bValue = b.average_score || 0;
					break;
				case 'name':
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
					break;
				case 'last_activity':
					aValue = new Date(a.last_activity || 0).getTime();
					bValue = new Date(b.last_activity || 0).getTime();
					break;
				case 'enrolled_at':
					aValue = new Date(a.enrolled_at || 0).getTime();
					bValue = new Date(b.enrolled_at || 0).getTime();
					break;
				default:
					return 0;
			}

			if (sortOrder === 'asc') {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			} else {
				return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
			}
		});

		return filtered;
	});

	function getStatusColor(student: any): string {
		if (student.completion_percentage >= 100) return 'bg-green-100 text-green-800';
		if (student.average_score < 60 || student.completion_percentage < 20) return 'bg-red-100 text-red-800';
		if (student.status === 'inactive') return 'bg-gray-100 text-gray-800';
		return 'bg-blue-100 text-blue-800';
	}

	function getStatusText(student: any): string {
		if (student.completion_percentage >= 100) return 'Completed';
		if (student.average_score < 60 || student.completion_percentage < 20) return 'Struggling';
		if (student.status === 'inactive') return 'Inactive';
		return 'Active';
	}

	function getScoreColor(score: number): string {
		if (score >= 85) return 'text-green-600';
		if (score >= 70) return 'text-yellow-600';
		return 'text-red-600';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}

	function formatPercentage(value: number): string {
		return `${Math.round(value * 100) / 100}%`;
	}

	function handleSort(field: string) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'desc';
		}
	}

	async function sendMessage(studentId: string, studentName: string) {
		// This would integrate with a messaging system
		alert(`Send message to ${studentName} (Student ID: ${studentId})`);
	}

	async function viewStudentDetails(studentId: string) {
		// Navigate to detailed student view
		window.location.href = `/instructor/students/${studentId}?course=${courseId}`;
	}
</script>

<div class="space-y-6">
	<!-- Header and Controls -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
		<div>
			<h3 class="text-lg font-medium text-gray-900">Student Performance</h3>
			<p class="text-sm text-gray-600">Track and monitor student progress and engagement</p>
		</div>
		<Button variant="outline" onclick={loadStudentData}>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
			</svg>
			Refresh
		</Button>
	</div>

	<!-- Filters and Search -->
	<Card class="p-4">
		<div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
			<!-- Search -->
			<div class="flex-1">
				<input
					type="text"
					placeholder="Search students by name or email..."
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					bind:value={searchQuery}
				/>
			</div>

			<!-- Status Filter -->
			<div>
				<select
					class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					bind:value={filterStatus}
				>
					{#each statusFilters as filter}
						<option value={filter.value}>{filter.label}</option>
					{/each}
				</select>
			</div>

			<!-- Sort -->
			<div>
				<select
					class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					bind:value={sortBy}
				>
					{#each sortOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			<!-- Sort Order -->
			<Button
				variant="outline"
				size="sm"
				onclick={() => sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'}
			>
				{#if sortOrder === 'asc'}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
					</svg>
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
					</svg>
				{/if}
			</Button>
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
			<h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Student Data</h3>
			<p class="text-gray-600 mb-4">{error}</p>
			<Button onclick={loadStudentData}>Try Again</Button>
		</Card>
	{:else if filteredAndSortedStudents.length === 0}
		<Card class="p-6 text-center">
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No students found</h3>
			<p class="mt-1 text-sm text-gray-500">
				{searchQuery || filterStatus !== 'all' 
					? 'Try adjusting your search or filter criteria.' 
					: 'No students are enrolled in this course yet.'}
			</p>
		</Card>
	{:else}
		<!-- Student List -->
		<div class="space-y-4">
			{#each filteredAndSortedStudents as student}
				<Card class="p-6 hover:shadow-md transition-shadow">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<!-- Avatar -->
							<div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
								{#if student.avatar_url}
									<img src={student.avatar_url} alt={student.name} class="w-12 h-12 rounded-full object-cover" />
								{:else}
									<span class="text-lg font-medium text-gray-600">
										{student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
									</span>
								{/if}
							</div>

							<!-- Student Info -->
							<div class="flex-1">
								<div class="flex items-center space-x-2">
									<h4 class="text-lg font-medium text-gray-900">{student.name}</h4>
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(student)}">
										{getStatusText(student)}
									</span>
								</div>
								<p class="text-sm text-gray-600">{student.email}</p>
								<div class="flex items-center space-x-4 mt-2">
									<span class="text-sm text-gray-500">
										Enrolled: {formatDate(student.enrolled_at)}
									</span>
									<span class="text-sm text-gray-500">
										Last active: {formatDate(student.last_activity)}
									</span>
								</div>
							</div>
						</div>

						<!-- Performance Metrics -->
						<div class="text-right space-y-2">
							<div class="flex items-center space-x-6">
								<!-- Progress -->
								<div class="text-center">
									<p class="text-sm text-gray-500">Progress</p>
									<p class="text-lg font-semibold text-gray-900">{formatPercentage(student.completion_percentage || 0)}</p>
									<ProgressBar value={student.completion_percentage || 0} size="sm" class="w-20" />
								</div>

								<!-- Average Score -->
								<div class="text-center">
									<p class="text-sm text-gray-500">Avg. Score</p>
									<p class="text-lg font-semibold {getScoreColor(student.average_score || 0)}">
										{formatPercentage(student.average_score || 0)}
									</p>
								</div>

								<!-- Assessments -->
								<div class="text-center">
									<p class="text-sm text-gray-500">Assessments</p>
									<p class="text-lg font-semibold text-gray-900">
										{student.completed_assessments || 0}/{student.total_assessments || 0}
									</p>
								</div>
							</div>

							<!-- Actions -->
							<div class="flex space-x-2 mt-4">
								<Button
									variant="outline"
									size="sm"
									onclick={() => viewStudentDetails(student.id)}
								>
									View Details
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => sendMessage(student.id, student.name)}
								>
									Message
								</Button>
							</div>
						</div>
					</div>

					<!-- Additional Details (expandable) -->
					{#if student.recent_activity && student.recent_activity.length > 0}
						<div class="mt-4 pt-4 border-t border-gray-200">
							<h5 class="text-sm font-medium text-gray-900 mb-2">Recent Activity</h5>
							<div class="space-y-1">
								{#each student.recent_activity.slice(0, 3) as activity}
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-600">{activity.description}</span>
										<span class="text-gray-500">{formatDate(activity.timestamp)}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</Card>
			{/each}
		</div>

		<!-- Summary Stats -->
		<Card class="p-6 bg-gray-50">
			<h4 class="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h4>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div class="text-center">
					<p class="text-2xl font-bold text-blue-600">{filteredAndSortedStudents.length}</p>
					<p class="text-sm text-gray-600">Total Students</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-green-600">
						{filteredAndSortedStudents.filter(s => s.completion_percentage >= 100).length}
					</p>
					<p class="text-sm text-gray-600">Completed</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-yellow-600">
						{filteredAndSortedStudents.filter(s => s.completion_percentage > 0 && s.completion_percentage < 100).length}
					</p>
					<p class="text-sm text-gray-600">In Progress</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-red-600">
						{filteredAndSortedStudents.filter(s => s.average_score < 60 || s.completion_percentage < 20).length}
					</p>
					<p class="text-sm text-gray-600">Need Help</p>
				</div>
			</div>
		</Card>
	{/if}
</div>