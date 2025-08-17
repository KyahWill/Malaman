<script lang="ts">
	import { isAuthenticated } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();

	// Redirect authenticated users away from auth pages
	$effect(() => {
		if ($isAuthenticated && $page.url.pathname.startsWith('/auth/')) {
			// Don't redirect from logout or reset-password pages
			if (!$page.url.pathname.includes('/logout') && !$page.url.pathname.includes('/reset-password')) {
				goto('/dashboard');
			}
		}
	});
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900">
				Personalized LMS
			</h1>
			<p class="mt-2 text-sm text-gray-600">
				AI-powered learning management system
			</p>
		</div>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			{@render children?.()}
		</div>
	</div>
</div>