<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'spinner' | 'dots' | 'pulse';
		text?: string;
		center?: boolean;
		overlay?: boolean;
		class?: string;
	}

	let {
		size = 'md',
		variant = 'spinner',
		text,
		center = false,
		overlay = false,
		class: className = ''
	}: Props = $props();

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
		xl: 'w-12 h-12'
	};

	const textSizeClasses = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg',
		xl: 'text-xl'
	};
</script>

{#if overlay}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
		<div class="bg-white rounded-lg p-6 shadow-xl">
			<div class="flex flex-col items-center space-y-4">
				<!-- Loading indicator -->
				<div class={cn('flex items-center justify-center', className)}>
					{#if variant === 'spinner'}
						<svg 
							class={cn('animate-spin text-primary-600', sizeClasses[size])}
							fill="none" 
							viewBox="0 0 24 24"
						>
							<circle 
								class="opacity-25" 
								cx="12" 
								cy="12" 
								r="10" 
								stroke="currentColor" 
								stroke-width="4"
							></circle>
							<path 
								class="opacity-75" 
								fill="currentColor" 
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					{:else if variant === 'dots'}
						<div class="flex space-x-1">
							<div class={cn('bg-primary-600 rounded-full animate-bounce', sizeClasses[size])} style="animation-delay: 0ms"></div>
							<div class={cn('bg-primary-600 rounded-full animate-bounce', sizeClasses[size])} style="animation-delay: 150ms"></div>
							<div class={cn('bg-primary-600 rounded-full animate-bounce', sizeClasses[size])} style="animation-delay: 300ms"></div>
						</div>
					{:else if variant === 'pulse'}
						<div class={cn('bg-primary-600 rounded-full animate-pulse', sizeClasses[size])}></div>
					{/if}
				</div>

				<!-- Loading text -->
				{#if text}
					<p class={cn('text-gray-600 font-medium', textSizeClasses[size])}>
						{text}
					</p>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div 
		class={cn(
			'flex items-center',
			center && 'justify-center',
			text ? 'space-x-3' : '',
			className
		)}
		role="status"
		aria-label={text || 'Loading'}
	>
		<!-- Loading indicator -->
		{#if variant === 'spinner'}
			<svg 
				class={cn('animate-spin text-primary-600', sizeClasses[size])}
				fill="none" 
				viewBox="0 0 24 24"
			>
				<circle 
					class="opacity-25" 
					cx="12" 
					cy="12" 
					r="10" 
					stroke="currentColor" 
					stroke-width="4"
				></circle>
				<path 
					class="opacity-75" 
					fill="currentColor" 
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		{:else if variant === 'dots'}
			<div class="flex space-x-1">
				<div class={cn('bg-primary-600 rounded-full animate-bounce', sizeClasses[size])} style="animation-delay: 0ms"></div>
				<div class={cn('bg-primary-600 rounded-full animate-bounce', sizeClasses[size])} style="animation-delay: 150ms"></div>
				<div class={cn('bg-primary-600 rounded-full animate-bounce', sizeClasses[size])} style="animation-delay: 300ms"></div>
			</div>
		{:else if variant === 'pulse'}
			<div class={cn('bg-primary-600 rounded-full animate-pulse', sizeClasses[size])}></div>
		{/if}

		<!-- Loading text -->
		{#if text}
			<span class={cn('text-gray-600 font-medium', textSizeClasses[size])}>
				{text}
			</span>
		{/if}
	</div>
{/if}