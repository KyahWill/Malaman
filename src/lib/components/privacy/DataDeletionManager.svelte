<!--
  Data Deletion Manager Component
  Allows users to request account and data deletion for privacy compliance
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui';
  import type { DeletionRequest } from '$lib/services/security/dataDeletion';

  let deletionRequests: DeletionRequest[] = $state([]);
  let loading = $state(false);
  let error = $state('');
  let success = $state('');

  // Form state
  let deletionType = $state('soft');
  let retentionPeriod = $state(30);
  let requesting = $state(false);
  let showConfirmation = $state(false);

  onMount(() => {
    loadDeletionRequests();
  });

  async function loadDeletionRequests() {
    try {
      loading = true;
      const response = await fetch('/api/privacy/deletion');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load deletion requests');
      }

      deletionRequests = data.deletion_requests;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load deletion requests';
    } finally {
      loading = false;
    }
  }

  async function requestDataDeletion() {
    try {
      requesting = true;
      error = '';
      success = '';

      const response = await fetch('/api/privacy/deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deletion_type: deletionType,
          retention_period_days: retentionPeriod
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to request data deletion');
      }

      success = data.message;
      showConfirmation = false;
      await loadDeletionRequests();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to request data deletion';
    } finally {
      requesting = false;
    }
  }

  async function cancelDeletionRequest(requestId: string) {
    try {
      const response = await fetch('/api/privacy/deletion', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          action: 'cancel'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel deletion request');
      }

      success = data.message;
      await loadDeletionRequests();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to cancel deletion request';
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-red-600';
      case 'processing': return 'text-orange-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-yellow-600';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  function openConfirmation() {
    showConfirmation = true;
    error = '';
    success = '';
  }
</script>

<div class="space-y-6">
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <h2 class="text-xl font-semibold text-gray-900 mb-4">Account Deletion</h2>
    <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Warning</h3>
          <p class="mt-2 text-sm text-red-700">
            Account deletion is permanent and cannot be undone. Please consider exporting your data first.
          </p>
        </div>
      </div>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    {#if success}
      <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-800">{success}</p>
          </div>
        </div>
      </div>
    {/if}

    {#if !showConfirmation}
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Deletion Type
          </label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="radio"
                bind:group={deletionType}
                value="soft"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-700">
                <strong>Soft Deletion</strong> - Anonymize data but keep for analytics (recommended)
              </span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                bind:group={deletionType}
                value="hard"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span class="ml-2 text-sm text-gray-700">
                <strong>Hard Deletion</strong> - Permanently remove all data
              </span>
            </label>
          </div>
        </div>

        {#if deletionType === 'soft'}
          <div>
            <label for="retention" class="block text-sm font-medium text-gray-700 mb-2">
              Retention Period (days)
            </label>
            <input
              id="retention"
              type="number"
              bind:value={retentionPeriod}
              min="1"
              max="365"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p class="mt-1 text-sm text-gray-500">
              How long to keep anonymized data for analytics purposes (1-365 days)
            </p>
          </div>
        {/if}

        <Button
          onclick={openConfirmation}
          variant="destructive"
          class="w-full sm:w-auto"
        >
          Request Account Deletion
        </Button>
      </div>
    {:else}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900">Confirm Account Deletion</h3>
        <div class="bg-gray-50 rounded-md p-4">
          <h4 class="font-medium text-gray-900 mb-2">Deletion Details:</h4>
          <ul class="text-sm text-gray-700 space-y-1">
            <li><strong>Type:</strong> {deletionType === 'soft' ? 'Soft Deletion (Anonymized)' : 'Hard Deletion (Permanent)'}</li>
            {#if deletionType === 'soft'}
              <li><strong>Retention Period:</strong> {retentionPeriod} days</li>
            {/if}
            <li><strong>What will be deleted:</strong> Profile, courses, lessons, assessments, progress data</li>
            <li><strong>What will be kept:</strong> {deletionType === 'soft' ? 'Anonymized analytics data' : 'Minimal audit logs for compliance'}</li>
          </ul>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-800">
                You will receive a confirmation email to complete this process. This helps ensure account security.
              </p>
            </div>
          </div>
        </div>

        <div class="flex space-x-3">
          <Button
            onclick={requestDataDeletion}
            disabled={requesting}
            variant="destructive"
          >
            {requesting ? 'Processing...' : 'Confirm Deletion'}
          </Button>
          <Button
            onclick={() => showConfirmation = false}
            variant="outline"
            disabled={requesting}
          >
            Cancel
          </Button>
        </div>
      </div>
    {/if}
  </div>

  <div class="bg-white rounded-lg shadow-sm border p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Deletion History</h3>

    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    {:else if deletionRequests.length === 0}
      <p class="text-gray-500 text-center py-8">No deletion requests found.</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each deletionRequests as request}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.deletion_type === 'soft' ? 'Soft' : 'Hard'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium {getStatusColor(request.status)}">
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(request.requested_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.completed_at ? formatDate(request.completed_at) : '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {#if request.status === 'pending'}
                    <button
                      onclick={() => cancelDeletionRequest(request.id)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Cancel
                    </button>
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-blue-800">Your Rights</h3>
        <div class="mt-2 text-sm text-blue-700">
          <ul class="list-disc list-inside space-y-1">
            <li>You have the right to request deletion of your personal data</li>
            <li>Deletion requests require email confirmation for security</li>
            <li>Some data may be retained for legal compliance purposes</li>
            <li>You can cancel pending requests before confirmation</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>