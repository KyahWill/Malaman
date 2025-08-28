import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.session) {
    throw redirect(302, '/auth');
  }

  // Check if user has admin role
  if (locals.session.user.role !== 'admin') {
    throw redirect(302, '/dashboard');
  }

  return {
    session: locals.session
  };
};