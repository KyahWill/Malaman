import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session, profile } }) => {
	// Require authentication
	if (!session) {
		redirect(303, '/auth');
	}

	console.log(profile?.role)

	// Require student role
	if (profile?.role !== 'student') {
		redirect(303, '/unauthorized');
	}

	return {
		profile
	};
};