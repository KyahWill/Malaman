import { error, redirect } from '@sveltejs/kit';
import { CourseService } from '$lib/services/database.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		throw redirect(302, '/auth');
	}

	const profile = locals.profile;
	if (!profile) {
		throw error(401, 'Profile not found');
	}

	// Check if user is an instructor or admin
	if (profile.role !== 'instructor' && profile.role !== 'admin') {
		throw error(403, 'Instructor access required');
	}

	const courseId = params.id;

	try {
		const course = await CourseService.getById(courseId);
		if (!course) {
			throw error(404, 'Course not found');
		}

		// Check if user owns this course (or is admin)
		if (course.instructor_id !== user.id && profile.role !== 'admin') {
			throw error(403, 'You can only view analytics for your own courses');
		}

		return {
			course,
			profile
		};
	} catch (err) {
		console.error('Error loading course for analytics:', err);
		throw error(500, 'Failed to load course');
	}
};