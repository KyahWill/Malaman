<script lang="ts">
	import { page } from '$app/stores';
	import { userRole, profile } from '$lib/stores/auth';
	import Header from './Header.svelte';
	import Navigation from './Navigation.svelte';
	import Sidebar from '$lib/components/shared/Sidebar.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { toastStore } from '$lib/stores/toast';

	let { children }: { children: any } = $props();

	// Responsive sidebar state
	let sidebarOpen = $state(false);
	let isMobile = $state(false);

	// Check if we're on mobile
	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 768;
			if (!isMobile) {
				sidebarOpen = true; // Keep sidebar open on desktop
			}
		}
	}

	// Initialize and listen for resize
	$effect(() => {
		checkMobile();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', checkMobile);
			return () => window.removeEventListener('resize', checkMobile);
		}
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		if (isMobile) {
			sidebarOpen = false;
		}
	}

	// Close sidebar on route change (mobile only)
	$effect(() => {
		$page.route.id; // Subscribe to route changes
		if (isMobile) {
			sidebarOpen = false;
		}
	});
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<Header {toggleSidebar} />

	<div class="flex">
		<!-- Sidebar -->
		<Sidebar 
			open={sidebarOpen} 
			{isMobile} 
			onClose={closeSidebar}
		/>

		<!-- Main content area -->
		<main 
			class="flex-1 transition-all duration-300 ease-in-out"
			class:ml-64={sidebarOpen && !isMobile}
			class:ml-0={!sidebarOpen || isMobile}
		>
			<!-- Navigation breadcrumbs -->
			<Navigation />
			
			<!-- Page content -->
			<div class="p-4 md:p-6 lg:p-8">
				{@render children?.()}
			</div>
		</main>
	</div>

	<!-- Mobile sidebar overlay -->
	{#if sidebarOpen && isMobile}
		<div 
			class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
			onclick={closeSidebar}
			role="button"
			tabindex="0"
			aria-label="Close sidebar"
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					closeSidebar();
				}
			}}
		></div>
	{/if}

	<!-- Toast notifications -->
	<Toast />
</div>