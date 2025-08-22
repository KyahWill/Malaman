<!--
  Progress Management Component (Instructor)
  
  Allows instructors to view and manage student progress,
  including blocking/unblocking access and viewing detailed status.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ProgressionClient } from '$lib/services/progressionClient.js';
  import type { StudentProgress } from '$lib/types/database.js';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';

  // Props
  export let studentId: string;
  export let studentName: string = '';
  export let courseId: string | null = null;

  // State
  let blockedContent: StudentProgress[] = [];
  let loading = true;
  let error: string | null = null;
  
  // Modal states
  let showBlockModal = false;
  let showUnblockModal = false;
  let selectedContent: StudentProgress | null = null;
  let blockReason = '';
  let processing = false;

  // Load blocked content on mount
  onMount(async () => {
    await loadBlockedContent();
  });

  async function loadBlockedContent() {
    try {
      loading = true;
      error = null;
      blockedContent = await ProgressionClient.getBlockedContent(studentId);
    } catch (err: any) {
      error = err.message;
      console.error('Error loading blocked content:', err);
    } finally {
      loading = false;
    }
  }

  async function handleUnblock(content: StudentProgress) {
    try {
      processing = true;
      
      const contentType = content.lesson_id ? 'lesson' : 'course';
      const contentId = content.lesson_id || content.course_id;
      
      if (!contentId) {
        throw new Error('Invalid content ID');
      }

      await ProgressionClient.unblockProgress(studentId, contentId, contentType);
      
      // Refresh blocked content list
      await loadBlockedContent();
      
      showUnblockModal = false;
      selectedContent = null;
    } catch (err: any) {
      error = err.message;
      console.error('Error unblocking progress:', err);
    } finally {
      processing = false;
    }
  }

  async function handleBlock() {
    try {
      processing = true;
      
      if (!selectedContent?.assessment_id || !blockReason.trim()) {
        throw new Error('Assessment ID and reason are required');
      }

      await ProgressionClient.blockProgress(studentId, selectedContent.assessment_id, blockReason);
      
      // Refresh blocked content list
      await loadBlockedContent();
      
      showBlockModal = false;
      selectedContent = null;
      blockReason = '';
    } catch (err: any) {
      error = err.message;
      console.error('Error blocking progress:', err);
    } finally {
      processing = false;
    }
  }

  function openUnblockModal(content: StudentProgress) {
    selectedContent = content;
    showUnblockModal = true;
  }

  function openBlockModal(content: StudentProgress) {
    selectedContent = content;
    showBlockModal = true;
  }

  function getContentTitle(content: StudentProgress): string {
    if (content.lesson_id) {
      return `Lesson (ID: ${content.lesson_id})`;
    } else if (content.course_id) {
      return `Course (ID: ${content.course_id})`;
    } else if (content.assessment_id) {
      return `Assessment (ID: ${content.assessment_id})`;
    }
    return 'Unknown Content';
  }

  function getContentType(content: StudentProgress): string {
    if (content.lesson_id) return 'lesson';
    if (content.course_id) return 'course';
    if (content.assessment_id) return 'assessment';
    return 'unknown';
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold">Progress Management</h3>
      {#if studentName}
        <p class="text-sm text-gray-600">Student: {studentName}</p>
      {/if}
    </div>
    <Button 
      variant="outline" 
      size="sm"
      on:click={loadBlockedContent}
      disabled={loading}
    >
      Refresh
    </Button>
  </div>

  {#if loading}
    <div class="flex items-center justify-center p-8">
      <Loading />
      <span class="ml-2 text-gray-600">Loading progress information...</span>
    </div>
  {:else if error}
    <Card class="border-red-200 bg-red-50">
      <div class="flex items-center space-x-3">
        <div class="text-red-500">⚠️</div>
        <div>
          <h4 class="font-medium text-red-800">Error Loading Progress</h4>
          <p class="text-sm text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            class="mt-2"
            on:click={loadBlockedContent}
          >
            Retry
          </Button>
        </div>
      </div>
    </Card>
  {:else}
    <!-- Blocked Content List -->
    <Card>
      <div class="space-y-4">
        <h4 class="font-medium">Blocked Content</h4>
        
        {#if blockedContent.length === 0}
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">✅</div>
            <p>No blocked content found</p>
            <p class="text-sm">Student has no progression blocks</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each blockedContent as content}
              <div class="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                <div class="flex-grow">
                  <div class="flex items-center space-x-2">
                    <span class="text-red-600">🚫</span>
                    <h5 class="font-medium text-red-800">
                      {getContentTitle(content)}
                    </h5>
                    <span class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                      {getContentType(content)}
                    </span>
                  </div>
                  
                  <div class="mt-2 space-y-1 text-sm text-red-700">
                    <p>Status: {content.status}</p>
                    <p>Last accessed: {formatDate(content.last_accessed)}</p>
                    {#if content.best_score}
                      <p>Best score: {content.best_score}%</p>
                    {/if}
                    {#if content.attempts_count > 0}
                      <p>Attempts: {content.attempts_count}</p>
                    {/if}
                  </div>
                </div>

                <div class="flex-shrink-0 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    class="text-red-700 border-red-300 hover:bg-red-100"
                    on:click={() => openUnblockModal(content)}
                  >
                    Unblock
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </Card>

    <!-- Quick Actions -->
    <Card>
      <div class="space-y-4">
        <h4 class="font-medium">Quick Actions</h4>
        <div class="flex space-x-3">
          <Button 
            variant="outline"
            on:click={() => window.location.href = `/dashboard/instructor/students/${studentId}`}
          >
            View Student Details
          </Button>
          {#if courseId}
            <Button 
              variant="outline"
              on:click={() => window.location.href = `/courses/${courseId}/analytics`}
            >
              Course Analytics
            </Button>
          {/if}
        </div>
      </div>
    </Card>
  {/if}
</div>

<!-- Unblock Confirmation Modal -->
<Modal bind:show={showUnblockModal} title="Unblock Progress">
  <div class="space-y-4">
    <p>Are you sure you want to unblock progress for this content?</p>
    
    {#if selectedContent}
      <div class="p-3 bg-gray-50 rounded-lg">
        <p class="font-medium">{getContentTitle(selectedContent)}</p>
        <p class="text-sm text-gray-600">Type: {getContentType(selectedContent)}</p>
        <p class="text-sm text-gray-600">Current status: {selectedContent.status}</p>
      </div>
    {/if}

    <p class="text-sm text-gray-600">
      This will allow the student to continue with their learning progress.
    </p>
  </div>

  <div slot="footer" class="flex justify-end space-x-3">
    <Button 
      variant="outline" 
      on:click={() => { showUnblockModal = false; selectedContent = null; }}
      disabled={processing}
    >
      Cancel
    </Button>
    <Button 
      variant="primary"
      on:click={() => selectedContent && handleUnblock(selectedContent)}
      disabled={processing}
    >
      {processing ? 'Unblocking...' : 'Unblock Progress'}
    </Button>
  </div>
</Modal>

<!-- Block Progress Modal -->
<Modal bind:show={showBlockModal} title="Block Progress">
  <div class="space-y-4">
    <p>Block student progress for the selected content.</p>
    
    {#if selectedContent}
      <div class="p-3 bg-gray-50 rounded-lg">
        <p class="font-medium">{getContentTitle(selectedContent)}</p>
        <p class="text-sm text-gray-600">Type: {getContentType(selectedContent)}</p>
      </div>
    {/if}

    <div>
      <label for="blockReason" class="block text-sm font-medium text-gray-700 mb-2">
        Reason for blocking (required)
      </label>
      <Input
        id="blockReason"
        bind:value={blockReason}
        placeholder="Enter reason for blocking progress..."
        required
      />
    </div>

    <p class="text-sm text-gray-600">
      This will prevent the student from accessing subsequent content until unblocked.
    </p>
  </div>

  <div slot="footer" class="flex justify-end space-x-3">
    <Button 
      variant="outline" 
      on:click={() => { showBlockModal = false; selectedContent = null; blockReason = ''; }}
      disabled={processing}
    >
      Cancel
    </Button>
    <Button 
      variant="danger"
      on:click={handleBlock}
      disabled={processing || !blockReason.trim()}
    >
      {processing ? 'Blocking...' : 'Block Progress'}
    </Button>
  </div>
</Modal>