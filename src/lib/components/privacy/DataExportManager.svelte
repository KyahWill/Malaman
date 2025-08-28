<!--
  Data Export Manager Component
  Allows users to request and manage data exports for privacy compliance
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui';
  import type { ExportRequest } from '$lib/services/security/dataExport';

  let exportRequests: ExportRequest[] = $state([]);
  let loading = $state(false);
  let error = $state('');
  let success = $state('');

  // Form state
  let selectedFormat = $state('json');
  let requesting = $state(false);

  onMount(() => {
    loadExportRequests();
  });

  async function loadExportRequests() {
    try {
      loading = true;
      const response = await fetch('/api/privacy/export');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load export requests');
      }

      exportRequests = data.export_requests;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load export requests';
    } finally {
      loading = false;
    }
  }

  async function requestDataExport() {
    try {
      requesting = true;
      error = '';
      success = '';

      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: selectedFormat
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to request data export');
      }

      success = data.message;
      await loadExportRequests();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to request data export';
    } finally {
      requesting = false;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  function isExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }
</script>

<div class="space-y-6">
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <h2 class="text-xl font-semibold text-gray-900 mb-4">Data Export</h2>
    <p class="text-gray-600 mb-6">
      Request a copy of all your personal data stored in our system. This includes your profile, 
      courses, assessments, progress, and other associated data.
    </p>

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

    <div class="space-y-4">
      <div>
        <label for="format" class="block text-sm font-medium text-gray-700 mb-2">
          Export Format
        </label>
        <select
          id="format"
          bind:value={selectedFormat}
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="json">JSON (Recommended)</option>
          <option value="csv">CSV (Spreadsheet)</option>
          <option value="xml">XML</option>
        </select>
      </div>

      <Button
        onclick={requestDataExport}
        disabled={requesting}
        class="w-full sm:w-auto"
      >
        {requesting ? 'Requesting...' : 'Request Data Export'}
      </Button>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow-sm border p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Export History</h3>

    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    {:else if exportRequests.length === 0}
      <p class="text-gray-500 text-center py-8">No export requests found.</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Format
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each exportRequests as request}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.format.toUpperCase()}
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
                  {#if request.expires_at}
                    {formatDate(request.expires_at)}
                    {#if isExpired(request.expires_at)}
                      <span class="text-red-500 ml-1">(Expired)</span>
                    {/if}
                  {:else}
                    -
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {#if request.status === 'completed' && request.download_url && !isExpired(request.expires_at)}
                    <a
                      href={request.download_url}
                      class="text-blue-600 hover:text-blue-900"
                      download
                    >
                      Download
                    </a>
                  {:else if request.status === 'failed'}
                    <span class="text-red-500">Failed</span>
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
        <h3 class="text-sm font-medium text-blue-800">Important Information</h3>
        <div class="mt-2 text-sm text-blue-700">
          <ul class="list-disc list-inside space-y-1">
            <li>Export requests may take up to 24 hours to process</li>
            <li>Download links expire after 7 days for security reasons</li>
            <li>Exported data includes all personal information we have stored</li>
            <li>You can request a new export at any time</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>