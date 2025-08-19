<!--
  Media Upload Demo Page
  Demonstrates the media upload functionality
-->

<script lang="ts">
	import { AppLayout } from '$lib/components/shared';
	import { MediaUploader } from '$lib/components/instructor';
	import { Card } from '$lib/components/ui';
	import type { MediaMetadata } from '$lib/services/mediaStorage.js';

	let imageUrl = $state('');
	let videoUrl = $state('');
	let fileUrl = $state('');
	
	let imageMetadata = $state<MediaMetadata | null>(null);
	let videoMetadata = $state<MediaMetadata | null>(null);
	let fileMetadata = $state<MediaMetadata | null>(null);

	function handleImageUpload(url: string, metadata?: MediaMetadata) {
		imageUrl = url;
		imageMetadata = metadata || null;
	}

	function handleVideoUpload(url: string, metadata?: MediaMetadata) {
		videoUrl = url;
		videoMetadata = metadata || null;
	}

	function handleFileUpload(url: string, metadata?: MediaMetadata) {
		fileUrl = url;
		fileMetadata = metadata || null;
	}
</script>

<svelte:head>
	<title>Media Upload Demo</title>
</svelte:head>

<AppLayout>
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Media Upload Demo</h1>
			<p class="mt-2 text-gray-600">
				Test the media upload functionality with different file types.
			</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Image Upload -->
			<Card class="p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Image Upload</h2>
				<MediaUploader
					type="image"
					maxSize={10}
					contentId="demo-lesson"
					generateThumbnail={true}
					onUpload={handleImageUpload}
					currentUrl={imageUrl}
				/>
				
				{#if imageMetadata}
					<div class="mt-4 p-3 bg-gray-50 rounded-md">
						<h3 class="text-sm font-medium text-gray-900 mb-2">Metadata:</h3>
						<div class="text-xs text-gray-600 space-y-1">
							<p><strong>Original:</strong> {imageMetadata.originalName}</p>
							<p><strong>Size:</strong> {(imageMetadata.size / 1024).toFixed(1)} KB</p>
							<p><strong>Type:</strong> {imageMetadata.type}</p>
							{#if imageMetadata.dimensions}
								<p><strong>Dimensions:</strong> {imageMetadata.dimensions.width}x{imageMetadata.dimensions.height}</p>
							{/if}
							{#if imageMetadata.thumbnailUrl}
								<p><strong>Thumbnail:</strong> Generated</p>
							{/if}
						</div>
					</div>
				{/if}
			</Card>

			<!-- Video Upload -->
			<Card class="p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Video Upload</h2>
				<MediaUploader
					type="video"
					maxSize={100}
					contentId="demo-lesson"
					onUpload={handleVideoUpload}
					currentUrl={videoUrl}
				/>
				
				{#if videoMetadata}
					<div class="mt-4 p-3 bg-gray-50 rounded-md">
						<h3 class="text-sm font-medium text-gray-900 mb-2">Metadata:</h3>
						<div class="text-xs text-gray-600 space-y-1">
							<p><strong>Original:</strong> {videoMetadata.originalName}</p>
							<p><strong>Size:</strong> {(videoMetadata.size / (1024 * 1024)).toFixed(1)} MB</p>
							<p><strong>Type:</strong> {videoMetadata.type}</p>
						</div>
					</div>
				{/if}
			</Card>

			<!-- File Upload -->
			<Card class="p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">File Upload</h2>
				<MediaUploader
					type="file"
					maxSize={50}
					contentId="demo-lesson"
					onUpload={handleFileUpload}
					currentUrl={fileUrl}
				/>
				
				{#if fileMetadata}
					<div class="mt-4 p-3 bg-gray-50 rounded-md">
						<h3 class="text-sm font-medium text-gray-900 mb-2">Metadata:</h3>
						<div class="text-xs text-gray-600 space-y-1">
							<p><strong>Original:</strong> {fileMetadata.originalName}</p>
							<p><strong>Size:</strong> {(fileMetadata.size / 1024).toFixed(1)} KB</p>
							<p><strong>Type:</strong> {fileMetadata.type}</p>
						</div>
					</div>
				{/if}
			</Card>
		</div>

		<!-- Upload Results -->
		{#if imageUrl || videoUrl || fileUrl}
			<Card class="p-6 mt-8">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Upload Results</h2>
				<div class="space-y-4">
					{#if imageUrl}
						<div>
							<h3 class="text-sm font-medium text-gray-700 mb-2">Image:</h3>
							<img src={imageUrl} alt="Uploaded image" class="max-w-xs rounded-md shadow-sm" />
							<p class="text-xs text-gray-500 mt-1">{imageUrl}</p>
						</div>
					{/if}
					
					{#if videoUrl}
						<div>
							<h3 class="text-sm font-medium text-gray-700 mb-2">Video:</h3>
							<video controls class="max-w-xs rounded-md shadow-sm">
								<source src={videoUrl} />
								Your browser does not support the video tag.
							</video>
							<p class="text-xs text-gray-500 mt-1">{videoUrl}</p>
						</div>
					{/if}
					
					{#if fileUrl}
						<div>
							<h3 class="text-sm font-medium text-gray-700 mb-2">File:</h3>
							<a 
								href={fileUrl} 
								target="_blank" 
								class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
								</svg>
								Download File
							</a>
							<p class="text-xs text-gray-500 mt-1">{fileUrl}</p>
						</div>
					{/if}
				</div>
			</Card>
		{/if}
	</div>
</AppLayout>