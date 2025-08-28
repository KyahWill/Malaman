import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressionService } from './progressionControl';
import { supabase } from '$lib/supabase';

vi.mock('$lib/supabase');

describe('ProgressionService', () => {
	let progressionService: ProgressionService;

	beforeEach(() => {
		progressionService = new ProgressionService();
		vi.clearAllMocks();
	});

	describe('canAccessLesson', () => {
		it('should allow access to lesson with no prerequisites', async () => {
			const mockLesson = global.createMockLesson({
				prerequisites: []
			});

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: mockLesson,
					error: null
				})
			} as any);

			const result = await progressionService.canAccessLesson('student-id', 'lesson-id');

			expect(result).toBe(true);
		});

		it('should deny access to lesson with unmet prerequisites', async () => {
			const mockLesson = global.createMockLesson({
				prerequisites: ['prereq-lesson-1', 'prereq-lesson-2']
			});

			vi.mocked(supabase.from)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: mockLesson,
						error: null
					})
				} as any)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: null, // No progress record = not completed
						error: null
					})
				} as any);

			const result = await progressionService.canAccessLesson('student-id', 'lesson-id');

			expect(result).toBe(false);
		});

		it('should allow access when all prerequisites are completed', async () => {
			const mockLesson = global.createMockLesson({
				prerequisites: ['prereq-lesson-1'],
				assessment_id: 'lesson-assessment-id'
			});

			const mockProgress = {
				status: 'completed',
				completion_percentage: 100
			};

			const mockAssessmentAttempt = {
				passed: true,
				score: 85
			};

			vi.mocked(supabase.from)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: mockLesson,
						error: null
					})
				} as any)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: mockProgress,
						error: null
					})
				} as any)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					order: vi.fn().mockReturnThis(),
					limit: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: mockAssessmentAttempt,
						error: null
					})
				} as any);

			const result = await progressionService.canAccessLesson('student-id', 'lesson-id');

			expect(result).toBe(true);
		});
	});

	describe('updateProgress', () => {
		it('should update lesson progress successfully', async () => {
			const progressData = {
				student_id: 'student-id',
				lesson_id: 'lesson-id',
				status: 'completed',
				completion_percentage: 100,
				time_spent: 1800
			};

			vi.mocked(supabase.from).mockReturnValue({
				upsert: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: progressData,
					error: null
				})
			} as any);

			const result = await progressionService.updateProgress(
				'student-id',
				'lesson-id',
				'lesson',
				{
					status: 'completed',
					completion_percentage: 100,
					time_spent: 1800
				}
			);

			expect(result.success).toBe(true);
			expect(result.progress).toEqual(progressData);
		});

		it('should handle progress update errors', async () => {
			const mockError = { message: 'Update failed' };

			vi.mocked(supabase.from).mockReturnValue({
				upsert: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: mockError
				})
			} as any);

			const result = await progressionService.updateProgress(
				'student-id',
				'lesson-id',
				'lesson',
				{ status: 'completed' }
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Update failed');
		});
	});

	describe('hasPassedAssessment', () => {
		it('should return true for passed assessment', async () => {
			const mockAttempt = {
				passed: true,
				score: 85
			};

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: mockAttempt,
					error: null
				})
			} as any);

			const result = await progressionService.hasPassedAssessment('student-id', 'assessment-id');

			expect(result).toBe(true);
		});

		it('should return false for failed assessment', async () => {
			const mockAttempt = {
				passed: false,
				score: 45
			};

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: mockAttempt,
					error: null
				})
			} as any);

			const result = await progressionService.hasPassedAssessment('student-id', 'assessment-id');

			expect(result).toBe(false);
		});

		it('should return false when no attempts exist', async () => {
			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: null
				})
			} as any);

			const result = await progressionService.hasPassedAssessment('student-id', 'assessment-id');

			expect(result).toBe(false);
		});
	});

	describe('generateAssessmentRecord', () => {
		it('should generate assessment record successfully', async () => {
			const mockAttempt = {
				id: 'attempt-id',
				assessment_id: 'assessment-id',
				student_id: 'student-id',
				score: 85,
				passed: true,
				submitted_at: new Date().toISOString(),
				time_spent: 300,
				answers: [
					{
						question_id: 'q1',
						student_answer: 'correct',
						is_correct: true,
						points_earned: 10
					}
				]
			};

			const mockAssessment = global.createMockAssessment();

			vi.mocked(supabase.from)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: mockAttempt,
						error: null
					})
				} as any)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: mockAssessment,
						error: null
					})
				} as any);

			const result = await progressionService.generateAssessmentRecord('attempt-id');

			expect(result.success).toBe(true);
			expect(result.record?.student_id).toBe('student-id');
			expect(result.record?.score).toBe(85);
			expect(result.record?.passed).toBe(true);
		});

		it('should handle assessment record generation errors', async () => {
			const mockError = { message: 'Attempt not found' };

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: mockError
				})
			} as any);

			const result = await progressionService.generateAssessmentRecord('invalid-attempt-id');

			expect(result.success).toBe(false);
			expect(result.error).toBe('Attempt not found');
		});
	});

	describe('getBlockedContent', () => {
		it('should return blocked content for student', async () => {
			const mockBlockedLessons = [
				{
					id: 'lesson-1',
					title: 'Blocked Lesson 1',
					prerequisites: ['prereq-1'],
					blocking_reason: 'Prerequisite not completed'
				},
				{
					id: 'lesson-2',
					title: 'Blocked Lesson 2',
					prerequisites: ['prereq-2'],
					blocking_reason: 'Assessment not passed'
				}
			];

			// Mock the complex query for blocked content
			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				not: vi.fn().mockReturnThis(),
				in: vi.fn().mockReturnThis(),
				order: vi.fn().mockResolvedValue({
					data: mockBlockedLessons,
					error: null
				})
			} as any);

			const result = await progressionService.getBlockedContent('student-id');

			expect(result.success).toBe(true);
			expect(result.blockedContent).toHaveLength(2);
			expect(result.blockedContent?.[0].title).toBe('Blocked Lesson 1');
		});
	});
});