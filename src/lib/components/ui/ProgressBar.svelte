<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		value: number; // 0-100
		max?: number;
		size?: 'sm' | 'md' | 'lg';
		variant?: 'primary' | 'success' | 'warning' | 'error';
		showLabel?: boolean;
		label?: string;
		animated?: boolean;
		striped?: boolean;
		class?: string;
	}

	let {
		value,
		max = 100,
		size = 'md',
		variant = 'primary',
		showLabel = false,
		label,
		animated = false,
		striped = false,
		class: className = ''
	}: Props = $props();

	// Calculate percentage
	const percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));

	// Size classes
	const sizeClasses = {
		sm: 'h-2',
		md: 'h-3',
		lg: 'h-4'
	};

	// Variant classes
	const variantClasses = {
		primary: 'bg-primary-600',
		success: 'bg-green-600',
		warning: 'bg-yellow-600',
		error: 'bg-red-600'
	};

	// Label text
	const displayLabel = $derived(() => {
		if (label) return label;
		if (showLabel) return `${Math.round(percentage)}%`;
		return '';
	});
</script>

<div class={cn('w-full', className)}>
	<!-- Label -->
	{#if displayLabel()}
		<div class="flex justify-between items-center mb-2">
			<span class="text-sm font-medium text-gray-700">
				{displayLabel()}
			</span>
			{#if showLabel && !label}
				<span class="text-sm text-gray-500">
					{value} / {max}
				</span>
			{/if}
		</div>
	{/if}

	<!-- Progress bar container -->
	<div 
		class={cn(
			'w-full bg-gray-200 rounded-full overflow-hidden',
			sizeClasses[size]
		)}
		role="progressbar"
		aria-valuenow={value}
		aria-valuemin={0}
		aria-valuemax={max}
		aria-label={displayLabel() || `Progress: ${Math.round(percentage)}%`}
	>
		<!-- Progress bar fill -->
		<div
			class={cn(
				'h-full transition-all duration-500 ease-out rounded-full',
				variantClasses[variant],
				striped && 'bg-stripes',
				animated && striped && 'animate-stripes'
			)}
			style={`width: ${percentage}%`}
		></div>
	</div>
</div>

<style>
	/* Striped pattern */
	.bg-stripes {
		background-image: linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.15) 25%,
			transparent 25%,
			transparent 50%,
			rgba(255, 255, 255, 0.15) 50%,
			rgba(255, 255, 255, 0.15) 75%,
			transparent 75%,
			transparent
		);
		background-size: 1rem 1rem;
	}

	/* Animated stripes */
	.animate-stripes {
		animation: stripes 1s linear infinite;
	}

	@keyframes stripes {
		0% {
			background-position: 0 0;
		}
		100% {
			background-position: 1rem 0;
		}
	}
</style>