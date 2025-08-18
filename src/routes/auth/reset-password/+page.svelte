<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);

	// Redirect to auth page after successful password update
	$effect(() => {
		if (form?.success) {
			setTimeout(() => {
				goto('/auth');
			}, 2000);
		}
	});
</script>

<svelte:head>
	<title>Reset Password - Personalized LMS</title>
	<meta name="description" content="Set your new Personalized LMS password" />
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
			{#if form?.success}
				<div class="text-center space-y-4">
					<div class="text-green-600 text-lg font-medium">
						Password Updated!
					</div>
					<p class="text-gray-600">
						Your password has been successfully updated. You will be redirected to the sign in page.
					</p>
				</div>
			{:else}
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-2xl font-bold text-gray-900">
							Set new password
						</h2>
						<p class="mt-2 text-sm text-gray-600">
							Enter your new password below.
						</p>
					</div>

					<form method="POST" action="?/updatePassword" use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							await update();
						};
					}}>
						<div class="space-y-6">
							<div>
								<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
									New Password
								</label>
								<Input
									id="password"
									name="password"
									type="password"
									required
									disabled={loading}
									placeholder="Enter your new password"
								/>
							</div>

							<div>
								<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
									Confirm New Password
								</label>
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									required
									disabled={loading}
									placeholder="Confirm your new password"
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
								{loading ? 'Updating Password...' : 'Update Password'}
							</Button>
						</div>
					</form>
				</div>
			{/if}
		</div>
	</div>
</div>