<script lang="ts">
	import ResetPasswordForm from '$lib/components/auth/ResetPasswordForm.svelte';
</script>

<svelte:head>
	<title>Reset Password - Personalized LMS</title>
	<meta name="description" content="Set your new Personalized LMS password" />
</svelte:head>

<div class="space-y-6">
	<div class="text-center">
		<h2 class="text-2xl font-bold text-gray-900">
			Set new password
		</h2>
		<p class="mt-2 text-sm text-gray-600">
			Enter your new password below.
		</p>
	</div>

	<ResetPasswordForm />
</div>