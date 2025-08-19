<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		videoId: string;
		title?: string;
		width?: number;
		height?: number;
		autoplay?: boolean;
		controls?: boolean;
		showInfo?: boolean;
		allowFullscreen?: boolean;
	}

	let {
		videoId,
		title = 'YouTube Video',
		width = 560,
		height = 315,
		autoplay = false,
		controls = true,
		showInfo = true,
		allowFullscreen = true
	}: Props = $props();

	let isLoaded = $state(false);
	let hasError = $state(false);
	let thumbnailUrl = $state('');

	// Generate YouTube embed URL
	function getEmbedUrl(): string {
		const params = new URLSearchParams();
		
		if (!autoplay) params.set('autoplay', '0');
		if (!controls) params.set('controls', '0');
		if (!showInfo) params.set('showinfo', '0');
		params.set('rel', '0'); // Don't show related videos
		params.set('modestbranding', '1'); // Minimal YouTube branding
		
		return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
	}

	// Generate thumbnail URL
	function getThumbnailUrl(): string {
		// Try high quality thumbnail first, fallback to default
		return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
	}

	// Validate video ID format
	function isValidVideoId(id: string): boolean {
		return /^[a-zA-Z0-9_-]{11}$/.test(id);
	}

	// Load video
	function loadVideo() {
		if (isValidVideoId(videoId)) {
			isLoaded = true;
			hasError = false;
		} else {
			hasError = true;
		}
	}

	// Handle thumbnail load error (fallback to default thumbnail)
	function handleThumbnailError() {
		thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
	}

	onMount(() => {
		if (videoId) {
			thumbnailUrl = getThumbnailUrl();
		}
	});

	// Update thumbnail when videoId changes
	$effect(() => {
		if (videoId) {
			thumbnailUrl = getThumbnailUrl();
			hasError = false;
			isLoaded = false;
		}
	});
</script>

<div class="youtube-embed">
	{#if hasError || !videoId || !isValidVideoId(videoId)}
		<!-- Error state -->
		<div class="error-state bg-gray-100 border border-gray-300 rounded-lg p-6 text-center">
			<svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">Invalid YouTube Video</h3>
			<p class="text-gray-600">
				{#if !videoId}
					No video ID provided
				{:else if !isValidVideoId(videoId)}
					Invalid video ID format: {videoId}
				{:else}
					Failed to load video
				{/if}
			</p>
		</div>
	{:else if !isLoaded}
		<!-- Thumbnail preview with play button -->
		<div class="thumbnail-container relative rounded-lg overflow-hidden bg-black">
			<img
				src={thumbnailUrl}
				alt={title}
				class="w-full h-auto"
				style="aspect-ratio: 16/9;"
				onerror={handleThumbnailError}
			/>
			
			<!-- Play button overlay -->
			<button
				type="button"
				onclick={loadVideo}
				class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all group"
				aria-label="Play video: {title}"
			>
				<div class="bg-red-600 rounded-full p-4 group-hover:bg-red-700 transition-colors">
					<svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
						<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
					</svg>
				</div>
			</button>
			
			<!-- Video info overlay -->
			<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
				<h3 class="text-white font-medium text-sm truncate">{title}</h3>
				<p class="text-gray-300 text-xs">YouTube Video</p>
			</div>
		</div>
	{:else}
		<!-- Embedded video -->
		<div class="video-container relative rounded-lg overflow-hidden bg-black">
			<iframe
				src={getEmbedUrl()}
				{title}
				{width}
				{height}
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen={allowFullscreen}
				class="w-full h-auto"
				style="aspect-ratio: 16/9;"
				loading="lazy"
			></iframe>
		</div>
	{/if}

	<!-- Video metadata -->
	<div class="mt-3 text-sm text-gray-600">
		<div class="flex items-center justify-between">
			<span>YouTube Video</span>
			<div class="flex items-center gap-2">
				{#if isLoaded}
					<button
						type="button"
						onclick={() => isLoaded = false}
						class="text-blue-600 hover:text-blue-700"
					>
						Show Thumbnail
					</button>
				{/if}
				<a
					href="https://www.youtube.com/watch?v={videoId}"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 hover:text-blue-700"
				>
					View on YouTube
				</a>
			</div>
		</div>
	</div>

	<!-- Accessibility note -->
	<div class="mt-2 text-xs text-gray-500">
		<p>
			<strong>Accessibility Note:</strong> YouTube videos should include captions when possible. 
			Consider providing a transcript or summary for users who cannot access video content.
		</p>
	</div>
</div>

<style>
	.youtube-embed {
		max-width: 100%;
	}

	.thumbnail-container,
	.video-container {
		position: relative;
		width: 100%;
		max-width: 100%;
	}

	.thumbnail-container img,
	.video-container iframe {
		display: block;
		width: 100%;
		height: auto;
	}

	/* Responsive aspect ratio */
	@media (max-width: 640px) {
		.thumbnail-container,
		.video-container {
			aspect-ratio: 16/9;
		}
	}
</style>