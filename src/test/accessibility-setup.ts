import { configureAxe } from 'axe-core';

// Configure axe-core for accessibility testing
configureAxe({
	rules: [
		{
			id: 'color-contrast',
			enabled: true
		},
		{
			id: 'keyboard-navigation',
			enabled: true
		},
		{
			id: 'focus-management',
			enabled: true
		},
		{
			id: 'aria-labels',
			enabled: true
		},
		{
			id: 'semantic-markup',
			enabled: true
		}
	],
	tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
});

// Global accessibility test utilities
global.testAccessibility = async (container: HTMLElement) => {
	const { axe } = await import('axe-core');
	const results = await axe.run(container);
	
	if (results.violations.length > 0) {
		const violationMessages = results.violations.map(violation => 
			`${violation.id}: ${violation.description}\n` +
			violation.nodes.map(node => `  - ${node.failureSummary}`).join('\n')
		).join('\n\n');
		
		throw new Error(`Accessibility violations found:\n\n${violationMessages}`);
	}
	
	return results;
};

global.testKeyboardNavigation = async (container: HTMLElement) => {
	const focusableElements = container.querySelectorAll(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);
	
	const results = {
		totalFocusable: focusableElements.length,
		violations: [] as string[]
	};
	
	focusableElements.forEach((element, index) => {
		const el = element as HTMLElement;
		
		// Check if element is visible
		if (el.offsetParent === null && el.style.display !== 'none') {
			results.violations.push(`Element ${index} is not visible but focusable`);
		}
		
		// Check if element has proper ARIA labels
		if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.textContent?.trim()) {
			results.violations.push(`Element ${index} lacks proper labeling`);
		}
		
		// Check tabindex values
		const tabindex = el.getAttribute('tabindex');
		if (tabindex && parseInt(tabindex) > 0) {
			results.violations.push(`Element ${index} has positive tabindex (${tabindex}), which can disrupt tab order`);
		}
	});
	
	return results;
};