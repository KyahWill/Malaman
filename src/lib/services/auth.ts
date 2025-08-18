import { supabase } from '$lib/supabase';
import type { AuthError, User } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '$lib/types';

export interface AuthCredentials {
	email: string;
	password: string;
}

export interface RegisterData extends AuthCredentials {
	firstName: string;
	lastName: string;
	role?: UserRole;
}

export interface ProfileUpdateData {
	first_name?: string;
	last_name?: string;
	avatar_url?: string;
	learning_preferences?: any;
	knowledge_profile?: any;
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
		try {
			console.log('Attempting to sign out user...');
			const { error } = await supabase.auth.signOut();
			
			if (error) {
				console.error('Supabase signOut error:', error);
			} else {
				console.log('Successfully signed out from Supabase');
			}
			
			return { error };
		} catch (err) {
			console.error('Unexpected error during signOut:', err);
			return { error: err as AuthError };
		}
	}

	/**
	 * Get the current session
	 */
	static async getSession() {
		const { data: { session }, error } = await supabase.auth.getSession();
		return { session, error };
	}

	/**
	 * Get user profile from database
	 */
	static async getProfile(userId: string): Promise<{ profile: UserProfile | null; error: any }> {
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', userId)
			.single();

		return { profile: data, error };
	}

	/**
	 * Update user profile
	 */
	static async updateProfile(userId: string, updates: ProfileUpdateData): Promise<{ profile: UserProfile | null; error: any }> {
		const { data, error } = await supabase
			.from('profiles')
			.update({ ...updates, updated_at: new Date().toISOString() })
			.eq('id', userId)
			.select()
			.single();

		return { profile: data, error };
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

	/**
	 * Check if user has required role
	 */
	static hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
		return requiredRoles.includes(userRole);
	}

	/**
	 * Check if user can access resource based on role
	 */
	static canAccess(userRole: UserRole, resourceType: 'student' | 'instructor' | 'admin'): boolean {
		const roleHierarchy: Record<UserRole, number> = {
			student: 1,
			instructor: 2,
			admin: 3
		};

		const requiredLevel = roleHierarchy[resourceType];
		const userLevel = roleHierarchy[userRole];

		return userLevel >= requiredLevel;
	}
}