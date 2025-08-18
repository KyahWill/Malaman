/**
 * Course Detail Page Server Logic
 */

import { error, redirect } from '@sveltejs/kit';
import { CourseService, EnrollmentService } from '$lib/services/database.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	try {
		const courseId = params.id;
		
		const profile = locals.profile;
		if (!profile) {
			throw redirect(302, '/auth/login');
		}
		
		// Get course with details
		const studentId = profile.role === 'student' ? user.id : undefined;
		const course = await CourseService.getWithDetails(courseId, studentId);
		
		if (!course) {
			throw error(404, 'Course not found');
		}

		// Check access permissions
		if (!course.is_published && course.instructor_id !== user.id && profile.role !== 'admin') {
			throw error(403, 'Access denied');
		}

		// Get enrollment status for students
		let isEnrolled = false;
		if (profile.role === 'student') {
			isEnrolled = await EnrollmentService.isEnrolled(user.id, courseId);
		}

		// Get analytics for instructors
		let analytics = null;
		if ((course.instructor_id === user.id || profile.role === 'admin') && course.is_published) {
			try {
				const response = await fetch(`${process.env.ORIGIN || 'http://localhost:5173'}/api/courses/${courseId}/analytics`, {
					headers: {
						'Authorization': `Bearer ${locals.session?.access_token}`
					}
				});
				if (response.ok) {
					const data = await response.json();
					analytics = data.analytics;
				}
			} catch (err) {
				console.error('Error fetching analytics:', err);
			}
		}

		return {
			course,
			isEnrolled,
			analytics,
			userRole: profile.role,
			userId: user.id
		};
	} catch (err) {
		console.error('Error loading course:', err);
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Course not found');
		}
		throw error(500, 'Failed to load course');
	}
};