/**
 * Utility functions for the Personalized LMS
 */

/**
 * Combines CSS class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(' ');
}

/**
 * Formats a date to a human-readable string
 */
export function formatDate(date: string | Date): string {
	const d = new Date(date);
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Formats duration in minutes to human-readable format
 */
export function formatDuration(minutes: number): string {
	if (minutes < 60) {
		return `${minutes} min`;
	}
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Calculates completion percentage
 */
export function calculateProgress(completed: number, total: number): number {
	if (total === 0) return 0;
	return Math.round((completed / total) * 100);
}

/**
 * Generates a random ID
 */
export function generateId(): string {
	return crypto.randomUUID();
}

/**
 * Debounce function for search and input handling
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}