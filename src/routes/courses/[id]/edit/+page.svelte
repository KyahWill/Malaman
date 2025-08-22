<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { toastHelpers as toast } from '$lib/stores/toast.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { course } = $derived(data);

	// Form state
	let formData = $derived({
		title: course.title,
		description: course.description || '',
		difficulty_level: course.difficulty_level,
		estimated_duration: (course.estimated_duration || 0).toString(),
		tags: [...(course.tags || [])]
	});

	let tagInput = $state('');
	let isSubmitting = $state(false);
	let errors = $state<Record<string, string>>({});

	function validateForm() {
		const newErrors: Record<string, string> = {};

		if (!formData.title.trim()) {
			newErrors.title = 'Title is required';
		}

		if (!formData.description.trim()) {
			newErrors.description = 'Description is required';
		}

		if (parseInt(formData.estimated_duration) < 0) {
			newErrors.estimated_duration = 'Duration must be positive';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function addTag() {
		const tag = tagInput.trim();
		if (tag && !formData.tags.includes(tag)) {
			formData.tags = [...formData.tags, tag];
			tagInput = '';
		}
	}

	function removeTag(tagToRemove: string) {
		formData.tags = formData.tags.filter(tag => tag !== tagToRemove);
	}

	function handleTagKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTag();
		}
	}

	async function handleSubmit() {
		if (!validateForm()) {
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch(`/api/courses/${course.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					estimated_duration: parseInt(formData.estimated_duration) || 0
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to update course');
			}

			toast.success('Course updated successfully!');
			goto(`/courses/${course.id}`);
		} catch (error) {
			console.error('Error updating course:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to update course');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Edit {course.title} - Personalized LMS</title>
	<meta name="description" content="Edit course details" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Edit Course</h1>
					<p class="mt-1 text-sm text-gray-600">
						Update your course details
					</p>
				</div>
				<div class="flex items-center space-x-4">
					<Button
						variant="primary"
						onclick={() => goto(`/assessments/create?courseId=${course.id}`)}
					>
						Create Assessment
					</Button>
					<Button
						variant="secondary"
						onclick={() => goto(`/courses/${course.id}`)}
					>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<Card variant="default" padding="lg">
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
					<div class="space-y-6">
						<!-- Course Title -->
						<div>
							<label for="title" class="block text-sm font-medium text-gray-700 mb-2">
								Course Title *
							</label>
							<Input
								id="title"
								type="text"
								placeholder="Enter course title"
								bind:value={formData.title}
								required
								class={errors.title ? 'border-red-500' : ''}
							/>
							{#if errors.title}
								<p class="mt-1 text-sm text-red-600">{errors.title}</p>
							{/if}
						</div>

						<!-- Course Description -->
						<div>
							<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
								Course Description *
							</label>
							<textarea
								id="description"
								rows="4"
								placeholder="Describe what students will learn in this course"
								bind:value={formData.description}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 {errors.description ? 'border-red-500' : ''}"
							></textarea>
							{#if errors.description}
								<p class="mt-1 text-sm text-red-600">{errors.description}</p>
							{/if}
						</div>

						<!-- Difficulty Level -->
						<div>
							<label for="difficulty" class="block text-sm font-medium text-gray-700 mb-2">
								Difficulty Level
							</label>
							<select
								id="difficulty"
								bind:value={formData.difficulty_level}
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							>
								<option value="beginner">Beginner</option>
								<option value="intermediate">Intermediate</option>
								<option value="advanced">Advanced</option>
							</select>
						</div>

						<!-- Estimated Duration -->
						<div>
							<label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
								Estimated Duration (minutes)
							</label>
							<Input
								id="duration"
								type="number"
								placeholder="0"
								bind:value={formData.estimated_duration}
								min="0"
								class={errors.estimated_duration ? 'border-red-500' : ''}
							/>
							{#if errors.estimated_duration}
								<p class="mt-1 text-sm text-red-600">{errors.estimated_duration}</p>
							{/if}
							<p class="mt-1 text-sm text-gray-500">
								Leave as 0 if you want to calculate automatically based on lessons
							</p>
						</div>

						<!-- Tags -->
						<div>
							<label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
								Tags
							</label>
							<div class="flex gap-2 mb-2">
								<Input
									id="tags"
									type="text"
									placeholder="Add a tag and press Enter"
									bind:value={tagInput}
									onkeydown={handleTagKeydown}
									class="flex-1"
								/>
								<Button
									type="button"
									variant="secondary"
									onclick={addTag}
									disabled={!tagInput.trim()}
								>
									Add
								</Button>
							</div>
							{#if formData.tags.length > 0}
								<div class="flex flex-wrap gap-2">
									{#each formData.tags as tag}
										<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
											{tag}
											<button
												type="button"
												onclick={() => removeTag(tag)}
												class="ml-2 text-blue-600 hover:text-blue-800"
												aria-label="Remove tag"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Submit Button -->
						<div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
							<Button
								type="button"
								variant="secondary"
								onclick={() => goto(`/courses/${course.id}`)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="primary"
								loading={isSubmitting}
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Updating...' : 'Update Course'}
							</Button>
						</div>
					</div>
				</form>
			</Card>
		</div>
	</main>
</div>