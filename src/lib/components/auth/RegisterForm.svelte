<script lang="ts">
	import { AuthService } from '$lib/services/auth';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { UserRole } from '$lib/types';

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let role = $state<UserRole>('student');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function handleSubmit() {
		// Validation
		if (!firstName || !lastName || !email || !password || !confirmPassword) {
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
			const { user, error: authError } = await AuthService.signUp({
				email,
				password,
				firstName,
				lastName,
				role
			});

			if (authError) {
				error = authError.message;
				return;
			}

			if (user) {
				success = true;
				// Note: User will need to verify email before they can sign in
			}
		} catch (err) {
			console.error('Registration error:', err);
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
			Registration Successful!
		</div>
		<p class="text-gray-600">
			Please check your email and click the verification link to activate your account.
		</p>
		<Button
			variant="primary"
			onclick={() => goto('/auth/login')}
		>
			Go to Sign In
		</Button>
	</div>
{:else}
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
		</div>

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
			<label for="role" class="block text-sm font-medium text-gray-700 mb-2">
				I am a...
			</label>
			<select
				id="role"
				bind:value={role}
				disabled={loading}
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
			>
				<option value="student">Student</option>
				<option value="instructor">Instructor</option>
			</select>
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

		<div>
			<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
				Confirm Password
			</label>
			<Input
				id="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				placeholder="Confirm your password"
				required
				disabled={loading}
				onkeydown={handleKeydown}
			/>
		</div>

		{#if error}
			<div id="register-error" class="text-red-600 text-sm" role="alert" aria-live="polite">
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
			{loading ? 'Creating Account...' : 'Create Account'}
		</Button>
	</form>
{/if}