<!--
  Admin Media Management Page
  Provides interface for managing all uploaded media files
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { AppLayout } from '$lib/components/shared';
	import { MediaManager } from '$lib/components/shared';
	import { Button, Card } from '$lib/components/ui';
	import { toastHelpers } from '$lib/stores/toast.js';

	let cleanupInProgress = $state(false);

	async function performCleanup() {
		try {
			cleanupInProgress = true;
			
			const response = await fetch('/api/media/cleanup', {
				method: 'POST'
			});
			
			const data = await response.json();
			
			if (data.success) {
				const { deletedCount, errors } = data.result;
				
				if (deletedCount > 0) {
					toastHelpers.success(`Cleaned up ${deletedCount} orphaned files`);
				} else {
					toastHelpers.info('No orphaned files found');
				}
				
				if (errors.length > 0) {
					toastHelpers.warning(`${errors.length} errors occurred during cleanup`);
				}
			} else {
				toastHelpers.error('Cleanup failed');
			}
		} catch (error) {
			console.error('Cleanup error:', error);
			toastHelpers.error('Cleanup failed');
		} finally {
			cleanupInProgress = false;
		}
	}
</script>

<svelte:head>
	<title>Media Management - Admin</title>
</svelte:head>

<AppLayout>
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Media Management</h1>
			<p class="mt-2 text-gray-600">
				Manage uploaded files, view storage statistics, and perform maintenance tasks.
			</p>
		</div>

		<!-- Admin Actions -->
		<Card class="p-6 mb-8">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>
			<div class="flex flex-wrap gap-4">
				<Button
					variant="secondary"
					onclick={performCleanup}
					disabled={cleanupInProgress}
				>
					{cleanupInProgress ? 'Cleaning up...' : 'Cleanup Orphaned Files'}
				</Button>
				
				<Button
					variant="secondary"
					onclick={() => window.open('/api/media/stats', '_blank')}
				>
					View Raw Statistics
				</Button>
			</div>
			
			<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-yellow-800">
							Admin Functions
						</h3>
						<div class="mt-2 text-sm text-yellow-700">
							<p>
								These functions should only be used by administrators. 
								Cleanup operations cannot be undone.
							</p>
						</div>
					</div>
				</div>
			</div>
		</Card>

		<!-- Media Manager -->
		<MediaManager
			showStats={true}
			allowDelete={true}
		/>
	</div>
</AppLayout>