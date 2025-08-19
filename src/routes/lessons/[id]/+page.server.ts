import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { LessonService, CourseService } from '$lib/services/database.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { user, profile } = locals;

	// Check authentication
	if (!user || !profile) {
		throw redirect(302, '/auth/login');
	}

	try {
		const lessonId = params.id;
		const lesson = await LessonService.getWithDetails(lessonId, user.id);

		if (!lesson) {
			throw error(404, 'Lesson not found');
		}

		// Get course information
		const course = await CourseService.getById(lesson.course_id);
		if (!course) {
			throw error(404, 'Course not found');
		}

		// Check access permissions
		const canEdit = profile.role === 'instructor' && course.instructor_id === user.id;
		const canView = course.is_published || canEdit || profile.role === 'admin';

		if (!canView) {
			throw error(403, 'Access denied');
		}

		return {
			lesson,
			course,
			canEdit
		};
	} catch (err) {
		console.error('Failed to load lesson:', err);
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Lesson not found');
		}
		throw error(500, 'Failed to load lesson');
	}
};