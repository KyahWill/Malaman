<script lang="ts">
	import ForgotPasswordForm from '$lib/components/auth/ForgotPasswordForm.svelte';
</script>

<svelte:head>
	<title>Forgot Password - Personalized LMS</title>
	<meta name="description" content="Reset your Personalized LMS password" />
</svelte:head>

<div class="space-y-6">
	<div class="text-center">
		<h2 class="text-2xl font-bold text-gray-900">
			Forgot your password?
		</h2>
		<p class="mt-2 text-sm text-gray-600">
			No worries! Enter your email and we'll send you a reset link.
		</p>
	</div>

	<ForgotPasswordForm />
</div>