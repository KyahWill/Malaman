import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase: Handle = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this server request.
	 * The Supabase client gets the Auth token from the request cookies.
	 */
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			/**
			 * SvelteKit's cookies API requires `path` to be explicitly set in
			 * the cookie options. Setting `path` to `/` replicates previous/
			 * standard behavior.
			 */
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Get user profile if authenticated
	if (session && user) {
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();
		
		event.locals.profile = profile;
	} else {
		event.locals.profile = null;
	}

	// Redirect authenticated users from index route
	if (user && event.url.pathname === '/') {
		const redirectPath = event.locals.profile?.role === 'instructor' ? '/dashboard/instructor' : '/dashboard/student';
		redirect(303, redirectPath);
	}

	// Protected routes that require authentication
	const protectedPaths = ['/dashboard', '/profile', '/courses', '/lessons', '/assessments'];
	const isProtectedPath = protectedPaths.some(path => event.url.pathname.startsWith(path));

	// Redirect unauthenticated users from protected routes
	if (!session && isProtectedPath) {
		redirect(303, '/auth/login');
	}

	// Redirect authenticated users from auth routes (except logout and reset-password)
	if (session && event.url.pathname.startsWith('/auth/')) {
		if (!event.url.pathname.includes('/logout') && !event.url.pathname.includes('/reset-password') && !event.url.pathname.includes('/confirm')) {
			// Redirect based on user role
			const redirectPath = event.locals.profile?.role === 'instructor' ? '/dashboard/instructor' : '/dashboard/student';
			redirect(303, redirectPath);
		}
	}

	// Redirect from generic dashboard to role-specific dashboard
	if (session && event.url.pathname === '/dashboard') {
		const redirectPath = event.locals.profile?.role === 'instructor' ? '/dashboard/instructor' : '/dashboard/student';
		redirect(303, redirectPath);
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard);