import { test, expect } from '@playwright/test';

test.describe('Course Management', () => {
	test.beforeEach(async ({ page }) => {
		// Login as instructor
		await page.goto('/auth/login');
		await page.fill('[data-testid="email-input"]', 'instructor@example.com');
		await page.fill('[data-testid="password-input"]', 'password123');
		await page.click('[data-testid="login-button"]');
		await expect(page).toHaveURL('/dashboard');
	});

	test('should create a new course', async ({ page }) => {
		// Navigate to course creation
		await page.click('[data-testid="create-course-button"]');
		await expect(page).toHaveURL('/courses/create');

		// Fill course form
		await page.fill('[data-testid="course-title-input"]', 'Test Course');
		await page.fill('[data-testid="course-description-textarea"]', 'This is a test course description');
		await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
		await page.fill('[data-testid="estimated-duration-input"]', '120');
		await page.fill('[data-testid="tags-input"]', 'test, programming');

		// Submit form
		await page.click('[data-testid="create-course-button"]');

		// Should redirect to course page
		await expect(page).toHaveURL(/\/courses\/[a-zA-Z0-9-]+$/);
		await expect(page.locator('[data-testid="course-title"]')).toContainText('Test Course');
		await expect(page.locator('[data-testid="course-description"]')).toContainText('This is a test course description');
	});

	test('should validate course creation form', async ({ page }) => {
		await page.click('[data-testid="create-course-button"]');

		// Try to submit empty form
		await page.click('[data-testid="create-course-button"]');

		// Should show validation errors
		await expect(page.locator('[data-testid="title-error"]')).toContainText('Title is required');
		await expect(page.locator('[data-testid="description-error"]')).toContainText('Description is required');
	});

	test('should edit existing course', async ({ page }) => {
		// Navigate to courses list
		await page.click('[data-testid="my-courses-link"]');
		await expect(page).toHaveURL('/courses');

		// Click on first course
		await page.click('[data-testid="course-card"]:first-child');

		// Click edit button
		await page.click('[data-testid="edit-course-button"]');
		await expect(page).toHaveURL(/\/courses\/[a-zA-Z0-9-]+\/edit$/);

		// Update course details
		await page.fill('[data-testid="course-title-input"]', 'Updated Course Title');
		await page.fill('[data-testid="course-description-textarea"]', 'Updated course description');

		// Save changes
		await page.click('[data-testid="save-course-button"]');

		// Should show success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText('Course updated successfully');
		await expect(page.locator('[data-testid="course-title"]')).toContainText('Updated Course Title');
	});

	test('should create lessons within a course', async ({ page }) => {
		// Navigate to a course
		await page.click('[data-testid="my-courses-link"]');
		await page.click('[data-testid="course-card"]:first-child');

		// Create new lesson
		await page.click('[data-testid="add-lesson-button"]');
		await expect(page).toHaveURL(/\/lessons\/create\?course=/);

		// Fill lesson form
		await page.fill('[data-testid="lesson-title-input"]', 'Introduction Lesson');
		await page.fill('[data-testid="lesson-description-textarea"]', 'This is an introduction lesson');
		await page.fill('[data-testid="learning-objectives-textarea"]', 'Understand basic concepts\nLearn fundamental principles');
		await page.fill('[data-testid="estimated-duration-input"]', '30');

		// Add content blocks
		await page.click('[data-testid="add-content-block-button"]');
		await page.selectOption('[data-testid="content-type-select"]', 'rich_text');
		
		// Fill rich text content
		await page.fill('[data-testid="rich-text-editor"]', 'Welcome to this lesson! This is the introduction content.');

		// Save lesson
		await page.click('[data-testid="save-lesson-button"]');

		// Should redirect back to course
		await expect(page).toHaveURL(/\/courses\/[a-zA-Z0-9-]+$/);
		await expect(page.locator('[data-testid="lesson-item"]')).toContainText('Introduction Lesson');
	});

	test('should upload and manage media in lessons', async ({ page }) => {
		// Navigate to lesson editor
		await page.click('[data-testid="my-courses-link"]');
		await page.click('[data-testid="course-card"]:first-child');
		await page.click('[data-testid="add-lesson-button"]');

		await page.fill('[data-testid="lesson-title-input"]', 'Media Lesson');
		await page.fill('[data-testid="lesson-description-textarea"]', 'Lesson with media content');

		// Add image content block
		await page.click('[data-testid="add-content-block-button"]');
		await page.selectOption('[data-testid="content-type-select"]', 'image');

		// Upload image
		const fileInput = page.locator('[data-testid="image-upload-input"]');
		await fileInput.setInputFiles('tests/fixtures/test-image.jpg');

		// Wait for upload to complete
		await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

		// Add alt text
		await page.fill('[data-testid="alt-text-input"]', 'Test image description');

		// Add video content block
		await page.click('[data-testid="add-content-block-button"]');
		await page.selectOption('[data-testid="content-type-select"]', 'youtube');

		// Add YouTube URL
		await page.fill('[data-testid="youtube-url-input"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		await page.click('[data-testid="validate-youtube-button"]');

		// Wait for validation
		await expect(page.locator('[data-testid="youtube-preview"]')).toBeVisible();

		// Save lesson
		await page.click('[data-testid="save-lesson-button"]');

		// Verify media content is saved
		await expect(page.locator('[data-testid="lesson-item"]')).toContainText('Media Lesson');
	});

	test('should publish and unpublish courses', async ({ page }) => {
		await page.click('[data-testid="my-courses-link"]');
		await page.click('[data-testid="course-card"]:first-child');

		// Check current publication status
		const publishButton = page.locator('[data-testid="publish-course-button"]');
		const unpublishButton = page.locator('[data-testid="unpublish-course-button"]');

		if (await publishButton.isVisible()) {
			// Course is unpublished, publish it
			await publishButton.click();
			await expect(page.locator('[data-testid="course-status"]')).toContainText('Published');
			await expect(unpublishButton).toBeVisible();
		} else {
			// Course is published, unpublish it
			await unpublishButton.click();
			await expect(page.locator('[data-testid="course-status"]')).toContainText('Draft');
			await expect(publishButton).toBeVisible();
		}
	});

	test('should delete course with confirmation', async ({ page }) => {
		await page.click('[data-testid="my-courses-link"]');
		await page.click('[data-testid="course-card"]:first-child');

		// Click delete button
		await page.click('[data-testid="delete-course-button"]');

		// Should show confirmation dialog
		await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
		await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('Are you sure you want to delete this course?');

		// Cancel deletion
		await page.click('[data-testid="cancel-delete-button"]');
		await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible();

		// Try delete again and confirm
		await page.click('[data-testid="delete-course-button"]');
		await page.click('[data-testid="confirm-delete-button"]');

		// Should redirect to courses list
		await expect(page).toHaveURL('/courses');
		await expect(page.locator('[data-testid="success-message"]')).toContainText('Course deleted successfully');
	});

	test('should handle course enrollment for students', async ({ page }) => {
		// Logout and login as student
		await page.click('[data-testid="user-menu"]');
		await page.click('text=Sign Out');

		await page.goto('/auth/login');
		await page.fill('[data-testid="email-input"]', 'student@example.com');
		await page.fill('[data-testid="password-input"]', 'password123');
		await page.click('[data-testid="login-button"]');

		// Browse available courses
		await page.click('[data-testid="browse-courses-link"]');
		await expect(page).toHaveURL('/courses');

		// Enroll in a course
		await page.click('[data-testid="course-card"]:first-child');
		await page.click('[data-testid="enroll-button"]');

		// Should show enrollment confirmation
		await expect(page.locator('[data-testid="enrollment-success"]')).toContainText('Successfully enrolled');
		await expect(page.locator('[data-testid="start-course-button"]')).toBeVisible();

		// Start the course
		await page.click('[data-testid="start-course-button"]');

		// Should navigate to first lesson
		await expect(page).toHaveURL(/\/lessons\/[a-zA-Z0-9-]+$/);
	});

	test('should show course analytics for instructors', async ({ page }) => {
		await page.click('[data-testid="my-courses-link"]');
		await page.click('[data-testid="course-card"]:first-child');

		// Navigate to analytics
		await page.click('[data-testid="course-analytics-tab"]');

		// Should show analytics dashboard
		await expect(page.locator('[data-testid="enrollment-stats"]')).toBeVisible();
		await expect(page.locator('[data-testid="completion-stats"]')).toBeVisible();
		await expect(page.locator('[data-testid="engagement-metrics"]')).toBeVisible();

		// Check for charts and graphs
		await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
		await expect(page.locator('[data-testid="assessment-scores-chart"]')).toBeVisible();
	});
});