import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { AuthService } from '$lib/services/auth';
import type { UserRole } from '$lib/types';

export interface AuthMiddlewareOptions {
	requiredRoles?: UserRole[];
	redirectTo?: string;
	allowUnauthenticated?: boolean;
}

/**
 * Authentication middleware for protecting routes
 */
export async function requireAuth(
	event: RequestEvent,
	options: AuthMiddlewareOptions = {}
): Promise<{ user: any; profile: any }> {
	const {
		requiredRoles = [],
		redirectTo = '/auth/login',
		allowUnauthenticated = false
	} = options;

	// Get session from Supabase
	const { session, error } = await AuthService.getSession();

	// Handle session errors
	if (error) {
		console.error('Session error in middleware:', error);
		throw redirect(302, redirectTo);
	}

	// Check if user is authenticated
	if (!session?.user) {
		if (allowUnauthenticated) {
			return { user: null, profile: null };
		}
		throw redirect(302, redirectTo);
	}

	// Get user profile for role checking
	const { profile, error: profileError } = await AuthService.getProfile(session.user.id);

	if (profileError) {
		console.error('Profile error in middleware:', profileError);
		throw redirect(302, redirectTo);
	}

	// Check role requirements
	if (requiredRoles.length > 0 && profile) {
		const hasRequiredRole = AuthService.hasRole(profile.role, requiredRoles);
		if (!hasRequiredRole) {
			throw redirect(302, '/unauthorized');
		}
	}

	return { user: session.user, profile };
}

/**
 * Middleware for student-only routes
 */
export async function requireStudent(event: RequestEvent) {
	return requireAuth(event, { requiredRoles: ['student'] });
}

/**
 * Middleware for instructor-only routes
 */
export async function requireInstructor(event: RequestEvent) {
	return requireAuth(event, { requiredRoles: ['instructor', 'admin'] });
}

/**
 * Middleware for admin-only routes
 */
export async function requireAdmin(event: RequestEvent) {
	return requireAuth(event, { requiredRoles: ['admin'] });
}

/**
 * Middleware that allows both authenticated and unauthenticated users
 */
export async function optionalAuth(event: RequestEvent) {
	return requireAuth(event, { allowUnauthenticated: true });
}

/**
 * Check if current route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
	const protectedPaths = [
		'/dashboard',
		'/courses',
		'/lessons',
		'/assessments',
		'/profile'
	];

	return protectedPaths.some(path => pathname.startsWith(path));
}

/**
 * Check if current route is auth-related
 */
export function isAuthRoute(pathname: string): boolean {
	return pathname.startsWith('/auth/');
}