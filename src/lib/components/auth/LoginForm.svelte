<script lang="ts">
	import { AuthService } from '$lib/services/auth';
	import { authHelpers } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = null;

		try {
			const { user, error: authError } = await AuthService.signIn({ email, password });

			if (authError) {
				error = authError.message;
				return;
			}

			if (user) {
				// Get user profile
				const { profile, error: profileError } = await AuthService.getProfile(user.id);
				
				if (profileError) {
					error = 'Failed to load user profile';
					return;
				}

				// Update auth store
				authHelpers.setUser(user);
				authHelpers.setProfile(profile);

				// Redirect based on role
				const redirectPath = profile?.role === 'instructor' ? '/dashboard/instructor' : '/dashboard/student';
				await goto(redirectPath);
			}
		} catch (err) {
			console.error('Login error:', err);
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
	</div>

	<div>
		<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
			Password
		</label>
		<Input
			id="password"
			type="password"
			bind:value={password}
			placeholder="Enter your password"
			required
			disabled={loading}
			onkeydown={handleKeydown}
		/>
	</div>

	{#if error}
		<div id="login-error" class="text-red-600 text-sm" role="alert" aria-live="polite">
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
		{loading ? 'Signing In...' : 'Sign In'}
	</Button>

	<div class="text-center">
		<a
			href="/auth/forgot-password"
			class="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
		>
			Forgot your password?
		</a>
	</div>
</form>