<script lang="ts">
	import { profile, authHelpers } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import Button from '../ui/Button.svelte';
	import Modal from '../ui/Modal.svelte';

	interface Props {
		toggleSidebar: () => void;
	}

	let { toggleSidebar }: Props = $props();

	// User menu state
	let userMenuOpen = $state(false);
	let logoutModalOpen = $state(false);

	// Get user initials for avatar
	const userInitials = $derived(() => {
		if (!$profile?.first_name && !$profile?.last_name) {
			return $profile?.email?.charAt(0).toUpperCase() || 'U';
		}
		const first = $profile?.first_name?.charAt(0) || '';
		const last = $profile?.last_name?.charAt(0) || '';
		return (first + last).toUpperCase();
	});

	const userDisplayName = $derived(() => {
		if ($profile?.first_name || $profile?.last_name) {
			return `${$profile?.first_name || ''} ${$profile?.last_name || ''}`.trim();
		}
		return $profile?.email || 'User';
	});

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
	}

	function closeUserMenu() {
		userMenuOpen = false;
	}

	function handleLogout() {
		logoutModalOpen = true;
		closeUserMenu();
	}

	async function confirmLogout() {
		try {
			await authHelpers.logout();
			await goto('/auth');
		} catch (error) {
			console.error('Logout failed:', error);
			// Force logout even if API call fails
			authHelpers.forceLogout();
			await goto('/auth');
		} finally {
			logoutModalOpen = false;
		}
	}

	function cancelLogout() {
		logoutModalOpen = false;
	}

	// Close user menu when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('[data-user-menu]')) {
			closeUserMenu();
		}
	}

	// Keyboard navigation for user menu
	function handleUserMenuKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeUserMenu();
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
	<div class="flex items-center justify-between h-16 px-4 md:px-6">
		<!-- Left side: Menu button and logo -->
		<div class="flex items-center space-x-4">
			<!-- Mobile menu button -->
			<button
				onclick={toggleSidebar}
				class="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 md:hidden"
				aria-label="Toggle sidebar"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>

			<!-- Logo and title -->
			<div class="flex items-center space-x-3">
				<div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.84l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
					</svg>
				</div>
				<h1 class="text-xl font-semibold text-gray-900 hidden sm:block">
					Personalized LMS
				</h1>
			</div>
		</div>

		<!-- Right side: User menu -->
		<div class="relative" data-user-menu>
			<button
				onclick={toggleUserMenu}
				onkeydown={handleUserMenuKeydown}
				class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
				aria-expanded={userMenuOpen}
				aria-haspopup="true"
				aria-label="User menu"
			>
				<!-- User avatar -->
				<div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
					{userInitials()}
				</div>
				
				<!-- User name (hidden on mobile) -->
				<div class="hidden md:block text-left">
					<div class="text-sm font-medium text-gray-900">{userDisplayName()}</div>
					<div class="text-xs text-gray-500 capitalize">{$profile?.role || 'User'}</div>
				</div>

				<!-- Dropdown arrow -->
				<svg 
					class="w-4 h-4 text-gray-500 transition-transform duration-200"
					class:rotate-180={userMenuOpen}
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			<!-- User dropdown menu -->
			{#if userMenuOpen}
				<div 
					class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
					role="menu"
					aria-orientation="vertical"
				>
					<!-- User info -->
					<div class="px-4 py-3 border-b border-gray-100">
						<div class="text-sm font-medium text-gray-900">{userDisplayName()}</div>
						<div class="text-sm text-gray-500">{$profile?.email}</div>
						<div class="text-xs text-gray-400 capitalize mt-1">{$profile?.role} Account</div>
					</div>

					<!-- Menu items -->
					<a 
						href="/profile" 
						class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
						role="menuitem"
						onclick={closeUserMenu}
					>
						<div class="flex items-center space-x-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							<span>Profile Settings</span>
						</div>
					</a>

					<a 
						href="/dashboard" 
						class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
						role="menuitem"
						onclick={closeUserMenu}
					>
						<div class="flex items-center space-x-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0H8v0z" />
							</svg>
							<span>Dashboard</span>
						</div>
					</a>

					<div class="border-t border-gray-100 mt-1 pt-1">
						<button
							onclick={handleLogout}
							class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
							role="menuitem"
						>
							<div class="flex items-center space-x-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								<span>Sign Out</span>
							</div>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>

<!-- Logout confirmation modal -->
<Modal 
	open={logoutModalOpen} 
	onClose={cancelLogout}
	title="Confirm Sign Out"
>
	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to sign out? You'll need to sign in again to access your account.
		</p>
		
		<div class="flex justify-end space-x-3">
			<Button variant="outline" onclick={cancelLogout}>
				Cancel
			</Button>
			<Button variant="primary" onclick={confirmLogout}>
				Sign Out
			</Button>
		</div>
	</div>
</Modal>