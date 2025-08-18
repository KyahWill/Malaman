<script lang="ts">
	import { toastStore, toastHelpers, type Toast } from '$lib/stores/toast';
	import { cn } from '$lib/utils';
	import { fly } from 'svelte/transition';

	// Get toasts from store
	const { toasts } = $derived($toastStore);

	// Toast type styling
	function getToastStyles(type: Toast['type']) {
		const styles = {
			success: {
				container: 'bg-green-50 border-green-200',
				icon: 'text-green-600',
				title: 'text-green-800',
				message: 'text-green-700',
				button: 'text-green-500 hover:text-green-600'
			},
			error: {
				container: 'bg-red-50 border-red-200',
				icon: 'text-red-600',
				title: 'text-red-800',
				message: 'text-red-700',
				button: 'text-red-500 hover:text-red-600'
			},
			warning: {
				container: 'bg-yellow-50 border-yellow-200',
				icon: 'text-yellow-600',
				title: 'text-yellow-800',
				message: 'text-yellow-700',
				button: 'text-yellow-500 hover:text-yellow-600'
			},
			info: {
				container: 'bg-blue-50 border-blue-200',
				icon: 'text-blue-600',
				title: 'text-blue-800',
				message: 'text-blue-700',
				button: 'text-blue-500 hover:text-blue-600'
			}
		};
		return styles[type];
	}

	// Toast icons
	function getToastIcon(type: Toast['type']) {
		const icons = {
			success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
			error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
			warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
			info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
		};
		return icons[type];
	}

	function dismissToast(id: string) {
		toastHelpers.remove(id);
	}
</script>

<!-- Toast container -->
<div 
	class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
	aria-live="polite"
	aria-label="Notifications"
>
	{#each toasts as toast (toast.id)}
		<div
			class={cn(
				'border rounded-lg shadow-lg p-4 transition-all duration-200',
				getToastStyles(toast.type).container
			)}
			role="alert"
			transition:fly={{ x: 300, duration: 300 }}
		>
			<div class="flex items-start">
				<!-- Toast icon -->
				<div class="flex-shrink-0">
					<svg 
						class={cn('w-5 h-5', getToastStyles(toast.type).icon)}
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path 
							stroke-linecap="round" 
							stroke-linejoin="round" 
							stroke-width="2" 
							d={getToastIcon(toast.type)} 
						/>
					</svg>
				</div>

				<!-- Toast content -->
				<div class="ml-3 flex-1">
					<h4 class={cn('text-sm font-medium', getToastStyles(toast.type).title)}>
						{toast.title}
					</h4>
					{#if toast.message}
						<p class={cn('mt-1 text-sm', getToastStyles(toast.type).message)}>
							{toast.message}
						</p>
					{/if}
				</div>

				<!-- Dismiss button -->
				{#if toast.dismissible}
					<div class="ml-4 flex-shrink-0">
						<button
							onclick={() => dismissToast(toast.id)}
							class={cn(
								'inline-flex rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
								getToastStyles(toast.type).button
							)}
							aria-label="Dismiss notification"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>