import { requireInstructor } from '$lib/middleware/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Require instructor role
	const { user, profile } = await requireInstructor(event);
	
	return {
		user,
		profile
	};
};