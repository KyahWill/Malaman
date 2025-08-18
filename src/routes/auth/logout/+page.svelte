<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { AuthService } from '$lib/services/auth';
	import { authHelpers } from '$lib/stores/auth';

	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			// Use the auth store logout helper
			await authHelpers.logout();
			
			// Small delay to ensure state is updated
			setTimeout(() => {
				goto('/', { replaceState: true });
			}, 100);
			
		} catch (err) {
			console.error('Normal logout failed, trying force logout:', err);
			
			try {
				// Try force logout as fallback
				authHelpers.forceLogout();
				
				setTimeout(() => {
					goto('/', { replaceState: true });
				}, 100);
			} catch (forceErr) {
				console.error('Force logout also failed:', forceErr);
				error = 'An unexpected error occurred during logout.';
				loading = false;
			}
		}
	});
</script>

<svelte:head>
	<title>Signing Out - Personalized LMS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			{#if loading}
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<h2 class="text-2xl font-bold text-gray-900">Signing you out...</h2>
				<p class="mt-2 text-gray-600">Please wait while we sign you out securely.</p>
			{:else if error}
				<div class="text-red-600 mb-4">
					<svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
					</svg>
				</div>
				<h2 class="text-2xl font-bold text-gray-900">Logout Failed</h2>
				<p class="mt-2 text-gray-600">{error}</p>
				<div class="mt-6 space-y-4">
					<button
						onclick={() => window.location.reload()}
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Try Again
					</button>
					<button
						onclick={() => goto('/')}
						class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Go to Home
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>