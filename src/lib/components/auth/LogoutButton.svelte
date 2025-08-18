<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'outline';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { variant = 'secondary', size = 'md', class: className = '' }: Props = $props();
	let loading = $state(false);
</script>

<form method="POST" action="/auth?/logout" use:enhance={() => {
	loading = true;
	return async ({ update }) => {
		loading = false;
		await update();
	};
}}>
	<Button
		type="submit"
		{variant}
		{size}
		class={className}
		disabled={loading}
	>
		{loading ? 'Signing Out...' : 'Sign Out'}
	</Button>
</form>