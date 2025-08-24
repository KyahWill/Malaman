/**
 * Student Performance API for Courses
 * Provides detailed student performance data for instructors
 */

import { json, error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase.js';
import { CourseService } from '$lib/services/database.js';
import type { RequestHandler } from './$types';

// GET /api/courses/[id]/students/performance - Get student performance data for a course
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Authentication required');
		}

		const profile = locals.profile;
		if (!profile) {
			throw error(401, 'Profile not found');
		}

		const courseId = params.id;

		// Get course to check permissions
		const course = await CourseService.getById(courseId);
		if (!course) {
			throw error(404, 'Course not found');
		}

		// Check permissions - only instructor or admin can view student performance
		if (course.instructor_id !== user.id && profile.role !== 'admin') {
			throw error(403, 'Permission denied');
		}

		// Get enrolled students with their progress data
		const { data: enrollments, error: enrollmentError } = await supabase
			.from('enrollments')
			.select(`
				id,
				enrolled_at,
				completed_at,
				progress,
				profiles!inner(
					id,
					first_name,
					last_name,
					email,
					avatar_url
				)
			`)
			.eq('course_id', courseId);

		if (enrollmentError) {
			throw enrollmentError;
		}

		// Get student progress data
		const studentIds = enrollments?.map(e => e.profiles.id) || [];
		
		const [progressData, assessmentData, activityData] = await Promise.all([
			// Get progress data
			supabase
				.from('student_progress')
				.select('*')
				.eq('course_id', courseId)
				.in('student_id', studentIds),
			
			// Get assessment attempts
			supabase
				.from('assessment_attempts')
				.select(`
					*,
					assessments!inner(course_id)
				`)
				.eq('assessments.course_id', courseId)
				.in('student_id', studentIds),
			
			// Get recent activity (mock for now - would need actual activity tracking)
			Promise.resolve({ data: [], error: null })
		]);

		if (progressData.error) throw progressData.error;
		if (assessmentData.error) throw assessmentData.error;

		// Get total assessments for this course
		const { data: courseAssessments } = await supabase
			.from('assessments')
			.select('id')
			.eq('course_id', courseId);

		const totalCourseAssessments = courseAssessments?.length || 0;

		// Process student data
		const students = enrollments?.map(enrollment => {
			const student = enrollment.profiles;
			const studentProgress = progressData.data?.filter(p => p.student_id === student.id) || [];
			const studentAssessments = assessmentData.data?.filter(a => a.student_id === student.id) || [];

			// Calculate overall progress
			const overallProgress = studentProgress.length > 0
				? studentProgress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / studentProgress.length
				: 0;

			// Calculate average score
			const passedAssessments = studentAssessments.filter(a => a.passed);
			const averageScore = studentAssessments.length > 0
				? studentAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / studentAssessments.length
				: 0;

			// Determine status
			const lastActivity = studentProgress.length > 0
				? Math.max(...studentProgress.map(p => new Date(p.last_accessed).getTime()))
				: new Date(enrollment.enrolled_at).getTime();
			
			const weekAgo = new Date();
			weekAgo.setDate(weekAgo.getDate() - 7);
			
			let status = 'active';
			if (overallProgress >= 100) {
				status = 'completed';
			} else if (lastActivity < weekAgo.getTime()) {
				status = 'inactive';
			} else if (averageScore < 60 || overallProgress < 20) {
				status = 'struggling';
			}

			const completedAssessments = new Set(studentAssessments.map(a => a.assessment_id)).size;

			return {
				id: student.id,
				name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student',
				email: student.email,
				avatar_url: student.avatar_url,
				enrolled_at: enrollment.enrolled_at,
				completed_at: enrollment.completed_at,
				completion_percentage: overallProgress,
				average_score: averageScore,
				status,
				last_activity: new Date(lastActivity).toISOString(),
				total_assessments: totalCourseAssessments,
				completed_assessments: completedAssessments,
				recent_activity: [] // Would be populated with actual activity tracking
			};
		}) || [];

		return json({ students });
	} catch (err) {
		console.error('Error fetching student performance data:', err);
		
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Course not found');
		}
		
		throw error(500, 'Failed to fetch student performance data');
	}
};