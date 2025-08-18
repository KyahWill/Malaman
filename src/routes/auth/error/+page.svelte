<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
	<title>Authentication Error - Personalized LMS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<div class="text-6xl font-bold text-red-500 mb-4">⚠️</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-4">
				Authentication Error
			</h1>
			<p class="text-lg text-gray-600 mb-8">
				There was an error with your authentication. This could be due to an expired or invalid link.
			</p>

			<div class="space-y-4">
				<Button
					variant="primary"
					onclick={() => goto('/auth')}
				>
					Try Again
				</Button>
				
				<div>
					<Button
						variant="secondary"
						onclick={() => goto('/')}
					>
						Go Home
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>