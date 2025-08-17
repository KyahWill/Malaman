import { requireAuth } from '$lib/middleware/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Require authentication for profile page
	const { user, profile } = await requireAuth(event);
	
	return {
		user,
		profile
	};
};