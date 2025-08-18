import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session, profile } }) => {
	// Require authentication
	if (!session) {
		redirect(303, '/auth');
	}

	// Require instructor or admin role
	if (profile?.role !== 'instructor' && profile?.role !== 'admin') {
		redirect(303, '/unauthorized');
	}

	return {
		profile
	};
};