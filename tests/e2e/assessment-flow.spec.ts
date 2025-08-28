import { test, expect } from '@playwright/test';

test.describe('Assessment Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Login as student
		await page.goto('/auth/login');
		await page.fill('[data-testid="email-input"]', 'student@example.com');
		await page.fill('[data-testid="password-input"]', 'password123');
		await page.click('[data-testid="login-button"]');
		await expect(page).toHaveURL('/dashboard');
	});

	test('should complete a lesson assessment successfully', async ({ page }) => {
		// Navigate to a course
		await page.click('[data-testid="my-courses-link"]');
		await page.click('[data-testid="course-card"]:first-child');

		// Start first lesson
		await page.click('[data-testid="lesson-item"]:first-child');
		await expect(page).toHaveURL(/\/lessons\/[a-zA-Z0-9-]+$/);

		// Complete lesson content
		await page.click('[data-testid="mark-complete-button"]');

		// Should be prompted to take assessment
		await expect(page.locator('[data-testid="assessment-prompt"]')).toBeVisible();
		await page.click('[data-testid="start-assessment-button"]');

		// Should navigate to assessment
		await expect(page).toHaveURL(/\/assessments\/[a-zA-Z0-9-]+\/take$/);

		// Answer questions
		await page.click('[data-testid="question-1"] [data-testid="option-b"]');
		await page.click('[data-testid="question-2"] [data-testid="option-true"]');
		await page.fill('[data-testid="question-3"] [data-testid="short-answer-input"]', 'This is my answer');

		// Submit assessment
		await page.click('[data-testid="submit-assessment-button"]');

		// Should show confirmation dialog
		await expect(page.locator('[data-testid="submit-confirmation"]')).toBeVisible();
		await page.click('[data-testid="confirm-submit-button"]');

		// Should navigate to results page
		await expect(page).toHaveURL(/\/assessments\/[a-zA-Z0-9-]+\/results\/[a-zA-Z0-9-]+$/);

		// Should show results
		await expect(page.locator('[data-testid="assessment-score"]')).toBeVisible();
		await expect(page.locator('[data-testid="pass-fail-status"]')).toBeVisible();
	});

	test('should handle assessment timer correctly', async ({ page }) => {
		// Navigate to timed assessment
		await page.goto('/assessments/timed-assessment-id/take');

		// Should show timer
		await expect(page.locator('[data-testid="assessment-timer"]')).toBeVisible();
		await expect(page.locator('[data-testid="time-remaining"]')).toContainText('30:00');

		// Answer some questions
		await page.click('[data-testid="question-1"] [data-testid="option-a"]');

		// Wait for timer to count down
		await page.waitForTimeout(2000);
		await expect(page.locator('[data-testid="time-remaining"]')).toContainText('29:5');

		// Timer should show warning when time is low
		// (This would require mocking or speeding up time in a real test)
	});

	test('should save progress automatically', async ({ page }) => {
		await page.goto('/assessments/test-assessment-id/take');

		// Answer first question
		await page.click('[data-testid="question-1"] [data-testid="option-b"]');

		// Should show auto-save indicator
		await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Saved');

		// Navigate away and back
		await page.goBack();
		await page.goForward();

		// Answer should be preserved
		await expect(page.locator('[data-testid="question-1"] [data-testid="option-b"]')).toBeChecked();
	});

	test('should handle assessment retakes', async ({ page }) => {
		// Take assessment and fail
		await page.goto('/assessments/retakeable-assessment-id/take');

		// Answer incorrectly
		await page.click('[data-testid="question-1"] [data-testid="option-wrong"]');
		await page.click('[data-testid="question-2"] [data-testid="option-wrong"]');

		await page.click('[data-testid="submit-assessment-button"]');
		await page.click('[data-testid="confirm-submit-button"]');

		// Should show failed result
		await expect(page.locator('[data-testid="pass-fail-status"]')).toContainText('Failed');

		// Should offer retake option
		await expect(page.locator('[data-testid="retake-button"]')).toBeVisible();
		await page.click('[data-testid="retake-button"]');

		// Should start new attempt
		await expect(page).toHaveURL(/\/assessments\/[a-zA-Z0-9-]+\/take$/);
		await expect(page.locator('[data-testid="attempt-number"]')).toContainText('Attempt 2');

		// Previous answers should be cleared
		await expect(page.locator('[data-testid="question-1"] input:checked')).toHaveCount(0);
	});

	test('should show detailed feedback after assessment', async ({ page }) => {
		await page.goto('/assessments/test-assessment-id/take');

		// Complete assessment
		await page.click('[data-testid="question-1"] [data-testid="option-correct"]');
		await page.click('[data-testid="question-2"] [data-testid="option-correct"]');
		await page.click('[data-testid="submit-assessment-button"]');
		await page.click('[data-testid="confirm-submit-button"]');

		// Should show detailed results
		await expect(page.locator('[data-testid="overall-feedback"]')).toBeVisible();
		await expect(page.locator('[data-testid="strengths-section"]')).toBeVisible();
		await expect(page.locator('[data-testid="improvements-section"]')).toBeVisible();

		// Should show question-by-question breakdown
		await page.click('[data-testid="show-details-button"]');
		await expect(page.locator('[data-testid="question-breakdown"]')).toBeVisible();

		// Each question should show correct/incorrect status
		await expect(page.locator('[data-testid="question-1-status"]')).toContainText('Correct');
		await expect(page.locator('[data-testid="question-1-explanation"]')).toBeVisible();
	});

	test('should prevent cheating attempts', async ({ page }) => {
		await page.goto('/assessments/secure-assessment-id/take');

		// Should detect tab switching
		await page.evaluate(() => {
			window.dispatchEvent(new Event('blur'));
		});

		await expect(page.locator('[data-testid="tab-switch-warning"]')).toBeVisible();

		// Should limit copy/paste
		await page.locator('[data-testid="question-1"] [data-testid="short-answer-input"]').focus();
		await page.keyboard.press('Control+V');

		await expect(page.locator('[data-testid="paste-warning"]')).toBeVisible();

		// Should prevent right-click context menu
		await page.locator('[data-testid="question-text"]').click({ button: 'right' });
		// Context menu should not appear (this is harder to test directly)
	});

	test('should handle network interruptions gracefully', async ({ page }) => {
		await page.goto('/assessments/test-assessment-id/take');

		// Answer some questions
		await page.click('[data-testid="question-1"] [data-testid="option-a"]');

		// Simulate network failure
		await page.setOffline(true);

		// Try to submit
		await page.click('[data-testid="submit-assessment-button"]');
		await page.click('[data-testid="confirm-submit-button"]');

		// Should show offline message
		await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();

		// Restore network
		await page.setOffline(false);

		// Should automatically retry submission
		await expect(page.locator('[data-testid="submission-success"]')).toBeVisible();
	});

	test('should generate assessment certificate for passed attempts', async ({ page }) => {
		// Complete assessment successfully
		await page.goto('/assessments/certificate-assessment-id/take');

		await page.click('[data-testid="question-1"] [data-testid="option-correct"]');
		await page.click('[data-testid="question-2"] [data-testid="option-correct"]');
		await page.click('[data-testid="submit-assessment-button"]');
		await page.click('[data-testid="confirm-submit-button"]');

		// Should show passed status
		await expect(page.locator('[data-testid="pass-fail-status"]')).toContainText('Passed');

		// Should offer certificate download
		await expect(page.locator('[data-testid="download-certificate-button"]')).toBeVisible();

		// Click download certificate
		const downloadPromise = page.waitForEvent('download');
		await page.click('[data-testid="download-certificate-button"]');
		const download = await downloadPromise;

		// Verify download
		expect(download.suggestedFilename()).toContain('certificate');
		expect(download.suggestedFilename()).toContain('.pdf');
	});

	test('should show assessment history', async ({ page }) => {
		// Navigate to assessment history
		await page.goto('/assessments/history');

		// Should show list of attempted assessments
		await expect(page.locator('[data-testid="assessment-history-list"]')).toBeVisible();

		// Each item should show key information
		const historyItems = page.locator('[data-testid="history-item"]');
		await expect(historyItems.first()).toContainText('Score:');
		await expect(historyItems.first()).toContainText('Date:');
		await expect(historyItems.first()).toContainText('Status:');

		// Should be able to view detailed results
		await historyItems.first().click();
		await expect(page).toHaveURL(/\/assessments\/[a-zA-Z0-9-]+\/results\/[a-zA-Z0-9-]+$/);
	});

	test('should block progression until assessment is passed', async ({ page }) => {
		// Navigate to course with progression control
		await page.goto('/courses/progression-course-id');

		// First lesson should be accessible
		await expect(page.locator('[data-testid="lesson-1"]')).not.toHaveClass(/locked/);

		// Second lesson should be locked
		await expect(page.locator('[data-testid="lesson-2"]')).toHaveClass(/locked/);

		// Click on locked lesson
		await page.click('[data-testid="lesson-2"]');

		// Should show progression requirement message
		await expect(page.locator('[data-testid="progression-blocked-message"]')).toBeVisible();
		await expect(page.locator('[data-testid="required-assessment-link"]')).toBeVisible();

		// Complete required assessment
		await page.click('[data-testid="required-assessment-link"]');
		// ... complete assessment successfully ...

		// Return to course
		await page.goto('/courses/progression-course-id');

		// Second lesson should now be unlocked
		await expect(page.locator('[data-testid="lesson-2"]')).not.toHaveClass(/locked/);
	});
});