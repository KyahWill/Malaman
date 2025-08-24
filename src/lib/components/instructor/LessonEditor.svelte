<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button, Input, Label, Card, Modal, Toast } from '$lib/components/ui';
	import ContentBlockEditor from './ContentBlockEditor.svelte';
	import type { Lesson, ContentBlock, ContentType } from '$lib/types/database.js';
	import { LessonService, ContentBlockService } from '$lib/services/database.js';
	import { toastHelpers } from '$lib/stores/toast.js';

	interface Props {
		lesson?: Lesson;
		courseId: string;
		isEditing?: boolean;
	}

	let { lesson, courseId, isEditing = false }: Props = $props();

	// Form state
	let title = $state(lesson?.title || '');
	let description = $state(lesson?.description || '');
	let learningObjectives = $state<string[]>(lesson?.learning_objectives || ['']);
	let estimatedDuration = $state(lesson?.estimated_duration || 0);
	let prerequisites = $state<string[]>(lesson?.prerequisites || []);
	let contentBlocks = $state<ContentBlock[]>(lesson?.content_blocks || []);

	// UI state
	let isLoading = $state(false);
	let isSaving = $state(false);
	let showAddContentModal = $state(false);
	let draggedBlockIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	// Content type options for adding new blocks
	const contentTypeOptions: { value: ContentType; label: string; description: string }[] = [
		{ value: 'rich_text', label: 'Rich Text', description: 'Formatted text with headings, lists, and links' },
		{ value: 'image', label: 'Image', description: 'Upload or link to images with alt text' },
		{ value: 'video', label: 'Video', description: 'Upload video files with preview' },
		{ value: 'file', label: 'File', description: 'Upload documents, PDFs, and other files' },
		{ value: 'youtube', label: 'YouTube Video', description: 'Embed YouTube videos' }
	];

	// Load lesson data if editing
	onMount(async () => {
		if (isEditing && lesson?.id) {
			try {
				isLoading = true;
				const loadedLesson = await LessonService.getById(lesson.id);
				if (loadedLesson) {
					title = loadedLesson.title;
					description = loadedLesson.description || '';
					learningObjectives = loadedLesson.learning_objectives.length > 0 
						? loadedLesson.learning_objectives 
						: [''];
					estimatedDuration = loadedLesson.estimated_duration || 0;
					prerequisites = loadedLesson.prerequisites || [];
					contentBlocks = loadedLesson.content_blocks || [];
				}
			} catch (error) {
				console.error('Failed to load lesson:', error);
				toastHelpers.error('Failed to load lesson');
			} finally {
				isLoading = false;
			}
		}
	});

	// Add learning objective
	function addLearningObjective() {
		learningObjectives = [...learningObjectives, ''];
	}

	// Remove learning objective
	function removeLearningObjective(index: number) {
		learningObjectives = learningObjectives.filter((_, i) => i !== index);
		if (learningObjectives.length === 0) {
			learningObjectives = [''];
		}
	}

	// Add content block
	function addContentBlock(type: ContentType) {
		const newBlock: Partial<ContentBlock> = {
			id: crypto.randomUUID(),
			lesson_id: lesson?.id || '',
			type,
			content: getDefaultContentForType(type),
			order_index: contentBlocks.length,
			metadata: {
				title: `New ${type.replace('_', ' ')} block`,
				description: ''
			},
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		
		contentBlocks = [...contentBlocks, newBlock as ContentBlock];
		showAddContentModal = false;
	}

	// Get default content structure for content type
	function getDefaultContentForType(type: ContentType): any {
		switch (type) {
			case 'rich_text':
				return { rich_text: { html: '<p>Start writing...</p>', plain_text: 'Start writing...' } };
			case 'image':
				return { image: { url: '', alt_text: '', caption: '' } };
			case 'video':
				return { video: { url: '', thumbnail_url: '', duration: 0 } };
			case 'file':
				return { file: { url: '', filename: '', file_type: '', file_size: 0 } };
			case 'youtube':
				return { youtube: { video_id: '', title: '', thumbnail_url: '', duration: 0 } };
			default:
				return {};
		}
	}

	// Remove content block
	function removeContentBlock(index: number) {
		contentBlocks = contentBlocks.filter((_, i) => i !== index);
		// Update order indices
		contentBlocks = contentBlocks.map((block, i) => ({
			...block,
			order_index: i
		}));
	}

	// Update content block
	function updateContentBlock(index: number, updatedBlock: ContentBlock) {
		contentBlocks = contentBlocks.map((block, i) => 
			i === index ? updatedBlock : block
		);
	}

	// Drag and drop handlers
	function handleDragStart(event: DragEvent, index: number) {
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', '');
		}
		draggedBlockIndex = index;
	}

	function handleDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = null;
	}

	function handleDrop(event: DragEvent, dropIndex: number) {
		event.preventDefault();
		
		if (draggedBlockIndex !== null && draggedBlockIndex !== dropIndex) {
			const draggedBlock = contentBlocks[draggedBlockIndex];
			const newBlocks = [...contentBlocks];
			
			// Remove dragged block
			newBlocks.splice(draggedBlockIndex, 1);
			
			// Insert at new position
			const insertIndex = draggedBlockIndex < dropIndex ? dropIndex - 1 : dropIndex;
			newBlocks.splice(insertIndex, 0, draggedBlock);
			
			// Update order indices
			contentBlocks = newBlocks.map((block, i) => ({
				...block,
				order_index: i
			}));
		}
		
		draggedBlockIndex = null;
		dragOverIndex = null;
	}

	function handleDragEnd() {
		draggedBlockIndex = null;
		dragOverIndex = null;
	}

	// Save lesson
	async function saveLesson() {
		if (!title.trim()) {
			toastHelpers.error('Please enter a lesson title');
			return;
		}

		try {
			isSaving = true;

			const lessonData: Partial<Lesson> = {
				title: title.trim(),
				description: description.trim() || null,
				course_id: courseId,
				learning_objectives: learningObjectives.filter(obj => obj.trim()),
				estimated_duration: estimatedDuration > 0 ? estimatedDuration : null,
				prerequisites,
				is_published: false
			};

			let savedLesson: Lesson;

			if (isEditing && lesson?.id) {
				// Update existing lesson
				savedLesson = await LessonService.update(lesson.id, lessonData);
			} else {
				// Create new lesson
				lessonData.order_index = 0; // Will be updated by the backend
				savedLesson = await LessonService.create(lessonData);
			}

			// Save content blocks
			for (let i = 0; i < contentBlocks.length; i++) {
				const block = JSON.parse(JSON.stringify(contentBlocks[i]))
				const blockData = {
					...block,
					lesson_id: savedLesson.id,
					order_index: i
				};
				console.log(blockData)
				if (block.id && block.id.length > 10) {
					// Update existing block
					console.log("UPDATE")
					await ContentBlockService.update(block.id, blockData);
				} else {
					// Create new block
					delete blockData.id;
					await ContentBlockService.create(blockData);
				}
			}

			toastHelpers.success(
				isEditing ? 'Lesson updated successfully' : 'Lesson created successfully'
			);

			// Redirect to course page
			goto(`/courses/${courseId}`);

		} catch (error) {
			console.error('Failed to save lesson:', error);
			toastHelpers.error('Failed to save lesson');
		} finally {
			isSaving = false;
		}
	}

	// Cancel editing
	function cancelEditing() {
		goto(`/courses/${courseId}`);
	}
</script>

<div class="max-w-4xl mx-auto p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">
			{isEditing ? 'Edit Lesson' : 'Create New Lesson'}
		</h1>
		<p class="text-gray-600">
			{isEditing ? 'Update your lesson content and structure' : 'Create engaging lesson content with multiple media types'}
		</p>
	</div>

	{#if isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); saveLesson(); }} class="space-y-6">
			<!-- Basic Information -->
			<Card variant="default" padding="lg">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="md:col-span-2">
						<Label for="title">Lesson Title *</Label>
						<Input
							id="title"
							bind:value={title}
							placeholder="Enter lesson title"
							required
							class="mt-1"
						/>
					</div>

					<div class="md:col-span-2">
						<Label for="description">Description</Label>
						<textarea
							id="description"
							bind:value={description}
							placeholder="Brief description of the lesson"
							rows="3"
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						></textarea>
					</div>

					<div>
						<Label for="duration">Estimated Duration (minutes)</Label>
						<Input
							id="duration"
							type="number"
							bind:value={estimatedDuration}
							placeholder="0"
							min="0"
							class="mt-1"
						/>
					</div>
				</div>
			</Card>

			<!-- Learning Objectives -->
			<Card variant="default" padding="lg">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-gray-900">Learning Objectives</h2>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={addLearningObjective}
					>
						Add Objective
					</Button>
				</div>

				<div class="space-y-3">
					{#each learningObjectives as objective, index}
						<div class="flex items-center gap-3">
							<div class="flex-1">
								<Input
									bind:value={learningObjectives[index]}
									placeholder="What will students learn?"
									class="w-full"
								/>
							</div>
							{#if learningObjectives.length > 1}
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onclick={() => removeLearningObjective(index)}
									class="text-red-600 hover:text-red-700"
								>
									Remove
								</Button>
							{/if}
						</div>
					{/each}
				</div>
			</Card>

			<!-- Content Blocks -->
			<Card variant="default" padding="lg">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-gray-900">Lesson Content</h2>
					<Button
						type="button"
						variant="primary"
						size="sm"
						onclick={() => showAddContentModal = true}
					>
						Add Content Block
					</Button>
				</div>

				{#if contentBlocks.length === 0}
					<div class="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
						<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						<h3 class="mt-2 text-sm font-medium text-gray-900">No content blocks yet</h3>
						<p class="mt-1 text-sm text-gray-500">Start by adding your first content block.</p>
						<div class="mt-6">
							<Button
								type="button"
								variant="primary"
								onclick={() => showAddContentModal = true}
							>
								Add Content Block
							</Button>
						</div>
					</div>
				{:else}
					<div class="space-y-4">
						{#each contentBlocks as block, index}
							<div
								class="border border-gray-200 rounded-lg p-4 {dragOverIndex === index ? 'border-blue-500 bg-blue-50' : ''}"
								draggable="true"
								ondragstart={(e) => handleDragStart(e, index)}
								ondragover={(e) => handleDragOver(e, index)}
								ondragleave={handleDragLeave}
								ondrop={(e) => handleDrop(e, index)}
								ondragend={handleDragEnd}
							>
								<div class="flex items-center justify-between mb-3">
									<div class="flex items-center gap-2">
										<svg class="w-5 h-5 text-gray-400 cursor-move" fill="currentColor" viewBox="0 0 20 20">
											<path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 6h8v2H6V6zm0 4h8v2H6v-2z"/>
										</svg>
										<span class="text-sm font-medium text-gray-700">
											{block.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Block
										</span>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => removeContentBlock(index)}
										class="text-red-600 hover:text-red-700"
									>
										Remove
									</Button>
								</div>

								<ContentBlockEditor
									{block}
									onUpdate={(updatedBlock) => updateContentBlock(index, updatedBlock)}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</Card>

			<!-- Actions -->
			<div class="flex justify-end gap-4">
				<Button
					type="button"
					variant="secondary"
					onclick={cancelEditing}
					disabled={isSaving}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					variant="primary"
					disabled={isSaving || !title.trim()}
				>
					{#if isSaving}
						<svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Saving...
					{:else}
						{isEditing ? 'Update Lesson' : 'Create Lesson'}
					{/if}
				</Button>
			</div>
		</form>
	{/if}
</div>

<!-- Add Content Block Modal -->
{#if showAddContentModal}
	<Modal
		title="Add Content Block"
		open={showAddContentModal}
		onClose={() => showAddContentModal = false}
	>
		<div class="space-y-4">
			<p class="text-sm text-gray-600">Choose the type of content you want to add to your lesson:</p>
			
			<div class="grid grid-cols-1 gap-3">
				{#each contentTypeOptions as option}
					<button
						type="button"
						onclick={() => addContentBlock(option.value)}
						class="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
					>
						<div class="font-medium text-gray-900">{option.label}</div>
						<div class="text-sm text-gray-500 mt-1">{option.description}</div>
					</button>
				{/each}
			</div>
		</div>
	</Modal>
{/if}