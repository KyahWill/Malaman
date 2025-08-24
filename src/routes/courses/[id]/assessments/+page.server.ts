
import { redirect } from '@sveltejs/kit';
import { AssessmentService, CourseService } from '$lib/services/database.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({params, locals, url }) => {
	const { user } = await locals.safeGetSession();
	
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	try {
    const courseId = params.id
		let course;
		const profile = locals.profile;
		if (!profile) {
			throw redirect(302, '/auth/login');
		}

		if (profile.role === 'instructor') {
			course = await CourseService.getById(courseId);
    }

		console.log(course)

    let assessments = await AssessmentService.getByCourse(courseId)

		return {
			course,
			assessments,
		};
	} catch (error) {
		console.error('Error loading courses:', error);
    throw error
	}
};
