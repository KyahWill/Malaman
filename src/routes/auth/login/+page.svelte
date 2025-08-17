<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
</script>

<svelte:head>
	<title>Sign In - Personalized LMS</title>
	<meta name="description" content="Sign in to your Personalized LMS account" />
</svelte:head>

<div class="space-y-6">
	<div class="text-center">
		<h2 class="text-2xl font-bold text-gray-900">
			Sign in to your account
		</h2>
		<p class="mt-2 text-sm text-gray-600">
			Or
			<a
				href="/auth/register"
				class="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
			>
				create a new account
			</a>
		</p>
	</div>

	<LoginForm />
</div>