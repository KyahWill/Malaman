<script lang="ts">
	import type { PageData } from './$types';
	import { Button, Card } from '$lib/components/ui';
	import { RichTextRenderer } from '$lib/components/ui';
	import YouTubeEmbed from '$lib/components/instructor/YouTubeEmbed.svelte';
	import { goto } from '$app/navigation';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Format duration
	function formatDuration(minutes: number): string {
		if (minutes < 60) {
			return `${minutes} min`;
		}
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours}h ${remainingMinutes}m`;
	}

	// Render content block based on type
	function renderContentBlock(block: any) {
		switch (block.type) {
			case 'rich_text':
				return block.content.rich_text?.html || '';
			case 'image':
				return {
					type: 'image',
					url: block.content.image?.url,
					alt: block.content.image?.alt_text,
					caption: block.content.image?.caption
				};
			case 'video':
				return {
					type: 'video',
					url: block.content.video?.url
				};
			case 'file':
				return {
					type: 'file',
					url: block.content.file?.url,
					filename: block.content.file?.filename,
					fileType: block.content.file?.file_type,
					fileSize: block.content.file?.file_size
				};
			case 'youtube':
				return {
					type: 'youtube',
					videoId: block.content.youtube?.video_id,
					title: block.content.youtube?.title
				};
			default:
				return null;
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

<svelte:head>
	<title>{data.lesson.title} - Personalized LMS</title>
	<meta name="description" content={data.lesson.description || 'Lesson content'} />
</svelte:head>

<div class="max-w-4xl mx-auto p-6">
	<!-- Lesson Header -->
	<div class="mb-8">
		<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-4">
			<a href="/courses/{data.lesson.course_id}" class="hover:text-gray-700">
				{data.course?.title || 'Course'}
			</a>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
			</svg>
			<span class="text-gray-900">{data.lesson.title}</span>
		</nav>

		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h1 class="text-3xl font-bold text-gray-900 mb-4">{data.lesson.title}</h1>
				
				{#if data.lesson.description}
					<p class="text-lg text-gray-600 mb-4">{data.lesson.description}</p>
				{/if}

				<div class="flex items-center gap-6 text-sm text-gray-500">
					{#if data.lesson.estimated_duration}
						<div class="flex items-center gap-1">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
							</svg>
							<span>{formatDuration(data.lesson.estimated_duration)}</span>
						</div>
					{/if}
					
					<div class="flex items-center gap-1">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						<span>{data.lesson.content_blocks?.length || 0} content blocks</span>
					</div>
				</div>
			</div>

			{#if data.canEdit}
				<div class="ml-6">
					<Button
						variant="secondary"
						onclick={() => goto(`/lessons/${data.lesson.id}/edit`)}
					>
						Edit Lesson
					</Button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Learning Objectives -->
	{#if data.lesson.learning_objectives && data.lesson.learning_objectives.length > 0}
		<Card variant="default" padding="lg" class="mb-8">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Learning Objectives</h2>
			<ul class="space-y-2">
				{#each data.lesson.learning_objectives as objective}
					<li class="flex items-start gap-2">
						<svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
						</svg>
						<span class="text-gray-700">{objective}</span>
					</li>
				{/each}
			</ul>
		</Card>
	{/if}

	<!-- Lesson Content -->
	<div class="space-y-8">
		{#if data.lesson.content_blocks && data.lesson.content_blocks.length > 0}
			{#each data.lesson.content_blocks as block}
				{@const content = renderContentBlock(block)}
				
				<div class="content-block">
					{#if block.metadata?.title}
						<h3 class="text-lg font-semibold text-gray-900 mb-4">{block.metadata.title}</h3>
					{/if}

					{#if block.type === 'rich_text' && content}
						<div class="prose prose-lg max-w-none">
							<RichTextRenderer html={content} />
						</div>
					{:else if content?.type === 'image'}
						<figure class="text-center">
							<img
								src={content.url}
								alt={content.alt}
								class="max-w-full h-auto rounded-lg shadow-lg mx-auto"
							/>
							{#if content.caption}
								<figcaption class="mt-2 text-sm text-gray-600 italic">
									{content.caption}
								</figcaption>
							{/if}
						</figure>
					{:else if content?.type === 'video'}
						<div class="video-container">
							<video
								src={content.url}
								controls
								class="w-full rounded-lg shadow-lg"
								style="max-height: 500px;"
							>
								<track kind="captions" />
								Your browser does not support the video tag.
							</video>
						</div>
					{:else if content?.type === 'file'}
						<Card variant="default" padding="lg">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
									</svg>
									<div>
										<p class="font-medium text-gray-900">{content.filename}</p>
										<p class="text-sm text-gray-500">
											{content.fileType}
											{#if content.fileSize > 0}
												• {formatFileSize(content.fileSize)}
											{/if}
										</p>
									</div>
								</div>
								<Button
									variant="primary"
									onclick={() => window.open(content.url, '_blank')}
								>
									Download
								</Button>
							</div>
						</Card>
					{:else if content?.type === 'youtube'}
						<div class="youtube-container">
							<YouTubeEmbed
								videoId={content.videoId}
								title={content.title}
							/>
						</div>
					{/if}

					{#if block.metadata?.description}
						<p class="text-sm text-gray-600 mt-2 italic">{block.metadata.description}</p>
					{/if}
				</div>
			{/each}
		{:else}
			<Card variant="default" padding="lg">
				<div class="text-center py-12">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No content yet</h3>
					<p class="mt-1 text-sm text-gray-500">
						This lesson doesn't have any content blocks yet.
					</p>
				</div>
			</Card>
		{/if}
	</div>

	<!-- Navigation -->
	<div class="mt-12 pt-8 border-t border-gray-200">
		<div class="flex justify-between items-center">
			<Button
				variant="secondary"
				onclick={() => goto(`/courses/${data.lesson.course_id}`)}
			>
				← Back to Course
			</Button>

			{#if data.lesson.assessment_id}
				<Button
					variant="primary"
					onclick={() => goto(`/assessments/${data.lesson.assessment_id}`)}
				>
					Take Assessment →
				</Button>
			{/if}
		</div>
	</div>
</div>

<style>
	.content-block {
		scroll-margin-top: 2rem;
	}

	.video-container,
	.youtube-container {
		position: relative;
		width: 100%;
		max-width: 100%;
	}

	.video-container video,
	.youtube-container :global(iframe) {
		width: 100%;
		height: auto;
		aspect-ratio: 16/9;
	}

	@media (max-width: 640px) {
		.video-container,
		.youtube-container {
			margin: 0 -1rem;
		}
	}
</style>