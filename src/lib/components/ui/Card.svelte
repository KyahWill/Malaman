<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		variant?: 'default' | 'outlined' | 'elevated';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		hover?: boolean;
		clickable?: boolean;
		class?: string;
		onclick?: () => void;
		children?: any;
	}

	let {
		variant = 'default',
		padding = 'md',
		hover = false,
		clickable = false,
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const baseClasses = 'rounded-lg transition-all duration-200';

	const variantClasses = {
		default: 'bg-white border border-gray-200',
		outlined: 'bg-white border-2 border-gray-300',
		elevated: 'bg-white shadow-lg border border-gray-100'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const interactiveClasses = cn(
		hover && 'hover:shadow-md hover:border-gray-300',
		clickable && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
	);

	function handleClick() {
		if (clickable && onclick) {
			onclick();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (clickable && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			handleClick();
		}
	}
</script>

{#if clickable}
	<div
		class={cn(
			baseClasses,
			variantClasses[variant],
			paddingClasses[padding],
			interactiveClasses,
			className
		)}
		role="button"
		tabindex="0"
		onclick={handleClick}
		onkeydown={handleKeydown}
	>
		{@render children?.()}
	</div>
{:else}
	<div
		class={cn(
			baseClasses,
			variantClasses[variant],
			paddingClasses[padding],
			className
		)}
	>
		{@render children?.()}
	</div>
{/if}