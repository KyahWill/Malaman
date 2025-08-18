<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let mode = $state<'login' | 'signup' | 'reset'>('login');
	let loading = $state(false);
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset Password'} - Personalized LMS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900">
				Personalized LMS
			</h1>
			<p class="mt-2 text-sm text-gray-600">
				AI-powered learning management system
			</p>
		</div>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			{#if mode === 'login'}
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-2xl font-bold text-gray-900">
							Sign in to your account
						</h2>
						<p class="mt-2 text-sm text-gray-600">
							Or
							<button
								type="button"
								onclick={() => mode = 'signup'}
								class="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
							>
								create a new account
							</button>
						</p>
					</div>

					<form method="POST" action="?/login" use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							await update();
							if (form?.success) {
								window.location.href = '/';
							}
						};
					}}>
						<div class="space-y-6">
							<div>
								<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
									Email Address
								</label>
								<Input
									id="email"
									name="email"
									type="email"
									required
									disabled={loading}
									placeholder="Enter your email"
								/>
							</div>

							<div>
								<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
									Password
								</label>
								<Input
									id="password"
									name="password"
									type="password"
									required
									disabled={loading}
									placeholder="Enter your password"
								/>
							</div>

							{#if form?.error}
								<div class="text-red-600 text-sm" role="alert">
									{form.error}
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
								<button
									type="button"
									onclick={() => mode = 'reset'}
									class="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
								>
									Forgot your password?
								</button>
							</div>
						</div>
					</form>
				</div>
			{:else if mode === 'signup'}
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-2xl font-bold text-gray-900">
							Create your account
						</h2>
						<p class="mt-2 text-sm text-gray-600">
							Already have an account?
							<button
								type="button"
								onclick={() => mode = 'login'}
								class="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
							>
								Sign in
							</button>
						</p>
					</div>

					{#if form?.success}
						<div class="text-center space-y-4">
							<div class="text-green-600 text-lg font-medium">
								Registration Successful!
							</div>
							<p class="text-gray-600">
								{form.success}
							</p>
							<Button
								variant="primary"
								onclick={() => mode = 'login'}
							>
								Go to Sign In
							</Button>
						</div>
					{:else}
						<form method="POST" action="?/signup" use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								await update();
							};
						}}>
							<div class="space-y-6">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
											First Name
										</label>
										<Input
											id="firstName"
											name="firstName"
											type="text"
											required
											disabled={loading}
											placeholder="Enter your first name"
										/>
									</div>

									<div>
										<label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
											Last Name
										</label>
										<Input
											id="lastName"
											name="lastName"
											type="text"
											required
											disabled={loading}
											placeholder="Enter your last name"
										/>
									</div>
								</div>

								<div>
									<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
										Email Address
									</label>
									<Input
										id="email"
										name="email"
										type="email"
										required
										disabled={loading}
										placeholder="Enter your email"
									/>
								</div>

								<div>
									<label for="role" class="block text-sm font-medium text-gray-700 mb-2">
										I am a...
									</label>
									<select
										id="role"
										name="role"
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
										name="password"
										type="password"
										required
										disabled={loading}
										placeholder="Enter your password"
									/>
								</div>

								{#if form?.error}
									<div class="text-red-600 text-sm" role="alert">
										{form.error}
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
							</div>
						</form>
					{/if}
				</div>
			{:else if mode === 'reset'}
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-2xl font-bold text-gray-900">
							Forgot your password?
						</h2>
						<p class="mt-2 text-sm text-gray-600">
							No worries! Enter your email and we'll send you a reset link.
						</p>
					</div>

					{#if form?.success}
						<div class="text-center space-y-4">
							<div class="text-green-600 text-lg font-medium">
								Reset Link Sent!
							</div>
							<p class="text-gray-600">
								{form.success}
							</p>
							<button
								type="button"
								onclick={() => mode = 'login'}
								class="inline-block text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
							>
								Back to Sign In
							</button>
						</div>
					{:else}
						<form method="POST" action="?/resetPassword" use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								await update();
							};
						}}>
							<div class="space-y-6">
								<div>
									<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
										Email Address
									</label>
									<Input
										id="email"
										name="email"
										type="email"
										required
										disabled={loading}
										placeholder="Enter your email"
									/>
									<p class="mt-2 text-sm text-gray-600">
										We'll send you a link to reset your password.
									</p>
								</div>

								{#if form?.error}
									<div class="text-red-600 text-sm" role="alert">
										{form.error}
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
									<button
										type="button"
										onclick={() => mode = 'login'}
										class="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
									>
										Back to Sign In
									</button>
								</div>
							</div>
						</form>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>