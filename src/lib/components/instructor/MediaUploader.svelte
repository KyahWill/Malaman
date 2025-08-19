<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui';
	import { toastHelpers } from '$lib/stores/toast.js';
	import type { MediaMetadata } from '$lib/services/mediaStorage.js';

	interface Props {
		accept?: string;
		maxSize?: number; // in MB
		onUpload: (url: string, metadata?: MediaMetadata) => void;
		currentUrl?: string;
		type: 'image' | 'video' | 'file';
		disabled?: boolean;
		contentId?: string; // For organizing files by lesson/course
		generateThumbnail?: boolean;
	}

	let {
		accept = '*/*',
		maxSize = 50, // 50MB default
		onUpload,
		currentUrl = '',
		type,
		disabled = false,
		contentId,
		generateThumbnail = false
	}: Props = $props();

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let dragOver = $state(false);

	// File size limits by type (in MB)
	const defaultSizeLimits = {
		image: 10,
		video: 100,
		file: 50
	};

	const actualMaxSize = maxSize || defaultSizeLimits[type];

	// Get storage bucket based on type
	function getStorageBucket(): string {
		return 'media'; // Single bucket for all media types
	}

	// Get storage path based on type
	function getStoragePath(filename: string): string {
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(2);
		const extension = filename.split('.').pop();
		const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
		
		return `${type}s/${timestamp}_${randomId}_${baseName}.${extension}`;
	}

	// Validate file
	function validateFile(file: File): string | null {
		// Check file size
		const fileSizeMB = file.size / (1024 * 1024);
		if (fileSizeMB > actualMaxSize) {
			return `File size must be less than ${actualMaxSize}MB`;
		}

		// Check file type
		if (type === 'image' && !file.type.startsWith('image/')) {
			return 'Please select an image file';
		}
		if (type === 'video' && !file.type.startsWith('video/')) {
			return 'Please select a video file';
		}

		// Check for potentially dangerous file types
		const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
		const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
		if (dangerousExtensions.includes(fileExtension)) {
			return 'This file type is not allowed for security reasons';
		}

		return null;
	}

	// Upload file via API
	async function uploadFile(file: File): Promise<{ url: string; metadata: MediaMetadata }> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('type', type);
		
		if (contentId) {
			formData.append('contentId', contentId);
		}
		
		if (generateThumbnail) {
			formData.append('generateThumbnail', 'true');
		}

		const response = await fetch('/api/media/upload', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
		}

		const result = await response.json();
		return { url: result.url, metadata: result.metadata };
	}

	// Handle file selection
	async function handleFileSelect(files: FileList | null) {
		if (!files || files.length === 0) return;

		const file = files[0];
		const validationError = validateFile(file);
		
		if (validationError) {
			toastHelpers.error(validationError);
			return;
		}

		try {
			isUploading = true;
			uploadProgress = 0;

			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				if (uploadProgress < 90) {
					uploadProgress += Math.random() * 20;
				}
			}, 200);

			const result = await uploadFile(file);
			
			clearInterval(progressInterval);
			uploadProgress = 100;

			onUpload(result.url, result.metadata);
			toastHelpers.success('File uploaded successfully');

		} catch (error) {
			console.error('Upload error:', error);
			toastHelpers.error(error instanceof Error ? error.message : 'Upload failed');
		} finally {
			isUploading = false;
			uploadProgress = 0;
		}
	}

	// Handle drag and drop
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) {
			dragOver = true;
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		
		if (disabled) return;

		const files = event.dataTransfer?.files;
		if (files) {
			handleFileSelect(files);
		}
	}

	// Trigger file input
	function triggerFileInput() {
		if (!disabled) {
			fileInput.click();
		}
	}

	// Remove current file
	function removeFile() {
		onUpload('');
	}

	// Get file type icon
	function getFileTypeIcon(fileType: string): string {
		if (type === 'image') {
			return `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
			</svg>`;
		} else if (type === 'video') {
			return `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
				<path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
				<path d="M8 9a1 1 0 000 2h4a1 1 0 100-2H8z"/>
			</svg>`;
		} else {
			return `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
			</svg>`;
		}
	}

	// Format file size
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<div class="media-uploader">
	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		{accept}
		onchange={(e) => handleFileSelect((e.target as HTMLInputElement)?.files)}
		class="hidden"
		{disabled}
	/>

	{#if currentUrl}
		<!-- Current file display -->
		<div class="current-file p-4 border border-gray-200 rounded-lg bg-gray-50">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="text-gray-400">
						{@html getFileTypeIcon(type)}
					</div>
					<div>
						<p class="font-medium text-gray-900">Current {type}</p>
						<p class="text-sm text-gray-500">Click to view or download</p>
					</div>
				</div>
				<div class="flex gap-2">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={() => window.open(currentUrl, '_blank')}
					>
						View
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onclick={removeFile}
						class="text-red-600 hover:text-red-700"
						{disabled}
					>
						Remove
					</Button>
				</div>
			</div>
		</div>

		<!-- Replace file option -->
		<div class="mt-3">
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onclick={triggerFileInput}
				{disabled}
			>
				Replace {type}
			</Button>
		</div>
	{:else}
		<!-- Upload area -->
		<div
			class="upload-area border-2 border-dashed rounded-lg p-6 text-center transition-colors {
				dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
			} {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			onclick={triggerFileInput}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					triggerFileInput();
				}
			}}
		>
			{#if isUploading}
				<!-- Upload progress -->
				<div class="space-y-4">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<div>
						<p class="text-sm font-medium text-gray-900">Uploading...</p>
						<div class="mt-2 bg-gray-200 rounded-full h-2">
							<div
								class="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style="width: {uploadProgress}%"
							></div>
						</div>
						<p class="text-xs text-gray-500 mt-1">{Math.round(uploadProgress)}% complete</p>
					</div>
				</div>
			{:else}
				<!-- Upload prompt -->
				<div class="space-y-4">
					<div class="text-gray-400 mx-auto">
						{@html getFileTypeIcon(type)}
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">
							{dragOver ? `Drop ${type} here` : `Upload ${type}`}
						</p>
						<p class="text-xs text-gray-500 mt-1">
							Drag and drop or click to select
						</p>
						<p class="text-xs text-gray-400 mt-2">
							Max size: {actualMaxSize}MB
							{#if accept !== '*/*'}
								• Accepted: {accept}
							{/if}
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Upload guidelines -->
	<div class="mt-4 text-xs text-gray-500 space-y-1">
		{#if type === 'image'}
			<p>• Images should be high quality and relevant to the lesson content</p>
			<p>• Alt text is required for accessibility compliance</p>
			<p>• Supported formats: JPG, PNG, GIF, WebP</p>
		{:else if type === 'video'}
			<p>• Videos should be clear and audible</p>
			<p>• Consider adding captions for accessibility</p>
			<p>• Supported formats: MP4, WebM, MOV</p>
		{:else}
			<p>• Files should be relevant to the lesson content</p>
			<p>• Provide descriptive filenames for better organization</p>
			<p>• Most file types are supported except executables</p>
		{/if}
	</div>
</div>

<style>
	.upload-area {
		min-height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>