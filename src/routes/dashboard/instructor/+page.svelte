<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import LogoutButton from '$lib/components/auth/LogoutButton.svelte';
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib/utils';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { profile } = $derived(data);

	let stats = $state({
		courses: 0,
		students: 0,
		assessments: 0,
		pendingReviews: 0
	});

	let recentCourses = $state<any[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			// Fetch instructor's courses
			const coursesResponse = await fetch(`/api/courses?instructor_id=${profile.id}`);
			if (coursesResponse.ok) {
				const { courses } = await coursesResponse.json();
				recentCourses = courses.slice(0, 5); // Show 5 most recent
				stats.courses = courses.length;

				// Calculate total students across all courses
				let totalStudents = 0;
				let totalAssessments = 0;

				for (const course of courses) {
					if (course.is_published) {
						try {
							const analyticsResponse = await fetch(`/api/courses/${course.id}/analytics`);
							if (analyticsResponse.ok) {
								const { analytics } = await analyticsResponse.json();
								totalStudents += analytics.overview.total_enrollments || 0;
							}
						} catch (err) {
							console.error('Error fetching course analytics:', err);
						}
					}
				}

				stats.students = totalStudents;
				stats.assessments = totalAssessments;
			}
		} catch (error) {
			console.error('Error fetching dashboard data:', error);
		} finally {
			isLoading = false;
		}
	});

	function getDifficultyColor(level: string) {
		switch (level) {
			case 'beginner': return 'bg-green-100 text-green-800';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800';
			case 'advanced': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusColor(isPublished: boolean) {
		return isPublished 
			? 'bg-green-100 text-green-800' 
			: 'bg-gray-100 text-gray-800';
	}

	function getStatusText(isPublished: boolean) {
		return isPublished ? 'Published' : 'Draft';
	}


</script>

<svelte:head>
	<title>Instructor Dashboard - Personalized LMS</title>
	<meta name="description" content="Manage your courses and students" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
					<p class="mt-1 text-sm text-gray-600">
						Welcome back, {profile?.first_name || 'Instructor'}!
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

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
									<dd class="text-lg font-medium text-gray-900">
										{#if isLoading}
											<div class="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
										{:else}
											{stats.courses}
										{/if}
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<!-- Total Students -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
								</svg>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Total Students</dt>
									<dd class="text-lg font-medium text-gray-900">
										{#if isLoading}
											<div class="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
										{:else}
											{stats.students}
										{/if}
									</dd>
								</dl>
							</div>
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
									<dt class="text-sm font-medium text-gray-500 truncate">Assessments</dt>
									<dd class="text-lg font-medium text-gray-900">
										{#if isLoading}
											<div class="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
										{:else}
											{stats.assessments}
										{/if}
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<!-- Pending Reviews -->
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<svg class="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Pending Reviews</dt>
									<dd class="text-lg font-medium text-gray-900">
										{#if isLoading}
											<div class="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
										{:else}
											{stats.pendingReviews}
										{/if}
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="mt-8">
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Quick Actions
						</h3>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Button
								variant="primary"
								class="w-full"
								onclick={() => goto('/courses/create')}
							>
								Create New Course
							</Button>
							<Button
								variant="secondary"
								class="w-full"
								onclick={() => goto('/courses')}
							>
								Manage Courses
							</Button>
							<Button
								variant="secondary"
								class="w-full"
								onclick={() => goto('/assessments')}
							>
								View Assessments
							</Button>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
							<Button
								variant="outline"
								class="w-full"
								onclick={() => goto('/knowledge-assessment/create')}
							>
								Create Knowledge Assessment
							</Button>
							<Button
								variant="outline"
								class="w-full"
								onclick={() => goto('/assessments/create')}
							>
								Create Regular Assessment
							</Button>
						</div>
					</div>
				</div>
			</div>

			<!-- Recent Courses -->
			<div class="mt-8">
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg leading-6 font-medium text-gray-900">
								Recent Courses
							</h3>
							<Button
								variant="secondary"
								size="sm"
								onclick={() => goto('/courses')}
							>
								View All
							</Button>
						</div>
						
						{#if isLoading}
							<div class="space-y-4">
								{#each Array(3) as _}
									<div class="animate-pulse">
										<div class="flex items-center space-x-4">
											<div class="bg-gray-200 h-12 w-12 rounded-lg"></div>
											<div class="flex-1 space-y-2">
												<div class="bg-gray-200 h-4 w-3/4 rounded"></div>
												<div class="bg-gray-200 h-3 w-1/2 rounded"></div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else if recentCourses.length > 0}
							<div class="space-y-4">
								{#each recentCourses as course}
									<Card 
										variant="outlined" 
										padding="sm" 
										hover={true} 
										clickable={true}
										onclick={() => goto(`/courses/${course.id}`)}
									>
										<div class="flex items-center justify-between">
											<div class="flex items-center space-x-4">
												<div class="flex-shrink-0">
													<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
														<svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
														</svg>
													</div>
												</div>
												<div class="flex-1 min-w-0">
													<h4 class="text-sm font-medium text-gray-900 truncate">
														{course.title}
													</h4>
													<div class="flex items-center space-x-2 mt-1">
														<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getStatusColor(course.is_published)}">
															{getStatusText(course.is_published)}
														</span>
														<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getDifficultyColor(course.difficulty_level)}">
															{course.difficulty_level}
														</span>
													</div>
												</div>
											</div>
											<div class="flex items-center space-x-2">
												<span class="text-xs text-gray-500">
													{formatDate(course.created_at)}
												</span>
												<Button
													variant="ghost"
													size="sm"
													onclick={() => goto(`/courses/${course.id}/edit`)}
												>
													Edit
												</Button>
											</div>
										</div>
									</Card>
								{/each}
							</div>
						{:else}
							<div class="text-center py-12">
								<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
								</svg>
								<h3 class="mt-2 text-sm font-medium text-gray-900">No courses yet</h3>
								<p class="mt-1 text-sm text-gray-500">
									Start by creating your first course to see it here.
								</p>
								<div class="mt-6">
									<Button
										variant="primary"
										onclick={() => goto('/courses/create')}
									>
										Create Course
									</Button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</main>
</div>