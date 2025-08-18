<script lang="ts">
	import { page } from '$app/stores';
	import { userRole } from '$lib/stores/auth';

	// Generate breadcrumbs from current route
	const breadcrumbs = $derived(() => {
		const path = $page.route.id || '';
		const segments = path.split('/').filter(Boolean);
		
		const crumbs = [
			{ label: 'Home', href: '/', current: false }
		];

		let currentPath = '';
		
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			currentPath += `/${segment}`;
			
			// Skip dynamic route segments like [id]
			if (segment.startsWith('[') && segment.endsWith(']')) {
				continue;
			}
			
			const isLast = i === segments.length - 1;
			const label = formatSegmentLabel(segment, segments, i);
			
			crumbs.push({
				label,
				href: currentPath,
				current: isLast
			});
		}

		// Update the first crumb to not be current if we have more
		if (crumbs.length > 1) {
			crumbs[0].current = false;
		}

		return crumbs;
	});

	function formatSegmentLabel(segment: string, segments: string[], index: number): string {
		// Handle special route names
		const labelMap: Record<string, string> = {
			'dashboard': 'Dashboard',
			'courses': 'Courses',
			'lessons': 'Lessons',
			'assessments': 'Assessments',
			'profile': 'Profile',
			'auth': 'Authentication',
			'student': 'Student',
			'instructor': 'Instructor',
			'admin': 'Admin'
		};

		// Check if this is a role-specific route
		if (segment === 'student' || segment === 'instructor' || segment === 'admin') {
			// If it's followed by another segment, don't show the role
			if (index < segments.length - 1) {
				return '';
			}
		}

		return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
	}

	// Filter out empty labels
	const filteredBreadcrumbs = $derived(() => 
		breadcrumbs().filter(crumb => crumb.label.trim() !== '')
	);
</script>

{#if filteredBreadcrumbs().length > 1}
	<nav class="bg-white border-b border-gray-200 px-4 md:px-6 py-3" aria-label="Breadcrumb">
		<ol class="flex items-center space-x-2 text-sm">
			{#each filteredBreadcrumbs() as crumb, index}
				<li class="flex items-center">
					{#if index > 0}
						<svg 
							class="w-4 h-4 text-gray-400 mx-2" 
							fill="currentColor" 
							viewBox="0 0 20 20"
							aria-hidden="true"
						>
							<path 
								fill-rule="evenodd" 
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
								clip-rule="evenodd" 
							/>
						</svg>
					{/if}
					
					{#if crumb.current}
						<span 
							class="text-gray-900 font-medium"
							aria-current="page"
						>
							{crumb.label}
						</span>
					{:else}
						<a 
							href={crumb.href}
							class="text-gray-600 hover:text-gray-900 transition-colors duration-200"
						>
							{crumb.label}
						</a>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}