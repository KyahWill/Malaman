<script lang="ts">
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';
</script>

<svelte:head>
	<title>Create Account - Personalized LMS</title>
	<meta name="description" content="Create your Personalized LMS account" />
</svelte:head>

<div class="space-y-6">
	<div class="text-center">
		<h2 class="text-2xl font-bold text-gray-900">
			Create your account
		</h2>
		<p class="mt-2 text-sm text-gray-600">
			Already have an account?
			<a
				href="/auth/login"
				class="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
			>
				Sign in
			</a>
		</p>
	</div>

	<RegisterForm />
</div>