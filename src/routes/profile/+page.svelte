<script lang="ts">
	import ProfileForm from '$lib/components/auth/ProfileForm.svelte';
	import { profile } from '$lib/stores/auth';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
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
					<ProfileForm />
				</div>
			</div>
		</div>
	</div>
</div>