import { redirect } from '@sveltejs/kit';
import { AuthService } from '$lib/services/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// Sign out the user
	await AuthService.signOut();
	
	// Clear any additional cookies if needed
	cookies.delete('session', { path: '/' });
	
	// Redirect to home page
	throw redirect(302, '/');
};