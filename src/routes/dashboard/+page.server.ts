import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session, profile } }) => {
	// Require authentication
	if (!session) {
		redirect(303, '/auth');
	}
	
	// Redirect to role-specific dashboard
	if (profile?.role === 'instructor') {
		redirect(303, '/dashboard/instructor');
	} else if (profile?.role === 'admin') {
		redirect(303, '/dashboard/admin');
	} else {
		redirect(303, '/dashboard/student');
	}
};