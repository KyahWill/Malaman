<!--
  Security Incident Dashboard Component
  Admin interface for managing security incidents
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui';
  import type { SecurityIncident, IncidentType, IncidentSeverity, IncidentStatus } from '$lib/services/security/incidentResponse';

  let incidents: SecurityIncident[] = $state([]);
  let loading = $state(false);
  let error = $state('');
  let success = $state('');

  // Filters
  let typeFilter = $state('');
  let severityFilter = $state('');
  let statusFilter = $state('');

  // New incident form
  let showNewIncidentForm = $state(false);
  let newIncident = $state({
    type: 'unauthorized_access' as IncidentType,
    severity: 'medium' as IncidentSeverity,
    title: '',
    description: '',
    affected_users: '',
    affected_resources: ''
  });
  let creating = $state(false);

  // Selected incident for details
  let selectedIncident: SecurityIncident | null = $state(null);
  let showIncidentDetails = $state(false);

  const incidentTypes: { value: IncidentType; label: string }[] = [
    { value: 'data_breach', label: 'Data Breach' },
    { value: 'unauthorized_access', label: 'Unauthorized Access' },
    { value: 'system_compromise', label: 'System Compromise' },
    { value: 'malware_detection', label: 'Malware Detection' },
    { value: 'ddos_attack', label: 'DDoS Attack' },
    { value: 'phishing_attempt', label: 'Phishing Attempt' },
    { value: 'insider_threat', label: 'Insider Threat' },
    { value: 'data_corruption', label: 'Data Corruption' },
    { value: 'service_disruption', label: 'Service Disruption' },
    { value: 'privacy_violation', label: 'Privacy Violation' },
    { value: 'compliance_breach', label: 'Compliance Breach' }
  ];

  const severityLevels: { value: IncidentSeverity; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  const statusOptions: { value: IncidentStatus; label: string; color: string }[] = [
    { value: 'detected', label: 'Detected', color: 'text-red-600' },
    { value: 'investigating', label: 'Investigating', color: 'text-yellow-600' },
    { value: 'contained', label: 'Contained', color: 'text-blue-600' },
    { value: 'mitigated', label: 'Mitigated', color: 'text-purple-600' },
    { value: 'resolved', label: 'Resolved', color: 'text-green-600' },
    { value: 'closed', label: 'Closed', color: 'text-gray-600' }
  ];

  onMount(() => {
    loadIncidents();
  });

  async function loadIncidents() {
    try {
      loading = true;
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (severityFilter) params.set('severity', severityFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/security/incidents?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load incidents');
      }

      incidents = data.incidents;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load incidents';
    } finally {
      loading = false;
    }
  }

  async function createIncident() {
    try {
      creating = true;
      error = '';
      success = '';

      const affectedUsers = newIncident.affected_users
        .split(',')
        .map(u => u.trim())
        .filter(u => u);

      const affectedResources = newIncident.affected_resources
        .split(',')
        .map(r => r.trim())
        .filter(r => r);

      const response = await fetch('/api/security/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: newIncident.type,
          severity: newIncident.severity,
          title: newIncident.title,
          description: newIncident.description,
          affected_users: affectedUsers,
          affected_resources: affectedResources
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create incident');
      }

      success = data.message;
      showNewIncidentForm = false;
      resetNewIncidentForm();
      await loadIncidents();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create incident';
    } finally {
      creating = false;
    }
  }

  async function updateIncidentStatus(incidentId: string, status: IncidentStatus, resolutionNotes?: string) {
    try {
      const response = await fetch(`/api/security/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_status',
          status,
          resolution_notes: resolutionNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update incident');
      }

      success = data.message;
      await loadIncidents();
      
      // Update selected incident if it's the one being updated
      if (selectedIncident?.id === incidentId) {
        const updatedIncident = incidents.find(i => i.id === incidentId);
        if (updatedIncident) {
          selectedIncident = updatedIncident;
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update incident';
    }
  }

  function resetNewIncidentForm() {
    newIncident = {
      type: 'unauthorized_access',
      severity: 'medium',
      title: '',
      description: '',
      affected_users: '',
      affected_resources: ''
    };
  }

  function getSeverityColor(severity: IncidentSeverity): string {
    return severityLevels.find(s => s.value === severity)?.color || 'text-gray-600';
  }

  function getStatusColor(status: IncidentStatus): string {
    return statusOptions.find(s => s.value === status)?.color || 'text-gray-600';
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  function viewIncidentDetails(incident: SecurityIncident) {
    selectedIncident = incident;
    showIncidentDetails = true;
  }

  async function downloadIncidentReport(incidentId: string) {
    try {
      const response = await fetch(`/api/security/incidents/${incidentId}/report`);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident-report-${incidentId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to download report';
    }
  }

  // Reactive filter updates
  $effect(() => {
    loadIncidents();
  });
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold text-gray-900">Security Incidents</h1>
    <Button onclick={() => showNewIncidentForm = true}>
      Report New Incident
    </Button>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
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
    <div class="bg-green-50 border border-green-200 rounded-md p-4">
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

  <!-- Filters -->
  <div class="bg-white rounded-lg shadow-sm border p-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="type-filter" class="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          id="type-filter"
          bind:value={typeFilter}
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Types</option>
          {#each incidentTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="severity-filter" class="block text-sm font-medium text-gray-700 mb-1">
          Severity
        </label>
        <select
          id="severity-filter"
          bind:value={severityFilter}
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Severities</option>
          {#each severityLevels as severity}
            <option value={severity.value}>{severity.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status-filter"
          bind:value={statusFilter}
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {#each statusOptions as status}
            <option value={status.value}>{status.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Incidents List -->
  <div class="bg-white rounded-lg shadow-sm border">
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    {:else if incidents.length === 0}
      <div class="text-center py-8">
        <p class="text-gray-500">No security incidents found.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detected
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each incidents as incident}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{incident.title}</div>
                  <div class="text-sm text-gray-500 truncate max-w-xs">{incident.description}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {incidentTypes.find(t => t.value === incident.type)?.label || incident.type}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium {getSeverityColor(incident.severity)}">
                    {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium {getStatusColor(incident.status)}">
                    {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(incident.detected_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onclick={() => viewIncidentDetails(incident)}
                    class="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                  <button
                    onclick={() => downloadIncidentReport(incident.id)}
                    class="text-green-600 hover:text-green-900"
                  >
                    Report
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- New Incident Modal -->
{#if showNewIncidentForm}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Report New Security Incident</h3>
        
        <form onsubmit|preventDefault={createIncident} class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="incident-type" class="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="incident-type"
                bind:value={newIncident.type}
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {#each incidentTypes as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="incident-severity" class="block text-sm font-medium text-gray-700 mb-1">
                Severity *
              </label>
              <select
                id="incident-severity"
                bind:value={newIncident.severity}
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {#each severityLevels as severity}
                  <option value={severity.value}>{severity.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <div>
            <label for="incident-title" class="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="incident-title"
              type="text"
              bind:value={newIncident.title}
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the incident"
            />
          </div>

          <div>
            <label for="incident-description" class="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="incident-description"
              bind:value={newIncident.description}
              required
              rows="4"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of what happened, when it was discovered, and any immediate actions taken"
            ></textarea>
          </div>

          <div>
            <label for="affected-users" class="block text-sm font-medium text-gray-700 mb-1">
              Affected Users
            </label>
            <input
              id="affected-users"
              type="text"
              bind:value={newIncident.affected_users}
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Comma-separated list of user IDs or emails"
            />
          </div>

          <div>
            <label for="affected-resources" class="block text-sm font-medium text-gray-700 mb-1">
              Affected Resources
            </label>
            <input
              id="affected-resources"
              type="text"
              bind:value={newIncident.affected_resources}
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Comma-separated list of affected systems, databases, or services"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onclick={() => {
                showNewIncidentForm = false;
                resetNewIncidentForm();
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Report Incident'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}