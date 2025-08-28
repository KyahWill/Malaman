<!--
  Privacy Settings Page
  Allows users to manage their data privacy settings, export data, and request deletion
-->

<script lang="ts">
  import { page } from '$app/stores';
  import { DataExportManager, DataDeletionManager } from '$lib/components/privacy';
  import { Button } from '$lib/components/ui';

  let activeTab = $state('export');

  function setActiveTab(tab: string) {
    activeTab = tab;
  }
</script>

<svelte:head>
  <title>Privacy Settings - Personalized LMS</title>
  <meta name="description" content="Manage your data privacy settings, export your data, or request account deletion." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Privacy Settings</h1>
      <p class="mt-2 text-gray-600">
        Manage your personal data, privacy preferences, and exercise your data rights.
      </p>
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white rounded-lg shadow-sm border mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          <button
            onclick={() => setActiveTab('export')}
            class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'export' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            Data Export
          </button>
          <button
            onclick={() => setActiveTab('deletion')}
            class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'deletion' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            Account Deletion
          </button>
          <button
            onclick={() => setActiveTab('rights')}
            class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'rights' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            Your Rights
          </button>
        </nav>
      </div>

      <div class="p-6">
        {#if activeTab === 'export'}
          <DataExportManager />
        {:else if activeTab === 'deletion'}
          <DataDeletionManager />
        {:else if activeTab === 'rights'}
          <div class="space-y-6">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">Your Privacy Rights</h2>
              <p class="text-gray-600 mb-6">
                We respect your privacy and are committed to protecting your personal data. 
                Under applicable privacy laws (GDPR, CCPA, etc.), you have the following rights:
              </p>
            </div>

            <div class="grid gap-6 md:grid-cols-2">
              <div class="bg-blue-50 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-blue-900 mb-3">Right to Access</h3>
                <p class="text-blue-800 mb-4">
                  You have the right to know what personal data we collect, how we use it, 
                  and to request a copy of your data.
                </p>
                <Button
                  onclick={() => setActiveTab('export')}
                  variant="outline"
                  size="sm"
                >
                  Export My Data
                </Button>
              </div>

              <div class="bg-red-50 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-red-900 mb-3">Right to Deletion</h3>
                <p class="text-red-800 mb-4">
                  You have the right to request deletion of your personal data, 
                  subject to certain legal exceptions.
                </p>
                <Button
                  onclick={() => setActiveTab('deletion')}
                  variant="outline"
                  size="sm"
                >
                  Delete My Account
                </Button>
              </div>

              <div class="bg-green-50 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-green-900 mb-3">Right to Rectification</h3>
                <p class="text-green-800 mb-4">
                  You have the right to correct inaccurate or incomplete personal data.
                </p>
                <Button
                  onclick={() => window.location.href = '/profile'}
                  variant="outline"
                  size="sm"
                >
                  Update Profile
                </Button>
              </div>

              <div class="bg-purple-50 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-purple-900 mb-3">Right to Portability</h3>
                <p class="text-purple-800 mb-4">
                  You have the right to receive your personal data in a structured, 
                  commonly used format.
                </p>
                <Button
                  onclick={() => setActiveTab('export')}
                  variant="outline"
                  size="sm"
                >
                  Download Data
                </Button>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Data Processing Information</h3>
              <div class="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 class="font-medium text-gray-900">What data we collect:</h4>
                  <ul class="list-disc list-inside mt-1 space-y-1">
                    <li>Profile information (name, email, learning preferences)</li>
                    <li>Learning progress and assessment results</li>
                    <li>Course enrollment and completion data</li>
                    <li>Usage analytics and interaction patterns</li>
                    <li>Content you create (courses, lessons, assessments)</li>
                  </ul>
                </div>

                <div>
                  <h4 class="font-medium text-gray-900">How we use your data:</h4>
                  <ul class="list-disc list-inside mt-1 space-y-1">
                    <li>Provide personalized learning experiences</li>
                    <li>Track your progress and generate recommendations</li>
                    <li>Improve our services and user experience</li>
                    <li>Communicate with you about your account and courses</li>
                    <li>Ensure platform security and prevent abuse</li>
                  </ul>
                </div>

                <div>
                  <h4 class="font-medium text-gray-900">Data retention:</h4>
                  <p class="mt-1">
                    We retain your data for as long as your account is active or as needed to provide services. 
                    You can request deletion at any time, subject to legal requirements.
                  </p>
                </div>

                <div>
                  <h4 class="font-medium text-gray-900">Contact us:</h4>
                  <p class="mt-1">
                    If you have questions about your privacy rights or our data practices, 
                    please contact our Data Protection Officer at privacy@example.com.
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-yellow-800">Important Note</h3>
                  <p class="mt-2 text-sm text-yellow-700">
                    Some data may be retained for legal compliance, security, or legitimate business purposes 
                    even after account deletion. We will always comply with applicable privacy laws and regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>