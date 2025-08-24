<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { invalidate } from "$app/navigation";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import type { LayoutData } from "./$types";
	import AppLayout from "$lib/components/shared/AppLayout.svelte";
	import { authStore, authHelpers } from "$lib/stores/auth";

	let { data, children }: { data: LayoutData; children: any } = $props();
	let { session,user, supabase } = $derived(data);

	// Initialize auth store with session data
	onMount(() => {
		// Set initial auth state from server data
		if (session?.user) {
			authHelpers.setUser(session.user);
			// Profile will be loaded by the auth store initialization
		}
		const { data: authListener } = supabase.auth.onAuthStateChange(
			(_, newSession) => {
				if (newSession?.expires_at !== session?.expires_at) {
					invalidate("supabase:auth");
				}
			},
		);

		return () => authListener.subscription.unsubscribe();
	});

	// Determine if we should show the full app layout
	const isAuthPage = $derived($page.route.id?.startsWith("/auth"));
	const showLayout = $derived(!isAuthPage && user);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Personalized LMS</title>
	<meta
		name="description"
		content="AI-powered personalized learning management system"
	/>
</svelte:head>

{#if showLayout}
	<AppLayout>
		{@render children?.()}
	</AppLayout>
{:else}
	{@render children?.()}
{/if}
