<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
		size?: 'sm' | 'md' | 'lg';
		rounded?: boolean;
		class?: string;
		children?: any;
	}

	let {
		variant = 'default',
		size = 'md',
		rounded = false,
		class: className = '',
		children
	}: Props = $props();

	const baseClasses = 'inline-flex items-center font-medium';

	const variantClasses = {
		default: 'bg-gray-100 text-gray-800',
		primary: 'bg-primary-100 text-primary-800',
		success: 'bg-green-100 text-green-800',
		warning: 'bg-yellow-100 text-yellow-800',
		error: 'bg-red-100 text-red-800',
		info: 'bg-blue-100 text-blue-800'
	};

	const sizeClasses = {
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-2.5 py-1 text-sm',
		lg: 'px-3 py-1.5 text-base'
	};

	const roundedClasses = rounded ? 'rounded-full' : 'rounded';
</script>

<span
	class={cn(
		baseClasses,
		variantClasses[variant],
		sizeClasses[size],
		roundedClasses,
		className
	)}
>
	{@render children?.()}
</span>