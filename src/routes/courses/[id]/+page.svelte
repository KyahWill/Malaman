<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { formatDate, formatDuration } from '$lib/utils';
	import { toastHelpers as toast } from '$lib/stores/toast.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { course, isEnrolled, analytics, userRole, userId } = $derived(data);

	let isEnrolling = $state(false);
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);

	function getDifficultyColor(level: string) {
		switch (level) {
			case 'beginner': return 'bg-green-100 text-green-800';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800';
			case 'advanced': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusColor(isPublished: boolean) {
		return isPublished 
			? 'bg-green-100 text-green-800' 
			: 'bg-gray-100 text-gray-800';
	}

	function getStatusText(isPublished: boolean) {
		return isPublished ? 'Published' : 'Draft';
	}

	async function handleEnroll() {
		if (isEnrolling) return;
		
		isEnrolling = true;
		try {
			const response = await fetch(`/api/courses/${course.id}/enroll`, {
				method: 'POST'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to enroll');
			}

			toast.success('Successfully enrolled in course!');
			// Refresh the page to update enrollment status
			window.location.reload();
		} catch (error) {
			console.error('Error enrolling:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to enroll');
		} finally {
			isEnrolling = false;
		}
	}

	async function handleDelete() {
		if (isDeleting) return;
		
		isDeleting = true;
		try {
			const response = await fetch(`/api/courses/${course.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to delete course');
			}

			toast.success('Course deleted successfully');
			goto('/courses');
		} catch (error) {
			console.error('Error deleting course:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to delete course');
		} finally {
			isDeleting = false;
			showDeleteModal = false;
		}
	}

	async function togglePublishStatus() {
		try {
			const response = await fetch(`/api/courses/${course.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					is_published: !course.is_published
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to update course');
			}

			const { course: updatedCourse } = await response.json();
			course = { ...course, is_published: updatedCourse.is_published };
			
			toast.success(course.is_published ? 'Course published!' : 'Course unpublished');
		} catch (error) {
			console.error('Error updating course:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to update course');
		}
	}

	const isOwner = $derived(course.instructor_id === userId);
	const canEdit = $derived(isOwner || userRole === 'admin');
	const canEnroll = $derived(userRole === 'student' && course.is_published && !isEnrolled);
</script>

<svelte:head>
	<title>{course.title} - Personalized LMS</title>
	<meta name="description" content={course.description || 'Course details'} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex-1 min-w-0">
					<div class="flex items-center space-x-3">
						<h1 class="text-3xl font-bold text-gray-900 truncate">
							{course.title}
						</h1>
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(course.is_published)}">
							{getStatusText(course.is_published)}
						</span>
					</div>
					<div class="mt-1 flex items-center space-x-4 text-sm text-gray-600">
						<span>By {course.instructor.first_name} {course.instructor.last_name}</span>
						<span>•</span>
						<span>Created {formatDate(course.created_at)}</span>
						{#if course.estimated_duration}
							<span>•</span>
							<span>{formatDuration(course.estimated_duration)}</span>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-4">
					{#if canEnroll}
						<Button
							variant="primary"
							onclick={handleEnroll}
							loading={isEnrolling}
							disabled={isEnrolling}
						>
							{isEnrolling ? 'Enrolling...' : 'Enroll Now'}
						</Button>
					{/if}
					
					{#if isEnrolled}
						<Button
							variant="primary"
							onclick={() => goto(`/courses/${course.id}/learn`)}
						>
							Continue Learning
						</Button>
					{/if}

					{#if canEdit}
						<Button
							variant="secondary"
							onclick={() => goto(`/courses/${course.id}/edit`)}
						>
							Edit Course
						</Button>
						
						<Button
							variant={course.is_published ? 'outline' : 'primary'}
							onclick={togglePublishStatus}
						>
							{course.is_published ? 'Unpublish' : 'Publish'}
						</Button>
					{/if}

					<Button
						variant="secondary"
						onclick={() => goto('/courses')}
					>
						Back to Courses
					</Button>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Main Content -->
				<div class="lg:col-span-2 space-y-8">
					<!-- Course Description -->
					<Card variant="default" padding="lg">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
						{#if course.description}
							<p class="text-gray-700 whitespace-pre-wrap">{course.description}</p>
						{:else}
							<p class="text-gray-500 italic">No description provided.</p>
						{/if}
					</Card>

					<!-- Lessons -->
					<Card variant="default" padding="lg">
						<div class="flex items-center justify-between mb-4">
							<h2 class="text-xl font-semibold text-gray-900">
								Course Content ({course.lessons?.length || 0} lessons)
							</h2>
							{#if canEdit}
								<Button
									variant="secondary"
									size="sm"
									onclick={() => goto(`/courses/${course.id}/lessons`)}
								>
									Manage Lessons
								</Button>
							{/if}
						</div>
						
						{#if course.lessons && course.lessons.length > 0}
							<div class="space-y-3">
								{#each course.lessons as lesson, index}
									<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
										<div class="flex items-center space-x-3">
											<span class="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-sm font-medium">
												{index + 1}
											</span>
											<div>
												<h3 class="font-medium text-gray-900">{lesson.title}</h3>
												{#if lesson.description}
													<p class="text-sm text-gray-600">{lesson.description}</p>
												{/if}
												{#if lesson.estimated_duration}
													<p class="text-xs text-gray-500">{formatDuration(lesson.estimated_duration)}</p>
												{/if}
											</div>
										</div>
										{#if canEdit}
											<Button
												variant="ghost"
												size="sm"
												onclick={() => goto(`/lessons/${lesson.id}/edit`)}
											>
												Edit
											</Button>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center py-8">
								<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
								</svg>
								<h3 class="mt-2 text-sm font-medium text-gray-900">No lessons yet</h3>
								<p class="mt-1 text-sm text-gray-500">
									{#if canEdit}
										Start by adding your first lesson.
									{:else}
										Lessons will appear here once added.
									{/if}
								</p>
								{#if canEdit}
									<div class="mt-6">
										<Button
											variant="primary"
											onclick={() => goto(`/courses/${course.id}/lessons/create`)}
										>
											Add Lesson
										</Button>
									</div>
								{/if}
							</div>
						{/if}
					</Card>

					<!-- Analytics (for instructors) -->
					{#if analytics && canEdit}
						<Card variant="default" padding="lg">
							<h2 class="text-xl font-semibold text-gray-900 mb-4">Course Analytics</h2>
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div class="text-center">
									<div class="text-2xl font-bold text-blue-600">{analytics.overview.total_enrollments}</div>
									<div class="text-sm text-gray-600">Total Enrollments</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold text-green-600">{analytics.overview.completion_rate}%</div>
									<div class="text-sm text-gray-600">Completion Rate</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold text-purple-600">{analytics.overview.average_progress}%</div>
									<div class="text-sm text-gray-600">Avg Progress</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold text-orange-600">{analytics.overview.average_score}%</div>
									<div class="text-sm text-gray-600">Avg Score</div>
								</div>
							</div>
						</Card>
					{/if}
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">
					<!-- Course Info -->
					<Card variant="default" padding="lg">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-600">Difficulty</span>
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getDifficultyColor(course.difficulty_level)}">
									{course.difficulty_level}
								</span>
							</div>
							
							{#if course.estimated_duration}
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">Duration</span>
									<span class="text-sm font-medium text-gray-900">{formatDuration(course.estimated_duration)}</span>
								</div>
							{/if}
							
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-600">Lessons</span>
								<span class="text-sm font-medium text-gray-900">{course.lessons?.length || 0}</span>
							</div>
							
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-600">Created</span>
								<span class="text-sm font-medium text-gray-900">{formatDate(course.created_at)}</span>
							</div>
						</div>
					</Card>

					<!-- Tags -->
					{#if course.tags && course.tags.length > 0}
						<Card variant="default" padding="lg">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
							<div class="flex flex-wrap gap-2">
								{#each course.tags as tag}
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
										{tag}
									</span>
								{/each}
							</div>
						</Card>
					{/if}

					<!-- Instructor Actions -->
					{#if canEdit}
						<Card variant="default" padding="lg">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">Instructor Actions</h3>
							<div class="space-y-3">
								<Button
									variant="secondary"
									class="w-full"
									onclick={() => goto(`/courses/${course.id}/lessons`)}
								>
									Manage Lessons
								</Button>
								<Button
									variant="secondary"
									class="w-full"
									onclick={() => goto(`/courses/${course.id}/assessments`)}
								>
									Manage Assessments
								</Button>
								<Button
									variant="outline"
									class="w-full text-red-600 border-red-300 hover:bg-red-50"
									onclick={() => showDeleteModal = true}
								>
									Delete Course
								</Button>
							</div>
						</Card>
					{/if}
				</div>
			</div>
		</div>
	</main>
</div>

<!-- Delete Confirmation Modal -->
<Modal
	open={showDeleteModal}
	onClose={() => showDeleteModal = false}
	title="Delete Course"
	size="md"
>
	<div class="space-y-4">
		<p class="text-gray-700">
			Are you sure you want to delete this course? This action cannot be undone and will remove all lessons, assessments, and student progress.
		</p>
		<div class="flex justify-end space-x-4">
			<Button
				variant="secondary"
				onclick={() => showDeleteModal = false}
			>
				Cancel
			</Button>
			<Button
				variant="primary"
				onclick={handleDelete}
				loading={isDeleting}
				disabled={isDeleting}
				class="bg-red-600 hover:bg-red-700 focus:ring-red-500"
			>
				{isDeleting ? 'Deleting...' : 'Delete Course'}
			</Button>
		</div>
	</div>
</Modal>