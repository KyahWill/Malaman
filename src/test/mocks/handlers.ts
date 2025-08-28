import { http, HttpResponse } from 'msw';

export const handlers = [
	// Auth endpoints
	http.post('/api/auth/login', () => {
		return HttpResponse.json({
			user: global.createMockUser(),
			session: {
				access_token: 'mock-access-token',
				refresh_token: 'mock-refresh-token',
				expires_in: 3600
			}
		});
	}),

	http.post('/api/auth/register', () => {
		return HttpResponse.json({
			user: global.createMockUser(),
			session: {
				access_token: 'mock-access-token',
				refresh_token: 'mock-refresh-token',
				expires_in: 3600
			}
		});
	}),

	http.post('/api/auth/logout', () => {
		return HttpResponse.json({ success: true });
	}),

	// Course endpoints
	http.get('/api/courses', () => {
		return HttpResponse.json([
			global.createMockCourse({ id: '1', title: 'Course 1' }),
			global.createMockCourse({ id: '2', title: 'Course 2' })
		]);
	}),

	http.get('/api/courses/:id', ({ params }) => {
		return HttpResponse.json(
			global.createMockCourse({ id: params.id as string })
		);
	}),

	http.post('/api/courses', async ({ request }) => {
		const body = await request.json();
		return HttpResponse.json(
			global.createMockCourse(body),
			{ status: 201 }
		);
	}),

	http.put('/api/courses/:id', async ({ params, request }) => {
		const body = await request.json();
		return HttpResponse.json(
			global.createMockCourse({ id: params.id as string, ...body })
		);
	}),

	http.delete('/api/courses/:id', () => {
		return HttpResponse.json({ success: true });
	}),

	// Lesson endpoints
	http.get('/api/lessons/:id', ({ params }) => {
		return HttpResponse.json(
			global.createMockLesson({ id: params.id as string })
		);
	}),

	http.post('/api/lessons', async ({ request }) => {
		const body = await request.json();
		return HttpResponse.json(
			global.createMockLesson(body),
			{ status: 201 }
		);
	}),

	// Assessment endpoints
	http.get('/api/assessments/:id', ({ params }) => {
		return HttpResponse.json(
			global.createMockAssessment({ id: params.id as string })
		);
	}),

	http.post('/api/assessments', async ({ request }) => {
		const body = await request.json();
		return HttpResponse.json(
			global.createMockAssessment(body),
			{ status: 201 }
		);
	}),

	http.post('/api/assessments/:id/submit', async ({ params, request }) => {
		const body = await request.json();
		return HttpResponse.json({
			id: 'mock-attempt-id',
			assessment_id: params.id,
			student_id: 'test-user-id',
			attempt_number: 1,
			answers: body.answers,
			score: 85,
			points_earned: 85,
			total_points: 100,
			passed: true,
			time_spent: 300,
			started_at: new Date().toISOString(),
			submitted_at: new Date().toISOString(),
			feedback: {
				overall_feedback: 'Good job!',
				strengths: ['Strong understanding of concepts'],
				areas_for_improvement: ['Practice more complex problems'],
				recommended_resources: [],
				next_steps: 'Continue to next lesson'
			}
		});
	}),

	// AI endpoints
	http.post('/api/ai/generate-roadmap', () => {
		return HttpResponse.json({
			roadmap_data: {
				learning_path: [
					{
						content_id: 'lesson-1',
						content_type: 'lesson',
						order_index: 0,
						estimated_time: 30,
						prerequisites: [],
						learning_objectives: ['Learn basics'],
						personalization_notes: 'Start with fundamentals',
						is_unlocked: true,
						completion_status: 'not_started'
					}
				],
				estimated_completion_time: 120,
				difficulty_progression: { start: 'beginner', end: 'intermediate' },
				personalization_factors: { knowledge_gaps: ['basics'] }
			},
			ai_reasoning: 'Based on your knowledge profile, starting with fundamentals is recommended.'
		});
	}),

	http.post('/api/ai/generate-assessment', () => {
		return HttpResponse.json({
			questions: [
				{
					id: 'ai-q1',
					type: 'multiple_choice',
					question_text: 'AI generated question?',
					options: ['Yes', 'No', 'Maybe', 'Always'],
					correct_answer: 'Yes',
					explanation: 'This is an AI generated question',
					difficulty_level: 2,
					topics: ['ai', 'testing'],
					points: 10
				}
			],
			metadata: {
				source_content_analyzed: true,
				confidence_score: 0.95,
				generation_time: 1500
			}
		});
	}),

	// Progress endpoints
	http.get('/api/progress/:studentId', ({ params }) => {
		return HttpResponse.json([
			{
				id: 'progress-1',
				student_id: params.studentId,
				course_id: 'course-1',
				lesson_id: 'lesson-1',
				status: 'completed',
				completion_percentage: 100,
				last_accessed: new Date().toISOString(),
				time_spent: 1800,
				attempts_count: 1,
				best_score: 85
			}
		]);
	}),

	http.post('/api/progression/update-progress', async ({ request }) => {
		const body = await request.json();
		return HttpResponse.json({
			success: true,
			progress: body
		});
	}),

	// Media endpoints
	http.post('/api/media/upload', () => {
		return HttpResponse.json({
			url: 'https://example.com/uploaded-file.jpg',
			filename: 'test-file.jpg',
			size: 1024,
			type: 'image/jpeg'
		});
	}),

	// Analytics endpoints
	http.get('/api/analytics/student/:id', ({ params }) => {
		return HttpResponse.json({
			student_id: params.id,
			total_courses: 3,
			completed_courses: 1,
			total_lessons: 15,
			completed_lessons: 8,
			total_assessments: 10,
			passed_assessments: 7,
			average_score: 82,
			time_spent: 7200,
			learning_streak: 5
		});
	}),

	http.get('/api/analytics/instructor/:id', ({ params }) => {
		return HttpResponse.json({
			instructor_id: params.id,
			total_courses: 2,
			total_students: 25,
			average_completion_rate: 0.78,
			average_assessment_score: 79,
			engagement_metrics: {
				daily_active_users: 18,
				weekly_active_users: 23,
				monthly_active_users: 25
			}
		});
	})
];