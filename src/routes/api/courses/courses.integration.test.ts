import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequestEvent } from '@sveltejs/kit';
import { GET, POST, PUT, DELETE } from './+server';
import { supabase } from '$lib/supabase';

vi.mock('$lib/supabase');

describe('Courses API Integration Tests', () => {
	let mockRequestEvent: Partial<RequestEvent>;

	beforeEach(() => {
		mockRequestEvent = {
			url: new URL('http://localhost:5173/api/courses'),
			request: new Request('http://localhost:5173/api/courses'),
			locals: {
				user: global.createMockUser({ role: 'instructor' })
			},
			params: {}
		};
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('GET /api/courses', () => {
		it('should return list of courses for authenticated user', async () => {
			const mockCourses = [
				global.createMockCourse({ id: '1', title: 'Course 1' }),
				global.createMockCourse({ id: '2', title: 'Course 2' })
			];

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				range: vi.fn().mockResolvedValue({
					data: mockCourses,
					error: null,
					count: 2
				})
			} as any);

			const response = await GET(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.courses).toHaveLength(2);
			expect(data.courses[0].title).toBe('Course 1');
			expect(data.total).toBe(2);
		});

		it('should handle pagination parameters', async () => {
			mockRequestEvent.url = new URL('http://localhost:5173/api/courses?page=2&limit=10');
			
			const mockCourses = Array.from({ length: 10 }, (_, i) => 
				global.createMockCourse({ id: `${i + 11}`, title: `Course ${i + 11}` })
			);

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				range: vi.fn().mockResolvedValue({
					data: mockCourses,
					error: null,
					count: 25
				})
			} as any);

			const response = await GET(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.courses).toHaveLength(10);
			expect(data.pagination.page).toBe(2);
			expect(data.pagination.totalPages).toBe(3);
		});

		it('should filter courses by search query', async () => {
			mockRequestEvent.url = new URL('http://localhost:5173/api/courses?search=javascript');
			
			const mockCourses = [
				global.createMockCourse({ id: '1', title: 'JavaScript Basics' }),
				global.createMockCourse({ id: '2', title: 'Advanced JavaScript' })
			];

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				range: vi.fn().mockResolvedValue({
					data: mockCourses,
					error: null,
					count: 2
				})
			} as any);

			const response = await GET(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.courses).toHaveLength(2);
			expect(supabase.from().ilike).toHaveBeenCalledWith('title', '%javascript%');
		});

		it('should return 401 for unauthenticated requests', async () => {
			mockRequestEvent.locals = {};

			const response = await GET(mockRequestEvent as RequestEvent);

			expect(response.status).toBe(401);
		});

		it('should handle database errors gracefully', async () => {
			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				range: vi.fn().mockResolvedValue({
					data: null,
					error: { message: 'Database connection failed' }
				})
			} as any);

			const response = await GET(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Database connection failed');
		});
	});

	describe('POST /api/courses', () => {
		it('should create a new course for instructor', async () => {
			const courseData = {
				title: 'New Course',
				description: 'A new course description',
				difficulty_level: 'beginner',
				tags: ['test', 'new']
			};

			mockRequestEvent.request = new Request('http://localhost:5173/api/courses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(courseData)
			});

			const mockCreatedCourse = global.createMockCourse({
				...courseData,
				id: 'new-course-id',
				instructor_id: mockRequestEvent.locals?.user?.id
			});

			vi.mocked(supabase.from).mockReturnValue({
				insert: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: mockCreatedCourse,
					error: null
				})
			} as any);

			const response = await POST(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.course.title).toBe('New Course');
			expect(data.course.instructor_id).toBe(mockRequestEvent.locals?.user?.id);
		});

		it('should validate required fields', async () => {
			const invalidCourseData = {
				description: 'Missing title'
			};

			mockRequestEvent.request = new Request('http://localhost:5173/api/courses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(invalidCourseData)
			});

			const response = await POST(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.errors).toContain('Title is required');
		});

		it('should reject requests from non-instructors', async () => {
			mockRequestEvent.locals = {
				user: global.createMockUser({ role: 'student' })
			};

			const response = await POST(mockRequestEvent as RequestEvent);

			expect(response.status).toBe(403);
		});

		it('should handle duplicate course titles', async () => {
			const courseData = {
				title: 'Existing Course',
				description: 'A course description',
				difficulty_level: 'beginner'
			};

			mockRequestEvent.request = new Request('http://localhost:5173/api/courses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(courseData)
			});

			vi.mocked(supabase.from).mockReturnValue({
				insert: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { code: '23505', message: 'Duplicate key value' }
				})
			} as any);

			const response = await POST(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(409);
			expect(data.error).toContain('already exists');
		});
	});

	describe('PUT /api/courses/[id]', () => {
		it('should update existing course', async () => {
			mockRequestEvent.params = { id: 'course-1' };
			
			const updateData = {
				title: 'Updated Course Title',
				description: 'Updated description'
			};

			mockRequestEvent.request = new Request('http://localhost:5173/api/courses/course-1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});

			const mockUpdatedCourse = global.createMockCourse({
				id: 'course-1',
				...updateData,
				instructor_id: mockRequestEvent.locals?.user?.id
			});

			vi.mocked(supabase.from)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: { instructor_id: mockRequestEvent.locals?.user?.id },
						error: null
					})
				} as any)
				.mockReturnValueOnce({
					update: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					select: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: mockUpdatedCourse,
						error: null
					})
				} as any);

			const response = await PUT(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.course.title).toBe('Updated Course Title');
		});

		it('should prevent unauthorized updates', async () => {
			mockRequestEvent.params = { id: 'course-1' };
			mockRequestEvent.request = new Request('http://localhost:5173/api/courses/course-1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Unauthorized Update' })
			});

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: { instructor_id: 'different-instructor-id' },
					error: null
				})
			} as any);

			const response = await PUT(mockRequestEvent as RequestEvent);

			expect(response.status).toBe(403);
		});

		it('should return 404 for non-existent course', async () => {
			mockRequestEvent.params = { id: 'non-existent-course' };
			mockRequestEvent.request = new Request('http://localhost:5173/api/courses/non-existent-course', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Update' })
			});

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { code: 'PGRST116' }
				})
			} as any);

			const response = await PUT(mockRequestEvent as RequestEvent);

			expect(response.status).toBe(404);
		});
	});

	describe('DELETE /api/courses/[id]', () => {
		it('should delete course for authorized instructor', async () => {
			mockRequestEvent.params = { id: 'course-1' };

			vi.mocked(supabase.from)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: { instructor_id: mockRequestEvent.locals?.user?.id },
						error: null
					})
				} as any)
				.mockReturnValueOnce({
					delete: vi.fn().mockReturnThis(),
					eq: vi.fn().mockResolvedValue({
						error: null
					})
				} as any);

			const response = await DELETE(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
		});

		it('should prevent unauthorized deletion', async () => {
			mockRequestEvent.params = { id: 'course-1' };

			vi.mocked(supabase.from).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: { instructor_id: 'different-instructor-id' },
					error: null
				})
			} as any);

			const response = await DELETE(mockRequestEvent as RequestEvent);

			expect(response.status).toBe(403);
		});

		it('should handle deletion of course with enrolled students', async () => {
			mockRequestEvent.params = { id: 'course-1' };

			vi.mocked(supabase.from)
				.mockReturnValueOnce({
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: { instructor_id: mockRequestEvent.locals?.user?.id },
						error: null
					})
				} as any)
				.mockReturnValueOnce({
					delete: vi.fn().mockReturnThis(),
					eq: vi.fn().mockResolvedValue({
						error: { code: '23503', message: 'Foreign key constraint violation' }
					})
				} as any);

			const response = await DELETE(mockRequestEvent as RequestEvent);
			const data = await response.json();

			expect(response.status).toBe(409);
			expect(data.error).toContain('enrolled students');
		});
	});
});