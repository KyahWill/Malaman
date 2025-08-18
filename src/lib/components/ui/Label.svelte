<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		for?: string;
		required?: boolean;
		class?: string;
		children?: any;
	}

	let {
		for: htmlFor,
		required = false,
		class: className = '',
		children
	}: Props = $props();
</script>

<label
	for={htmlFor}
	class={cn(
		'block text-sm font-medium text-gray-700 mb-1',
		className
	)}
>
	{@render children?.()}
	{#if required}
		<span class="text-red-500 ml-1" aria-label="required">*</span>
	{/if}
</label>