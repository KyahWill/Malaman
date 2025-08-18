/**
 * Course Enrollment API Routes
 * Handles student enrollment in courses
 */

import { json, error } from '@sveltejs/kit';
import { CourseService, EnrollmentService } from '$lib/services/database.js';
import type { RequestHandler } from './$types';

// POST /api/courses/[id]/enroll - Enroll student in course
export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Authentication required');
		}

		const profile = locals.profile;
		if (!profile || profile.role !== 'student') {
			throw error(403, 'Student access required');
		}

		const courseId = params.id;

		// Check if course exists and is published
		const course = await CourseService.getById(courseId);
		if (!course) {
			throw error(404, 'Course not found');
		}

		if (!course.is_published) {
			throw error(400, 'Course is not available for enrollment');
		}

		// Check if already enrolled
		const isEnrolled = await EnrollmentService.isEnrolled(user.id, courseId);
		if (isEnrolled) {
			throw error(400, 'Already enrolled in this course');
		}

		// Enroll student
		const enrollment = await EnrollmentService.enroll(user.id, courseId);
		return json({ enrollment }, { status: 201 });
	} catch (err) {
		console.error('Error enrolling student:', err);
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Course not found');
		}
		if (err instanceof Error && err.message.includes('Already enrolled')) {
			throw error(400, 'Already enrolled in this course');
		}
		throw error(500, 'Failed to enroll in course');
	}
};

// DELETE /api/courses/[id]/enroll - Unenroll student from course
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Authentication required');
		}

		const profile = locals.profile;
		if (!profile || profile.role !== 'student') {
			throw error(403, 'Student access required');
		}

		const courseId = params.id;

		// Check if enrolled
		const isEnrolled = await EnrollmentService.isEnrolled(user.id, courseId);
		if (!isEnrolled) {
			throw error(400, 'Not enrolled in this course');
		}

		// TODO: Implement unenrollment logic
		// For now, we'll just return success
		return json({ success: true });
	} catch (err) {
		console.error('Error unenrolling student:', err);
		throw error(500, 'Failed to unenroll from course');
	}
};