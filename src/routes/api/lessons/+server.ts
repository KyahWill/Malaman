import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LessonService } from '$lib/services/database.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	try {
		const courseId = url.searchParams.get('courseId');
		
		if (!courseId) {
			throw error(400, 'Course ID is required');
		}

		const lessons = await LessonService.getByCourse(courseId);
		return json(lessons);
	} catch (err) {
		console.error('Failed to fetch lessons:', err);
		throw error(500, 'Failed to fetch lessons');
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	if (profile.role !== 'instructor') {
		throw error(403, 'Instructor access required');
	}

	try {
		const lessonData = await request.json();
		
		// Validate required fields
		if (!lessonData.title || !lessonData.course_id) {
			throw error(400, 'Title and course ID are required');
		}

		const lesson = await LessonService.create(lessonData);
		return json(lesson, { status: 201 });
	} catch (err) {
		console.error('Failed to create lesson:', err);
		if (err instanceof Error && err.message.includes('required')) {
			throw error(400, err.message);
		}
		throw error(500, 'Failed to create lesson');
	}
};