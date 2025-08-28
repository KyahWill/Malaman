import { Page, expect } from '@playwright/test';

/**
 * Authentication helpers
 */
export async function loginAsInstructor(page: Page) {
	await page.goto('/auth/login');
	await page.fill('[data-testid="email-input"]', 'instructor@example.com');
	await page.fill('[data-testid="password-input"]', 'password123');
	await page.click('[data-testid="login-button"]');
	await expect(page).toHaveURL('/dashboard');
}

export async function loginAsStudent(page: Page) {
	await page.goto('/auth/login');
	await page.fill('[data-testid="email-input"]', 'student@example.com');
	await page.fill('[data-testid="password-input"]', 'password123');
	await page.click('[data-testid="login-button"]');
	await expect(page).toHaveURL('/dashboard');
}

export async function loginAsAdmin(page: Page) {
	await page.goto('/auth/login');
	await page.fill('[data-testid="email-input"]', 'admin@example.com');
	await page.fill('[data-testid="password-input"]', 'password123');
	await page.click('[data-testid="login-button"]');
	await expect(page).toHaveURL('/dashboard');
}

export async function logout(page: Page) {
	await page.click('[data-testid="user-menu"]');
	await page.click('text=Sign Out');
	await expect(page).toHaveURL('/');
}

/**
 * Course management helpers
 */
export async function createTestCourse(page: Page, courseData: {
	title: string;
	description: string;
	difficulty?: string;
	tags?: string;
}) {
	await page.click('[data-testid="create-course-button"]');
	await page.fill('[data-testid="course-title-input"]', courseData.title);
	await page.fill('[data-testid="course-description-textarea"]', courseData.description);
	
	if (courseData.difficulty) {
		await page.selectOption('[data-testid="difficulty-select"]', courseData.difficulty);
	}
	
	if (courseData.tags) {
		await page.fill('[data-testid="tags-input"]', courseData.tags);
	}
	
	await page.click('[data-testid="create-course-button"]');
	await expect(page).toHaveURL(/\/courses\/[a-zA-Z0-9-]+$/);
}

export async function createTestLesson(page: Page, lessonData: {
	title: string;
	description: string;
	content?: string;
}) {
	await page.click('[data-testid="add-lesson-button"]');
	await page.fill('[data-testid="lesson-title-input"]', lessonData.title);
	await page.fill('[data-testid="lesson-description-textarea"]', lessonData.description);
	
	if (lessonData.content) {
		await page.click('[data-testid="add-content-block-button"]');
		await page.selectOption('[data-testid="content-type-select"]', 'rich_text');
		await page.fill('[data-testid="rich-text-editor"]', lessonData.content);
	}
	
	await page.click('[data-testid="save-lesson-button"]');
}

/**
 * Assessment helpers
 */
export async function takeAssessment(page: Page, answers: Record<string, string>) {
	for (const [questionId, answer] of Object.entries(answers)) {
		if (answer.startsWith('option-')) {
			await page.click(`[data-testid="${questionId}"] [data-testid="${answer}"]`);
		} else {
			await page.fill(`[data-testid="${questionId}"] [data-testid="short-answer-input"]`, answer);
		}
	}
	
	await page.click('[data-testid="submit-assessment-button"]');
	await page.click('[data-testid="confirm-submit-button"]');
}

export async function waitForAssessmentResults(page: Page) {
	await expect(page).toHaveURL(/\/assessments\/[a-zA-Z0-9-]+\/results\/[a-zA-Z0-9-]+$/);
	await expect(page.locator('[data-testid="assessment-score"]')).toBeVisible();
}

/**
 * Navigation helpers
 */
export async function navigateToCourses(page: Page) {
	await page.click('[data-testid="my-courses-link"]');
	await expect(page).toHaveURL('/courses');
}

export async function navigateToDashboard(page: Page) {
	await page.click('[data-testid="dashboard-link"]');
	await expect(page).toHaveURL('/dashboard');
}

export async function navigateToProfile(page: Page) {
	await page.click('[data-testid="user-menu"]');
	await page.click('[data-testid="profile-link"]');
	await expect(page).toHaveURL('/profile');
}

/**
 * Form helpers
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
	for (const [field, value] of Object.entries(formData)) {
		const input = page.locator(`[data-testid="${field}"]`);
		const tagName = await input.evaluate(el => el.tagName.toLowerCase());
		
		if (tagName === 'select') {
			await page.selectOption(`[data-testid="${field}"]`, value);
		} else if (tagName === 'textarea') {
			await page.fill(`[data-testid="${field}"]`, value);
		} else {
			await page.fill(`[data-testid="${field}"]`, value);
		}
	}
}

export async function submitForm(page: Page, submitButtonTestId: string) {
	await page.click(`[data-testid="${submitButtonTestId}"]`);
}

/**
 * Wait helpers
 */
export async function waitForToast(page: Page, message?: string) {
	const toast = page.locator('[data-testid="toast"]');
	await expect(toast).toBeVisible();
	
	if (message) {
		await expect(toast).toContainText(message);
	}
	
	// Wait for toast to disappear
	await expect(toast).not.toBeVisible({ timeout: 10000 });
}

export async function waitForLoading(page: Page) {
	await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
}

export async function waitForModal(page: Page, modalTestId: string) {
	await expect(page.locator(`[data-testid="${modalTestId}"]`)).toBeVisible();
}

export async function closeModal(page: Page, modalTestId: string) {
	await page.click(`[data-testid="${modalTestId}"] [data-testid="close-button"]`);
	await expect(page.locator(`[data-testid="${modalTestId}"]`)).not.toBeVisible();
}

/**
 * Accessibility helpers
 */
export async function checkAccessibility(page: Page) {
	// This would integrate with axe-playwright or similar
	// For now, we'll do basic keyboard navigation checks
	
	// Check that all interactive elements are focusable
	const focusableElements = await page.locator(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	).all();
	
	for (const element of focusableElements) {
		await element.focus();
		await expect(element).toBeFocused();
	}
}

export async function testKeyboardNavigation(page: Page) {
	// Test tab navigation
	await page.keyboard.press('Tab');
	const firstFocusable = await page.locator(':focus').first();
	await expect(firstFocusable).toBeFocused();
	
	// Test shift+tab navigation
	await page.keyboard.press('Shift+Tab');
	// Should cycle back or stay on first element
}

/**
 * Performance helpers
 */
export async function measurePageLoadTime(page: Page, url: string) {
	const startTime = Date.now();
	await page.goto(url);
	await page.waitForLoadState('networkidle');
	const endTime = Date.now();
	
	return endTime - startTime;
}

export async function checkPagePerformance(page: Page) {
	const metrics = await page.evaluate(() => {
		const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
		return {
			domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
			loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
			firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
			firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
		};
	});
	
	// Assert reasonable performance thresholds
	expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
	expect(metrics.loadComplete).toBeLessThan(5000); // 5 seconds
	
	return metrics;
}

/**
 * Database helpers (for test setup/teardown)
 */
export async function seedTestData(page: Page) {
	// This would typically call API endpoints to seed test data
	await page.request.post('/api/test/seed', {
		data: {
			users: true,
			courses: true,
			assessments: true
		}
	});
}

export async function cleanupTestData(page: Page) {
	// Clean up test data after tests
	await page.request.delete('/api/test/cleanup');
}

/**
 * Screenshot helpers
 */
export async function takeScreenshot(page: Page, name: string) {
	await page.screenshot({ 
		path: `tests/screenshots/${name}.png`,
		fullPage: true
	});
}

export async function compareScreenshot(page: Page, name: string) {
	await expect(page).toHaveScreenshot(`${name}.png`);
}

/**
 * Error handling helpers
 */
export async function expectError(page: Page, errorMessage: string) {
	await expect(page.locator('[data-testid="error-message"]')).toContainText(errorMessage);
}

export async function expectSuccess(page: Page, successMessage: string) {
	await expect(page.locator('[data-testid="success-message"]')).toContainText(successMessage);
}

/**
 * Mobile helpers
 */
export async function setMobileViewport(page: Page) {
	await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
}

export async function setTabletViewport(page: Page) {
	await page.setViewportSize({ width: 768, height: 1024 }); // iPad
}

export async function setDesktopViewport(page: Page) {
	await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
}