/**
 * Content Recommendations API
 * Provides AI-powered recommendations for course content improvement
 */

import { json, error } from '@sveltejs/kit';
import { InstructorAnalyticsService } from '$lib/services/instructorAnalytics.js';
import { CourseService } from '$lib/services/database.js';
import type { RequestHandler } from './$types';

// GET /api/courses/[id]/recommendations - Get content improvement recommendations
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

		const courseId = params.id;

		// Get course to check permissions
		const course = await CourseService.getById(courseId);
		if (!course) {
			throw error(404, 'Course not found');
		}

		// Check permissions - only instructor or admin can view recommendations
		if (course.instructor_id !== user.id && profile.role !== 'admin') {
			throw error(403, 'Permission denied');
		}

		// Get course analytics to generate recommendations
		const analytics = await InstructorAnalyticsService.getCourseAnalytics(courseId, user.id);
		
		// Extract recommendations from analytics
		const recommendations = analytics.recommendations;

		return json({ recommendations });
	} catch (err) {
		console.error('Error fetching content recommendations:', err);
		
		if (err instanceof Error) {
			if (err.message.includes('not found') || err.message.includes('access denied')) {
				throw error(404, 'Course not found or access denied');
			}
		}
		
		throw error(500, 'Failed to fetch content recommendations');
	}
};