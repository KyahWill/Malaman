/**
 * Course Management API Routes
 * Handles CRUD operations for courses
 */

import { json, error } from '@sveltejs/kit';
import { CourseService } from '$lib/services/database.js';
import type { RequestHandler } from './$types';

// GET /api/courses - List courses with optional filtering
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Authentication required');
		}

		const profile = locals.profile;
		if (!profile) {
			throw error(401, 'Profile not found');
		}

		const searchParams = url.searchParams;
		const instructorId = searchParams.get('instructor_id');
		const published = searchParams.get('published');
		const search = searchParams.get('search');
		const limit = parseInt(searchParams.get('limit') || '20');
		const offset = parseInt(searchParams.get('offset') || '0');

		let courses;

		if (search) {
			courses = await CourseService.search(search, limit);
		} else if (instructorId) {
			courses = await CourseService.getByInstructor(instructorId);
		} else if (published === 'true') {
			courses = await CourseService.getPublished(limit, offset);
		} else {
			// For admin users, return all courses
			if (profile.role === 'admin') {
				courses = await CourseService.getPublished(limit, offset);
			} else {
				// For instructors, return their courses
				courses = await CourseService.getByInstructor(user.id);
			}
		}

		return json({ courses });
	} catch (err) {
		console.error('Error fetching courses:', err);
		throw error(500, 'Failed to fetch courses');
	}
};

// POST /api/courses - Create new course
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Authentication required');
		}

		const profile = locals.profile;
		if (!profile || profile.role !== 'instructor') {
			throw error(403, 'Instructor access required');
		}

		const courseData = await request.json();
		
		// Validate required fields
		if (!courseData.title || !courseData.description) {
			throw error(400, 'Title and description are required');
		}

		// Set instructor ID and defaults
		const newCourse = {
			...courseData,
			instructor_id: user.id,
			is_published: false,
			tags: courseData.tags || [],
			difficulty_level: courseData.difficulty_level || 'beginner',
			estimated_duration: courseData.estimated_duration || 0
		};

		const course = await CourseService.create(newCourse);
		return json({ course }, { status: 201 });
	} catch (err) {
		console.error('Error creating course:', err);
		if (err instanceof Error && err.message.includes('required')) {
			throw error(400, err.message);
		}
		throw error(500, 'Failed to create course');
	}
};