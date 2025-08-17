import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '$lib/types';

interface AuthState {
	user: User | null;
	profile: UserProfile | null;
	loading: boolean;
	initialized: boolean;
}

const initialState: AuthState = {
	user: null,
	profile: null,
	loading: true,
	initialized: false
};

export const authStore = writable<AuthState>(initialState);

// Helper functions for auth store
export const authHelpers = {
	setUser: (user: User | null) => {
		authStore.update(state => ({ ...state, user, loading: false }));
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
	
	reset: () => {
		authStore.set(initialState);
	}
};