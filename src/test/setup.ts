import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
	server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
	server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
	server.close();
});

// Mock environment variables
vi.mock('$env/static/public', () => ({
	PUBLIC_SUPABASE_URL: 'http://localhost:54321',
	PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
}));

vi.mock('$env/static/private', () => ({
	OPENAI_API_KEY: 'test-openai-key',
	AI_MODEL: 'gpt-4'
}));

// Mock Supabase client
vi.mock('$lib/supabase', () => ({
	supabase: {
		auth: {
			getSession: vi.fn(),
			signIn: vi.fn(),
			signOut: vi.fn(),
			signUp: vi.fn(),
			onAuthStateChange: vi.fn()
		},
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn(),
			order: vi.fn().mockReturnThis()
		})),
		storage: {
			from: vi.fn(() => ({
				upload: vi.fn(),
				download: vi.fn(),
				remove: vi.fn(),
				list: vi.fn()
			}))
		}
	}
}));

// Mock AI service
vi.mock('$lib/services/ai', () => ({
	generateRoadmap: vi.fn(),
	generateAssessment: vi.fn(),
	analyzeContent: vi.fn()
}));

// Global test utilities
global.createMockUser = (overrides = {}) => ({
	id: 'test-user-id',
	email: 'test@example.com',
	role: 'student',
	profile: {
		first_name: 'Test',
		last_name: 'User',
		learning_preferences: {
			preferred_pace: 'medium',
			preferred_media_types: ['video', 'text'],
			learning_style: 'visual'
		},
		knowledge_profile: {
			subject_areas: [],
			skill_levels: [],
			last_assessed: new Date().toISOString()
		}
	},
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});

global.createMockCourse = (overrides = {}) => ({
	id: 'test-course-id',
	title: 'Test Course',
	description: 'A test course',
	instructor_id: 'test-instructor-id',
	lessons: [],
	final_assessment_id: 'test-assessment-id',
	tags: ['test'],
	difficulty_level: 'beginner',
	estimated_duration: 60,
	is_published: true,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});

global.createMockLesson = (overrides = {}) => ({
	id: 'test-lesson-id',
	course_id: 'test-course-id',
	title: 'Test Lesson',
	description: 'A test lesson',
	order_index: 1,
	content_blocks: [],
	learning_objectives: ['Learn testing'],
	estimated_duration: 30,
	assessment_id: 'test-lesson-assessment-id',
	prerequisites: [],
	is_published: true,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});

global.createMockAssessment = (overrides = {}) => ({
	id: 'test-assessment-id',
	lesson_id: 'test-lesson-id',
	title: 'Test Assessment',
	description: 'A test assessment',
	questions: [
		{
			id: 'q1',
			type: 'multiple_choice',
			question_text: 'What is 2 + 2?',
			options: ['3', '4', '5', '6'],
			correct_answer: '4',
			explanation: '2 + 2 equals 4',
			difficulty_level: 1,
			topics: ['math'],
			points: 10
		}
	],
	ai_generated: false,
	source_content_ids: [],
	is_mandatory: true,
	minimum_passing_score: 70,
	max_attempts: null,
	time_limit: null,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});