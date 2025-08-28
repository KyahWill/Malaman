/**
 * Data Export Service
 * Handles user data export for privacy compliance (GDPR/CCPA)
 */

import { supabase } from '$lib/supabase';
import { auditLogger } from './auditLogger';
import type { User } from '@supabase/supabase-js';

export interface UserDataExport {
  user_profile: any;
  courses: any[];
  lessons: any[];
  assessments: any[];
  assessment_attempts: any[];
  progress: any[];
  roadmaps: any[];
  enrollments: any[];
  audit_logs: any[];
  media_files: any[];
  export_metadata: {
    exported_at: string;
    export_format: string;
    data_version: string;
  };
}

export interface ExportRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'json' | 'csv' | 'xml';
  requested_at: string;
  completed_at?: string;
  download_url?: string;
  expires_at?: string;
  error_message?: string;
}

export class DataExportService {
  private static instance: DataExportService;

  private constructor() {}

  static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  /**
   * Request data export for a user
   */
  async requestDataExport(
    userId: string,
    format: 'json' | 'csv' | 'xml' = 'json',
    request?: Request
  ): Promise<string> {
    try {
      // Create export request record
      const exportRequest: Omit<ExportRequest, 'id'> = {
        user_id: userId,
        status: 'pending',
        format,
        requested_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('data_export_requests')
        .insert(exportRequest)
        .select()
        .single();

      if (error) throw error;

      // Log the export request
      await auditLogger.logPrivacyAction(
        userId,
        'DATA_EXPORT',
        { format, request_id: data.id },
        request
      );

      // Start background processing (in a real app, this would be a queue job)
      this.processExportRequest(data.id).catch(console.error);

      return data.id;
    } catch (error) {
      console.error('Failed to request data export:', error);
      throw new Error('Failed to request data export');
    }
  }

  /**
   * Process data export request
   */
  private async processExportRequest(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('data_export_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Get export request details
      const { data: exportRequest, error: requestError } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !exportRequest) {
        throw new Error('Export request not found');
      }

      // Export user data
      const userData = await this.exportUserData(exportRequest.user_id);
      
      // Generate file based on format
      let fileContent: string;
      let mimeType: string;
      let fileExtension: string;

      switch (exportRequest.format) {
        case 'json':
          fileContent = JSON.stringify(userData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        case 'csv':
          fileContent = this.convertToCSV(userData);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'xml':
          fileContent = this.convertToXML(userData);
          mimeType = 'application/xml';
          fileExtension = 'xml';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Upload file to storage
      const fileName = `data-export-${exportRequest.user_id}-${Date.now()}.${fileExtension}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('data-exports')
        .upload(fileName, fileContent, {
          contentType: mimeType,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Generate signed URL (expires in 7 days)
      const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
      const { data: urlData, error: urlError } = await supabase.storage
        .from('data-exports')
        .createSignedUrl(fileName, expiresIn);

      if (urlError) throw urlError;

      // Update export request with completion details
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          download_url: urlData.signedUrl,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', requestId);

    } catch (error) {
      console.error('Failed to process export request:', error);
      
      // Update status to failed
      await supabase
        .from('data_export_requests')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', requestId);
    }
  }

  /**
   * Export all user data
   */
  private async exportUserData(userId: string): Promise<UserDataExport> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get user's courses (as instructor)
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', userId);

      // Get user's lessons (as instructor)
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*, content_blocks(*)')
        .in('course_id', courses?.map(c => c.id) || []);

      // Get user's assessments (as instructor)
      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .or(`lesson_id.in.(${lessons?.map(l => l.id).join(',') || 'null'}),course_id.in.(${courses?.map(c => c.id).join(',') || 'null'})`);

      // Get user's assessment attempts (as student)
      const { data: attempts } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('student_id', userId);

      // Get user's progress
      const { data: progress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', userId);

      // Get user's roadmaps
      const { data: roadmaps } = await supabase
        .from('personalized_roadmaps')
        .select('*')
        .eq('student_id', userId);

      // Get user's enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', userId);

      // Get user's audit logs (last 1000 entries)
      const auditLogs = await auditLogger.getUserAuditLogs(userId, 1000);

      // Get user's media files
      const { data: mediaFiles } = await supabase.storage
        .from('media')
        .list(`users/${userId}`, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      return {
        user_profile: profile,
        courses: courses || [],
        lessons: lessons || [],
        assessments: assessments || [],
        assessment_attempts: attempts || [],
        progress: progress || [],
        roadmaps: roadmaps || [],
        enrollments: enrollments || [],
        audit_logs: auditLogs,
        media_files: mediaFiles || [],
        export_metadata: {
          exported_at: new Date().toISOString(),
          export_format: 'complete',
          data_version: '1.0'
        }
      };
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Get export request status
   */
  async getExportStatus(requestId: string): Promise<ExportRequest | null> {
    const { data, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Failed to get export status:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user's export requests
   */
  async getUserExportRequests(userId: string): Promise<ExportRequest[]> {
    const { data, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Failed to get user export requests:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: UserDataExport): string {
    const sections = [
      { name: 'Profile', data: [data.user_profile] },
      { name: 'Courses', data: data.courses },
      { name: 'Lessons', data: data.lessons },
      { name: 'Assessments', data: data.assessments },
      { name: 'Assessment Attempts', data: data.assessment_attempts },
      { name: 'Progress', data: data.progress },
      { name: 'Enrollments', data: data.enrollments }
    ];

    let csv = '';
    
    for (const section of sections) {
      if (section.data.length > 0) {
        csv += `\n${section.name}\n`;
        const headers = Object.keys(section.data[0]);
        csv += headers.join(',') + '\n';
        
        for (const row of section.data) {
          const values = headers.map(header => {
            const value = row[header];
            if (typeof value === 'object') {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            return `"${String(value).replace(/"/g, '""')}"`;
          });
          csv += values.join(',') + '\n';
        }
      }
    }

    return csv;
  }

  /**
   * Convert data to XML format
   */
  private convertToXML(data: UserDataExport): string {
    const escapeXML = (str: string) => {
      return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case "'": return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    const objectToXML = (obj: any, indent = ''): string => {
      let xml = '';
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          xml += `${indent}<${key}>\n`;
          for (const item of value) {
            xml += `${indent}  <item>\n`;
            xml += objectToXML(item, indent + '    ');
            xml += `${indent}  </item>\n`;
          }
          xml += `${indent}</${key}>\n`;
        } else if (typeof value === 'object' && value !== null) {
          xml += `${indent}<${key}>\n`;
          xml += objectToXML(value, indent + '  ');
          xml += `${indent}</${key}>\n`;
        } else {
          xml += `${indent}<${key}>${escapeXML(String(value))}</${key}>\n`;
        }
      }
      return xml;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n<user_data>\n${objectToXML(data, '  ')}</user_data>`;
  }
}

export const dataExportService = DataExportService.getInstance();