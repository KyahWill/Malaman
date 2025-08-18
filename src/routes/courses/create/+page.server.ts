/**
 * Course Creation Page Server Logic
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const profile = locals.profile;
	if (!profile || profile.role !== 'instructor') {
		throw redirect(302, '/unauthorized');
	}

	return {
		user
	};
};