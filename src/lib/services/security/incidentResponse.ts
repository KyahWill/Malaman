/**
 * Security Incident Response Service
 * Handles security incident detection, reporting, and response procedures
 */

import { supabase } from '$lib/supabase';
import { auditLogger } from './auditLogger';

export interface SecurityIncident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  affected_users: string[];
  affected_resources: string[];
  detected_at: string;
  reported_by?: string;
  status: IncidentStatus;
  response_actions: ResponseAction[];
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export type IncidentType = 
  | 'data_breach'
  | 'unauthorized_access'
  | 'system_compromise'
  | 'malware_detection'
  | 'ddos_attack'
  | 'phishing_attempt'
  | 'insider_threat'
  | 'data_corruption'
  | 'service_disruption'
  | 'privacy_violation'
  | 'compliance_breach';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 
  | 'detected'
  | 'investigating'
  | 'contained'
  | 'mitigated'
  | 'resolved'
  | 'closed';

export interface ResponseAction {
  id: string;
  action_type: string;
  description: string;
  taken_by: string;
  taken_at: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
}

export interface IncidentNotification {
  id: string;
  incident_id: string;
  notification_type: 'internal' | 'user' | 'regulatory' | 'public';
  recipients: string[];
  subject: string;
  message: string;
  sent_at: string;
  delivery_status: 'pending' | 'sent' | 'failed';
}

export class IncidentResponseService {
  private static instance: IncidentResponseService;

  private constructor() {}

  static getInstance(): IncidentResponseService {
    if (!IncidentResponseService.instance) {
      IncidentResponseService.instance = new IncidentResponseService();
    }
    return IncidentResponseService.instance;
  }

  /**
   * Report a security incident
   */
  async reportIncident(
    type: IncidentType,
    severity: IncidentSeverity,
    title: string,
    description: string,
    affectedUsers: string[] = [],
    affectedResources: string[] = [],
    reportedBy?: string
  ): Promise<string> {
    try {
      const incident: Omit<SecurityIncident, 'id' | 'created_at' | 'updated_at'> = {
        type,
        severity,
        title,
        description,
        affected_users: affectedUsers,
        affected_resources: affectedResources,
        detected_at: new Date().toISOString(),
        reported_by: reportedBy,
        status: 'detected',
        response_actions: []
      };

      const { data, error } = await supabase
        .from('security_incidents')
        .insert(incident)
        .select()
        .single();

      if (error) throw error;

      // Log the incident report
      await auditLogger.log({
        user_id: reportedBy || 'system',
        action: 'CREATE',
        resource_type: 'security_incident',
        resource_id: data.id,
        details: { type, severity, title }
      });

      // Trigger automatic response based on severity
      await this.triggerAutomaticResponse(data.id, severity);

      // Send notifications
      await this.sendIncidentNotifications(data.id);

      return data.id;
    } catch (error) {
      console.error('Failed to report security incident:', error);
      throw new Error('Failed to report security incident');
    }
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
    resolutionNotes?: string,
    updatedBy?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        if (resolutionNotes) {
          updateData.resolution_notes = resolutionNotes;
        }
      }

      const { error } = await supabase
        .from('security_incidents')
        .update(updateData)
        .eq('id', incidentId);

      if (error) throw error;

      // Log the status update
      await auditLogger.log({
        user_id: updatedBy || 'system',
        action: 'UPDATE',
        resource_type: 'security_incident',
        resource_id: incidentId,
        details: { status, resolution_notes: resolutionNotes }
      });

      // Send status update notifications
      if (status === 'resolved' || status === 'closed') {
        await this.sendResolutionNotifications(incidentId);
      }
    } catch (error) {
      console.error('Failed to update incident status:', error);
      throw new Error('Failed to update incident status');
    }
  }

  /**
   * Add response action to incident
   */
  async addResponseAction(
    incidentId: string,
    actionType: string,
    description: string,
    takenBy: string,
    status: 'pending' | 'completed' | 'failed' = 'completed',
    notes?: string
  ): Promise<void> {
    try {
      const action: ResponseAction = {
        id: crypto.randomUUID(),
        action_type: actionType,
        description,
        taken_by: takenBy,
        taken_at: new Date().toISOString(),
        status,
        notes
      };

      // Get current incident
      const { data: incident, error: fetchError } = await supabase
        .from('security_incidents')
        .select('response_actions')
        .eq('id', incidentId)
        .single();

      if (fetchError) throw fetchError;

      // Add new action to existing actions
      const updatedActions = [...(incident.response_actions || []), action];

      const { error } = await supabase
        .from('security_incidents')
        .update({ 
          response_actions: updatedActions,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      if (error) throw error;

      // Log the response action
      await auditLogger.log({
        user_id: takenBy,
        action: 'UPDATE',
        resource_type: 'security_incident',
        resource_id: incidentId,
        details: { action_type: actionType, description, status }
      });
    } catch (error) {
      console.error('Failed to add response action:', error);
      throw new Error('Failed to add response action');
    }
  }

  /**
   * Get incident details
   */
  async getIncident(incidentId: string): Promise<SecurityIncident | null> {
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('id', incidentId)
      .single();

    if (error) {
      console.error('Failed to get incident:', error);
      return null;
    }

    return data;
  }

  /**
   * List incidents with filters
   */
  async listIncidents(
    filters: {
      type?: IncidentType;
      severity?: IncidentSeverity;
      status?: IncidentStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SecurityIncident[]> {
    let query = supabase
      .from('security_incidents')
      .select('*')
      .order('detected_at', { ascending: false });

    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to list incidents:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Trigger automatic response based on incident severity
   */
  private async triggerAutomaticResponse(incidentId: string, severity: IncidentSeverity): Promise<void> {
    try {
      const responses: { [key in IncidentSeverity]: string[] } = {
        low: ['log_incident', 'notify_security_team'],
        medium: ['log_incident', 'notify_security_team', 'escalate_to_manager'],
        high: ['log_incident', 'notify_security_team', 'escalate_to_manager', 'notify_affected_users'],
        critical: ['log_incident', 'notify_security_team', 'escalate_to_manager', 'notify_affected_users', 'activate_incident_response_team', 'consider_system_lockdown']
      };

      const actions = responses[severity];

      for (const actionType of actions) {
        await this.addResponseAction(
          incidentId,
          actionType,
          `Automatic response action for ${severity} severity incident`,
          'system',
          'completed'
        );
      }

      // Update incident status to investigating
      await this.updateIncidentStatus(incidentId, 'investigating', undefined, 'system');
    } catch (error) {
      console.error('Failed to trigger automatic response:', error);
    }
  }

  /**
   * Send incident notifications
   */
  private async sendIncidentNotifications(incidentId: string): Promise<void> {
    try {
      const incident = await this.getIncident(incidentId);
      if (!incident) return;

      // Internal notification to security team
      await this.sendNotification(incidentId, {
        type: 'internal',
        recipients: ['security-team@company.com'],
        subject: `Security Incident Detected: ${incident.title}`,
        message: `A ${incident.severity} severity ${incident.type} incident has been detected.\n\nDescription: ${incident.description}\n\nIncident ID: ${incidentId}`
      });

      // High/Critical incidents require immediate escalation
      if (incident.severity === 'high' || incident.severity === 'critical') {
        await this.sendNotification(incidentId, {
          type: 'internal',
          recipients: ['management@company.com', 'legal@company.com'],
          subject: `URGENT: ${incident.severity.toUpperCase()} Security Incident`,
          message: `A ${incident.severity} severity security incident requires immediate attention.\n\nType: ${incident.type}\nTitle: ${incident.title}\nDescription: ${incident.description}\n\nIncident ID: ${incidentId}`
        });
      }

      // Notify affected users for data breaches or privacy violations
      if (incident.type === 'data_breach' || incident.type === 'privacy_violation') {
        if (incident.affected_users.length > 0) {
          await this.sendNotification(incidentId, {
            type: 'user',
            recipients: incident.affected_users,
            subject: 'Important Security Notice',
            message: 'We are writing to inform you of a security incident that may have affected your account. We are taking immediate action to address this issue and will provide updates as they become available.'
          });
        }
      }
    } catch (error) {
      console.error('Failed to send incident notifications:', error);
    }
  }

  /**
   * Send resolution notifications
   */
  private async sendResolutionNotifications(incidentId: string): Promise<void> {
    try {
      const incident = await this.getIncident(incidentId);
      if (!incident) return;

      // Internal notification
      await this.sendNotification(incidentId, {
        type: 'internal',
        recipients: ['security-team@company.com'],
        subject: `Security Incident Resolved: ${incident.title}`,
        message: `The security incident has been resolved.\n\nIncident ID: ${incidentId}\nResolution: ${incident.resolution_notes || 'No additional notes'}`
      });

      // Notify affected users if they were previously notified
      if (incident.affected_users.length > 0 && (incident.type === 'data_breach' || incident.type === 'privacy_violation')) {
        await this.sendNotification(incidentId, {
          type: 'user',
          recipients: incident.affected_users,
          subject: 'Security Incident Update - Resolved',
          message: 'We are writing to inform you that the security incident we previously notified you about has been resolved. We have taken steps to prevent similar incidents in the future.'
        });
      }
    } catch (error) {
      console.error('Failed to send resolution notifications:', error);
    }
  }

  /**
   * Send notification (placeholder - would integrate with email service)
   */
  private async sendNotification(
    incidentId: string,
    notification: {
      type: 'internal' | 'user' | 'regulatory' | 'public';
      recipients: string[];
      subject: string;
      message: string;
    }
  ): Promise<void> {
    try {
      const notificationRecord: Omit<IncidentNotification, 'id'> = {
        incident_id: incidentId,
        notification_type: notification.type,
        recipients: notification.recipients,
        subject: notification.subject,
        message: notification.message,
        sent_at: new Date().toISOString(),
        delivery_status: 'sent' // In real implementation, this would be 'pending' initially
      };

      const { error } = await supabase
        .from('incident_notifications')
        .insert(notificationRecord);

      if (error) {
        console.error('Failed to record notification:', error);
      }

      // In a real implementation, this would integrate with an email service
      console.log(`Notification sent: ${notification.subject} to ${notification.recipients.join(', ')}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Generate incident report
   */
  async generateIncidentReport(incidentId: string): Promise<string> {
    try {
      const incident = await this.getIncident(incidentId);
      if (!incident) throw new Error('Incident not found');

      const report = `
SECURITY INCIDENT REPORT
========================

Incident ID: ${incident.id}
Type: ${incident.type}
Severity: ${incident.severity}
Status: ${incident.status}

Title: ${incident.title}
Description: ${incident.description}

Timeline:
- Detected: ${incident.detected_at}
- Resolved: ${incident.resolved_at || 'Not resolved'}

Affected Users: ${incident.affected_users.length}
Affected Resources: ${incident.affected_resources.join(', ')}

Response Actions:
${incident.response_actions.map(action => 
  `- ${action.taken_at}: ${action.action_type} - ${action.description} (${action.status})`
).join('\n')}

Resolution Notes:
${incident.resolution_notes || 'None'}

Report Generated: ${new Date().toISOString()}
      `.trim();

      return report;
    } catch (error) {
      console.error('Failed to generate incident report:', error);
      throw new Error('Failed to generate incident report');
    }
  }
}

export const incidentResponseService = IncidentResponseService.getInstance();