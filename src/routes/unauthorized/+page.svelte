<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import { profile } from '$lib/stores/auth';
</script>

<svelte:head>
	<title>Unauthorized - Personalized LMS</title>
	<meta name="description" content="You don't have permission to access this page" />
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<div class="text-6xl font-bold text-red-500 mb-4">403</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-4">
				Access Denied
			</h1>
			<p class="text-lg text-gray-600 mb-8">
				You don't have permission to access this page.
			</p>
			
			{#if $profile}
				<p class="text-sm text-gray-500 mb-8">
					You are signed in as a <span class="font-medium capitalize">{$profile.role}</span>.
					This page requires different permissions.
				</p>
			{/if}

			<div class="space-y-4">
				<Button
					variant="primary"
					onclick={() => goto('/dashboard')}
				>
					Go to Dashboard
				</Button>
				
				<div>
					<Button
						variant="secondary"
						onclick={() => history.back()}
					>
						Go Back
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>