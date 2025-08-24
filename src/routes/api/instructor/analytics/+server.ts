/**
 * Instructor Analytics API
 * Provides comprehensive analytics data for instructors
 */

import { json, error } from '@sveltejs/kit';
import { InstructorAnalyticsService } from '$lib/services/instructorAnalytics.js';
import type { RequestHandler } from './$types';

// GET /api/instructor/analytics - Get instructor dashboard analytics
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Authentication required');
		}

		const profile = locals.profile;
		if (!profile) {
			throw error(401, 'Profile not found');
		}

		// Check if user is an instructor
		if (profile.role !== 'instructor' && profile.role !== 'admin') {
			throw error(403, 'Instructor access required');
		}

		const instructorId = url.searchParams.get('instructor_id') || user.id;
		const timeRange = url.searchParams.get('range') || '30d';

		// Verify instructor can access this data
		if (instructorId !== user.id && profile.role !== 'admin') {
			throw error(403, 'Access denied');
		}

		const dashboardData = await InstructorAnalyticsService.getInstructorDashboard(instructorId);

		return json(dashboardData);
	} catch (err) {
		console.error('Error fetching instructor analytics:', err);
		
		if (err instanceof Error) {
			if (err.message.includes('not found')) {
				throw error(404, 'Instructor not found');
			}
			if (err.message.includes('access denied') || err.message.includes('Permission denied')) {
				throw error(403, 'Access denied');
			}
		}
		
		throw error(500, 'Failed to fetch instructor analytics');
	}
};