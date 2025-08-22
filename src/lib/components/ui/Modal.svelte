<script lang="ts">
	import { cn } from '$lib/utils';
	import Button from './Button.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		closable?: boolean;
		children?: any;
		class?: string;
	}

	let {
		open,
		onClose,
		title,
		size = 'md',
		closable = true,
		children,
		class: className = ''
	}: Props = $props();

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closable) {
			onClose();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && closable) {
			onClose();
		}
	}

	// Focus management
	let modalElement = $state<HTMLDivElement>();
	let previousActiveElement: Element | null = null;

	$effect(() => {
		if (open) {
			// Store the previously focused element
			previousActiveElement = document.activeElement;
			
			// Focus the modal
			setTimeout(() => {
				modalElement?.focus();
			}, 0);

			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Restore body scroll
			document.body.style.overflow = '';
			
			// Restore focus to previously focused element
			if (previousActiveElement instanceof HTMLElement) {
				previousActiveElement.focus();
			}
		}

		// Cleanup function
		return () => {
			document.body.style.overflow = '';
		};
	});

	// Handle backdrop keydown for accessibility
	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			if (closable) {
				onClose();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Modal backdrop -->
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-scroll"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		tabindex="-1"
		role="presentation"
	>
		<!-- Modal content -->
		<div 
			bind:this={modalElement}
			class={cn(
				'bg-white rounded-lg shadow-xl w-full transform transition-all duration-200 ease-out',
				sizeClasses[size],
				className
			)}
			tabindex="-1"
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'modal-title' : undefined}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Modal header -->
			{#if title || closable}
				<div class="flex items-center justify-between p-6 border-b border-gray-200">
					{#if title}
						<h2 id="modal-title" class="text-lg font-semibold text-gray-900">
							{title}
						</h2>
					{/if}
					
					{#if closable}
						<button
							onclick={onClose}
							class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
							aria-label="Close modal"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<!-- Modal body -->
			<div class="p-6">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}