<script lang="ts">
	import { AuthService } from '$lib/services/auth';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let email = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function handleSubmit() {
		if (!email) {
			error = 'Please enter your email address';
			return;
		}

		loading = true;
		error = null;

		try {
			const { error: resetError } = await AuthService.resetPassword(email);

			if (resetError) {
				error = resetError.message;
				return;
			}

			success = true;
		} catch (err) {
			console.error('Password reset error:', err);
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
			Reset Link Sent!
		</div>
		<p class="text-gray-600">
			Please check your email for a password reset link. If you don't see it, check your spam folder.
		</p>
		<a
			href="/auth/login"
			class="inline-block text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
		>
			Back to Sign In
		</a>
	</div>
{:else}
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		<div>
			<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
				Email Address
			</label>
			<Input
				id="email"
				type="email"
				bind:value={email}
				placeholder="Enter your email"
				required
				disabled={loading}
				onkeydown={handleKeydown}
			/>
			<p class="mt-2 text-sm text-gray-600">
				We'll send you a link to reset your password.
			</p>
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
			{loading ? 'Sending Reset Link...' : 'Send Reset Link'}
		</Button>

		<div class="text-center">
			<a
				href="/auth/login"
				class="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
			>
				Back to Sign In
			</a>
		</div>
	</form>
{/if}