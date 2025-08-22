<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Label } from '$lib/components/ui';
	import { RichTextEditor } from '$lib/components/ui';
	import MediaUploader from './MediaUploader.svelte';
	import YouTubeEmbed from './YouTubeEmbed.svelte';
	import type { ContentBlock, ContentType } from '$lib/types/database.js';
	import { toastHelpers } from '$lib/stores/toast.js';

	interface Props {
		block: ContentBlock;
		onUpdate: (block: ContentBlock) => void;
	}

	let { block, onUpdate }: Props = $props();

	// Local state for editing
	let title = $state(block.metadata?.title || '');
	let description = $state(block.metadata?.description || '');
	let isExpanded = $state(false);

	// Content-specific state
	let richTextContent = $state(block.content.rich_text?.html || '<p>Start writing...</p>');
	let imageUrl = $state(block.content.image?.url || '');
	let imageAlt = $state(block.content.image?.alt_text || '');
	let imageCaption = $state(block.content.image?.caption || '');
	let videoUrl = $state(block.content.video?.url || '');
	let fileUrl = $state(block.content.file?.url || '');
	let fileName = $state(block.content.file?.filename || '');
	let fileType = $state(block.content.file?.file_type || '');
	let fileSize = $state(block.content.file?.file_size || 0);
	let youtubeUrl = $state('');
	let youtubeVideoId = $state(block.content.youtube?.video_id || '');
	let youtubeTitle = $state(block.content.youtube?.title || '');

	// Update block when content changes
	function updateBlock() {
		const updatedBlock: ContentBlock = {
			...block,
			metadata: {
				...block.metadata,
				title,
				description
			},
			content: getUpdatedContent(),
			updated_at: new Date().toISOString()
		};
		onUpdate(updatedBlock);
	}

	// Get updated content based on block type
	function getUpdatedContent() {
		switch (block.type) {
			case 'rich_text':
				return {
					rich_text: {
						html: richTextContent,
						plain_text: stripHtml(richTextContent),
						word_count: countWords(stripHtml(richTextContent))
					}
				};
			case 'image':
				return {
					image: {
						url: imageUrl,
						alt_text: imageAlt,
						caption: imageCaption
					}
				};
			case 'video':
				return {
					video: {
						url: videoUrl,
						thumbnail_url: block.content.video?.thumbnail_url || '',
						duration: block.content.video?.duration || 0
					}
				};
			case 'file':
				return {
					file: {
						url: fileUrl,
						filename: fileName,
						file_type: fileType,
						file_size: fileSize
					}
				};
			case 'youtube':
				return {
					youtube: {
						video_id: youtubeVideoId,
						title: youtubeTitle,
						thumbnail_url: block.content.youtube?.thumbnail_url || '',
						duration: block.content.youtube?.duration || 0
					}
				};
			default:
				return block.content;
		}
	}

	// Utility functions
	function stripHtml(html: string): string {
		const tmp = document.createElement('div');
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || '';
	}

	function countWords(text: string): number {
		return text.trim().split(/\s+/).filter(word => word.length > 0).length;
	}

	// Handle rich text updates
	function handleRichTextUpdate(content: string) {
		richTextContent = content;
		updateBlock();
	}

	// Handle media upload
	function handleMediaUpload(url: string, metadata?: any) {
		switch (block.type) {
			case 'image':
				imageUrl = url;
				if (metadata) {
					// Auto-generate alt text if not provided
					if (!imageAlt && metadata.filename) {
						imageAlt = `Image: ${metadata.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}`;
					}
				}
				break;
			case 'video':
				videoUrl = url;
				break;
			case 'file':
				fileUrl = url;
				if (metadata) {
					fileName = metadata.filename || fileName;
					fileType = metadata.type || fileType;
					fileSize = metadata.size || fileSize;
				}
				break;
		}
		updateBlock();
	}

	// Handle YouTube URL processing
	function processYouTubeUrl() {
		if (!youtubeUrl) return;

		const videoId = extractYouTubeVideoId(youtubeUrl);
		if (videoId) {
			youtubeVideoId = videoId;
			// Fetch video metadata
			fetchYouTubeMetadata(videoId);
			updateBlock()
		} else {
			toastHelpers.error('Invalid YouTube URL');
		}
	}

	function extractYouTubeVideoId(url: string): string | null {
		const patterns = [
			/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
			/youtube\.com\/v\/([^&\n?#]+)/
		];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) return match[1];
		}
		return null;
	}

	async function fetchYouTubeMetadata(videoId: string) {
		try {
			const response = await fetch('/api/youtube/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}` })
			});

			if (response.ok) {
				const result = await response.json();
				youtubeTitle = result.videoData.title;
			} else {
				youtubeTitle = `YouTube Video: ${videoId}`;
			}
			updateBlock();
		} catch (error) {
			console.error('Failed to fetch YouTube metadata:', error);
			youtubeTitle = `YouTube Video: ${videoId}`;
			updateBlock();
		}
	}

	// Validate content
	function validateContent(): boolean {
		switch (block.type) {
			case 'rich_text':
				return richTextContent.trim().length > 0;
			case 'image':
				return imageUrl.trim().length > 0 && imageAlt.trim().length > 0;
			case 'video':
				return videoUrl.trim().length > 0;
			case 'file':
				return fileUrl.trim().length > 0 && fileName.trim().length > 0;
			case 'youtube':
				return youtubeVideoId.trim().length > 0;
			default:
				return true;
		}
	}

	// Get content type display name
	function getContentTypeDisplayName(type: ContentType): string {
		const names = {
			rich_text: 'Rich Text',
			image: 'Image',
			video: 'Video',
			file: 'File',
			youtube: 'YouTube Video'
		};
		return names[type] || type;
	}

</script>

<div class="content-block-editor">
	<!-- Block Header -->
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<h3 class="font-medium text-gray-900">
				{getContentTypeDisplayName(block.type)}
			</h3>
			{#if !validateContent()}
				<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
					Incomplete
				</span>
			{/if}
		</div>
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onclick={() => isExpanded = !isExpanded}
		>
			{isExpanded ? 'Collapse' : 'Expand'}
		</Button>
	</div>

	<!-- Metadata Fields -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
		<div>
			<Label for="block-title-{block.id}">Block Title</Label>
			<Input
				id="block-title-{block.id}"
				bind:value={title}
				placeholder="Enter block title"
				class="mt-1"
			/>
		</div>
		<div>
			<Label for="block-description-{block.id}">Description</Label>
			<Input
				id="block-description-{block.id}"
				bind:value={description}
				placeholder="Brief description"
				class="mt-1"
			/>
		</div>
	</div>

	<!-- Content Editor -->
	<div class="border border-gray-200 rounded-lg p-4 {isExpanded ? '' : 'max-h-64 overflow-hidden'}">
		{#if block.type === 'rich_text'}
			<RichTextEditor
				content={richTextContent}
				onUpdate={handleRichTextUpdate}
				placeholder="Start writing your content..."
				class="min-h-[200px]"
			/>
		{:else if block.type === 'image'}
			<div class="space-y-4">
				<MediaUploader
					accept="image/*"
					onUpload={handleMediaUpload}
					currentUrl={imageUrl}
					type="image"
				/>
				
				{#if imageUrl}
					<div class="space-y-3">
						<div>
							<Label for="image-alt-{block.id}">Alt Text (Required) *</Label>
							<Input
								id="image-alt-{block.id}"
								bind:value={imageAlt}
								placeholder="Describe the image for accessibility"
								required
								class="mt-1"
							/>
							<p class="text-xs text-gray-500 mt-1">
								Alt text is required for accessibility. Describe what the image shows.
							</p>
						</div>
						<div>
							<Label for="image-caption-{block.id}">Caption (Optional)</Label>
							<Input
								id="image-caption-{block.id}"
								bind:value={imageCaption}
								placeholder="Optional caption for the image"
								class="mt-1"
							/>
						</div>
						
						<!-- Image Preview -->
						<div class="mt-4">
							<img
								src={imageUrl}
								alt={imageAlt || 'Preview'}
								class="max-w-full h-auto rounded-lg border border-gray-200"
								style="max-height: 300px;"
							/>
						</div>
					</div>
				{/if}
			</div>
		{:else if block.type === 'video'}
			<div class="space-y-4">
				<MediaUploader
					accept="video/*"
					onUpload={handleMediaUpload}
					currentUrl={videoUrl}
					type="video"
				/>
				
				{#if videoUrl}
					<div class="mt-4">
						<video
							src={videoUrl}
							controls
							class="max-w-full h-auto rounded-lg border border-gray-200"
							style="max-height: 300px;"
						>
							<track kind="captions" />
							Your browser does not support the video tag.
						</video>
					</div>
				{/if}
			</div>
		{:else if block.type === 'file'}
			<div class="space-y-4">
				<MediaUploader
					accept="*/*"
					onUpload={handleMediaUpload}
					currentUrl={fileUrl}
					type="file"
				/>
				
				{#if fileUrl}
					<div class="space-y-3">
						<div>
							<Label for="file-name-{block.id}">File Name</Label>
							<Input
								id="file-name-{block.id}"
								bind:value={fileName}
								placeholder="Enter file name"
								class="mt-1"
							/>
						</div>
						
						<!-- File Preview -->
						<div class="p-4 border border-gray-200 rounded-lg bg-gray-50">
							<div class="flex items-center gap-3">
								<svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
								</svg>
								<div>
									<p class="font-medium text-gray-900">{fileName || 'Uploaded File'}</p>
									<p class="text-sm text-gray-500">
										{fileType} {fileSize > 0 ? `• ${(fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
									</p>
								</div>
								<div class="ml-auto">
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onclick={() => window.open(fileUrl, '_blank')}
									>
										Download
									</Button>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else if block.type === 'youtube'}
			<div class="space-y-4">
				<div>
					<Label for="youtube-url-{block.id}">YouTube URL</Label>
					<div class="flex gap-2 mt-1">
						<Input
							id="youtube-url-{block.id}"
							bind:value={youtubeUrl}
							placeholder="https://www.youtube.com/watch?v=..."
							class="flex-1"
						/>
						<Button
							type="button"
							variant="secondary"
							onclick={processYouTubeUrl}
							disabled={!youtubeUrl}
						>
							Load Video
						</Button>
					</div>
				</div>
				
				{#if youtubeVideoId}
					<YouTubeEmbed
						videoId={youtubeVideoId}
						title={youtubeTitle}
					/>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Content Validation Messages -->
	{#if !validateContent()}
		<div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
			<div class="flex">
				<svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
				</svg>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Content Incomplete</h3>
					<div class="mt-2 text-sm text-red-700">
						{#if block.type === 'rich_text'}
							Please add some content to this text block.
						{:else if block.type === 'image'}
							Please upload an image and provide alt text for accessibility.
						{:else if block.type === 'video'}
							Please upload a video file.
						{:else if block.type === 'file'}
							Please upload a file and provide a filename.
						{:else if block.type === 'youtube'}
							Please enter a valid YouTube URL and load the video.
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

