/**
 * Course Analytics API Routes
 * Provides analytics data for course instructors
 */

import { json, error } from '@sveltejs/kit';
import { CourseService } from '$lib/services/database.js';
import { supabase } from '$lib/supabase.js';
import type { RequestHandler } from './$types';

// GET /api/courses/[id]/analytics - Get course analytics
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Authentication required');
		}

		const courseId = params.id;

		// Get course to check permissions
		const course = await CourseService.getById(courseId);
		if (!course) {
			throw error(404, 'Course not found');
		}

		const profile = locals.profile;
		if (!profile) {
			throw error(401, 'Profile not found');
		}

		// Check permissions - only instructor or admin can view analytics
		if (course.instructor_id !== user.id && profile.role !== 'admin') {
			throw error(403, 'Permission denied');
		}

		// Get enrollment statistics
		const { data: enrollmentStats, error: enrollmentError } = await supabase
			.from('enrollments')
			.select('id, enrolled_at, completed_at')
			.eq('course_id', courseId);

		if (enrollmentError) {
			throw enrollmentError;
		}

		// Get student progress statistics
		const { data: progressStats, error: progressError } = await supabase
			.from('student_progress')
			.select('student_id, status, completion_percentage, best_score')
			.eq('course_id', courseId);

		if (progressError) {
			throw progressError;
		}

		// Calculate analytics
		const totalEnrollments = enrollmentStats?.length || 0;
		const completedEnrollments = enrollmentStats?.filter(e => e.completed_at).length || 0;
		const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

		// Calculate average progress
		const avgProgress = progressStats?.length > 0 
			? progressStats.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / progressStats.length
			: 0;

		// Calculate average score
		const scoresWithValues = progressStats?.filter(p => p.best_score !== null) || [];
		const avgScore = scoresWithValues.length > 0
			? scoresWithValues.reduce((sum, p) => sum + (p.best_score || 0), 0) / scoresWithValues.length
			: 0;

		// Get recent enrollments (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const recentEnrollments = enrollmentStats?.filter(e => 
			new Date(e.enrolled_at) >= thirtyDaysAgo
		).length || 0;

		const analytics = {
			overview: {
				total_enrollments: totalEnrollments,
				completion_rate: Math.round(completionRate * 100) / 100,
				average_progress: Math.round(avgProgress * 100) / 100,
				average_score: Math.round(avgScore * 100) / 100,
				recent_enrollments: recentEnrollments
			},
			enrollments: {
				total: totalEnrollments,
				completed: completedEnrollments,
				in_progress: totalEnrollments - completedEnrollments,
				recent: recentEnrollments
			},
			progress: {
				not_started: progressStats?.filter(p => p.status === 'not_started').length || 0,
				in_progress: progressStats?.filter(p => p.status === 'in_progress').length || 0,
				completed: progressStats?.filter(p => p.status === 'completed').length || 0,
				blocked: progressStats?.filter(p => p.status === 'blocked').length || 0
			}
		};

		return json({ analytics });
	} catch (err) {
		console.error('Error fetching course analytics:', err);
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Course not found');
		}
		throw error(500, 'Failed to fetch course analytics');
	}
};