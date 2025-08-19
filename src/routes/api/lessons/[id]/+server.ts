import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LessonService } from '$lib/services/database.js';

export const GET: RequestHandler = async ({ locals, params }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	try {
		const lessonId = params.id;
		const lesson = await LessonService.getById(lessonId);

		if (!lesson) {
			throw error(404, 'Lesson not found');
		}

		return json(lesson);
	} catch (err) {
		console.error('Failed to fetch lesson:', err);
		throw error(500, 'Failed to fetch lesson');
	}
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	if (profile.role !== 'instructor') {
		throw error(403, 'Instructor access required');
	}

	try {
		const lessonId = params.id;
		const updates = await request.json();

		// Check if lesson exists
		const existingLesson = await LessonService.getById(lessonId);
		if (!existingLesson) {
			throw error(404, 'Lesson not found');
		}

		// TODO: Add ownership check - verify instructor owns the course

		const updatedLesson = await LessonService.update(lessonId, updates);
		return json(updatedLesson);
	} catch (err) {
		console.error('Failed to update lesson:', err);
		throw error(500, 'Failed to update lesson');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	if (profile.role !== 'instructor') {
		throw error(403, 'Instructor access required');
	}

	try {
		const lessonId = params.id;

		// Check if lesson exists
		const existingLesson = await LessonService.getById(lessonId);
		if (!existingLesson) {
			throw error(404, 'Lesson not found');
		}

		// TODO: Add ownership check - verify instructor owns the course

		await LessonService.delete(lessonId);
		return json({ success: true });
	} catch (err) {
		console.error('Failed to delete lesson:', err);
		throw error(500, 'Failed to delete lesson');
	}
};