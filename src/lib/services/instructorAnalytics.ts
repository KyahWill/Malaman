/**
 * Instructor Analytics Service
 * Provides comprehensive analytics for instructors including course performance,
 * student engagement, content effectiveness, and improvement recommendations
 */

import { supabase } from '$lib/supabase.js';
import type { Database } from '$lib/types/database.js';

type Tables = Database['public']['Tables'];
type Course = Tables['courses']['Row'];
type Assessment = Tables['assessments']['Row'];
type StudentProgress = Tables['student_progress']['Row'];
type AssessmentAttempt = Tables['assessment_attempts']['Row'];

export interface CourseAnalytics {
	overview: {
		total_enrollments: number;
		active_students: number;
		completion_rate: number;
		average_progress: number;
		average_score: number;
		engagement_rate: number;
		recent_enrollments: number;
	};
	student_performance: {
		high_performers: number;
		struggling_students: number;
		average_time_to_complete: number;
		dropout_rate: number;
		score_distribution: ScoreDistribution;
	};
	content_effectiveness: {
		lesson_completion_rates: LessonMetrics[];
		assessment_performance: AssessmentMetrics[];
		content_engagement: ContentEngagement[];
		difficulty_analysis: DifficultyAnalysis;
	};
	engagement_patterns: {
		daily_activity: DailyActivity[];
		peak_learning_times: TimeSlot[];
		session_duration: SessionMetrics;
		return_rate: number;
	};
	recommendations: ContentRecommendation[];
}

export interface ScoreDistribution {
	excellent: number; // 90-100%
	good: number; // 80-89%
	satisfactory: number; // 70-79%
	needs_improvement: number; // 60-69%
	failing: number; // <60%
}

export interface LessonMetrics {
	lesson_id: string;
	lesson_title: string;
	completion_rate: number;
	average_time_spent: number;
	difficulty_rating: number;
	student_feedback_score: number;
	drop_off_points: string[];
}

export interface AssessmentMetrics {
	assessment_id: string;
	assessment_title: string;
	average_score: number;
	pass_rate: number;
	average_attempts: number;
	time_to_complete: number;
	question_difficulty: QuestionDifficulty[];
	common_mistakes: string[];
}

export interface ContentEngagement {
	content_id: string;
	content_type: string;
	content_title: string;
	view_count: number;
	average_time_spent: number;
	completion_rate: number;
	interaction_rate: number;
	skip_rate: number;
}

export interface DifficultyAnalysis {
	perceived_difficulty: number;
	actual_difficulty: number;
	difficulty_gap: number;
	recommendations: string[];
}

export interface DailyActivity {
	date: string;
	active_students: number;
	lessons_completed: number;
	assessments_taken: number;
	total_time_spent: number;
}

export interface TimeSlot {
	hour: number;
	activity_level: number;
	completion_rate: number;
}

export interface SessionMetrics {
	average_duration: number;
	median_duration: number;
	bounce_rate: number;
	pages_per_session: number;
}

export interface QuestionDifficulty {
	question_id: string;
	question_text: string;
	difficulty_score: number;
	success_rate: number;
	average_time: number;
}

export interface ContentRecommendation {
	type: 'improvement' | 'optimization' | 'engagement' | 'difficulty';
	priority: 'high' | 'medium' | 'low';
	title: string;
	description: string;
	content_id?: string;
	suggested_actions: string[];
	expected_impact: string;
}

export interface InstructorDashboardData {
	overview: {
		total_courses: number;
		total_students: number;
		total_assessments: number;
		pending_reviews: number;
		average_course_rating: number;
		total_revenue?: number;
	};
	recent_activity: {
		new_enrollments: number;
		completed_assessments: number;
		student_messages: number;
		course_views: number;
	};
	performance_trends: {
		enrollment_trend: TrendData[];
		completion_trend: TrendData[];
		engagement_trend: TrendData[];
		score_trend: TrendData[];
	};
	top_performing_courses: CoursePerformance[];
	struggling_students: StudentAlert[];
	content_insights: ContentInsight[];
}

export interface TrendData {
	date: string;
	value: number;
	change: number;
}

export interface CoursePerformance {
	course_id: string;
	course_title: string;
	enrollment_count: number;
	completion_rate: number;
	average_score: number;
	engagement_score: number;
	revenue?: number;
}

export interface StudentAlert {
	student_id: string;
	student_name: string;
	course_id: string;
	course_title: string;
	issue_type: 'low_progress' | 'failing_assessments' | 'inactive' | 'struggling';
	severity: 'high' | 'medium' | 'low';
	last_activity: string;
	suggested_action: string;
}

export interface ContentInsight {
	content_id: string;
	content_title: string;
	content_type: string;
	insight_type: 'high_dropout' | 'low_engagement' | 'difficult_content' | 'popular_content';
	metric_value: number;
	recommendation: string;
}

export class InstructorAnalyticsService {
	/**
	 * Get comprehensive analytics for a specific course
	 */
	static async getCourseAnalytics(courseId: string, instructorId: string): Promise<CourseAnalytics> {
		// Verify instructor owns the course
		const { data: course, error: courseError } = await supabase
			.from('courses')
			.select('*')
			.eq('id', courseId)
			.eq('instructor_id', instructorId)
			.single();

		if (courseError || !course) {
			throw new Error('Course not found or access denied');
		}

		// Get all analytics data in parallel
		const [
			enrollmentData,
			progressData,
			assessmentData,
			lessonData,
			engagementData
		] = await Promise.all([
			this.getEnrollmentAnalytics(courseId),
			this.getProgressAnalytics(courseId),
			this.getAssessmentAnalytics(courseId),
			this.getLessonAnalytics(courseId),
			this.getEngagementAnalytics(courseId)
		]);

		// Calculate overview metrics
		const overview = this.calculateOverviewMetrics(enrollmentData, progressData, assessmentData);
		
		// Calculate student performance metrics
		const studentPerformance = this.calculateStudentPerformance(progressData, assessmentData);
		
		// Calculate content effectiveness
		const contentEffectiveness = this.calculateContentEffectiveness(lessonData, assessmentData, engagementData);
		
		// Calculate engagement patterns
		const engagementPatterns = this.calculateEngagementPatterns(engagementData);
		
		// Generate recommendations
		const recommendations = this.generateRecommendations(overview, studentPerformance, contentEffectiveness);

		return {
			overview,
			student_performance: studentPerformance,
			content_effectiveness: contentEffectiveness,
			engagement_patterns: engagementPatterns,
			recommendations
		};
	}

	/**
	 * Get instructor dashboard overview data
	 */
	static async getInstructorDashboard(instructorId: string): Promise<InstructorDashboardData> {
		// Get instructor's courses
		const { data: courses, error: coursesError } = await supabase
			.from('courses')
			.select('*')
			.eq('instructor_id', instructorId);

		if (coursesError) {
			throw new Error('Failed to fetch courses');
		}

		const courseIds = courses?.map(c => c.id) || [];

		// Get aggregated data for all courses
		const [
			overviewData,
			activityData,
			trendsData,
			performanceData,
			alertsData,
			insightsData
		] = await Promise.all([
			this.getInstructorOverview(instructorId, courseIds),
			this.getRecentActivity(courseIds),
			this.getPerformanceTrends(courseIds),
			this.getTopPerformingCourses(courseIds),
			this.getStudentAlerts(courseIds),
			this.getContentInsights(courseIds)
		]);

		return {
			overview: overviewData,
			recent_activity: activityData,
			performance_trends: trendsData,
			top_performing_courses: performanceData,
			struggling_students: alertsData,
			content_insights: insightsData
		};
	}

	/**
	 * Get enrollment analytics for a course
	 */
	private static async getEnrollmentAnalytics(courseId: string) {
		const { data: enrollments, error } = await supabase
			.from('enrollments')
			.select(`
				id,
				enrolled_at,
				completed_at,
				progress,
				profiles!inner(id, first_name, last_name)
			`)
			.eq('course_id', courseId);

		if (error) throw error;
		return enrollments || [];
	}

	/**
	 * Get progress analytics for a course
	 */
	private static async getProgressAnalytics(courseId: string) {
		const { data: progress, error } = await supabase
			.from('student_progress')
			.select('*')
			.eq('course_id', courseId);

		if (error) throw error;
		return progress || [];
	}

	/**
	 * Get assessment analytics for a course
	 */
	private static async getAssessmentAnalytics(courseId: string) {
		const { data: assessments, error: assessmentError } = await supabase
			.from('assessments')
			.select(`
				*,
				assessment_attempts(*)
			`)
			.eq('course_id', courseId);

		if (assessmentError) throw assessmentError;
		return assessments || [];
	}

	/**
	 * Get lesson analytics for a course
	 */
	private static async getLessonAnalytics(courseId: string) {
		const { data: lessons, error } = await supabase
			.from('lessons')
			.select(`
				*,
				student_progress(*)
			`)
			.eq('course_id', courseId);

		if (error) throw error;
		return lessons || [];
	}

	/**
	 * Get engagement analytics (placeholder - would need interaction tracking)
	 */
	private static async getEngagementAnalytics(courseId: string) {
		// This would integrate with interaction tracking service
		// For now, return mock data structure
		return {
			daily_activity: [],
			session_data: [],
			interaction_events: []
		};
	}

	/**
	 * Calculate overview metrics
	 */
	private static calculateOverviewMetrics(enrollmentData: any[], progressData: any[], assessmentData: any[]) {
		const totalEnrollments = enrollmentData.length;
		const completedEnrollments = enrollmentData.filter(e => e.completed_at).length;
		const activeStudents = progressData.filter(p => {
			const lastAccessed = new Date(p.last_accessed);
			const weekAgo = new Date();
			weekAgo.setDate(weekAgo.getDate() - 7);
			return lastAccessed >= weekAgo;
		}).length;

		const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
		const avgProgress = progressData.length > 0 
			? progressData.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / progressData.length
			: 0;

		// Calculate average score from assessment attempts
		const allAttempts = assessmentData.flatMap(a => a.assessment_attempts || []);
		const avgScore = allAttempts.length > 0
			? allAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / allAttempts.length
			: 0;

		const engagementRate = activeStudents / Math.max(totalEnrollments, 1) * 100;

		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const recentEnrollments = enrollmentData.filter(e => 
			new Date(e.enrolled_at) >= thirtyDaysAgo
		).length;

		return {
			total_enrollments: totalEnrollments,
			active_students: activeStudents,
			completion_rate: Math.round(completionRate * 100) / 100,
			average_progress: Math.round(avgProgress * 100) / 100,
			average_score: Math.round(avgScore * 100) / 100,
			engagement_rate: Math.round(engagementRate * 100) / 100,
			recent_enrollments: recentEnrollments
		};
	}

	/**
	 * Calculate student performance metrics
	 */
	private static calculateStudentPerformance(progressData: any[], assessmentData: any[]) {
		const allAttempts = assessmentData.flatMap(a => a.assessment_attempts || []);
		
		// Score distribution
		const scoreDistribution: ScoreDistribution = {
			excellent: 0,
			good: 0,
			satisfactory: 0,
			needs_improvement: 0,
			failing: 0
		};

		allAttempts.forEach(attempt => {
			const score = attempt.score || 0;
			if (score >= 90) scoreDistribution.excellent++;
			else if (score >= 80) scoreDistribution.good++;
			else if (score >= 70) scoreDistribution.satisfactory++;
			else if (score >= 60) scoreDistribution.needs_improvement++;
			else scoreDistribution.failing++;
		});

		const highPerformers = progressData.filter(p => (p.best_score || 0) >= 85).length;
		const strugglingStudents = progressData.filter(p => (p.best_score || 0) < 60).length;
		
		// Calculate average time to complete (mock data for now)
		const avgTimeToComplete = 0; // Would need actual time tracking
		const dropoutRate = 0; // Would need dropout tracking

		return {
			high_performers: highPerformers,
			struggling_students: strugglingStudents,
			average_time_to_complete: avgTimeToComplete,
			dropout_rate: dropoutRate,
			score_distribution: scoreDistribution
		};
	}

	/**
	 * Calculate content effectiveness metrics
	 */
	private static calculateContentEffectiveness(lessonData: any[], assessmentData: any[], engagementData: any) {
		const lessonMetrics: LessonMetrics[] = lessonData.map(lesson => {
			const progressEntries = lesson.student_progress || [];
			const completionRate = progressEntries.length > 0 
				? progressEntries.filter((p: any) => p.status === 'completed').length / progressEntries.length * 100
				: 0;

			return {
				lesson_id: lesson.id,
				lesson_title: lesson.title,
				completion_rate: Math.round(completionRate * 100) / 100,
				average_time_spent: 0, // Would need time tracking
				difficulty_rating: 0, // Would need student feedback
				student_feedback_score: 0, // Would need feedback system
				drop_off_points: [] // Would need interaction tracking
			};
		});

		const assessmentMetrics: AssessmentMetrics[] = assessmentData.map(assessment => {
			const attempts = assessment.assessment_attempts || [];
			const avgScore = attempts.length > 0
				? attempts.reduce((sum: number, attempt: any) => sum + (attempt.score || 0), 0) / attempts.length
				: 0;
			
			const passRate = attempts.length > 0
				? attempts.filter((attempt: any) => attempt.passed).length / attempts.length * 100
				: 0;

			// Group attempts by student to calculate average attempts per student
			const studentAttempts = new Map();
			attempts.forEach((attempt: any) => {
				const studentId = attempt.student_id;
				if (!studentAttempts.has(studentId)) {
					studentAttempts.set(studentId, 0);
				}
				studentAttempts.set(studentId, studentAttempts.get(studentId) + 1);
			});

			const avgAttempts = studentAttempts.size > 0
				? Array.from(studentAttempts.values()).reduce((sum: number, count: number) => sum + count, 0) / studentAttempts.size
				: 0;

			return {
				assessment_id: assessment.id,
				assessment_title: assessment.title,
				average_score: Math.round(avgScore * 100) / 100,
				pass_rate: Math.round(passRate * 100) / 100,
				average_attempts: Math.round(avgAttempts * 100) / 100,
				time_to_complete: 0, // Would need time tracking
				question_difficulty: [], // Would need question-level analysis
				common_mistakes: [] // Would need answer analysis
			};
		});

		return {
			lesson_completion_rates: lessonMetrics,
			assessment_performance: assessmentMetrics,
			content_engagement: [], // Would need engagement tracking
			difficulty_analysis: {
				perceived_difficulty: 0,
				actual_difficulty: 0,
				difficulty_gap: 0,
				recommendations: []
			}
		};
	}

	/**
	 * Calculate engagement patterns
	 */
	private static calculateEngagementPatterns(engagementData: any) {
		// Mock implementation - would need actual engagement tracking
		return {
			daily_activity: [],
			peak_learning_times: [],
			session_duration: {
				average_duration: 0,
				median_duration: 0,
				bounce_rate: 0,
				pages_per_session: 0
			},
			return_rate: 0
		};
	}

	/**
	 * Generate content improvement recommendations
	 */
	private static generateRecommendations(overview: any, performance: any, effectiveness: any): ContentRecommendation[] {
		const recommendations: ContentRecommendation[] = [];

		// Low completion rate recommendation
		if (overview.completion_rate < 50) {
			recommendations.push({
				type: 'improvement',
				priority: 'high',
				title: 'Improve Course Completion Rate',
				description: `Your course completion rate is ${overview.completion_rate}%, which is below the recommended 70%.`,
				suggested_actions: [
					'Review course structure and pacing',
					'Add more engaging content types',
					'Implement progress checkpoints',
					'Provide clearer learning objectives'
				],
				expected_impact: 'Could increase completion rate by 15-25%'
			});
		}

		// Low engagement recommendation
		if (overview.engagement_rate < 60) {
			recommendations.push({
				type: 'engagement',
				priority: 'high',
				title: 'Boost Student Engagement',
				description: `Student engagement is at ${overview.engagement_rate}%, indicating students may be losing interest.`,
				suggested_actions: [
					'Add interactive elements to lessons',
					'Include multimedia content',
					'Create discussion forums',
					'Implement gamification elements'
				],
				expected_impact: 'Could improve engagement by 20-30%'
			});
		}

		// Struggling students recommendation
		if (performance.struggling_students > 0) {
			recommendations.push({
				type: 'improvement',
				priority: 'medium',
				title: 'Support Struggling Students',
				description: `${performance.struggling_students} students are struggling with course content.`,
				suggested_actions: [
					'Provide additional practice materials',
					'Create remedial content for difficult topics',
					'Offer one-on-one support sessions',
					'Implement adaptive learning paths'
				],
				expected_impact: 'Could reduce dropout rate by 10-15%'
			});
		}

		// Assessment difficulty recommendation
		const lowPassRateAssessments = effectiveness.assessment_performance.filter(a => a.pass_rate < 70);
		if (lowPassRateAssessments.length > 0) {
			recommendations.push({
				type: 'difficulty',
				priority: 'medium',
				title: 'Review Assessment Difficulty',
				description: `${lowPassRateAssessments.length} assessments have pass rates below 70%.`,
				suggested_actions: [
					'Review question difficulty and clarity',
					'Provide more practice opportunities',
					'Add explanatory feedback for wrong answers',
					'Consider breaking complex assessments into smaller parts'
				],
				expected_impact: 'Could improve pass rates by 15-20%'
			});
		}

		return recommendations;
	}

	/**
	 * Get instructor overview data
	 */
	private static async getInstructorOverview(instructorId: string, courseIds: string[]) {
		const [coursesCount, studentsCount, assessmentsCount] = await Promise.all([
			// Count courses
			supabase
				.from('courses')
				.select('id', { count: 'exact' })
				.eq('instructor_id', instructorId),
			
			// Count unique students across all courses
			courseIds.length > 0 ? supabase
				.from('enrollments')
				.select('student_id', { count: 'exact' })
				.in('course_id', courseIds) : Promise.resolve({ count: 0 }),
			
			// Count assessments
			courseIds.length > 0 ? supabase
				.from('assessments')
				.select('id', { count: 'exact' })
				.in('course_id', courseIds) : Promise.resolve({ count: 0 })
		]);

		// Count pending reviews (essay questions needing grading)
		const { data: pendingReviews } = await supabase
			.from('assessment_attempts')
			.select('id')
			.is('feedback', null)
			.in('assessment_id', courseIds.length > 0 ? 
				(await supabase.from('assessments').select('id').in('course_id', courseIds)).data?.map(a => a.id) || [] : 
				[]
			);

		return {
			total_courses: coursesCount.count || 0,
			total_students: studentsCount.count || 0,
			total_assessments: assessmentsCount.count || 0,
			pending_reviews: pendingReviews?.length || 0,
			average_course_rating: 0, // Would need rating system
			total_revenue: 0 // Would need payment system
		};
	}

	/**
	 * Get recent activity data
	 */
	private static async getRecentActivity(courseIds: string[]) {
		if (courseIds.length === 0) {
			return {
				new_enrollments: 0,
				completed_assessments: 0,
				student_messages: 0,
				course_views: 0
			};
		}

		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const [enrollments, assessments] = await Promise.all([
			supabase
				.from('enrollments')
				.select('id')
				.in('course_id', courseIds)
				.gte('enrolled_at', sevenDaysAgo.toISOString()),
			
			supabase
				.from('assessment_attempts')
				.select('id')
				.gte('submitted_at', sevenDaysAgo.toISOString())
		]);

		return {
			new_enrollments: enrollments.data?.length || 0,
			completed_assessments: assessments.data?.length || 0,
			student_messages: 0, // Would need messaging system
			course_views: 0 // Would need view tracking
		};
	}

	/**
	 * Get performance trends (mock implementation)
	 */
	private static async getPerformanceTrends(courseIds: string[]) {
		// Mock implementation - would need historical data tracking
		return {
			enrollment_trend: [],
			completion_trend: [],
			engagement_trend: [],
			score_trend: []
		};
	}

	/**
	 * Get top performing courses
	 */
	private static async getTopPerformingCourses(courseIds: string[]): Promise<CoursePerformance[]> {
		if (courseIds.length === 0) return [];

		const { data: courses } = await supabase
			.from('courses')
			.select(`
				id,
				title,
				enrollments(id, completed_at),
				student_progress(best_score)
			`)
			.in('id', courseIds);

		return (courses || []).map(course => {
			const enrollments = course.enrollments || [];
			const progress = course.student_progress || [];
			
			const enrollmentCount = enrollments.length;
			const completionRate = enrollmentCount > 0 
				? enrollments.filter(e => e.completed_at).length / enrollmentCount * 100 
				: 0;
			
			const avgScore = progress.length > 0
				? progress.reduce((sum, p) => sum + (p.best_score || 0), 0) / progress.length
				: 0;

			return {
				course_id: course.id,
				course_title: course.title,
				enrollment_count: enrollmentCount,
				completion_rate: Math.round(completionRate * 100) / 100,
				average_score: Math.round(avgScore * 100) / 100,
				engagement_score: 0, // Would need engagement tracking
				revenue: 0 // Would need payment tracking
			};
		}).sort((a, b) => b.completion_rate - a.completion_rate);
	}

	/**
	 * Get student alerts
	 */
	private static async getStudentAlerts(courseIds: string[]): Promise<StudentAlert[]> {
		if (courseIds.length === 0) return [];

		const { data: strugglingProgress } = await supabase
			.from('student_progress')
			.select(`
				student_id,
				course_id,
				completion_percentage,
				best_score,
				last_accessed,
				courses(title),
				profiles(first_name, last_name)
			`)
			.in('course_id', courseIds)
			.or('completion_percentage.lt.30,best_score.lt.60')
			.limit(10);

		return (strugglingProgress || []).map(progress => {
			let issueType: StudentAlert['issue_type'] = 'low_progress';
			let severity: StudentAlert['severity'] = 'medium';
			let suggestedAction = 'Monitor student progress';

			if ((progress.best_score || 0) < 60) {
				issueType = 'failing_assessments';
				severity = 'high';
				suggestedAction = 'Provide additional support and remedial materials';
			} else if ((progress.completion_percentage || 0) < 20) {
				issueType = 'low_progress';
				severity = 'high';
				suggestedAction = 'Reach out to student to identify barriers';
			}

			const lastActivity = new Date(progress.last_accessed);
			const weekAgo = new Date();
			weekAgo.setDate(weekAgo.getDate() - 7);
			
			if (lastActivity < weekAgo) {
				issueType = 'inactive';
				severity = 'medium';
				suggestedAction = 'Send engagement reminder and check in with student';
			}

			return {
				student_id: progress.student_id,
				student_name: `${progress.profiles?.first_name || ''} ${progress.profiles?.last_name || ''}`.trim() || 'Unknown Student',
				course_id: progress.course_id,
				course_title: progress.courses?.title || 'Unknown Course',
				issue_type: issueType,
				severity,
				last_activity: progress.last_accessed,
				suggested_action: suggestedAction
			};
		});
	}

	/**
	 * Get content insights
	 */
	private static async getContentInsights(courseIds: string[]): Promise<ContentInsight[]> {
		if (courseIds.length === 0) return [];

		// Get lessons with low completion rates
		const { data: lessons } = await supabase
			.from('lessons')
			.select(`
				id,
				title,
				student_progress(status)
			`)
			.in('course_id', courseIds);

		const insights: ContentInsight[] = [];

		(lessons || []).forEach(lesson => {
			const progress = lesson.student_progress || [];
			if (progress.length > 0) {
				const completionRate = progress.filter(p => p.status === 'completed').length / progress.length * 100;
				
				if (completionRate < 50) {
					insights.push({
						content_id: lesson.id,
						content_title: lesson.title,
						content_type: 'lesson',
						insight_type: 'high_dropout',
						metric_value: completionRate,
						recommendation: 'Review lesson content and structure to improve engagement'
					});
				}
			}
		});

		return insights.slice(0, 5); // Return top 5 insights
	}
}