export const testUsers = {
	instructor: {
		id: 'instructor-1',
		email: 'instructor@example.com',
		password: 'password123',
		role: 'instructor',
		profile: {
			first_name: 'John',
			last_name: 'Instructor',
			avatar_url: null,
			learning_preferences: null,
			knowledge_profile: null
		}
	},
	student: {
		id: 'student-1',
		email: 'student@example.com',
		password: 'password123',
		role: 'student',
		profile: {
			first_name: 'Jane',
			last_name: 'Student',
			avatar_url: null,
			learning_preferences: {
				preferred_pace: 'medium',
				preferred_media_types: ['video', 'text'],
				learning_style: 'visual'
			},
			knowledge_profile: {
				subject_areas: [
					{
						subject: 'JavaScript',
						level: 'beginner',
						confidence: 0.6
					}
				],
				skill_levels: [],
				last_assessed: '2024-01-01T00:00:00Z'
			}
		}
	},
	admin: {
		id: 'admin-1',
		email: 'admin@example.com',
		password: 'password123',
		role: 'admin',
		profile: {
			first_name: 'Admin',
			last_name: 'User',
			avatar_url: null,
			learning_preferences: null,
			knowledge_profile: null
		}
	}
};

export const testCourses = [
	{
		id: 'course-1',
		title: 'JavaScript Fundamentals',
		description: 'Learn the basics of JavaScript programming',
		instructor_id: 'instructor-1',
		difficulty_level: 'beginner',
		estimated_duration: 120,
		tags: ['javascript', 'programming', 'web'],
		is_published: true,
		lessons: [
			{
				id: 'lesson-1',
				title: 'Introduction to JavaScript',
				description: 'Basic concepts and syntax',
				order_index: 1,
				estimated_duration: 30,
				content_blocks: [
					{
						id: 'block-1',
						type: 'rich_text',
						content: {
							rich_text: {
								html: '<h2>Welcome to JavaScript</h2><p>JavaScript is a programming language...</p>',
								plain_text: 'Welcome to JavaScript\n\nJavaScript is a programming language...'
							}
						},
						order_index: 1
					}
				],
				assessment_id: 'assessment-1'
			},
			{
				id: 'lesson-2',
				title: 'Variables and Data Types',
				description: 'Understanding JavaScript variables',
				order_index: 2,
				estimated_duration: 45,
				prerequisites: ['lesson-1'],
				content_blocks: [
					{
						id: 'block-2',
						type: 'rich_text',
						content: {
							rich_text: {
								html: '<h2>Variables</h2><p>Variables store data values...</p>',
								plain_text: 'Variables\n\nVariables store data values...'
							}
						},
						order_index: 1
					}
				],
				assessment_id: 'assessment-2'
			}
		]
	},
	{
		id: 'course-2',
		title: 'Advanced React Patterns',
		description: 'Master advanced React development patterns',
		instructor_id: 'instructor-1',
		difficulty_level: 'advanced',
		estimated_duration: 240,
		tags: ['react', 'javascript', 'advanced'],
		is_published: false,
		lessons: []
	}
];

export const testAssessments = [
	{
		id: 'assessment-1',
		lesson_id: 'lesson-1',
		title: 'JavaScript Introduction Quiz',
		description: 'Test your understanding of JavaScript basics',
		questions: [
			{
				id: 'q1',
				type: 'multiple_choice',
				question_text: 'What does JavaScript stand for?',
				options: [
					'Java Standard Code Runtime',
					'JavaScript is not an acronym',
					'Java Syntax Code Runtime',
					'Just Another Scripting Language'
				],
				correct_answer: 'JavaScript is not an acronym',
				explanation: 'JavaScript is not an acronym. It was originally called LiveScript.',
				difficulty_level: 1,
				topics: ['basics'],
				points: 10
			},
			{
				id: 'q2',
				type: 'true_false',
				question_text: 'JavaScript is the same as Java.',
				correct_answer: 'False',
				explanation: 'JavaScript and Java are completely different programming languages.',
				difficulty_level: 1,
				topics: ['basics'],
				points: 5
			},
			{
				id: 'q3',
				type: 'short_answer',
				question_text: 'What is the purpose of the console.log() function?',
				correct_answer: 'To output/display information to the console',
				explanation: 'console.log() is used to print output to the browser console for debugging.',
				difficulty_level: 2,
				topics: ['debugging', 'console'],
				points: 15
			}
		],
		minimum_passing_score: 70,
		time_limit: 30,
		max_attempts: 3,
		ai_generated: false
	},
	{
		id: 'assessment-2',
		lesson_id: 'lesson-2',
		title: 'Variables and Data Types Quiz',
		description: 'Test your knowledge of JavaScript variables',
		questions: [
			{
				id: 'q4',
				type: 'multiple_choice',
				question_text: 'Which keyword is used to declare a variable in modern JavaScript?',
				options: ['var', 'let', 'const', 'All of the above'],
				correct_answer: 'All of the above',
				explanation: 'var, let, and const can all be used to declare variables, with different scoping rules.',
				difficulty_level: 2,
				topics: ['variables'],
				points: 10
			}
		],
		minimum_passing_score: 70,
		time_limit: 20,
		max_attempts: 3,
		ai_generated: true
	}
];

export const testProgressData = [
	{
		id: 'progress-1',
		student_id: 'student-1',
		course_id: 'course-1',
		lesson_id: 'lesson-1',
		status: 'completed',
		completion_percentage: 100,
		time_spent: 1800,
		best_score: 85,
		attempts_count: 1
	},
	{
		id: 'progress-2',
		student_id: 'student-1',
		course_id: 'course-1',
		lesson_id: 'lesson-2',
		status: 'not_started',
		completion_percentage: 0,
		time_spent: 0,
		best_score: null,
		attempts_count: 0
	}
];

export const testAssessmentAttempts = [
	{
		id: 'attempt-1',
		assessment_id: 'assessment-1',
		student_id: 'student-1',
		attempt_number: 1,
		answers: [
			{
				question_id: 'q1',
				student_answer: 'JavaScript is not an acronym',
				is_correct: true,
				points_earned: 10
			},
			{
				question_id: 'q2',
				student_answer: 'False',
				is_correct: true,
				points_earned: 5
			},
			{
				question_id: 'q3',
				student_answer: 'To display information in the console',
				is_correct: true,
				points_earned: 15
			}
		],
		score: 100,
		points_earned: 30,
		total_points: 30,
		passed: true,
		time_spent: 420,
		started_at: '2024-01-01T10:00:00Z',
		submitted_at: '2024-01-01T10:07:00Z',
		feedback: {
			overall_feedback: 'Excellent work! You have a solid understanding of JavaScript basics.',
			strengths: ['Strong grasp of fundamental concepts', 'Good understanding of console methods'],
			areas_for_improvement: [],
			recommended_resources: [],
			next_steps: 'Continue to the next lesson on Variables and Data Types'
		}
	}
];

export const testRoadmaps = [
	{
		id: 'roadmap-1',
		student_id: 'student-1',
		roadmap_data: {
			learning_path: [
				{
					content_id: 'lesson-1',
					content_type: 'lesson',
					order_index: 0,
					estimated_time: 30,
					prerequisites: [],
					learning_objectives: ['Understand JavaScript basics'],
					personalization_notes: 'Start with fundamentals based on beginner level',
					is_unlocked: true,
					completion_status: 'completed'
				},
				{
					content_id: 'assessment-1',
					content_type: 'assessment',
					order_index: 1,
					estimated_time: 30,
					prerequisites: ['lesson-1'],
					learning_objectives: ['Demonstrate understanding of basics'],
					personalization_notes: 'Assessment required before progression',
					is_unlocked: true,
					completion_status: 'completed'
				},
				{
					content_id: 'lesson-2',
					content_type: 'lesson',
					order_index: 2,
					estimated_time: 45,
					prerequisites: ['assessment-1'],
					learning_objectives: ['Learn about variables and data types'],
					personalization_notes: 'Next logical step in learning progression',
					is_unlocked: true,
					completion_status: 'not_started'
				}
			],
			estimated_completion_time: 105,
			difficulty_progression: {
				start: 'beginner',
				end: 'intermediate'
			},
			personalization_factors: {
				knowledge_gaps: ['variables', 'data-types'],
				learning_style: 'visual',
				preferred_pace: 'medium'
			}
		},
		ai_reasoning: 'Based on your beginner level in JavaScript and visual learning preference, this roadmap starts with fundamental concepts and progresses logically through core topics.',
		status: 'active'
	}
];

// Helper functions for test data
export const createTestUser = (overrides = {}) => ({
	...testUsers.student,
	...overrides,
	id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
});

export const createTestCourse = (overrides = {}) => ({
	...testCourses[0],
	...overrides,
	id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
});

export const createTestAssessment = (overrides = {}) => ({
	...testAssessments[0],
	...overrides,
	id: `assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
});

export const createTestAttempt = (overrides = {}) => ({
	...testAssessmentAttempts[0],
	...overrides,
	id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
});