import { requireStudent } from '$lib/middleware/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Require student role
	const { user, profile } = await requireStudent(event);
	
	return {
		user,
		profile
	};
};