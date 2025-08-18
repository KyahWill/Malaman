import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title: string;
	message?: string;
	duration?: number; // in milliseconds, 0 for persistent
	dismissible?: boolean;
}

interface ToastState {
	toasts: Toast[];
}

const initialState: ToastState = {
	toasts: []
};

export const toastStore = writable<ToastState>(initialState);

// Helper functions for managing toasts
export const toastHelpers = {
	add: (toast: Omit<Toast, 'id'>) => {
		const id = crypto.randomUUID();
		const newToast: Toast = {
			id,
			duration: 5000, // 5 seconds default
			dismissible: true,
			...toast
		};

		toastStore.update(state => ({
			...state,
			toasts: [...state.toasts, newToast]
		}));

		// Auto-dismiss if duration is set
		if (newToast.duration && newToast.duration > 0) {
			setTimeout(() => {
				toastHelpers.remove(id);
			}, newToast.duration);
		}

		return id;
	},

	remove: (id: string) => {
		toastStore.update(state => ({
			...state,
			toasts: state.toasts.filter(toast => toast.id !== id)
		}));
	},

	clear: () => {
		toastStore.update(state => ({
			...state,
			toasts: []
		}));
	},

	// Convenience methods for different toast types
	success: (title: string, message?: string, options?: Partial<Toast>) => {
		return toastHelpers.add({
			type: 'success',
			title,
			message,
			...options
		});
	},

	error: (title: string, message?: string, options?: Partial<Toast>) => {
		return toastHelpers.add({
			type: 'error',
			title,
			message,
			duration: 0, // Errors persist by default
			...options
		});
	},

	warning: (title: string, message?: string, options?: Partial<Toast>) => {
		return toastHelpers.add({
			type: 'warning',
			title,
			message,
			duration: 7000, // Warnings last longer
			...options
		});
	},

	info: (title: string, message?: string, options?: Partial<Toast>) => {
		return toastHelpers.add({
			type: 'info',
			title,
			message,
			...options
		});
	}
};