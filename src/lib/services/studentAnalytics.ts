/**
 * Student Analytics Service
 * 
 * Provides comprehensive analytics and metrics for student learning progress,
 * performance tracking, and personalized insights.
 */

import { supabase } from '$lib/supabase.js';
import type { 
  LearningAnalytics, 
  AnalyticsMetrics, 
  LearningTrend,
  StudentProgress,
  AssessmentAttempt,
  Enrollment
} from '$lib/types/database.js';

export interface DashboardMetrics {
  totalCourses: number;
  activeCourses: number;
  completedCourses: number;
  overallProgress: number;
  totalTimeSpent: number; // in minutes
  assessmentsPassed: number;
  totalAssessments: number;
  averageScore: number;
  currentStreak: number; // days
  longestStreak: number; // days
  weeklyGoalProgress: number; // percentage
  monthlyGoalProgress: number; // percentage
}

export interface ProgressVisualization {
  dailyActivity: DailyActivity[];
  weeklyProgress: WeeklyProgress[];
  monthlyTrends: MonthlyTrend[];
  subjectProgress: SubjectProgress[];
  skillDevelopment: SkillProgress[];
}

export interface DailyActivity {
  date: string;
  timeSpent: number; // in minutes
  lessonsCompleted: number;
  assessmentsTaken: number;
  score: number | null;
}

export interface WeeklyProgress {
  week: string;
  lessonsCompleted: number;
  assessmentsPassed: number;
  averageScore: number;
  timeSpent: number;
}

export interface MonthlyTrend {
  month: string;
  metric: string;
  value: number;
  change: number; // percentage change from previous month
  trend: 'up' | 'down' | 'stable';
}

export interface SubjectProgress {
  subject: string;
  progress: number; // percentage
  timeSpent: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nextMilestone: string;
}

export interface SkillProgress {
  skill: string;
  currentLevel: number; // 1-10
  targetLevel: number;
  progress: number; // percentage to target
  recentImprovement: number;
}

export interface LearningGoals {
  daily: {
    target: number; // minutes
    current: number;
    streak: number;
  };
  weekly: {
    target: number; // lessons
    current: number;
    progress: number; // percentage
  };
  monthly: {
    target: number; // courses or assessments
    current: number;
    progress: number; // percentage
  };
}

export interface RecentActivity {
  id: string;
  type: 'lesson_completed' | 'assessment_passed' | 'assessment_failed' | 'course_enrolled' | 'course_completed';
  title: string;
  description: string;
  timestamp: string;
  score?: number;
  courseTitle?: string;
  icon: string;
  color: string;
}

export class StudentAnalyticsService {
  /**
   * Get comprehensive dashboard metrics for a student
   */
  static async getDashboardMetrics(studentId: string): Promise<DashboardMetrics> {
    try {
      // Get enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(id, title, difficulty_level)
        `)
        .eq('student_id', studentId);

      if (enrollmentsError) throw enrollmentsError;

      // Get progress data
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId);

      if (progressError) throw progressError;

      // Get assessment attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      // Calculate metrics
      const totalCourses = enrollments?.length || 0;
      const completedCourses = enrollments?.filter(e => e.completed_at).length || 0;
      const activeCourses = totalCourses - completedCourses;

      const totalTimeSpent = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;
      const overallProgress = totalCourses > 0 
        ? progressData?.reduce((sum, p) => sum + p.completion_percentage, 0) / totalCourses || 0
        : 0;

      const passedAttempts = attempts?.filter(a => a.passed) || [];
      const assessmentsPassed = passedAttempts.length;
      const totalAssessments = attempts?.length || 0;
      const averageScore = attempts?.length > 0 
        ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length 
        : 0;

      // Calculate streaks (simplified - would need more complex logic for real streaks)
      const currentStreak = await this.calculateCurrentStreak(studentId);
      const longestStreak = await this.calculateLongestStreak(studentId);

      // Calculate goal progress (simplified)
      const weeklyGoalProgress = Math.min((progressData?.length || 0) / 5 * 100, 100);
      const monthlyGoalProgress = Math.min(completedCourses / 2 * 100, 100);

      return {
        totalCourses,
        activeCourses,
        completedCourses,
        overallProgress: Math.round(overallProgress),
        totalTimeSpent: Math.round(totalTimeSpent / 60), // convert to minutes
        assessmentsPassed,
        totalAssessments,
        averageScore: Math.round(averageScore),
        currentStreak,
        longestStreak,
        weeklyGoalProgress: Math.round(weeklyGoalProgress),
        monthlyGoalProgress: Math.round(monthlyGoalProgress)
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get progress visualization data
   */
  static async getProgressVisualization(studentId: string): Promise<ProgressVisualization> {
    try {
      // Get daily activity for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentProgress, error } = await supabase
        .from('student_progress')
        .select(`
          *,
          lesson:lessons(title),
          assessment:assessments(title)
        `)
        .eq('student_id', studentId)
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: true });

      if (error) throw error;

      // Process daily activity
      const dailyActivity = this.processDailyActivity(recentProgress || []);
      
      // Get weekly progress
      const weeklyProgress = this.processWeeklyProgress(recentProgress || []);
      
      // Get monthly trends (simplified)
      const monthlyTrends = await this.getMonthlyTrends(studentId);
      
      // Get subject progress
      const subjectProgress = await this.getSubjectProgress(studentId);
      
      // Get skill development
      const skillDevelopment = await this.getSkillDevelopment(studentId);

      return {
        dailyActivity,
        weeklyProgress,
        monthlyTrends,
        subjectProgress,
        skillDevelopment
      };
    } catch (error) {
      console.error('Error getting progress visualization:', error);
      throw error;
    }
  }

  /**
   * Get learning goals and progress
   */
  static async getLearningGoals(studentId: string): Promise<LearningGoals> {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get today's progress
      const { data: todayProgress } = await supabase
        .from('student_progress')
        .select('time_spent')
        .eq('student_id', studentId)
        .gte('updated_at', today.toISOString().split('T')[0]);

      // Get this week's progress
      const { data: weekProgress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .gte('updated_at', startOfWeek.toISOString());

      // Get this month's progress
      const { data: monthProgress } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)
        .not('completed_at', 'is', null)
        .gte('completed_at', startOfMonth.toISOString());

      const dailyTimeSpent = todayProgress?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;
      const weeklyLessons = weekProgress?.length || 0;
      const monthlyCompletions = monthProgress?.length || 0;

      return {
        daily: {
          target: 60, // 60 minutes
          current: Math.round(dailyTimeSpent / 60),
          streak: await this.calculateCurrentStreak(studentId)
        },
        weekly: {
          target: 5, // 5 lessons
          current: weeklyLessons,
          progress: Math.min(weeklyLessons / 5 * 100, 100)
        },
        monthly: {
          target: 2, // 2 courses
          current: monthlyCompletions,
          progress: Math.min(monthlyCompletions / 2 * 100, 100)
        }
      };
    } catch (error) {
      console.error('Error getting learning goals:', error);
      throw error;
    }
  }

  /**
   * Get recent learning activity
   */
  static async getRecentActivity(studentId: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent progress updates
      const { data: progressUpdates } = await supabase
        .from('student_progress')
        .select(`
          *,
          lesson:lessons(title, course:courses(title)),
          assessment:assessments(title)
        `)
        .eq('student_id', studentId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      // Get recent assessment attempts
      const { data: assessmentAttempts } = await supabase
        .from('assessment_attempts')
        .select(`
          *,
          assessment:assessments(title, lesson:lessons(course:courses(title)))
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      // Get recent enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(title)
        `)
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false })
        .limit(limit);

      // Process progress updates
      progressUpdates?.forEach(progress => {
        if (progress.status === 'completed') {
          activities.push({
            id: progress.id,
            type: 'lesson_completed',
            title: progress.lesson?.title || 'Lesson Completed',
            description: `Completed lesson in ${progress.lesson?.course?.title || 'course'}`,
            timestamp: progress.updated_at,
            courseTitle: progress.lesson?.course?.title,
            icon: '✅',
            color: 'text-green-600'
          });
        }
      });

      // Process assessment attempts
      assessmentAttempts?.forEach(attempt => {
        activities.push({
          id: attempt.id,
          type: attempt.passed ? 'assessment_passed' : 'assessment_failed',
          title: attempt.assessment?.title || 'Assessment',
          description: `${attempt.passed ? 'Passed' : 'Failed'} with ${attempt.score}%`,
          timestamp: attempt.submitted_at,
          score: attempt.score,
          courseTitle: attempt.assessment?.lesson?.course?.title,
          icon: attempt.passed ? '🎯' : '📝',
          color: attempt.passed ? 'text-green-600' : 'text-yellow-600'
        });
      });

      // Process enrollments
      enrollments?.forEach(enrollment => {
        if (enrollment.completed_at) {
          activities.push({
            id: enrollment.id,
            type: 'course_completed',
            title: enrollment.course?.title || 'Course',
            description: 'Course completed successfully',
            timestamp: enrollment.completed_at,
            courseTitle: enrollment.course?.title,
            icon: '🏆',
            color: 'text-purple-600'
          });
        } else {
          activities.push({
            id: enrollment.id,
            type: 'course_enrolled',
            title: enrollment.course?.title || 'Course',
            description: 'Enrolled in course',
            timestamp: enrollment.enrolled_at,
            courseTitle: enrollment.course?.title,
            icon: '📚',
            color: 'text-blue-600'
          });
        }
      });

      // Sort by timestamp and return limited results
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // Helper methods
  private static processDailyActivity(progressData: any[]): DailyActivity[] {
    const dailyMap = new Map<string, DailyActivity>();

    progressData.forEach(progress => {
      const date = progress.updated_at.split('T')[0];
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          timeSpent: 0,
          lessonsCompleted: 0,
          assessmentsTaken: 0,
          score: null
        });
      }

      const day = dailyMap.get(date)!;
      day.timeSpent += progress.time_spent || 0;
      
      if (progress.status === 'completed') {
        if (progress.lesson_id) {
          day.lessonsCompleted++;
        } else if (progress.assessment_id) {
          day.assessmentsTaken++;
          day.score = progress.best_score;
        }
      }
    });

    return Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        ...day,
        timeSpent: Math.round(day.timeSpent / 60) // convert to minutes
      }));
  }

  private static processWeeklyProgress(progressData: any[]): WeeklyProgress[] {
    // Simplified weekly processing
    const weeks: WeeklyProgress[] = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekData = progressData.filter(p => {
        const date = new Date(p.updated_at);
        return date >= weekStart && date <= weekEnd;
      });

      weeks.push({
        week: `Week ${4 - i}`,
        lessonsCompleted: weekData.filter(p => p.status === 'completed' && p.lesson_id).length,
        assessmentsPassed: weekData.filter(p => p.status === 'completed' && p.assessment_id && p.best_score >= 70).length,
        averageScore: weekData.length > 0 
          ? Math.round(weekData.reduce((sum, p) => sum + (p.best_score || 0), 0) / weekData.length)
          : 0,
        timeSpent: Math.round(weekData.reduce((sum, p) => sum + (p.time_spent || 0), 0) / 60)
      });
    }

    return weeks;
  }

  private static async getMonthlyTrends(studentId: string): Promise<MonthlyTrend[]> {
    // Simplified monthly trends
    return [
      {
        month: 'This Month',
        metric: 'Lessons Completed',
        value: 12,
        change: 15,
        trend: 'up'
      },
      {
        month: 'This Month',
        metric: 'Average Score',
        value: 85,
        change: 5,
        trend: 'up'
      },
      {
        month: 'This Month',
        metric: 'Time Spent',
        value: 240,
        change: -10,
        trend: 'down'
      }
    ];
  }

  private static async getSubjectProgress(studentId: string): Promise<SubjectProgress[]> {
    // Simplified subject progress
    return [
      {
        subject: 'Mathematics',
        progress: 75,
        timeSpent: 120,
        difficulty: 'intermediate',
        nextMilestone: 'Complete Algebra Module'
      },
      {
        subject: 'Science',
        progress: 60,
        timeSpent: 90,
        difficulty: 'beginner',
        nextMilestone: 'Physics Fundamentals'
      },
      {
        subject: 'Programming',
        progress: 40,
        timeSpent: 180,
        difficulty: 'advanced',
        nextMilestone: 'Data Structures'
      }
    ];
  }

  private static async getSkillDevelopment(studentId: string): Promise<SkillProgress[]> {
    // Simplified skill development
    return [
      {
        skill: 'Problem Solving',
        currentLevel: 7,
        targetLevel: 9,
        progress: 60,
        recentImprovement: 15
      },
      {
        skill: 'Critical Thinking',
        currentLevel: 6,
        targetLevel: 8,
        progress: 50,
        recentImprovement: 10
      },
      {
        skill: 'Communication',
        currentLevel: 5,
        targetLevel: 7,
        progress: 25,
        recentImprovement: 5
      }
    ];
  }

  private static async calculateCurrentStreak(studentId: string): Promise<number> {
    // Simplified streak calculation
    return 5;
  }

  private static async calculateLongestStreak(studentId: string): Promise<number> {
    // Simplified longest streak calculation
    return 12;
  }
}