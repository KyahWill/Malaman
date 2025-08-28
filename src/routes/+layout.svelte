<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { invalidate } from "$app/navigation";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import type { LayoutData } from "./$types";
	import AppLayout from "$lib/components/shared/AppLayout.svelte";
	import KeyboardNavigationProvider from "$lib/components/shared/KeyboardNavigationProvider.svelte";
	import AccessibilitySettings from "$lib/components/shared/AccessibilitySettings.svelte";
	import { authHelpers } from "$lib/stores/auth";
	import { screenReader } from "$lib/services/accessibility";

	let { data, children }: { data: LayoutData; children: any } = $props();
	let { session, user, supabase } = $derived(data);

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

		// Announce page changes for screen readers
		const unsubscribe = page.subscribe(($page) => {
			if (screenReader && $page.route?.id) {
				const title = document.title || 'Page';
				screenReader.announcePageChange(title);
			}
		});

		return () => {
			authListener.subscription.unsubscribe();
			unsubscribe();
		};
	});

	// Determine if we should show the full app layout
	const isAuthPage = $derived($page.route.id?.startsWith("/auth"));
	const showLayout = $derived(!isAuthPage && user);

	// Skip links for keyboard navigation
	const skipLinks = [
		{ href: '#main-content', text: 'Skip to main content' },
		{ href: '#navigation', text: 'Skip to navigation' },
		{ href: '#accessibility-settings', text: 'Skip to accessibility settings' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Personalized LMS</title>
	<meta
		name="description"
		content="AI-powered personalized learning management system"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="theme-color" content="#3b82f6" />
	
	<!-- Accessibility meta tags -->
	<meta name="color-scheme" content="light dark" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin={null} />
</svelte:head>

<KeyboardNavigationProvider {skipLinks}>
	<!-- Accessibility settings in header -->
	<div id="accessibility-settings" class="accessibility-settings-container">
		<AccessibilitySettings />
	</div>
	
	{#if showLayout}
		<AppLayout>
			<main id="main-content" tabindex="-1">
				{@render children?.()}
			</main>
		</AppLayout>
	{:else}
		<main id="main-content" tabindex="-1">
			{@render children?.()}
		</main>
	{/if}
</KeyboardNavigationProvider>

<style>
	.accessibility-settings-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 1000;
	}
	
	#main-content:focus {
		outline: none;
	}
	
	/* Global accessibility styles */
	:global(html) {
		scroll-behavior: smooth;
	}
	
	:global(.reduced-motion) :global(html) {
		scroll-behavior: auto;
	}
	
	/* High contrast mode styles */
	:global(.high-contrast) {
		filter: contrast(150%);
	}
	
	:global(.high-contrast) * {
		background-color: black !important;
		color: white !important;
		border-color: white !important;
	}
	
	:global(.high-contrast) a {
		color: #00ffff !important;
	}
	
	:global(.high-contrast) button {
		background-color: white !important;
		color: black !important;
		border: 2px solid white !important;
	}
	
	/* Font size scaling */
	:global(.font-small) {
		font-size: 14px;
	}
	
	:global(.font-medium) {
		font-size: 16px;
	}
	
	:global(.font-large) {
		font-size: 18px;
	}
	
	:global(.font-extra-large) {
		font-size: 20px;
	}
	
	/* Enhanced focus indicators */
	:global(.enhanced-focus) *:focus {
		outline: 3px solid #3b82f6 !important;
		outline-offset: 2px !important;
		border-radius: 4px;
	}
	
	/* Screen reader optimizations */
	:global(.screen-reader-mode) {
		line-height: 1.6;
	}
	
	:global(.screen-reader-mode) h1,
	:global(.screen-reader-mode) h2,
	:global(.screen-reader-mode) h3,
	:global(.screen-reader-mode) h4,
	:global(.screen-reader-mode) h5,
	:global(.screen-reader-mode) h6 {
		margin-top: 1.5em;
		margin-bottom: 0.5em;
	}
	
	/* Reduced motion preferences */
	:global(.reduced-motion) *,
	:global(.reduced-motion) *::before,
	:global(.reduced-motion) *::after {
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
		scroll-behavior: auto !important;
	}
	
	/* Screen reader only content */
	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	
	/* Focus visible polyfill */
	:global(.js-focus-visible) :global(.focus-visible) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
	
	/* Print styles for accessibility */
	@media print {
		:global(.accessibility-settings-container) {
			display: none;
		}
		
		:global(a[href^="http"]:after) {
			content: " (" attr(href) ")";
		}
		
		:global(abbr[title]:after) {
			content: " (" attr(title) ")";
		}
	}
</style>
