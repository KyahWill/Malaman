<script lang="ts">
	import { isAuthenticated, user, profile } from '$lib/stores/auth';
	import { authHelpers } from '$lib/stores/auth';
	import Button from '$lib/components/ui/Button.svelte';
	import LogoutButton from '$lib/components/auth/LogoutButton.svelte';

	function logAuthState() {
		console.log('=== Auth State Debug ===');
		console.log('isAuthenticated:', $isAuthenticated);
		console.log('user:', $user);
		console.log('profile:', $profile);
		console.log('localStorage keys:', Object.keys(localStorage).filter(k => k.includes('supabase') || k.startsWith('sb-')));
		console.log('========================');
	}

	function forceLogout() {
		console.log('Forcing logout...');
		authHelpers.forceLogout();
	}
</script>

{#if $isAuthenticated}
	<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
		<h3 class="text-lg font-medium text-yellow-800">Logout Debug Panel</h3>
		<div class="space-y-2">
			<p class="text-sm text-yellow-700">
				User: {$profile?.first_name} {$profile?.last_name} ({$profile?.email})
			</p>
			<p class="text-sm text-yellow-700">
				Role: {$profile?.role}
			</p>
		</div>
		<div class="flex space-x-2">
			<Button variant="secondary" size="sm" onclick={logAuthState}>
				Log Auth State
			</Button>
			<Button variant="outline" size="sm" onclick={forceLogout}>
				Force Logout
			</Button>
			<LogoutButton variant="primary" size="sm" />
		</div>
	</div>
{:else}
	<div class="bg-green-50 border border-green-200 rounded-lg p-4">
		<p class="text-green-800">✅ User is logged out</p>
	</div>
{/if}