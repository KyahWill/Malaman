<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { formatDate, formatDuration } from '$lib/utils';
	import { debounce } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { courses, searchQuery, currentPage, userRole } = $derived(data);
	let searchInput = $state('');
	let isSearching = $state(false);

	// Initialize search input with current query
	$effect(() => {
		searchInput = searchQuery;
	});

	// Debounced search function
	const debouncedSearch = debounce((query: string) => {
		const url = new URL($page.url);
		if (query) {
			url.searchParams.set('search', query);
		} else {
			url.searchParams.delete('search');
		}
		url.searchParams.delete('page'); // Reset to first page
		goto(url.toString());
		isSearching = false;
	}, 500);

	function handleSearch() {
		isSearching = true;
		debouncedSearch(searchInput);
	}

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


</script>

<svelte:head>
	<title>Courses - Personalized LMS</title>
	<meta name="description" content="Browse and manage courses" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">
						{#if userRole === 'instructor'}
							My Courses
						{:else}
							Courses
						{/if}
					</h1>
					<p class="mt-1 text-sm text-gray-600">
						{#if userRole === 'instructor'}
							Create and manage your courses
						{:else}
							Discover and enroll in courses
						{/if}
					</p>
				</div>
				<div class="flex items-center space-x-4">
					{#if userRole === 'instructor'}
						<Button
							variant="primary"
							onclick={() => goto('/courses/create')}
						>
							Create Course
						</Button>
					{/if}
					<Button
						variant="secondary"
						onclick={() => goto('/dashboard')}
					>
						Dashboard
					</Button>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Search and Filters -->
			<div class="mb-8">
				<div class="flex flex-col sm:flex-row gap-4">
					<div class="flex-1">
						<Input
							type="text"
							placeholder="Search courses..."
							bind:value={searchInput}
							oninput={handleSearch}
							class="w-full"
						/>
					</div>
					{#if isSearching}
						<div class="flex items-center text-sm text-gray-500">
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Searching...
						</div>
					{/if}
				</div>
			</div>

			<!-- Course Grid -->
			{#if courses.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each courses as course}
						<Card 
							variant="default" 
							hover={true} 
							clickable={true}
							onclick={() => goto(`/courses/${course.id}`)}
							class="h-full"
						>
							<div class="flex flex-col h-full">
								<!-- Course Header -->
								<div class="flex-1">
									<div class="flex items-start justify-between mb-3">
										<h3 class="text-lg font-semibold text-gray-900 line-clamp-2">
											{course.title}
										</h3>
										{#if userRole === 'instructor'}
											<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(course.is_published)}">
												{getStatusText(course.is_published)}
											</span>
										{/if}
									</div>
									
									{#if course.description}
										<p class="text-sm text-gray-600 mb-4 line-clamp-3">
											{course.description}
										</p>
									{/if}
								</div>

								<!-- Course Metadata -->
								<div class="space-y-3">
									<div class="flex items-center justify-between text-sm">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getDifficultyColor(course.difficulty_level)}">
											{course.difficulty_level}
										</span>
										{#if course.estimated_duration}
											<span class="text-gray-500">
												{formatDuration(course.estimated_duration)}
											</span>
										{/if}
									</div>

									{#if course.tags && course.tags.length > 0}
										<div class="flex flex-wrap gap-1">
											{#each course.tags.slice(0, 3) as tag}
												<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
													{tag}
												</span>
											{/each}
											{#if course.tags.length > 3}
												<span class="text-xs text-gray-500">
													+{course.tags.length - 3} more
												</span>
											{/if}
										</div>
									{/if}

									<div class="flex items-center justify-between pt-3 border-t border-gray-200">
										<span class="text-xs text-gray-500">
											Created {formatDate(course.created_at)}
										</span>
										{#if userRole === 'instructor'}
											<Button
												variant="ghost"
												size="sm"
												onclick={() => goto(`/courses/${course.id}/edit`)}
											>
												Edit
											</Button>
										{/if}
									</div>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{:else}
				<!-- Empty State -->
				<div class="text-center py-12">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">
						{#if searchQuery}
							No courses found
						{:else if userRole === 'instructor'}
							No courses yet
						{:else}
							No courses available
						{/if}
					</h3>
					<p class="mt-1 text-sm text-gray-500">
						{#if searchQuery}
							Try adjusting your search terms.
						{:else if userRole === 'instructor'}
							Get started by creating your first course.
						{:else}
							Check back later for new courses.
						{/if}
					</p>
					{#if userRole === 'instructor' && !searchQuery}
						<div class="mt-6">
							<Button
								variant="primary"
								onclick={() => goto('/courses/create')}
							>
								Create Course
							</Button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>