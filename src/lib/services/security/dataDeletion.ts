/**
 * Data Deletion Service
 * Handles user data deletion for privacy compliance (GDPR/CCPA)
 */

import { supabase } from '$lib/supabase';
import { auditLogger } from './auditLogger';

export interface DeletionRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletion_type: 'soft' | 'hard';
  requested_at: string;
  completed_at?: string;
  retention_period_days?: number;
  error_message?: string;
  confirmation_token?: string;
  confirmed_at?: string;
}

export interface DeletionSummary {
  profiles_deleted: number;
  courses_deleted: number;
  lessons_deleted: number;
  assessments_deleted: number;
  attempts_deleted: number;
  progress_deleted: number;
  enrollments_deleted: number;
  media_files_deleted: number;
  audit_logs_retained: number;
}

export class DataDeletionService {
  private static instance: DataDeletionService;

  private constructor() {}

  static getInstance(): DataDeletionService {
    if (!DataDeletionService.instance) {
      DataDeletionService.instance = new DataDeletionService();
    }
    return DataDeletionService.instance;
  }

  /**
   * Request data deletion for a user
   */
  async requestDataDeletion(
    userId: string,
    deletionType: 'soft' | 'hard' = 'soft',
    retentionPeriodDays: number = 30,
    request?: Request
  ): Promise<string> {
    try {
      // Generate confirmation token
      const confirmationToken = crypto.randomUUID();

      // Create deletion request record
      const deletionRequest: Omit<DeletionRequest, 'id'> = {
        user_id: userId,
        status: 'pending',
        deletion_type: deletionType,
        requested_at: new Date().toISOString(),
        retention_period_days: retentionPeriodDays,
        confirmation_token: confirmationToken
      };

      const { data, error } = await supabase
        .from('data_deletion_requests')
        .insert(deletionRequest)
        .select()
        .single();

      if (error) throw error;

      // Log the deletion request
      await auditLogger.logPrivacyAction(
        userId,
        'DATA_DELETION',
        { 
          deletion_type: deletionType,
          retention_period_days: retentionPeriodDays,
          request_id: data.id 
        },
        request
      );

      return data.id;
    } catch (error) {
      console.error('Failed to request data deletion:', error);
      throw new Error('Failed to request data deletion');
    }
  }

  /**
   * Confirm data deletion request
   */
  async confirmDataDeletion(
    requestId: string,
    confirmationToken: string,
    request?: Request
  ): Promise<void> {
    try {
      // Verify confirmation token
      const { data: deletionRequest, error: requestError } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('id', requestId)
        .eq('confirmation_token', confirmationToken)
        .eq('status', 'pending')
        .single();

      if (requestError || !deletionRequest) {
        throw new Error('Invalid confirmation token or request not found');
      }

      // Update request as confirmed
      await supabase
        .from('data_deletion_requests')
        .update({
          confirmed_at: new Date().toISOString(),
          status: 'processing'
        })
        .eq('id', requestId);

      // Log confirmation
      await auditLogger.logPrivacyAction(
        deletionRequest.user_id,
        'DATA_DELETION',
        { 
          action: 'confirmed',
          request_id: requestId 
        },
        request
      );

      // Start deletion process
      this.processDeletionRequest(requestId).catch(console.error);

    } catch (error) {
      console.error('Failed to confirm data deletion:', error);
      throw new Error('Failed to confirm data deletion');
    }
  }

  /**
   * Process data deletion request
   */
  private async processDeletionRequest(requestId: string): Promise<void> {
    try {
      // Get deletion request details
      const { data: deletionRequest, error: requestError } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !deletionRequest) {
        throw new Error('Deletion request not found');
      }

      let summary: DeletionSummary;

      if (deletionRequest.deletion_type === 'soft') {
        summary = await this.performSoftDeletion(deletionRequest.user_id);
      } else {
        summary = await this.performHardDeletion(deletionRequest.user_id);
      }

      // Update deletion request with completion details
      await supabase
        .from('data_deletion_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Log completion
      await auditLogger.logPrivacyAction(
        deletionRequest.user_id,
        'DATA_DELETION',
        { 
          action: 'completed',
          deletion_type: deletionRequest.deletion_type,
          summary,
          request_id: requestId 
        }
      );

    } catch (error) {
      console.error('Failed to process deletion request:', error);
      
      // Update status to failed
      await supabase
        .from('data_deletion_requests')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', requestId);
    }
  }

  /**
   * Perform soft deletion (anonymize data, keep for retention period)
   */
  private async performSoftDeletion(userId: string): Promise<DeletionSummary> {
    const summary: DeletionSummary = {
      profiles_deleted: 0,
      courses_deleted: 0,
      lessons_deleted: 0,
      assessments_deleted: 0,
      attempts_deleted: 0,
      progress_deleted: 0,
      enrollments_deleted: 0,
      media_files_deleted: 0,
      audit_logs_retained: 0
    };

    try {
      // Anonymize user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: `deleted-user-${userId}@example.com`,
          first_name: 'Deleted',
          last_name: 'User',
          avatar_url: null,
          learning_preferences: null,
          knowledge_profile: null,
          deleted_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (!profileError) summary.profiles_deleted = 1;

      // Mark courses as deleted (keep for analytics)
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('instructor_id', userId)
        .select('id');

      if (!coursesError && courses) {
        summary.courses_deleted = courses.length;

        // Mark associated lessons as deleted
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .update({ deleted_at: new Date().toISOString() })
          .in('course_id', courses.map(c => c.id))
          .select('id');

        if (!lessonsError && lessons) {
          summary.lessons_deleted = lessons.length;
        }
      }

      // Mark assessments as deleted
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .update({ deleted_at: new Date().toISOString() })
        .or(`lesson_id.in.(${courses?.map(c => c.id).join(',') || 'null'}),course_id.in.(${courses?.map(c => c.id).join(',') || 'null'})`)
        .select('id');

      if (!assessmentsError && assessments) {
        summary.assessments_deleted = assessments.length;
      }

      // Anonymize assessment attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('assessment_attempts')
        .update({ 
          student_id: null,
          anonymized_at: new Date().toISOString()
        })
        .eq('student_id', userId)
        .select('id');

      if (!attemptsError && attempts) {
        summary.attempts_deleted = attempts.length;
      }

      // Delete student progress
      const { data: progress, error: progressError } = await supabase
        .from('student_progress')
        .delete()
        .eq('student_id', userId)
        .select('id');

      if (!progressError && progress) {
        summary.progress_deleted = progress.length;
      }

      // Delete enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', userId)
        .select('id');

      if (!enrollmentsError && enrollments) {
        summary.enrollments_deleted = enrollments.length;
      }

      // Delete user media files
      const { data: mediaFiles } = await supabase.storage
        .from('media')
        .list(`users/${userId}`);

      if (mediaFiles && mediaFiles.length > 0) {
        const filePaths = mediaFiles.map(file => `users/${userId}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from('media')
          .remove(filePaths);

        if (!deleteError) {
          summary.media_files_deleted = mediaFiles.length;
        }
      }

      // Keep audit logs for compliance (anonymize user_id)
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .update({ 
          user_id: `anonymized-${userId}`,
          anonymized_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('id');

      if (!auditError && auditLogs) {
        summary.audit_logs_retained = auditLogs.length;
      }

      return summary;
    } catch (error) {
      console.error('Soft deletion failed:', error);
      throw error;
    }
  }

  /**
   * Perform hard deletion (permanently remove all data)
   */
  private async performHardDeletion(userId: string): Promise<DeletionSummary> {
    const summary: DeletionSummary = {
      profiles_deleted: 0,
      courses_deleted: 0,
      lessons_deleted: 0,
      assessments_deleted: 0,
      attempts_deleted: 0,
      progress_deleted: 0,
      enrollments_deleted: 0,
      media_files_deleted: 0,
      audit_logs_retained: 0
    };

    try {
      // Delete in reverse dependency order to avoid foreign key constraints

      // Delete student progress
      const { data: progress, error: progressError } = await supabase
        .from('student_progress')
        .delete()
        .eq('student_id', userId)
        .select('id');

      if (!progressError && progress) {
        summary.progress_deleted = progress.length;
      }

      // Delete enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', userId)
        .select('id');

      if (!enrollmentsError && enrollments) {
        summary.enrollments_deleted = enrollments.length;
      }

      // Delete assessment attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('assessment_attempts')
        .delete()
        .eq('student_id', userId)
        .select('id');

      if (!attemptsError && attempts) {
        summary.attempts_deleted = attempts.length;
      }

      // Get user's courses before deletion
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', userId);

      if (courses && courses.length > 0) {
        // Delete assessments
        const { data: assessments, error: assessmentsError } = await supabase
          .from('assessments')
          .delete()
          .or(`lesson_id.in.(${courses.map(c => c.id).join(',')}),course_id.in.(${courses.map(c => c.id).join(',')})`)
          .select('id');

        if (!assessmentsError && assessments) {
          summary.assessments_deleted = assessments.length;
        }

        // Delete lessons and content blocks (cascade)
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .delete()
          .in('course_id', courses.map(c => c.id))
          .select('id');

        if (!lessonsError && lessons) {
          summary.lessons_deleted = lessons.length;
        }

        // Delete courses
        const { error: coursesError } = await supabase
          .from('courses')
          .delete()
          .eq('instructor_id', userId);

        if (!coursesError) {
          summary.courses_deleted = courses.length;
        }
      }

      // Delete user media files
      const { data: mediaFiles } = await supabase.storage
        .from('media')
        .list(`users/${userId}`);

      if (mediaFiles && mediaFiles.length > 0) {
        const filePaths = mediaFiles.map(file => `users/${userId}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from('media')
          .remove(filePaths);

        if (!deleteError) {
          summary.media_files_deleted = mediaFiles.length;
        }
      }

      // Delete roadmaps
      await supabase
        .from('personalized_roadmaps')
        .delete()
        .eq('student_id', userId);

      // Keep minimal audit logs for compliance (anonymize)
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .update({ 
          user_id: `deleted-${Date.now()}`,
          details: { anonymized: true },
          anonymized_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('id');

      if (!auditError && auditLogs) {
        summary.audit_logs_retained = auditLogs.length;
      }

      // Finally, delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (!profileError) {
        summary.profiles_deleted = 1;
      }

      return summary;
    } catch (error) {
      console.error('Hard deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get deletion request status
   */
  async getDeletionStatus(requestId: string): Promise<DeletionRequest | null> {
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Failed to get deletion status:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user's deletion requests
   */
  async getUserDeletionRequests(userId: string): Promise<DeletionRequest[]> {
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Failed to get user deletion requests:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Cancel pending deletion request
   */
  async cancelDeletionRequest(requestId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('data_deletion_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Failed to cancel deletion request:', error);
      throw new Error('Failed to cancel deletion request');
    }
  }
}

export const dataDeletionService = DataDeletionService.getInstance();