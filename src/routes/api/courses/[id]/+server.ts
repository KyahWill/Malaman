/**
 * Individual Course API Routes
 * Handles operations for specific courses
 */

import { json, error } from '@sveltejs/kit';
import { CourseService, EnrollmentService } from '$lib/services/database.js';
import type { RequestHandler } from './$types';

// GET /api/courses/[id] - Get course details
export const GET: RequestHandler = async ({ params, url, locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Authentication required');
		}

		const courseId = params.id;
		const includeDetails = url.searchParams.get('details') === 'true';

		const profile = locals.profile;
		if (!profile) {
			throw error(401, 'Profile not found');
		}

		let course;
		if (includeDetails) {
			// Include enrollment status for students
			const studentId = profile.role === 'student' ? user.id : undefined;
			course = await CourseService.getWithDetails(courseId, studentId);
		} else {
			course = await CourseService.getById(courseId);
		}

		if (!course) {
			throw error(404, 'Course not found');
		}

		// Check access permissions
		if (!course.is_published && course.instructor_id !== user.id && profile.role !== 'admin') {
			throw error(403, 'Access denied');
		}

		return json({ course });
	} catch (err) {
		console.error('Error fetching course:', err);
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Course not found');
		}
		throw error(500, 'Failed to fetch course');
	}
};

// PUT /api/courses/[id] - Update course
export const PUT: RequestHandler = async ({ params, request, locals }) => {
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
		const updates = await request.json();

		// Get existing course to check permissions
		const existingCourse = await CourseService.getById(courseId);
		if (!existingCourse) {
			throw error(404, 'Course not found');
		}

		// Check permissions
		if (existingCourse.instructor_id !== user.id && profile.role !== 'admin') {
			throw error(403, 'Permission denied');
		}

		// Don't allow changing instructor_id through this endpoint
		delete updates.instructor_id;

		const course = await CourseService.update(courseId, updates);
		return json({ course });
	} catch (err) {
		console.error('Error updating course:', err);
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Course not found');
		}
		throw error(500, 'Failed to update course');
	}
};

// DELETE /api/courses/[id] - Delete course
export const DELETE: RequestHandler = async ({ params, locals }) => {
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

		// Get existing course to check permissions
		const existingCourse = await CourseService.getById(courseId);
		if (!existingCourse) {
			throw error(404, 'Course not found');
		}

		// Check permissions
		if (existingCourse.instructor_id !== user.id && profile.role !== 'admin') {
			throw error(403, 'Permission denied');
		}

		await CourseService.delete(courseId);
		return json({ success: true });
	} catch (err) {
		console.error('Error deleting course:', err);
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Course not found');
		}
		throw error(500, 'Failed to delete course');
	}
};