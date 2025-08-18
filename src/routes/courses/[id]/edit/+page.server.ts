/**
 * Course Edit Page Server Logic
 */

import { error, redirect } from '@sveltejs/kit';
import { CourseService } from '$lib/services/database.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	try {
		const courseId = params.id;
		const course = await CourseService.getById(courseId);
		
		if (!course) {
			throw error(404, 'Course not found');
		}

		const profile = locals.profile;
		if (!profile) {
			throw redirect(302, '/auth/login');
		}

		// Check permissions
		if (course.instructor_id !== user.id && profile.role !== 'admin') {
			throw error(403, 'Permission denied');
		}

		return {
			course,
			userId: user.id
		};
	} catch (err) {
		console.error('Error loading course for edit:', err);
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Course not found');
		}
		throw error(500, 'Failed to load course');
	}
};