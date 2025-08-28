<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { InfiniteScroller } from '$lib/utils/lazyLoading';
  import { performanceMonitor } from '$lib/services/performanceMonitoring';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';

  interface Course {
    id: string;
    title: string;
    description: string;
    instructor_name: string;
    difficulty_level: string;
    estimated_duration: number;
    thumbnail_url?: string;
    tags: string[];
  }

  export let loadCourses: (offset: number, limit: number) => Promise<Course[]>;
  export let pageSize = 12;
  export let searchQuery = '';
  export let filters: Record<string, any> = {};

  let courses: Course[] = [];
  let loading = false;
  let hasMore = true;
  let error: string | null = null;
  let container: HTMLElement;
  let infiniteScroller: InfiniteScroller | null = null;

  // Performance tracking
  let loadStartTime = 0;

  onMount(() => {
    loadInitialCourses();
    setupInfiniteScroll();
  });

  onDestroy(() => {
    if (infiniteScroller) {
      infiniteScroller.destroy();
    }
  });

  async function loadInitialCourses() {
    loading = true;
    error = null;
    loadStartTime = performance.now();

    try {
      const initialCourses = await loadCourses(0, pageSize);
      courses = initialCourses;
      hasMore = initialCourses.length === pageSize;

      // Track performance
      const loadTime = performance.now() - loadStartTime;
      performanceMonitor.recordMetric('course_list_initial_load', loadTime);
    } catch (err: any) {
      error = err.message || 'Failed to load courses';
      console.error('Failed to load initial courses:', err);
    } finally {
      loading = false;
    }
  }

  async function loadMoreCourses(): Promise<Course[]> {
    if (!hasMore || loading) return [];

    loading = true;
    const startTime = performance.now();

    try {
      const newCourses = await loadCourses(courses.length, pageSize);
      
      if (newCourses.length < pageSize) {
        hasMore = false;
      }

      courses = [...courses, ...newCourses];

      // Track performance
      const loadTime = performance.now() - startTime;
      performanceMonitor.recordMetric('course_list_load_more', loadTime);

      return newCourses;
    } catch (err: any) {
      error = err.message || 'Failed to load more courses';
      console.error('Failed to load more courses:', err);
      return [];
    } finally {
      loading = false;
    }
  }

  function setupInfiniteScroll() {
    if (!container) return;

    infiniteScroller = new InfiniteScroller(
      container,
      loadMoreCourses,
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    container.addEventListener('itemsloaded', (event: any) => {
      console.log('Loaded more courses:', event.detail.items.length);
    });

    container.addEventListener('loadingerror', (event: any) => {
      console.error('Error loading more courses:', event.detail.error);
    });
  }

  function retryLoad() {
    error = null;
    loadInitialCourses();
  }

  // Reactive updates for search and filters
  $: if (searchQuery !== undefined || Object.keys(filters).length > 0) {
    courses = [];
    hasMore = true;
    loadInitialCourses();
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  function getDifficultyColor(level: string): string {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div bind:this={container} class="course-list-container">
  {#if error && courses.length === 0}
    <div class="text-center py-12">
      <div class="text-red-600 mb-4">
        <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-semibold">Failed to load courses</p>
        <p class="text-sm text-gray-600 mt-1">{error}</p>
      </div>
      <Button on:click={retryLoad}>Try Again</Button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each courses as course (course.id)}
        <Card class="course-card hover:shadow-lg transition-shadow duration-200">
          <div class="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
            {#if course.thumbnail_url}
              <img
                src={course.thumbnail_url}
                alt={course.title}
                class="w-full h-full object-cover lazy-image"
                loading="lazy"
                on:error={(e) => {
                  e.currentTarget.src = '/images/course-placeholder.jpg';
                }}
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            {/if}
          </div>

          <div class="p-4">
            <div class="flex items-start justify-between mb-2">
              <h3 class="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                {course.title}
              </h3>
              <span class="ml-2 px-2 py-1 text-xs font-medium rounded-full {getDifficultyColor(course.difficulty_level)}">
                {course.difficulty_level}
              </span>
            </div>

            <p class="text-sm text-gray-600 mb-3 line-clamp-2">
              {course.description}
            </p>

            <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
              <span>By {course.instructor_name}</span>
              <span>{formatDuration(course.estimated_duration)}</span>
            </div>

            {#if course.tags && course.tags.length > 0}
              <div class="flex flex-wrap gap-1 mb-3">
                {#each course.tags.slice(0, 3) as tag}
                  <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {tag}
                  </span>
                {/each}
                {#if course.tags.length > 3}
                  <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    +{course.tags.length - 3}
                  </span>
                {/if}
              </div>
            {/if}

            <div class="flex gap-2">
              <Button 
                href="/courses/{course.id}" 
                class="flex-1"
                size="sm"
              >
                View Course
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                on:click={() => {
                  // Add to favorites or bookmark functionality
                  console.log('Bookmark course:', course.id);
                }}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>

    {#if loading && courses.length === 0}
      <div class="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    {/if}

    {#if loading && courses.length > 0}
      <div class="flex justify-center py-8">
        <Loading size="md" />
      </div>
    {/if}

    {#if !loading && !hasMore && courses.length > 0}
      <div class="text-center py-8 text-gray-500">
        <p>You've reached the end of the course list</p>
      </div>
    {/if}

    {#if !loading && courses.length === 0 && !error}
      <div class="text-center py-12">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
        <p class="text-gray-600">Try adjusting your search or filters</p>
      </div>
    {/if}

    {#if error && courses.length > 0}
      <div class="text-center py-4">
        <p class="text-red-600 text-sm mb-2">Failed to load more courses</p>
        <Button variant="outline" size="sm" on:click={retryLoad}>
          Try Again
        </Button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .course-list-container {
    min-height: 400px;
  }

  .course-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .course-card:hover {
    transform: translateY(-2px);
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .lazy-image {
    transition: opacity 0.3s ease;
  }

  .lazy-image[loading] {
    opacity: 0.7;
  }

  /* Skeleton loading animation */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .loading-skeleton {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    background-color: #f3f4f6;
  }
</style>