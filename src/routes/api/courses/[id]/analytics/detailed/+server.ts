/**
 * Detailed Course Analytics API
 * Provides comprehensive analytics for a specific course
 */

import { json, error } from '@sveltejs/kit';
import { InstructorAnalyticsService } from '$lib/services/instructorAnalytics.js';
import type { RequestHandler } from './$types';

// GET /api/courses/[id]/analytics/detailed - Get detailed course analytics
export const GET: RequestHandler = async ({ params, locals }) => {
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

		const courseId = params.id;
		const instructorId = user.id;

		const analytics = await InstructorAnalyticsService.getCourseAnalytics(courseId, instructorId);

		return json({ analytics });
	} catch (err) {
		console.error('Error fetching detailed course analytics:', err);
		
		if (err instanceof Error) {
			if (err.message.includes('not found') || err.message.includes('access denied')) {
				throw error(404, 'Course not found or access denied');
			}
		}
		
		throw error(500, 'Failed to fetch course analytics');
	}
};