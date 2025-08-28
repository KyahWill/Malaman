import { describe, it, expect } from 'vitest';
import {
	validateEmail,
	validatePassword,
	validateCourseData,
	validateLessonData,
	validateAssessmentData,
	validateUserProfile,
	sanitizeHtml
} from './validation';

describe('validation utilities', () => {
	describe('validateEmail', () => {
		it('should validate correct email addresses', () => {
			expect(validateEmail('test@example.com')).toBe(true);
			expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
			expect(validateEmail('user123@test-domain.com')).toBe(true);
		});

		it('should reject invalid email addresses', () => {
			expect(validateEmail('invalid-email')).toBe(false);
			expect(validateEmail('test@')).toBe(false);
			expect(validateEmail('@domain.com')).toBe(false);
			expect(validateEmail('test..test@domain.com')).toBe(false);
			expect(validateEmail('')).toBe(false);
		});
	});

	describe('validatePassword', () => {
		it('should validate strong passwords', () => {
			const result = validatePassword('StrongPass123!');
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject weak passwords', () => {
			const result = validatePassword('weak');
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Password must be at least 8 characters long');
			expect(result.errors).toContain('Password must contain at least one uppercase letter');
			expect(result.errors).toContain('Password must contain at least one number');
		});

		it('should provide specific error messages', () => {
			const result = validatePassword('password');
			expect(result.errors).toContain('Password must contain at least one uppercase letter');
			expect(result.errors).toContain('Password must contain at least one number');
		});
	});

	describe('validateCourseData', () => {
		it('should validate correct course data', () => {
			const courseData = {
				title: 'Test Course',
				description: 'A test course description',
				difficulty_level: 'beginner' as const,
				estimated_duration: 120,
				tags: ['test', 'course']
			};

			const result = validateCourseData(courseData);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject invalid course data', () => {
			const courseData = {
				title: '',
				description: '',
				difficulty_level: 'invalid' as any,
				estimated_duration: -10,
				tags: []
			};

			const result = validateCourseData(courseData);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Title is required');
			expect(result.errors).toContain('Description is required');
			expect(result.errors).toContain('Invalid difficulty level');
			expect(result.errors).toContain('Estimated duration must be positive');
		});
	});

	describe('validateLessonData', () => {
		it('should validate correct lesson data', () => {
			const lessonData = {
				title: 'Test Lesson',
				description: 'A test lesson',
				order_index: 1,
				estimated_duration: 30,
				learning_objectives: ['Learn something'],
				content_blocks: []
			};

			const result = validateLessonData(lessonData);
			expect(result.isValid).toBe(true);
		});

		it('should reject invalid lesson data', () => {
			const lessonData = {
				title: '',
				description: '',
				order_index: -1,
				estimated_duration: 0,
				learning_objectives: [],
				content_blocks: []
			};

			const result = validateLessonData(lessonData);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Title is required');
			expect(result.errors).toContain('Order index must be non-negative');
			expect(result.errors).toContain('At least one learning objective is required');
		});
	});

	describe('validateAssessmentData', () => {
		it('should validate correct assessment data', () => {
			const assessmentData = {
				title: 'Test Assessment',
				description: 'A test assessment',
				questions: [
					{
						id: 'q1',
						type: 'multiple_choice' as const,
						question_text: 'What is 2+2?',
						options: ['3', '4', '5'],
						correct_answer: '4',
						explanation: '2+2=4',
						difficulty_level: 1,
						topics: ['math'],
						points: 10
					}
				],
				minimum_passing_score: 70,
				time_limit: 60
			};

			const result = validateAssessmentData(assessmentData);
			expect(result.isValid).toBe(true);
		});

		it('should reject invalid assessment data', () => {
			const assessmentData = {
				title: '',
				description: '',
				questions: [],
				minimum_passing_score: 150,
				time_limit: -10
			};

			const result = validateAssessmentData(assessmentData);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Title is required');
			expect(result.errors).toContain('At least one question is required');
			expect(result.errors).toContain('Passing score must be between 0 and 100');
		});
	});

	describe('validateUserProfile', () => {
		it('should validate correct user profile', () => {
			const profile = {
				first_name: 'John',
				last_name: 'Doe',
				learning_preferences: {
					preferred_pace: 'medium' as const,
					preferred_media_types: ['video', 'text'],
					learning_style: 'visual' as const
				}
			};

			const result = validateUserProfile(profile);
			expect(result.isValid).toBe(true);
		});

		it('should reject invalid user profile', () => {
			const profile = {
				first_name: '',
				last_name: '',
				learning_preferences: {
					preferred_pace: 'invalid' as any,
					preferred_media_types: [],
					learning_style: 'invalid' as any
				}
			};

			const result = validateUserProfile(profile);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('First name is required');
			expect(result.errors).toContain('Last name is required');
		});
	});

	describe('sanitizeHtml', () => {
		it('should allow safe HTML tags', () => {
			const html = '<p>Safe <strong>content</strong> with <em>emphasis</em></p>';
			const result = sanitizeHtml(html);
			expect(result).toBe(html);
		});

		it('should remove dangerous HTML tags', () => {
			const html = '<p>Safe content</p><script>alert("xss")</script>';
			const result = sanitizeHtml(html);
			expect(result).not.toContain('<script>');
			expect(result).toContain('<p>Safe content</p>');
		});

		it('should remove dangerous attributes', () => {
			const html = '<p onclick="alert(\'xss\')">Content</p>';
			const result = sanitizeHtml(html);
			expect(result).not.toContain('onclick');
			expect(result).toContain('<p>Content</p>');
		});
	});
});