import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button Component', () => {
	it('should render with default props', () => {
		render(Button, { props: { children: 'Click me' } });
		
		const button = screen.getByRole('button', { name: 'Click me' });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass('btn');
	});

	it('should render with different variants', () => {
		const { rerender } = render(Button, { 
			props: { 
				children: 'Primary Button',
				variant: 'primary'
			} 
		});
		
		let button = screen.getByRole('button');
		expect(button).toHaveClass('btn-primary');

		rerender({ 
			children: 'Secondary Button',
			variant: 'secondary'
		});
		
		button = screen.getByRole('button');
		expect(button).toHaveClass('btn-secondary');
	});

	it('should render with different sizes', () => {
		const { rerender } = render(Button, { 
			props: { 
				children: 'Small Button',
				size: 'sm'
			} 
		});
		
		let button = screen.getByRole('button');
		expect(button).toHaveClass('btn-sm');

		rerender({ 
			children: 'Large Button',
			size: 'lg'
		});
		
		button = screen.getByRole('button');
		expect(button).toHaveClass('btn-lg');
	});

	it('should be disabled when disabled prop is true', () => {
		render(Button, { 
			props: { 
				children: 'Disabled Button',
				disabled: true
			} 
		});
		
		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
		expect(button).toHaveClass('btn-disabled');
	});

	it('should show loading state', () => {
		render(Button, { 
			props: { 
				children: 'Loading Button',
				loading: true
			} 
		});
		
		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
		expect(button).toHaveClass('btn-loading');
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('should handle click events', async () => {
		const handleClick = vi.fn();
		
		render(Button, { 
			props: { 
				children: 'Clickable Button',
				onclick: handleClick
			} 
		});
		
		const button = screen.getByRole('button');
		await fireEvent.click(button);
		
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('should not handle click when disabled', async () => {
		const handleClick = vi.fn();
		
		render(Button, { 
			props: { 
				children: 'Disabled Button',
				disabled: true,
				onclick: handleClick
			} 
		});
		
		const button = screen.getByRole('button');
		await fireEvent.click(button);
		
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('should not handle click when loading', async () => {
		const handleClick = vi.fn();
		
		render(Button, { 
			props: { 
				children: 'Loading Button',
				loading: true,
				onclick: handleClick
			} 
		});
		
		const button = screen.getByRole('button');
		await fireEvent.click(button);
		
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('should render as different element types', () => {
		const { rerender } = render(Button, { 
			props: { 
				children: 'Link Button',
				element: 'a',
				href: '/test'
			} 
		});
		
		let element = screen.getByRole('link');
		expect(element).toBeInTheDocument();
		expect(element).toHaveAttribute('href', '/test');

		rerender({ 
			children: 'Div Button',
			element: 'div'
		});
		
		element = screen.getByText('Div Button');
		expect(element.tagName).toBe('DIV');
	});

	it('should support custom CSS classes', () => {
		render(Button, { 
			props: { 
				children: 'Custom Button',
				class: 'custom-class another-class'
			} 
		});
		
		const button = screen.getByRole('button');
		expect(button).toHaveClass('custom-class', 'another-class');
	});

	it('should support ARIA attributes', () => {
		render(Button, { 
			props: { 
				children: 'ARIA Button',
				'aria-label': 'Custom ARIA label',
				'aria-describedby': 'description-id'
			} 
		});
		
		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-label', 'Custom ARIA label');
		expect(button).toHaveAttribute('aria-describedby', 'description-id');
	});

	it('should handle keyboard navigation', async () => {
		const handleClick = vi.fn();
		
		render(Button, { 
			props: { 
				children: 'Keyboard Button',
				onclick: handleClick
			} 
		});
		
		const button = screen.getByRole('button');
		button.focus();
		
		expect(button).toHaveFocus();
		
		await fireEvent.keyDown(button, { key: 'Enter' });
		expect(handleClick).toHaveBeenCalledTimes(1);
		
		await fireEvent.keyDown(button, { key: ' ' });
		expect(handleClick).toHaveBeenCalledTimes(2);
	});
});