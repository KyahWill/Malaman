/**
 * API endpoint for getting students enrolled in a course
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.session?.user) {
      throw error(401, 'Authentication required');
    }

    const { id: courseId } = params;

    // Verify the user is the instructor of this course or an admin
    const userRole = locals.session.user.user_metadata?.role || 'student';
    
    if (userRole !== 'admin') {
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('Failed to get course:', courseError);
        throw error(500, 'Failed to verify course access');
      }

      if (!course || course.instructor_id !== locals.session.user.id) {
        throw error(403, 'Access denied - you are not the instructor of this course');
      }
    }

    // Get enrolled students
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        enrolled_at,
        completed_at,
        progress,
        profiles!enrollments_student_id_fkey (
          id,
          first_name,
          last_name,
          email,
          learning_preferences,
          knowledge_profile
        )
      `)
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false });

    if (enrollmentsError) {
      console.error('Failed to get enrollments:', enrollmentsError);
      throw error(500, 'Failed to retrieve enrolled students');
    }

    // Transform the data to a more usable format
    const students = enrollments?.map(enrollment => ({
      id: enrollment.student_id,
      first_name: enrollment.profiles?.first_name || '',
      last_name: enrollment.profiles?.last_name || '',
      email: enrollment.profiles?.email || '',
      enrolled_at: enrollment.enrolled_at,
      completed_at: enrollment.completed_at,
      progress: enrollment.progress,
      learning_preferences: enrollment.profiles?.learning_preferences,
      knowledge_profile: enrollment.profiles?.knowledge_profile
    })) || [];

    return json({
      success: true,
      course_id: courseId,
      students,
      total_students: students.length
    });

  } catch (err) {
    console.error('Error getting course students:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    throw error(500, 'Failed to retrieve course students');
  }
};