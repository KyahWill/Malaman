<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import LogoutButton from '$lib/components/auth/LogoutButton.svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { profile } = $derived(data);
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
									<dd class="text-lg font-medium text-gray-900">0</dd>
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
									<dd class="text-lg font-medium text-gray-900">0</dd>
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
									<dd class="text-lg font-medium text-gray-900">0</dd>
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
									<dd class="text-lg font-medium text-gray-900">0</dd>
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
								Start by creating your first course to see activity here.
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
					</div>
				</div>
			</div>
		</div>
	</main>
</div>