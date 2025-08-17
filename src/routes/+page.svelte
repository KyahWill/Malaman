<script lang="ts">
	import { isAuthenticated, profile } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';

	function handleGetStarted() {
		if ($isAuthenticated) {
			const redirectPath = $profile?.role === 'instructor' ? '/dashboard/instructor' : '/dashboard/student';
			goto(redirectPath);
		} else {
			goto('/auth/register');
		}
	}
</script>

<svelte:head>
	<title>Personalized LMS - AI-Powered Learning</title>
	<meta name="description" content="An AI-powered learning management system that creates personalized learning paths for every student." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
	<!-- Navigation -->
	<nav class="bg-white shadow-sm">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-4">
				<div class="flex items-center">
					<h1 class="text-xl font-bold text-gray-900">
						Personalized LMS
					</h1>
				</div>
				<div class="flex items-center space-x-4">
					{#if $isAuthenticated}
						<span class="text-sm text-gray-600">
							Welcome, {$profile?.first_name || 'User'}!
						</span>
						<Button
							variant="primary"
							onclick={handleGetStarted}
						>
							Go to Dashboard
						</Button>
						<Button
							variant="secondary"
							onclick={() => goto('/auth/logout')}
						>
							Sign Out
						</Button>
					{:else}
						<Button
							variant="secondary"
							onclick={() => goto('/auth/login')}
						>
							Sign In
						</Button>
						<Button
							variant="primary"
							onclick={() => goto('/auth/register')}
						>
							Get Started
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<div class="flex items-center justify-center py-20">
		<div class="max-w-4xl mx-auto px-4 text-center">
			<h2 class="text-5xl font-bold text-gray-900 mb-6">
				AI-Powered Learning for Everyone
			</h2>
			<p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
				Experience personalized education with our intelligent learning management system that adapts to your knowledge and learning style.
			</p>
			
			<div class="mb-16">
				<Button
					variant="primary"
					size="lg"
					onclick={handleGetStarted}
					class="text-lg px-8 py-4"
				>
					{$isAuthenticated ? 'Go to Dashboard' : 'Start Learning Today'}
				</Button>
			</div>

			<!-- Features Grid -->
			<div class="grid md:grid-cols-3 gap-8 mt-16">
				<div class="bg-white p-6 rounded-lg shadow-sm">
					<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
						<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-3">AI-Powered Personalization</h3>
					<p class="text-gray-600">Intelligent learning roadmaps tailored to each student's knowledge level and learning pace.</p>
				</div>
				
				<div class="bg-white p-6 rounded-lg shadow-sm">
					<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
						<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12l2 2 4-4"></path>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-3">Assessment-Driven Progress</h3>
					<p class="text-gray-600">Mandatory assessments ensure mastery before progression to advanced topics.</p>
				</div>
				
				<div class="bg-white p-6 rounded-lg shadow-sm">
					<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
						<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-3">Rich Content Support</h3>
					<p class="text-gray-600">Support for images, videos, files, and rich text content in interactive lessons.</p>
				</div>
			</div>

			{#if !$isAuthenticated}
				<div class="mt-16 bg-white p-8 rounded-lg shadow-sm">
					<h3 class="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h3>
					<p class="text-gray-600 mb-6">Join thousands of learners and educators using our platform.</p>
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<Button
							variant="primary"
							size="lg"
							onclick={() => goto('/auth/register')}
						>
							Create Account
						</Button>
						<Button
							variant="secondary"
							size="lg"
							onclick={() => goto('/auth/login')}
						>
							Sign In
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
