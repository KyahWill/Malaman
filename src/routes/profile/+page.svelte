<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let { profile } = $derived(data);
	let loading = $state(false);
</script>

<svelte:head>
	<title>Profile - Personalized LMS</title>
	<meta name="description" content="Manage your profile settings" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="max-w-3xl mx-auto">
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<div class="max-w-md mx-auto">
						<h2 class="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
						
						<form method="POST" action="?/updateProfile" use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								await update();
							};
						}}>
							<div class="space-y-6">
								<div>
									<label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
										First Name
									</label>
									<Input
										id="firstName"
										name="firstName"
										type="text"
										value={profile?.first_name || ''}
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
										value={profile?.last_name || ''}
										required
										disabled={loading}
										placeholder="Enter your last name"
									/>
								</div>

								<div>
									<label for="profile-email" class="block text-sm font-medium text-gray-700 mb-2">
										Email
									</label>
									<Input
										id="profile-email"
										type="email"
										value={profile?.email || ''}
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
										value={profile?.role || ''}
										disabled
										class="bg-gray-50 capitalize"
									/>
									<p class="mt-1 text-sm text-gray-500">
										Role cannot be changed. Contact support if you need to update your role.
									</p>
								</div>

								{#if form?.error}
									<div class="text-red-600 text-sm" role="alert">
										{form.error}
									</div>
								{/if}

								{#if form?.success}
									<div class="text-green-600 text-sm" role="alert">
										{form.success}
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
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>