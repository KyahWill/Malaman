<!--
  Media Manager Component
  Provides interface for managing uploaded media files
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Card, Modal } from '$lib/components/ui';
	import { toastHelpers } from '$lib/stores/toast.js';
	import type { FileObject } from '@supabase/storage-js';

	interface Props {
		folder?: string;
		showStats?: boolean;
		allowDelete?: boolean;
	}

	let {
		folder,
		showStats = true,
		allowDelete = false
	}: Props = $props();

	let files = $state<FileObject[]>([]);
	let stats = $state<any>(null);
	let loading = $state(true);
	let selectedFile = $state<FileObject | null>(null);
	let showDeleteModal = $state(false);
	let deleting = $state(false);

	onMount(() => {
		loadFiles();
		if (showStats) {
			loadStats();
		}
	});

	async function loadFiles() {
		try {
			loading = true;
			const params = new URLSearchParams();
			if (folder) params.set('folder', folder);
			
			const response = await fetch(`/api/media/list?${params}`);
			const data = await response.json();
			
			if (data.success) {
				files = data.files;
			} else {
				toastHelpers.error('Failed to load files');
			}
		} catch (error) {
			console.error('Load files error:', error);
			toastHelpers.error('Failed to load files');
		} finally {
			loading = false;
		}
	}

	async function loadStats() {
		try {
			const response = await fetch('/api/media/stats');
			const data = await response.json();
			
			if (data.success) {
				stats = data.stats;
			}
		} catch (error) {
			console.error('Load stats error:', error);
		}
	}

	async function deleteFile(file: FileObject) {
		try {
			deleting = true;
			const response = await fetch(`/api/media/${encodeURIComponent(file.name)}`, {
				method: 'DELETE'
			});
			
			const data = await response.json();
			
			if (data.success) {
				toastHelpers.success('File deleted successfully');
				await loadFiles();
				if (showStats) {
					await loadStats();
				}
			} else {
				toastHelpers.error('Failed to delete file');
			}
		} catch (error) {
			console.error('Delete file error:', error);
			toastHelpers.error('Failed to delete file');
		} finally {
			deleting = false;
			showDeleteModal = false;
			selectedFile = null;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getFileIcon(fileName: string): string {
		const extension = fileName.split('.').pop()?.toLowerCase() || '';
		
		if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
			return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
			</svg>`;
		} else if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
			return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
				<path d="M8 9a1 1 0 000 2h4a1 1 0 100-2H8z"/>
			</svg>`;
		} else {
			return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
			</svg>`;
		}
	}

	function confirmDelete(file: FileObject) {
		selectedFile = file;
		showDeleteModal = true;
	}
</script>

<div class="media-manager space-y-6">
	<!-- Statistics -->
	{#if showStats && stats}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Card class="p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Total Files</p>
						<p class="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
					</div>
					<div class="text-blue-600">
						<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
						</svg>
					</div>
				</div>
			</Card>

			<Card class="p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Total Size</p>
						<p class="text-2xl font-bold text-gray-900">{stats.totalSizeFormatted}</p>
					</div>
					<div class="text-green-600">
						<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
							<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
						</svg>
					</div>
				</div>
			</Card>

			<Card class="p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">File Types</p>
						<p class="text-2xl font-bold text-gray-900">{Object.keys(stats.byType).length}</p>
					</div>
					<div class="text-purple-600">
						<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
							<path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
						</svg>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	<!-- File List -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-gray-900">
				Media Files {folder ? `in ${folder}` : ''}
			</h3>
			<Button
				variant="secondary"
				size="sm"
				onclick={loadFiles}
				disabled={loading}
			>
				{loading ? 'Loading...' : 'Refresh'}
			</Button>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-8">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		{:else if files.length === 0}
			<div class="text-center py-8 text-gray-500">
				<svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
				</svg>
				<p>No files found</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								File
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Size
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Modified
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each files as file}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="text-gray-400 mr-3">
											{@html getFileIcon(file.name)}
										</div>
										<div>
											<div class="text-sm font-medium text-gray-900">
												{file.name}
											</div>
											<div class="text-sm text-gray-500">
												{file.metadata?.mimetype || 'Unknown type'}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{formatFileSize(file.metadata?.size || 0)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(file.updated_at || file.created_at)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<div class="flex items-center justify-end gap-2">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => window.open(`/storage/v1/object/public/media/${file.name}`, '_blank')}
										>
											View
										</Button>
										{#if allowDelete}
											<Button
												variant="ghost"
												size="sm"
												onclick={() => confirmDelete(file)}
												class="text-red-600 hover:text-red-700"
											>
												Delete
											</Button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && selectedFile}
	<Modal
		open={showDeleteModal}
		onClose={() => {
			showDeleteModal = false;
			selectedFile = null;
		}}
		title="Delete File"
	>
		<div class="space-y-4">
			<p class="text-gray-600">
				Are you sure you want to delete <strong>{selectedFile.name}</strong>?
				This action cannot be undone.
			</p>
			
			<div class="flex justify-end gap-3">
				<Button
					variant="secondary"
					onclick={() => {
						showDeleteModal = false;
						selectedFile = null;
					}}
					disabled={deleting}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					onclick={() => selectedFile && deleteFile(selectedFile)}
					disabled={deleting}
					class="bg-red-600 hover:bg-red-700"
				>
					{deleting ? 'Deleting...' : 'Delete'}
				</Button>
			</div>
		</div>
	</Modal>
{/if}