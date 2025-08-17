import { supabase } from '$lib/supabase';
import type { AuthError, User } from '@supabase/supabase-js';

export interface AuthCredentials {
	email: string;
	password: string;
}

export interface RegisterData extends AuthCredentials {
	firstName: string;
	lastName: string;
	role?: 'student' | 'instructor';
}

export class AuthService {
	/**
	 * Sign up a new user
	 */
	static async signUp(data: RegisterData): Promise<{ user: User | null; error: AuthError | null }> {
		const { email, password, firstName, lastName, role = 'student' } = data;
		
		const { data: authData, error } = await supabase.auth.signUp({
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

		return { user: authData.user, error };
	}

	/**
	 * Sign in an existing user
	 */
	static async signIn(credentials: AuthCredentials): Promise<{ user: User | null; error: AuthError | null }> {
		const { email, password } = credentials;
		
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		return { user: data.user, error };
	}

	/**
	 * Sign out the current user
	 */
	static async signOut(): Promise<{ error: AuthError | null }> {
		const { error } = await supabase.auth.signOut();
		return { error };
	}

	/**
	 * Get the current session
	 */
	static async getSession() {
		const { data: { session }, error } = await supabase.auth.getSession();
		return { session, error };
	}

	/**
	 * Reset password
	 */
	static async resetPassword(email: string): Promise<{ error: AuthError | null }> {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/auth/reset-password`
		});
		return { error };
	}

	/**
	 * Update password
	 */
	static async updatePassword(password: string): Promise<{ error: AuthError | null }> {
		const { error } = await supabase.auth.updateUser({ password });
		return { error };
	}
}