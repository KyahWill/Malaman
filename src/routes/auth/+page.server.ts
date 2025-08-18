import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	// Redirect authenticated users to dashboard
	if (session) {
		redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	signup: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;
		const role = (formData.get('role') as string) || 'student';

		if (!email || !password || !firstName || !lastName) {
			return {
				error: 'Please fill in all required fields'
			};
		}

		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					first_name: firstName,
					last_name: lastName,
					role
				}
			}
		});

		if (error) {
			console.error('Signup error:', error);
			return {
				error: error.message
			};
		}

		return {
			success: 'Please check your email to verify your account'
		};
	},

	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return {
				error: 'Please provide both email and password'
			};
		}

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			console.error('Login error:', error);
			return {
				error: error.message
			};
		}

		redirect(303, '/dashboard');
	},

	logout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		redirect(303, '/');
	},

	resetPassword: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return {
				error: 'Please provide your email address'
			};
		}

		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${new URL(request.url).origin}/auth/reset-password`
		});

		if (error) {
			console.error('Password reset error:', error);
			return {
				error: error.message
			};
		}

		return {
			success: 'Password reset email sent. Please check your inbox.'
		};
	}
};