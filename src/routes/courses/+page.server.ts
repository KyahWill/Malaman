/**
 * Course Listing Page Server Logic
 */

import { redirect } from '@sveltejs/kit';
import { CourseService } from '$lib/services/database.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();
	
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	try {
		const searchQuery = url.searchParams.get('search') || '';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = 12;
		const offset = (page - 1) * limit;

		let courses;
		const profile = locals.profile;
		if (!profile) {
			throw redirect(302, '/auth/login');
		}

		if (profile.role === 'instructor') {
			// Instructors see their own courses
			courses = await CourseService.getByInstructor(user.id);
		} else if (profile.role === 'student') {
			// Students see published courses
			if (searchQuery) {
				courses = await CourseService.search(searchQuery, limit);
			} else {
				courses = await CourseService.getPublished(limit, offset);
			}
		} else {
			// Admins see all courses
			courses = await CourseService.getPublished(limit, offset);
		}

		return {
			courses,
			searchQuery,
			currentPage: page,
			userRole: profile.role
		};
	} catch (error) {
		console.error('Error loading courses:', error);
		return {
			courses: [],
			searchQuery: '',
			currentPage: 1,
			userRole: locals.profile?.role || 'student',
			error: 'Failed to load courses'
		};
	}
};