import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			profile: Database['public']['Tables']['profiles']['Row'] | null;
		}
		interface PageData {
			session: Session | null;
			user: User | null;
			profile: Database['public']['Tables']['profiles']['Row'] | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
