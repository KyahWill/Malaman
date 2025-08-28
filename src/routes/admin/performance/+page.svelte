<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import PerformanceDashboard from '$lib/components/admin/PerformanceDashboard.svelte';
  import AppLayout from '$lib/components/shared/AppLayout.svelte';

  // Check if user has admin access
  $: if ($page.data.session?.user?.role !== 'admin') {
    // Redirect to unauthorized page or show error
    console.error('Admin access required');
  }
</script>

<svelte:head>
  <title>Performance Dashboard - Admin</title>
  <meta name="description" content="Monitor and optimize application performance" />
</svelte:head>

<AppLayout>
  <div class="container mx-auto px-4 py-8">
    <PerformanceDashboard />
  </div>
</AppLayout>