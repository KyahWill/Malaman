/**
 * Audit Logging Service
 * Tracks data access and modifications for compliance
 */

import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  session_id?: string;
}

export type AuditAction = 
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'ASSESSMENT_ATTEMPT'
  | 'GRADE_ASSIGNMENT'
  | 'ENROLL'
  | 'UNENROLL'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'DATA_EXPORT'
  | 'DATA_DELETION';

export class AuditLogger {
  private static instance: AuditLogger;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Don't throw error to avoid breaking main functionality
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any> = {},
    request?: Request
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'READ',
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: this.getClientIP(request),
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }

  /**
   * Log data modification
   */
  async logDataModification(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    resourceType: string,
    resourceId: string,
    changes: Record<string, any> = {},
    request?: Request
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: { changes },
      ip_address: this.getClientIP(request),
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }

  /**
   * Log authentication events
   */
  async logAuth(
    userId: string,
    action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE',
    details: Record<string, any> = {},
    request?: Request
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'auth',
      resource_id: userId,
      details,
      ip_address: this.getClientIP(request),
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }

  /**
   * Log privacy-related actions
   */
  async logPrivacyAction(
    userId: string,
    action: 'DATA_EXPORT' | 'DATA_DELETION',
    details: Record<string, any> = {},
    request?: Request
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'privacy',
      resource_id: userId,
      details,
      ip_address: this.getClientIP(request),
      user_agent: request?.headers.get('user-agent') || undefined
    });
  }

  /**
   * Get audit logs for a user (admin only)
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get audit logs for a resource (admin only)
   */
  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch resource audit logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());

    if (error) {
      console.error('Failed to cleanup old audit logs:', error);
    }
  }

  private getClientIP(request?: Request): string | undefined {
    if (!request) return undefined;
    
    // Check various headers for client IP
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip'
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        return value.split(',')[0].trim();
      }
    }

    return undefined;
  }
}

export const auditLogger = AuditLogger.getInstance();