<script lang="ts">
	import { AuthService } from '$lib/services/auth';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function handleSubmit() {
		if (!password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters long';
			return;
		}

		loading = true;
		error = null;

		try {
			const { error: updateError } = await AuthService.updatePassword(password);

			if (updateError) {
				error = updateError.message;
				return;
			}

			success = true;
			
			// Redirect to login after a short delay
			setTimeout(() => {
				goto('/auth/login');
			}, 2000);
		} catch (err) {
			console.error('Password update error:', err);
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

{#if success}
	<div class="text-center space-y-4">
		<div class="text-green-600 text-lg font-medium">
			Password Updated!
		</div>
		<p class="text-gray-600">
			Your password has been successfully updated. You will be redirected to the sign in page.
		</p>
	</div>
{:else}
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		<div>
			<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
				New Password
			</label>
			<Input
				id="password"
				type="password"
				bind:value={password}
				placeholder="Enter your new password"
				required
				disabled={loading}
				onkeydown={handleKeydown}
			/>
		</div>

		<div>
			<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
				Confirm New Password
			</label>
			<Input
				id="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				placeholder="Confirm your new password"
				required
				disabled={loading}
				onkeydown={handleKeydown}
			/>
		</div>

		{#if error}
			<div id="reset-error" class="text-red-600 text-sm" role="alert" aria-live="polite">
				{error}
			</div>
		{/if}

		<Button
			type="submit"
			variant="primary"
			size="lg"
			class="w-full"
			disabled={loading}
		>
			{loading ? 'Updating Password...' : 'Update Password'}
		</Button>
	</form>
{/if}