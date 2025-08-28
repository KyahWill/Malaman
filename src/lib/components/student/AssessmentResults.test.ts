import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import AssessmentResults from './AssessmentResults.svelte';

// Mock the stores
vi.mock('$lib/stores/auth', () => ({
	user: {
		subscribe: vi.fn((callback) => {
			callback(global.createMockUser());
			return () => {};
		})
	}
}));

describe('AssessmentResults Component', () => {
	const mockAttempt = {
		id: 'attempt-1',
		assessment_id: 'assessment-1',
		student_id: 'student-1',
		attempt_number: 1,
		answers: [
			{
				question_id: 'q1',
				student_answer: '4',
				is_correct: true,
				points_earned: 10,
				feedback: 'Correct!'
			},
			{
				question_id: 'q2',
				student_answer: 'False',
				is_correct: false,
				points_earned: 0,
				feedback: 'Incorrect. The correct answer is True.'
			}
		],
		score: 50,
		points_earned: 10,
		total_points: 20,
		passed: false,
		time_spent: 300,
		started_at: '2024-01-01T10:00:00Z',
		submitted_at: '2024-01-01T10:05:00Z',
		feedback: {
			overall_feedback: 'Good effort, but needs improvement',
			strengths: ['Good understanding of basic concepts'],
			areas_for_improvement: ['Review advanced topics'],
			recommended_resources: ['Chapter 5 of the textbook'],
			next_steps: 'Retake the assessment after reviewing'
		}
	};

	const mockAssessment = global.createMockAssessment({
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
			},
			{
				id: 'q2',
				type: 'true_false',
				question_text: 'The sky is blue.',
				correct_answer: 'True',
				explanation: 'The sky appears blue due to light scattering',
				difficulty_level: 1,
				topics: ['science'],
				points: 10
			}
		]
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render assessment results with attempt data', async () => {
		render(AssessmentResults, {
			props: {
				attempt: mockAttempt,
				assessment: mockAssessment
			}
		});

		await waitFor(() => {
			expect(screen.getByText('Assessment Results')).toBeInTheDocument();
			expect(screen.getByText('Score: 50%')).toBeInTheDocument();
			expect(screen.getByText('Points: 10 / 20')).toBeInTheDocument();
			expect(screen.getByText('Status: Failed')).toBeInTheDocument();
		});
	});

	it('should display passing status for passed attempts', async () => {
		const passingAttempt = {
			...mockAttempt,
			score: 85,
			points_earned: 17,
			passed: true
		};

		render(AssessmentResults, {
			props: {
				attempt: passingAttempt,
				assessment: mockAssessment
			}
		});

		await waitFor(() => {
			expect(screen.getByText('Status: Passed')).toBeInTheDocument();
			expect(screen.getByText('Score: 85%')).toBeInTheDocument();
		});
	});

	it('should show detailed question results', async () => {
		render(AssessmentResults, {
			props: {
				attempt: mockAttempt,
				assessment: mockAssessment,
				showDetails: true
			}
		});

		await waitFor(() => {
			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
			expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
			expect(screen.getByText('Your answer: 4')).toBeInTheDocument();
			expect(screen.getByText('Your answer: False')).toBeInTheDocument();
		});
	});

	it('should display feedback when available', async () => {
		render(AssessmentResults, {
			props: {
				attempt: mockAttempt,
				assessment: mockAssessment,
				showFeedback: true
			}
		});

		await waitFor(() => {
			expect(screen.getByText('Good effort, but needs improvement')).toBeInTheDocument();
			expect(screen.getByText('Good understanding of basic concepts')).toBeInTheDocument();
			expect(screen.getByText('Review advanced topics')).toBeInTheDocument();
			expect(screen.getByText('Chapter 5 of the textbook')).toBeInTheDocument();
		});
	});

	it('should show time spent on assessment', async () => {
		render(AssessmentResults, {
			props: {
				attempt: mockAttempt,
				assessment: mockAssessment
			}
		});

		await waitFor(() => {
			expect(screen.getByText('Time Spent: 5 minutes')).toBeInTheDocument();
		});
	});

	it('should display attempt information', async () => {
		render(AssessmentResults, {
			props: {
				attempt: mockAttempt,
				assessment: mockAssessment
			}
		});

		await waitFor(() => {
			expect(screen.getByText('Attempt #1')).toBeInTheDocument();
			expect(screen.getByText(/Submitted on/)).toBeInTheDocument();
		});
	});

	it('should show correct/incorrect indicators for each question', async () => {
		render(AssessmentResults, {
			props: {
				attempt: mockAttempt,
				assessment: mockAssessment,
				showDetails: true
			}
		});

		await waitFor(() => {
			const correctIndicators = screen.getAllByText('✓');
			const incorrectIndicators = screen.getAllByText('✗');
			
			expect(correctIndicators).toHaveLength(1);
			expect(incorrectIndicators).toHaveLength(1);
		});
	});

	it('should display explanations for questions', async () => {
		render(AssessmentResults, {
			props: {
				attempt: mockAttempt,
				assessment: mockAssessment,
				showDetails: true,
				showExplanations: true
			}
		});

		await waitFor(() => {
			expect(screen.getByText('2 + 2 equals 4')).toBeInTheDocument();
			expect(screen.getByText('The sky appears blue due to light scattering')).toBeInTheDocument();
		});
	});

	it('should handle missing feedback gracefully', async () => {
		const attemptWithoutFeedback = {
			...mockAttempt,
			feedback: null
		};

		render(AssessmentResults, {
			props: {
				attempt: attemptWithoutFeedback,
				assessment: mockAssessment,
				showFeedback: true
			}
		});

		await waitFor(() => {
			expect(screen.getByText('Score: 50%')).toBeInTheDocument();
			// Should not crash when feedback is missing
		});
	});

	it('should show retake option for failed attempts', async () => {
		render(AssessmentResults, {
			props: {
				attempt: mockAttempt,
				assessment: mockAssessment,
				allowRetake: true
			}
		});

		await waitFor(() => {
			expect(screen.getByText('Retake Assessment')).toBeInTheDocument();
		});
	});

	it('should not show retake option for passed attempts', async () => {
		const passingAttempt = {
			...mockAttempt,
			score: 85,
			passed: true
		};

		render(AssessmentResults, {
			props: {
				attempt: passingAttempt,
				assessment: mockAssessment,
				allowRetake: true
			}
		});

		await waitFor(() => {
			expect(screen.queryByText('Retake Assessment')).not.toBeInTheDocument();
		});
	});

	it('should display progress towards next content', async () => {
		const passingAttempt = {
			...mockAttempt,
			score: 85,
			passed: true
		};

		render(AssessmentResults, {
			props: {
				attempt: passingAttempt,
				assessment: mockAssessment,
				nextContent: {
					type: 'lesson',
					title: 'Next Lesson: Advanced Topics',
					url: '/lessons/advanced-topics'
				}
			}
		});

		await waitFor(() => {
			expect(screen.getByText('Continue to Next Lesson')).toBeInTheDocument();
			expect(screen.getByText('Next Lesson: Advanced Topics')).toBeInTheDocument();
		});
	});
});