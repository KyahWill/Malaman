/**
 * Notification Service
 * 
 * Handles student notifications for progress updates, reminders,
 * achievements, and learning recommendations.
 */

import { supabase } from '$lib/supabase.js';
import type { UserProfile } from '$lib/types/database.js';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: NotificationCategory;
  data?: any;
  read: boolean;
  created_at: string;
  expires_at?: string;
}

export type NotificationType = 
  | 'progress_milestone'
  | 'assessment_reminder'
  | 'course_completion'
  | 'streak_achievement'
  | 'goal_reminder'
  | 'new_content'
  | 'performance_insight'
  | 'deadline_warning';

export type NotificationCategory = 
  | 'achievement'
  | 'reminder'
  | 'progress'
  | 'content'
  | 'system';

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  categories: {
    achievement: boolean;
    reminder: boolean;
    progress: boolean;
    content: boolean;
    system: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

export class NotificationService {
  /**
   * Get notifications for a student
   */
  static async getNotifications(
    studentId: string, 
    options: {
      unreadOnly?: boolean;
      limit?: number;
      category?: NotificationCategory;
    } = {}
  ): Promise<Notification[]> {
    try {
      // For now, return mock notifications since we don't have a notifications table
      // In a real implementation, this would query the database
      return this.getMockNotifications(studentId, options);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      // In a real implementation, this would update the database
      console.log(`Marking notification ${notificationId} as read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(studentId: string): Promise<void> {
    try {
      // In a real implementation, this would update all unread notifications
      console.log(`Marking all notifications as read for student ${studentId}`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(
    studentId: string,
    notification: Omit<Notification, 'id' | 'read' | 'created_at'>
  ): Promise<void> {
    try {
      // In a real implementation, this would insert into the database
      console.log('Creating notification:', notification);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Get notification preferences for a student
   */
  static async getNotificationPreferences(studentId: string): Promise<NotificationPreferences> {
    try {
      // In a real implementation, this would query user preferences
      return {
        email_enabled: true,
        push_enabled: true,
        categories: {
          achievement: true,
          reminder: true,
          progress: true,
          content: true,
          system: false
        },
        quiet_hours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        frequency: 'immediate'
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    studentId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      // In a real implementation, this would update user preferences
      console.log('Updating notification preferences:', preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Generate progress-based notifications
   */
  static async generateProgressNotifications(studentId: string): Promise<void> {
    try {
      // Check for milestones, streaks, and achievements
      const notifications = await this.checkForProgressMilestones(studentId);
      
      for (const notification of notifications) {
        await this.createNotification(studentId, notification);
      }
    } catch (error) {
      console.error('Error generating progress notifications:', error);
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(studentId: string): Promise<number> {
    try {
      const notifications = await this.getNotifications(studentId, { unreadOnly: true });
      return notifications.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Helper methods
  private static async checkForProgressMilestones(studentId: string): Promise<Omit<Notification, 'id' | 'read' | 'created_at'>[]> {
    const notifications: Omit<Notification, 'id' | 'read' | 'created_at'>[] = [];

    // Check for course completion
    const { data: recentCompletions } = await supabase
      .from('enrollments')
      .select('*, course:courses(title)')
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
      .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    recentCompletions?.forEach(completion => {
      notifications.push({
        type: 'course_completion',
        title: 'Course Completed! 🎉',
        message: `Congratulations on completing "${completion.course?.title}"!`,
        priority: 'high',
        category: 'achievement',
        data: { courseId: completion.course_id }
      });
    });

    // Check for assessment achievements
    const { data: recentPasses } = await supabase
      .from('assessment_attempts')
      .select('*, assessment:assessments(title)')
      .eq('student_id', studentId)
      .eq('passed', true)
      .gte('submitted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    recentPasses?.forEach(attempt => {
      if (attempt.score >= 90) {
        notifications.push({
          type: 'progress_milestone',
          title: 'Excellent Performance! ⭐',
          message: `You scored ${attempt.score}% on "${attempt.assessment?.title}"`,
          priority: 'medium',
          category: 'achievement',
          data: { assessmentId: attempt.assessment_id, score: attempt.score }
        });
      }
    });

    return notifications;
  }

  private static getMockNotifications(
    studentId: string, 
    options: { unreadOnly?: boolean; limit?: number; category?: NotificationCategory }
  ): Notification[] {
    const allNotifications: Notification[] = [
      {
        id: '1',
        type: 'progress_milestone',
        title: 'Great Progress! 🎯',
        message: 'You\'ve completed 5 lessons this week. Keep up the excellent work!',
        priority: 'medium',
        category: 'progress',
        read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'assessment_reminder',
        title: 'Assessment Due Soon ⏰',
        message: 'Your Mathematics assessment is due in 2 days. Don\'t forget to complete it!',
        priority: 'high',
        category: 'reminder',
        read: false,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'streak_achievement',
        title: 'Learning Streak! 🔥',
        message: 'Amazing! You\'ve maintained a 7-day learning streak.',
        priority: 'medium',
        category: 'achievement',
        read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'new_content',
        title: 'New Lesson Available 📚',
        message: 'A new lesson "Advanced Algorithms" has been added to your course.',
        priority: 'low',
        category: 'content',
        read: false,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        type: 'performance_insight',
        title: 'Learning Insight 💡',
        message: 'You perform best during morning hours. Consider scheduling study time between 9-11 AM.',
        priority: 'low',
        category: 'progress',
        read: true,
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '6',
        type: 'goal_reminder',
        title: 'Weekly Goal Check 📊',
        message: 'You\'re 80% towards your weekly goal of 5 lessons. Just 1 more to go!',
        priority: 'medium',
        category: 'reminder',
        read: false,
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      }
    ];

    let filtered = allNotifications;

    if (options.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    if (options.category) {
      filtered = filtered.filter(n => n.category === options.category);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }
}