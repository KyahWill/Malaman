import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth';
import { supabase } from '$lib/supabase';

// Mock the supabase client
vi.mock('$lib/supabase');

describe('AuthService', () => {
	let authService: AuthService;

	beforeEach(() => {
		authService = new AuthService();
		vi.clearAllMocks();
	});

	describe('signUp', () => {
		it('should successfully sign up a new user', async () => {
			const mockUser = global.createMockUser();
			const mockResponse = {
				data: {
					user: mockUser,
					session: {
						access_token: 'mock-token',
						refresh_token: 'mock-refresh',
						expires_in: 3600
					}
				},
				error: null
			};

			vi.mocked(supabase.auth.signUp).mockResolvedValue(mockResponse);

			const result = await authService.signUp({
				email: 'test@example.com',
				password: 'password123',
				userData: {
					first_name: 'Test',
					last_name: 'User',
					role: 'student'
				}
			});

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockUser);
			expect(supabase.auth.signUp).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'password123',
				options: {
					data: {
						first_name: 'Test',
						last_name: 'User',
						role: 'student'
					}
				}
			});
		});

		it('should handle sign up errors', async () => {
			const mockError = { message: 'Email already registered' };
			vi.mocked(supabase.auth.signUp).mockResolvedValue({
				data: { user: null, session: null },
				error: mockError
			});

			const result = await authService.signUp({
				email: 'test@example.com',
				password: 'password123',
				userData: {
					first_name: 'Test',
					last_name: 'User',
					role: 'student'
				}
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Email already registered');
		});
	});

	describe('signIn', () => {
		it('should successfully sign in a user', async () => {
			const mockUser = global.createMockUser();
			const mockResponse = {
				data: {
					user: mockUser,
					session: {
						access_token: 'mock-token',
						refresh_token: 'mock-refresh',
						expires_in: 3600
					}
				},
				error: null
			};

			vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockResponse);

			const result = await authService.signIn({
				email: 'test@example.com',
				password: 'password123'
			});

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockUser);
		});

		it('should handle sign in errors', async () => {
			const mockError = { message: 'Invalid credentials' };
			vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
				data: { user: null, session: null },
				error: mockError
			});

			const result = await authService.signIn({
				email: 'test@example.com',
				password: 'wrongpassword'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Invalid credentials');
		});
	});

	describe('signOut', () => {
		it('should successfully sign out a user', async () => {
			vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

			const result = await authService.signOut();

			expect(result.success).toBe(true);
			expect(supabase.auth.signOut).toHaveBeenCalled();
		});

		it('should handle sign out errors', async () => {
			const mockError = { message: 'Sign out failed' };
			vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: mockError });

			const result = await authService.signOut();

			expect(result.success).toBe(false);
			expect(result.error).toBe('Sign out failed');
		});
	});

	describe('getCurrentUser', () => {
		it('should return current user session', async () => {
			const mockUser = global.createMockUser();
			const mockSession = {
				user: mockUser,
				access_token: 'mock-token',
				refresh_token: 'mock-refresh',
				expires_in: 3600
			};

			vi.mocked(supabase.auth.getSession).mockResolvedValue({
				data: { session: mockSession },
				error: null
			});

			const result = await authService.getCurrentUser();

			expect(result.user).toEqual(mockUser);
			expect(result.session).toEqual(mockSession);
		});

		it('should handle no active session', async () => {
			vi.mocked(supabase.auth.getSession).mockResolvedValue({
				data: { session: null },
				error: null
			});

			const result = await authService.getCurrentUser();

			expect(result.user).toBeNull();
			expect(result.session).toBeNull();
		});
	});

	describe('updateProfile', () => {
		it('should successfully update user profile', async () => {
			const mockUser = global.createMockUser();
			const profileData = {
				first_name: 'Updated',
				last_name: 'Name'
			};

			vi.mocked(supabase.from).mockReturnValue({
				update: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: { ...mockUser.profile, ...profileData },
					error: null
				})
			} as any);

			const result = await authService.updateProfile('user-id', profileData);

			expect(result.success).toBe(true);
			expect(result.profile?.first_name).toBe('Updated');
		});

		it('should handle profile update errors', async () => {
			const mockError = { message: 'Update failed' };

			vi.mocked(supabase.from).mockReturnValue({
				update: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: mockError
				})
			} as any);

			const result = await authService.updateProfile('user-id', {
				first_name: 'Updated'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Update failed');
		});
	});

	describe('resetPassword', () => {
		it('should successfully send password reset email', async () => {
			vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
				data: {},
				error: null
			});

			const result = await authService.resetPassword('test@example.com');

			expect(result.success).toBe(true);
			expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
				'test@example.com'
			);
		});

		it('should handle password reset errors', async () => {
			const mockError = { message: 'Email not found' };
			vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
				data: {},
				error: mockError
			});

			const result = await authService.resetPassword('nonexistent@example.com');

			expect(result.success).toBe(false);
			expect(result.error).toBe('Email not found');
		});
	});
});