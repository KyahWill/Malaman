import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { LessonService } from '$lib/services/database.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { user, profile } = locals;

	// Check authentication
	if (!user || !profile) {
		throw redirect(302, '/auth/login');
	}

	// Check if user is an instructor
	if (profile.role !== 'instructor') {
		throw redirect(302, '/unauthorized');
	}

	try {
		const lessonId = params.id;
		const lesson = await LessonService.getById(lessonId);

		if (!lesson) {
			throw error(404, 'Lesson not found');
		}

		// Check if the instructor owns this lesson (through the course)
		// This would typically require checking the course ownership
		// For now, we'll allow any instructor to edit any lesson
		// In production, you'd want to add proper ownership checks

		return {
			lesson
		};
	} catch (err) {
		console.error('Failed to load lesson:', err);
		throw error(500, 'Failed to load lesson');
	}
};