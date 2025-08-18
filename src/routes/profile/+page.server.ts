import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session, profile } }) => {
	// Require authentication for profile page
	if (!session) {
		redirect(303, '/auth');
	}
	
	return {
		profile
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals: { supabase, user } }) => {
		if (!user) {
			return {
				error: 'Not authenticated'
			};
		}

		const formData = await request.formData();
		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;

		if (!firstName || !lastName) {
			return {
				error: 'Please fill in all fields'
			};
		}

		const { error } = await supabase
			.from('profiles')
			.update({
				first_name: firstName,
				last_name: lastName,
				updated_at: new Date().toISOString()
			})
			.eq('id', user.id);

		if (error) {
			console.error('Profile update error:', error);
			return {
				error: 'Failed to update profile'
			};
		}

		return {
			success: 'Profile updated successfully'
		};
	}
};