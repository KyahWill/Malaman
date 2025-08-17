<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { authHelpers, isLoading, isAuthenticated, profile } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { isProtectedRoute, isAuthRoute } from '$lib/middleware/auth';

	let { children } = $props();

	// Initialize auth on mount
	onMount(() => {
		authHelpers.initialize();
	});

	// Handle route protection
	$effect(() => {
		if (!$isLoading && $page.url) {
			const pathname = $page.url.pathname;
			
			// Redirect unauthenticated users from protected routes
			if (isProtectedRoute(pathname) && !$isAuthenticated) {
				goto('/auth/login');
			}
			
			// Redirect authenticated users from auth routes (except logout and reset-password)
			if (isAuthRoute(pathname) && $isAuthenticated) {
				if (!pathname.includes('/logout') && !pathname.includes('/reset-password')) {
					const redirectPath = $profile?.role === 'instructor' ? '/dashboard/instructor' : '/dashboard/student';
					goto(redirectPath);
				}
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if $isLoading}
	<div class="min-h-screen bg-gray-50 flex items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
			<p class="mt-4 text-gray-600">Loading...</p>
		</div>
	</div>
{:else}
	{@render children?.()}
{/if}
