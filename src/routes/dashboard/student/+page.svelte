<script lang="ts">
	import { profile } from '$lib/stores/auth';
	import Button from '$lib/components/ui/Button.svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
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
						Welcome back, {$profile?.first_name || 'Student'}!
					</p>
				</div>
				<div class="flex items-center space-x-4">
					<Button
						variant="secondary"
						onclick={() => goto('/profile')}
					>
						Profile
					</Button>
					<Button
						variant="secondary"
						onclick={() => goto('/auth/logout')}
					>
						Sign Out
					</Button>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
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
		</div>
	</main>
</div>