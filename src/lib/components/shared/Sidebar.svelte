<script lang="ts">
	import { page } from '$app/stores';
	import { userRole, profile } from '$lib/stores/auth';
	import { cn } from '$lib/utils';

	interface Props {
		open: boolean;
		isMobile: boolean;
		onClose: () => void;
	}

	let { open, isMobile, onClose }: Props = $props();

	// Navigation items based on user role
	const navigationItems = $derived(() => {
		const role = $userRole;
		
		const commonItems = [
			{
				label: 'Dashboard',
				href: '/dashboard',
				icon: 'dashboard',
				roles: ['student', 'instructor', 'admin']
			}
		];

		const studentItems = [
			{
				label: 'My Courses',
				href: '/courses',
				icon: 'courses',
				roles: ['student']
			},
			{
				label: 'Learning Path',
				href: '/student/roadmap',
				icon: 'roadmap',
				roles: ['student']
			},
			{
				label: 'Assessments',
				href: '/assessments',
				icon: 'assessments',
				roles: ['student']
			},
			{
				label: 'Progress',
				href: '/progress',
				icon: 'progress',
				roles: ['student']
			}
		];

		const instructorItems = [
			{
				label: 'My Courses',
				href: '/courses',
				icon: 'courses',
				roles: ['instructor', 'admin']
			},
			{
				label: 'Create Course',
				href: '/courses/create',
				icon: 'create',
				roles: ['instructor', 'admin']
			},
			{
				label: 'Students',
				href: '/students',
				icon: 'students',
				roles: ['instructor', 'admin']
			},
			{
				label: 'Analytics',
				href: '/analytics',
				icon: 'analytics',
				roles: ['instructor', 'admin']
			}
		];

		const adminItems = [
			{
				label: 'User Management',
				href: '/admin/users',
				icon: 'users',
				roles: ['admin']
			},
			{
				label: 'System Settings',
				href: '/admin/settings',
				icon: 'settings',
				roles: ['admin']
			}
		];

		const allItems = [...commonItems, ...studentItems, ...instructorItems, ...adminItems];
		
		return allItems.filter(item => 
			role && item.roles.includes(role)
		);
	});

	// Check if a navigation item is active
	function isActive(href: string): boolean {
		const currentPath = $page.route.id || '';
		if (href === '/dashboard') {
			return currentPath === '/dashboard' || currentPath === '' || currentPath === '/';
		}
		return currentPath.startsWith(href);
	}

	// Handle navigation click
	function handleNavClick() {
		if (isMobile) {
			onClose();
		}
	}

	// Get icon SVG for navigation items
	function getIcon(iconName: string): string {
		const icons: Record<string, string> = {
			dashboard: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M8 5a2 2 0 012-2h2a2 2 0 012 2v0H8v0z',
			courses: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
			roadmap: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
			assessments: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			progress: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			create: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
			students: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
			analytics: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
			users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
			settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
		};
		return icons[iconName] || icons.dashboard;
	}
</script>

<!-- Sidebar -->
<aside 
	class={cn(
		'fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out',
		open ? 'translate-x-0' : '-translate-x-full',
		isMobile ? 'md:translate-x-0' : ''
	)}
	aria-label="Sidebar navigation"
>
	<div class="h-full px-3 py-4 overflow-y-auto">
		<!-- User role indicator -->
		{#if $profile?.role}
			<div class="mb-6 px-3 py-2 bg-gray-50 rounded-lg">
				<div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
					{$profile.role} Dashboard
				</div>
			</div>
		{/if}

		<!-- Navigation menu -->
		<nav class="space-y-1">
			{#each navigationItems() as item}
				<a
					href={item.href}
					onclick={handleNavClick}
					class={cn(
						'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
						isActive(item.href)
							? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
							: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
					)}
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					<svg 
						class={cn(
							'mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200',
							isActive(item.href) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
						)}
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path 
							stroke-linecap="round" 
							stroke-linejoin="round" 
							stroke-width="2" 
							d={getIcon(item.icon)} 
						/>
					</svg>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Footer section -->
		<div class="absolute bottom-4 left-3 right-3">
			<div class="border-t border-gray-200 pt-4">
				<a
					href="/profile"
					onclick={handleNavClick}
					class="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
				>
					<svg 
						class="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200"
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path 
							stroke-linecap="round" 
							stroke-linejoin="round" 
							stroke-width="2" 
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
						/>
					</svg>
					Profile Settings
				</a>
			</div>
		</div>
	</div>
</aside>