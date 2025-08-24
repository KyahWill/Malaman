/**
 * API endpoint for getting students enrolled in a course
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { supabase } from '$lib/supabase.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { id: courseId } = params;
    const currentUser = locals.session.user;

    // Authorization check - only instructors of the course or admins can view students
    if (currentUser.role === 'instructor') {
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();

      if (courseError) {
        throw error(404, 'Course not found');
      }

      if (course.instructor_id !== currentUser.id) {
        throw error(403, 'You can only view students from your own courses');
      }
    } else if (currentUser.role !== 'admin') {
      throw error(403, 'Insufficient permissions');
    }

    // Get enrolled students with their profile information
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        enrolled_at,
        completed_at,
        progress,
        profiles!enrollments_student_id_fkey (
          id,
          email,
          first_name,
          last_name,
          avatar_url,
          learning_preferences,
          knowledge_profile
        )
      `)
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false });

    if (enrollmentError) {
      throw error(500, 'Failed to fetch enrolled students');
    }

    // Transform the data to a more convenient format
    const students = enrollments?.map(enrollment => ({
      id: enrollment.profiles.id,
      email: enrollment.profiles.email,
      first_name: enrollment.profiles.first_name,
      last_name: enrollment.profiles.last_name,
      avatar_url: enrollment.profiles.avatar_url,
      learning_preferences: enrollment.profiles.learning_preferences,
      knowledge_profile: enrollment.profiles.knowledge_profile,
      enrollment: {
        enrolled_at: enrollment.enrolled_at,
        completed_at: enrollment.completed_at,
        progress: enrollment.progress
      }
    })) || [];

    return json({
      success: true,
      students,
      metadata: {
        courseId,
        totalStudents: students.length,
        completedStudents: students.filter(s => s.enrollment.completed_at).length
      }
    });

  } catch (err) {
    console.error('Failed to get course students:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, 'Failed to retrieve course students');
  }
};