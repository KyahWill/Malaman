<script lang="ts">
	import { AuthService } from '$lib/services/auth';
	import { authHelpers, profile } from '$lib/stores/auth';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { UserProfile } from '$lib/types';

	let firstName = $state('');
	let lastName = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	// Initialize form with current profile data
	$effect(() => {
		if ($profile) {
			firstName = $profile.first_name || '';
			lastName = $profile.last_name || '';
		}
	});

	async function handleSubmit() {
		if (!firstName || !lastName) {
			error = 'Please fill in all fields';
			return;
		}

		if (!$profile?.id) {
			error = 'User profile not found';
			return;
		}

		loading = true;
		error = null;
		success = false;

		try {
			const { profile: updatedProfile, error: updateError } = await AuthService.updateProfile(
				$profile.id,
				{
					first_name: firstName,
					last_name: lastName
				}
			);

			if (updateError) {
				error = updateError.message || 'Failed to update profile';
				return;
			}

			if (updatedProfile) {
				// Update the auth store with new profile data
				authHelpers.setProfile(updatedProfile);
				success = true;
				
				// Clear success message after 3 seconds
				setTimeout(() => {
					success = false;
				}, 3000);
			}
		} catch (err) {
			console.error('Profile update error:', err);
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	}
</script>

<div class="max-w-md mx-auto">
	<h2 class="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
	
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		<div>
			<label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
				First Name
			</label>
			<Input
				id="firstName"
				type="text"
				bind:value={firstName}
				placeholder="Enter your first name"
				required
				disabled={loading}
				onkeydown={handleKeydown}
			/>
		</div>

		<div>
			<label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
				Last Name
			</label>
			<Input
				id="lastName"
				type="text"
				bind:value={lastName}
				placeholder="Enter your last name"
				required
				disabled={loading}
				onkeydown={handleKeydown}
			/>
		</div>

		<div>
			<label for="profile-email" class="block text-sm font-medium text-gray-700 mb-2">
				Email
			</label>
			<Input
				id="profile-email"
				type="email"
				value={$profile?.email || ''}
				disabled
				class="bg-gray-50"
			/>
			<p class="mt-1 text-sm text-gray-500">
				Email cannot be changed. Contact support if you need to update your email.
			</p>
		</div>

		<div>
			<label for="profile-role" class="block text-sm font-medium text-gray-700 mb-2">
				Role
			</label>
			<Input
				id="profile-role"
				type="text"
				value={$profile?.role || ''}
				disabled
				class="bg-gray-50 capitalize"
			/>
			<p class="mt-1 text-sm text-gray-500">
				Role cannot be changed. Contact support if you need to update your role.
			</p>
		</div>

		{#if error}
			<div id="profile-error" class="text-red-600 text-sm" role="alert" aria-live="polite">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="text-green-600 text-sm" role="alert" aria-live="polite">
				Profile updated successfully!
			</div>
		{/if}

		<Button
			type="submit"
			variant="primary"
			size="lg"
			class="w-full"
			disabled={loading}
		>
			{loading ? 'Updating Profile...' : 'Update Profile'}
		</Button>
	</form>
</div>