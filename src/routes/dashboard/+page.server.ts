import { redirect } from '@sveltejs/kit';
import { requireAuth } from '$lib/middleware/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Require authentication
	const { user, profile } = await requireAuth(event);
	
	// Redirect to role-specific dashboard
	if (profile?.role === 'instructor') {
		throw redirect(302, '/dashboard/instructor');
	} else if (profile?.role === 'admin') {
		throw redirect(302, '/dashboard/admin');
	} else {
		throw redirect(302, '/dashboard/student');
	}
};