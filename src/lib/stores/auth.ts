import { writable, derived } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '$lib/types';
import { supabase } from '$lib/supabase';
import { AuthService } from '$lib/services/auth';

interface AuthState {
	user: User | null;
	profile: UserProfile | null;
	loading: boolean;
	initialized: boolean;
	error: string | null;
}

const initialState: AuthState = {
	user: null,
	profile: null,
	loading: true,
	initialized: false,
	error: null
};

export const authStore = writable<AuthState>(initialState);

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const profile = derived(authStore, $auth => $auth.profile);
export const isAuthenticated = derived(authStore, $auth => !!$auth.user);
export const isLoading = derived(authStore, $auth => $auth.loading);
export const userRole = derived(authStore, $auth => $auth.profile?.role || null);

// Helper functions for auth store
export const authHelpers = {
	setUser: (user: User | null) => {
		authStore.update(state => ({ ...state, user, loading: false, error: null }));
	},
	
	setProfile: (profile: UserProfile | null) => {
		authStore.update(state => ({ ...state, profile }));
	},
	
	setLoading: (loading: boolean) => {
		authStore.update(state => ({ ...state, loading }));
	},
	
	setInitialized: (initialized: boolean) => {
		authStore.update(state => ({ ...state, initialized }));
	},
	
	setError: (error: string | null) => {
		authStore.update(state => ({ ...state, error, loading: false }));
	},
	
	reset: () => {
		authStore.set({ ...initialState, initialized: true });
	},

	// Initialize auth state
	initialize: async () => {
		try {
			authHelpers.setLoading(true);
			
			// Get current session
			const { session, error } = await AuthService.getSession();
			
			if (error) {
				console.error('Session error:', error);
				authHelpers.setError('Failed to get session');
				return;
			}

			if (session?.user) {
				authHelpers.setUser(session.user);
				
				// Get user profile
				const { profile, error: profileError } = await AuthService.getProfile(session.user.id);
				
				if (profileError) {
					console.error('Profile error:', profileError);
					authHelpers.setError('Failed to load profile');
				} else {
					authHelpers.setProfile(profile);
				}
			}
		} catch (error) {
			console.error('Auth initialization error:', error);
			authHelpers.setError('Authentication initialization failed');
		} finally {
			authHelpers.setLoading(false);
			authHelpers.setInitialized(true);
		}
	}
};

// Initialize auth state and listen for changes
if (typeof window !== 'undefined') {
	// Initialize on client side
	authHelpers.initialize();

	// Listen for auth state changes
	supabase.auth.onAuthStateChange(async (event, session) => {
		console.log('Auth state changed:', event, session?.user?.id);
		
		if (event === 'SIGNED_IN' && session?.user) {
			authHelpers.setUser(session.user);
			
			// Load user profile
			const { profile, error } = await AuthService.getProfile(session.user.id);
			if (error) {
				console.error('Failed to load profile:', error);
				authHelpers.setError('Failed to load user profile');
			} else {
				authHelpers.setProfile(profile);
			}
		} else if (event === 'SIGNED_OUT') {
			authHelpers.reset();
		} else if (event === 'TOKEN_REFRESHED' && session?.user) {
			authHelpers.setUser(session.user);
		}
	});
}