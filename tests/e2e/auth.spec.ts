import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Start with a clean state
		await page.goto('/');
	});

	test('should allow user registration', async ({ page }) => {
		// Navigate to registration page
		await page.click('text=Sign Up');
		await expect(page).toHaveURL('/auth/register');

		// Fill registration form
		await page.fill('[data-testid="email-input"]', 'test@example.com');
		await page.fill('[data-testid="password-input"]', 'TestPassword123!');
		await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
		await page.fill('[data-testid="first-name-input"]', 'Test');
		await page.fill('[data-testid="last-name-input"]', 'User');
		await page.selectOption('[data-testid="role-select"]', 'student');

		// Submit form
		await page.click('[data-testid="register-button"]');

		// Should redirect to dashboard after successful registration
		await expect(page).toHaveURL('/dashboard');
		await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, Test');
	});

	test('should show validation errors for invalid registration', async ({ page }) => {
		await page.click('text=Sign Up');

		// Try to submit with empty fields
		await page.click('[data-testid="register-button"]');

		// Should show validation errors
		await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
		await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
		await expect(page.locator('[data-testid="first-name-error"]')).toContainText('First name is required');
	});

	test('should allow user login', async ({ page }) => {
		// Navigate to login page
		await page.click('text=Sign In');
		await expect(page).toHaveURL('/auth/login');

		// Fill login form
		await page.fill('[data-testid="email-input"]', 'instructor@example.com');
		await page.fill('[data-testid="password-input"]', 'password123');

		// Submit form
		await page.click('[data-testid="login-button"]');

		// Should redirect to dashboard
		await expect(page).toHaveURL('/dashboard');
		await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
	});

	test('should show error for invalid login credentials', async ({ page }) => {
		await page.click('text=Sign In');

		// Fill with invalid credentials
		await page.fill('[data-testid="email-input"]', 'invalid@example.com');
		await page.fill('[data-testid="password-input"]', 'wrongpassword');

		await page.click('[data-testid="login-button"]');

		// Should show error message
		await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');
	});

	test('should allow password reset', async ({ page }) => {
		await page.click('text=Sign In');
		await page.click('text=Forgot Password?');

		await expect(page).toHaveURL('/auth/forgot-password');

		// Fill email for password reset
		await page.fill('[data-testid="email-input"]', 'test@example.com');
		await page.click('[data-testid="reset-button"]');

		// Should show success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent');
	});

	test('should allow user logout', async ({ page }) => {
		// Login first
		await page.goto('/auth/login');
		await page.fill('[data-testid="email-input"]', 'instructor@example.com');
		await page.fill('[data-testid="password-input"]', 'password123');
		await page.click('[data-testid="login-button"]');

		await expect(page).toHaveURL('/dashboard');

		// Logout
		await page.click('[data-testid="user-menu"]');
		await page.click('text=Sign Out');

		// Should redirect to home page
		await expect(page).toHaveURL('/');
		await expect(page.locator('text=Sign In')).toBeVisible();
	});

	test('should redirect unauthenticated users to login', async ({ page }) => {
		// Try to access protected route
		await page.goto('/dashboard');

		// Should redirect to login
		await expect(page).toHaveURL('/auth/login');
	});

	test('should maintain session across page refreshes', async ({ page }) => {
		// Login
		await page.goto('/auth/login');
		await page.fill('[data-testid="email-input"]', 'instructor@example.com');
		await page.fill('[data-testid="password-input"]', 'password123');
		await page.click('[data-testid="login-button"]');

		await expect(page).toHaveURL('/dashboard');

		// Refresh page
		await page.reload();

		// Should still be logged in
		await expect(page).toHaveURL('/dashboard');
		await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
	});

	test('should handle session expiration gracefully', async ({ page }) => {
		// Login
		await page.goto('/auth/login');
		await page.fill('[data-testid="email-input"]', 'instructor@example.com');
		await page.fill('[data-testid="password-input"]', 'password123');
		await page.click('[data-testid="login-button"]');

		// Simulate session expiration by clearing storage
		await page.evaluate(() => {
			localStorage.clear();
			sessionStorage.clear();
		});

		// Try to access protected content
		await page.goto('/courses');

		// Should redirect to login
		await expect(page).toHaveURL('/auth/login');
		await expect(page.locator('[data-testid="session-expired-message"]')).toContainText('Session expired');
	});
});