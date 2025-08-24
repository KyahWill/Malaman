<!--
  Notification Center Component
  
  Displays student notifications including progress updates, reminders,
  achievements, and learning recommendations with interactive management.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import { NotificationService, type Notification, type NotificationCategory } from '$lib/services/notificationService.js';

  // Props
  export let studentId: string;
  export let showUnreadOnly: boolean = false;
  export let limit: number = 20;

  // State
  let notifications: Notification[] = [];
  let loading = true;
  let error: string | null = null;
  let selectedCategory: NotificationCategory | 'all' = 'all';
  let showPreferences = false;
  let unreadCount = 0;

  // Load notifications on mount
  onMount(async () => {
    await loadNotifications();
    await loadUnreadCount();
  });

  async function loadNotifications() {
    try {
      loading = true;
      error = null;
      notifications = await NotificationService.getNotifications(studentId, {
        unreadOnly: showUnreadOnly,
        limit,
        category: selectedCategory === 'all' ? undefined : selectedCategory
      });
    } catch (err: any) {
      error = err.message;
      console.error('Error loading notifications:', err);
    } finally {
      loading = false;
    }
  }

  async function loadUnreadCount() {
    try {
      unreadCount = await NotificationService.getUnreadCount(studentId);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await NotificationService.markAsRead(notificationId);
      // Update local state
      notifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      await loadUnreadCount();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  async function markAllAsRead() {
    try {
      await NotificationService.markAllAsRead(studentId);
      // Update local state
      notifications = notifications.map(n => ({ ...n, read: true }));
      unreadCount = 0;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }

  function getNotificationIcon(type: string): string {
    switch (type) {
      case 'progress_milestone': return '🎯';
      case 'assessment_reminder': return '⏰';
      case 'course_completion': return '🎉';
      case 'streak_achievement': return '🔥';
      case 'goal_reminder': return '📊';
      case 'new_content': return '📚';
      case 'performance_insight': return '💡';
      case 'deadline_warning': return '⚠️';
      default: return '📢';
    }
  }

  function getPriorityColor(priority: string): 'error' | 'warning' | 'info' {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  function getCategoryColor(category: NotificationCategory): 'success' | 'primary' | 'warning' | 'info' | 'default' {
    switch (category) {
      case 'achievement': return 'success';
      case 'reminder': return 'warning';
      case 'progress': return 'primary';
      case 'content': return 'info';
      case 'system': return 'default';
      default: return 'default';
    }
  }

  function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return time.toLocaleDateString();
  }

  // Reactive updates
  $: {
    if (selectedCategory || showUnreadOnly) {
      loadNotifications();
    }
  }

  const categories: { value: NotificationCategory | 'all'; label: string; count?: number }[] = [
    { value: 'all', label: 'All' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'reminder', label: 'Reminders' },
    { value: 'progress', label: 'Progress' },
    { value: 'content', label: 'Content' },
    { value: 'system', label: 'System' }
  ];
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <h2 class="text-xl font-semibold text-gray-900">Notifications</h2>
      {#if unreadCount > 0}
        <Badge variant="error" size="sm">{unreadCount}</Badge>
      {/if}
    </div>
    <div class="flex items-center space-x-2">
      {#if unreadCount > 0}
        <Button variant="outline" size="sm" onclick={markAllAsRead}>
          Mark All Read
        </Button>
      {/if}
      <Button variant="outline" size="sm" onclick={() => showPreferences = true}>
        Settings
      </Button>
    </div>
  </div>

  <!-- Filters -->
  <div class="flex items-center space-x-4">
    <!-- Category Filter -->
    <div class="flex items-center space-x-2">
      <span class="text-sm font-medium text-gray-700">Category:</span>
      <select 
        bind:value={selectedCategory}
        class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {#each categories as category}
          <option value={category.value}>{category.label}</option>
        {/each}
      </select>
    </div>

    <!-- Show Unread Only -->
    <label class="flex items-center space-x-2">
      <input 
        type="checkbox" 
        bind:checked={showUnreadOnly}
        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span class="text-sm text-gray-700">Unread only</span>
    </label>
  </div>

  <!-- Notifications List -->
  {#if loading}
    <div class="flex items-center justify-center p-8">
      <Loading />
      <span class="ml-2 text-gray-600">Loading notifications...</span>
    </div>
  {:else if error}
    <Card class="border-red-200 bg-red-50">
      <div class="flex items-center space-x-3">
        <div class="text-red-500">⚠️</div>
        <div>
          <h3 class="font-medium text-red-800">Failed to Load Notifications</h3>
          <p class="text-sm text-red-600">{error}</p>
          <button 
            class="mt-2 text-sm text-red-700 underline hover:text-red-800"
            on:click={loadNotifications}
          >
            Try Again
          </button>
        </div>
      </div>
    </Card>
  {:else if notifications.length === 0}
    <Card class="p-8 text-center">
      <div class="text-4xl mb-4">🔔</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
      <p class="text-gray-600">
        {showUnreadOnly ? 'All caught up! No unread notifications.' : 'You don\'t have any notifications yet.'}
      </p>
    </Card>
  {:else}
    <div class="space-y-3">
      {#each notifications as notification}
        <Card class="p-4 {notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}">
          <div class="flex items-start space-x-3">
            <!-- Icon -->
            <div class="flex-shrink-0 text-2xl">
              {getNotificationIcon(notification.type)}
            </div>

            <!-- Content -->
            <div class="flex-grow min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex-grow">
                  <div class="flex items-center space-x-2 mb-1">
                    <h4 class="font-medium text-gray-900 {notification.read ? '' : 'font-semibold'}">
                      {notification.title}
                    </h4>
                    <Badge variant={getCategoryColor(notification.category)} size="sm">
                      {notification.category}
                    </Badge>
                    {#if notification.priority === 'high'}
                      <Badge variant={getPriorityColor(notification.priority)} size="sm">
                        High Priority
                      </Badge>
                    {/if}
                  </div>
                  <p class="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatTimeAgo(notification.created_at)}</span>
                    {#if notification.expires_at}
                      <span>Expires: {new Date(notification.expires_at).toLocaleDateString()}</span>
                    {/if}
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex-shrink-0 ml-4">
                  {#if !notification.read}
                    <button
                      class="text-xs text-blue-600 hover:text-blue-800 underline"
                      on:click={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </Card>
      {/each}
    </div>

    <!-- Load More -->
    {#if notifications.length >= limit}
      <div class="text-center">
        <Button variant="outline" onclick={() => limit += 20}>
          Load More
        </Button>
      </div>
    {/if}
  {/if}
</div>

<!-- Notification Preferences Modal -->
<Modal bind:show={showPreferences} title="Notification Preferences">
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-4">Notification Categories</h3>
      <div class="space-y-3">
        {#each categories.slice(1) as category}
          <label class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 capitalize">
              {category.label}
            </span>
            <input 
              type="checkbox" 
              checked={true}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        {/each}
      </div>
    </div>

    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-4">Delivery Settings</h3>
      <div class="space-y-3">
        <label class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">Email notifications</span>
          <input 
            type="checkbox" 
            checked={true}
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
        <label class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">Push notifications</span>
          <input 
            type="checkbox" 
            checked={true}
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Notification frequency
      </label>
      <select class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        <option value="immediate">Immediate</option>
        <option value="daily">Daily digest</option>
        <option value="weekly">Weekly summary</option>
      </select>
    </div>
  </div>

  <div slot="footer" class="flex justify-end space-x-3">
    <Button variant="outline" onclick={() => showPreferences = false}>
      Cancel
    </Button>
    <Button variant="primary" onclick={() => showPreferences = false}>
      Save Preferences
    </Button>
  </div>
</Modal>