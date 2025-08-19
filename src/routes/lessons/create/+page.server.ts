import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user, profile } = locals;

	// Check authentication
	if (!user || !profile) {
		throw redirect(302, '/auth/login');
	}

	// Check if user is an instructor
	if (profile.role !== 'instructor') {
		throw redirect(302, '/unauthorized');
	}

	// Get course ID from query parameters
	const courseId = url.searchParams.get('courseId');
	if (!courseId) {
		throw redirect(302, '/dashboard/instructor');
	}

	return {
		courseId
	};
};