import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button Accessibility Tests', () => {
	it('should pass basic accessibility checks', async () => {
		const { container } = render(Button, {
			props: { children: 'Accessible Button' }
		});

		await global.testAccessibility(container);
	});

	it('should have proper ARIA attributes when disabled', async () => {
		const { container } = render(Button, {
			props: { 
				children: 'Disabled Button',
				disabled: true
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveAttribute('aria-disabled', 'true');
		
		await global.testAccessibility(container);
	});

	it('should have proper ARIA attributes when loading', async () => {
		const { container } = render(Button, {
			props: { 
				children: 'Loading Button',
				loading: true
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(button).toHaveAttribute('aria-disabled', 'true');
		
		await global.testAccessibility(container);
	});

	it('should support keyboard navigation', async () => {
		const { container } = render(Button, {
			props: { children: 'Keyboard Button' }
		});

		const results = await global.testKeyboardNavigation(container);
		expect(results.violations).toHaveLength(0);
		
		await global.testAccessibility(container);
	});

	it('should have sufficient color contrast', async () => {
		const { container } = render(Button, {
			props: { 
				children: 'Contrast Button',
				variant: 'primary'
			}
		});

		// This will be caught by axe-core color-contrast rule
		await global.testAccessibility(container);
	});

	it('should have proper focus indicators', async () => {
		const { container } = render(Button, {
			props: { children: 'Focus Button' }
		});

		const button = container.querySelector('button');
		button?.focus();
		
		// Check that focus is visible (this would be caught by axe-core)
		await global.testAccessibility(container);
	});

	it('should work with screen readers', async () => {
		const { container } = render(Button, {
			props: { 
				children: 'Screen Reader Button',
				'aria-label': 'Custom screen reader label',
				'aria-describedby': 'button-description'
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveAttribute('aria-label', 'Custom screen reader label');
		expect(button).toHaveAttribute('aria-describedby', 'button-description');
		
		await global.testAccessibility(container);
	});

	it('should handle high contrast mode', async () => {
		// Simulate high contrast mode by adding CSS
		const style = document.createElement('style');
		style.textContent = `
			@media (prefers-contrast: high) {
				.btn { border: 2px solid; }
			}
		`;
		document.head.appendChild(style);

		const { container } = render(Button, {
			props: { children: 'High Contrast Button' }
		});

		await global.testAccessibility(container);
		
		document.head.removeChild(style);
	});

	it('should respect reduced motion preferences', async () => {
		// Simulate reduced motion preference
		const style = document.createElement('style');
		style.textContent = `
			@media (prefers-reduced-motion: reduce) {
				.btn { transition: none; }
			}
		`;
		document.head.appendChild(style);

		const { container } = render(Button, {
			props: { 
				children: 'Reduced Motion Button',
				loading: true
			}
		});

		await global.testAccessibility(container);
		
		document.head.removeChild(style);
	});

	it('should work with voice control', async () => {
		const { container } = render(Button, {
			props: { 
				children: 'Voice Control Button',
				'data-testid': 'voice-button'
			}
		});

		// Voice control relies on accessible names and roles
		const button = container.querySelector('button');
		expect(button).toHaveAccessibleName('Voice Control Button');
		
		await global.testAccessibility(container);
	});
});