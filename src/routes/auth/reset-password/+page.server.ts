import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	// Only allow access if user has a session (from password reset link)
	if (!session) {
		redirect(303, '/auth');
	}
};

export const actions: Actions = {
	updatePassword: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!password || !confirmPassword) {
			return {
				error: 'Please fill in all fields'
			};
		}

		if (password !== confirmPassword) {
			return {
				error: 'Passwords do not match'
			};
		}

		if (password.length < 6) {
			return {
				error: 'Password must be at least 6 characters long'
			};
		}

		const { error } = await supabase.auth.updateUser({ password });

		if (error) {
			console.error('Password update error:', error);
			return {
				error: error.message
			};
		}

		return {
			success: 'Password updated successfully'
		};
	}
};