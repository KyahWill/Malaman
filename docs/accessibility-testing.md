# Accessibility Testing Procedures

This document outlines comprehensive accessibility testing procedures for the Personalized LMS application to ensure WCAG 2.1 AA compliance.

## Table of Contents

- [Overview](#overview)
- [Testing Tools](#testing-tools)
- [Automated Testing](#automated-testing)
- [Manual Testing](#manual-testing)
- [Screen Reader Testing](#screen-reader-testing)
- [Keyboard Navigation Testing](#keyboard-navigation-testing)
- [Color and Contrast Testing](#color-and-contrast-testing)
- [Mobile Accessibility Testing](#mobile-accessibility-testing)
- [Testing Checklist](#testing-checklist)
- [Common Issues and Solutions](#common-issues-and-solutions)

## Overview

Accessibility testing ensures that our application is usable by people with disabilities, including those who use assistive technologies like screen readers, keyboard navigation, or voice control software.

### WCAG 2.1 AA Requirements

Our application must meet the following criteria:

- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: Interface components must be operable by all users
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for various assistive technologies

## Testing Tools

### Automated Testing Tools

#### axe-core
- **Purpose**: Automated accessibility testing
- **Installation**: `npm install --save-dev @axe-core/playwright`
- **Usage**: Integrated into our test suite

#### Lighthouse
- **Purpose**: Performance and accessibility auditing
- **Usage**: Built into Chrome DevTools
- **Command**: `lighthouse --accessibility https://localhost:5173`

#### WAVE (Web Accessibility Evaluation Tool)
- **Purpose**: Visual accessibility testing
- **Usage**: Browser extension or web service
- **URL**: https://wave.webaim.org/

### Manual Testing Tools

#### Screen Readers
- **NVDA** (Windows): Free, widely used
- **JAWS** (Windows): Commercial, industry standard
- **VoiceOver** (macOS/iOS): Built-in Apple screen reader
- **TalkBack** (Android): Built-in Android screen reader

#### Browser Extensions
- **axe DevTools**: Free accessibility testing
- **Accessibility Insights**: Microsoft's accessibility testing tool
- **Colour Contrast Analyser**: Color contrast checking

## Automated Testing

### Integration with Test Suite

```javascript
// tests/accessibility.test.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible forms', async ({ page }) => {
    await page.goto('/auth/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('form')
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### Running Automated Tests

```bash
# Run all accessibility tests
npm run test:a11y

# Run accessibility tests for specific components
npm run test:a11y -- --grep "Button component"

# Generate accessibility report
npm run test:a11y:report
```

### Continuous Integration

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:a11y
```

## Manual Testing

### Testing Workflow

1. **Visual Inspection**: Check for obvious accessibility issues
2. **Keyboard Navigation**: Test all functionality with keyboard only
3. **Screen Reader Testing**: Test with at least one screen reader
4. **Color/Contrast Testing**: Verify color contrast ratios
5. **Zoom Testing**: Test at 200% zoom level
6. **Mobile Testing**: Test on mobile devices with assistive technologies

### Visual Inspection Checklist

- [ ] All images have appropriate alt text
- [ ] Form inputs have associated labels
- [ ] Headings follow logical hierarchy (h1, h2, h3, etc.)
- [ ] Links have descriptive text (not "click here")
- [ ] Color is not the only way to convey information
- [ ] Text has sufficient contrast against background
- [ ] Focus indicators are clearly visible
- [ ] Error messages are clearly associated with form fields

## Screen Reader Testing

### NVDA Testing (Windows)

1. **Installation**: Download from https://www.nvaccess.org/
2. **Basic Commands**:
   - `Ctrl`: Stop speech
   - `Insert + Space`: Toggle browse/focus mode
   - `H`: Navigate by headings
   - `F`: Navigate by form fields
   - `B`: Navigate by buttons
   - `L`: Navigate by links

3. **Testing Procedure**:
   ```
   1. Start NVDA
   2. Navigate to the application
   3. Use heading navigation (H key) to understand page structure
   4. Navigate through forms using Tab and form navigation (F key)
   5. Test all interactive elements
   6. Verify announcements are clear and helpful
   ```

### VoiceOver Testing (macOS)

1. **Activation**: `Cmd + F5`
2. **Basic Commands**:
   - `Ctrl + Option + Right/Left`: Navigate elements
   - `Ctrl + Option + Space`: Activate element
   - `Ctrl + Option + U`: Open rotor
   - `Ctrl + Option + H`: Navigate by headings

3. **Testing Procedure**:
   ```
   1. Enable VoiceOver
   2. Use rotor to navigate by headings, links, form controls
   3. Test form completion and submission
   4. Verify modal dialogs are properly announced
   5. Test dynamic content updates
   ```

### Screen Reader Testing Checklist

- [ ] Page title is announced when page loads
- [ ] Headings provide clear page structure
- [ ] Form labels are properly associated and announced
- [ ] Button purposes are clear from their accessible names
- [ ] Link destinations are clear from link text
- [ ] Error messages are announced and associated with fields
- [ ] Dynamic content changes are announced
- [ ] Modal dialogs trap focus and announce properly
- [ ] Tables have proper headers and captions
- [ ] Lists are properly structured and announced

## Keyboard Navigation Testing

### Testing Procedure

1. **Disconnect mouse/trackpad** or use only keyboard
2. **Navigate through entire application** using only:
   - `Tab`: Move forward through interactive elements
   - `Shift + Tab`: Move backward through interactive elements
   - `Enter`: Activate buttons and links
   - `Space`: Activate buttons and checkboxes
   - `Arrow keys`: Navigate within components (menus, tabs, etc.)
   - `Escape`: Close modals and menus

### Keyboard Navigation Checklist

- [ ] All interactive elements are reachable via keyboard
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps (can always navigate away)
- [ ] Skip links are provided for main content
- [ ] Modal dialogs trap focus appropriately
- [ ] Dropdown menus work with arrow keys
- [ ] Form submission works with Enter key
- [ ] Custom components follow standard keyboard conventions

### Focus Management Testing

```javascript
// Test focus management in modals
test('Modal focus management', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Open modal
  await page.click('[data-testid="open-modal"]');
  
  // Verify focus is trapped in modal
  await page.keyboard.press('Tab');
  const focusedElement = await page.locator(':focus');
  await expect(focusedElement).toBeVisible();
  
  // Close modal and verify focus returns
  await page.keyboard.press('Escape');
  const returnedFocus = await page.locator(':focus');
  await expect(returnedFocus).toHaveAttribute('data-testid', 'open-modal');
});
```

## Color and Contrast Testing

### Contrast Requirements

- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt+ bold): 3:1 contrast ratio
- **Interactive elements**: 3:1 contrast ratio for borders/backgrounds

### Testing Tools

#### Colour Contrast Analyser
1. Download from TPGi
2. Use eyedropper to select foreground and background colors
3. Verify ratios meet WCAG requirements

#### Browser DevTools
```javascript
// Chrome DevTools Console
// Check contrast ratio for an element
const element = document.querySelector('.text-gray-600');
const styles = getComputedStyle(element);
console.log('Color:', styles.color);
console.log('Background:', styles.backgroundColor);
```

### Color Testing Checklist

- [ ] All text meets minimum contrast ratios
- [ ] Interactive elements have sufficient contrast
- [ ] Focus indicators have adequate contrast
- [ ] Error states don't rely solely on color
- [ ] Success states don't rely solely on color
- [ ] Charts and graphs have alternative text descriptions
- [ ] Color-blind users can distinguish all information

## Mobile Accessibility Testing

### iOS Testing with VoiceOver

1. **Enable VoiceOver**: Settings > Accessibility > VoiceOver
2. **Basic Gestures**:
   - Single tap: Select element
   - Double tap: Activate element
   - Swipe right/left: Navigate elements
   - Two-finger tap: Stop/start speech

### Android Testing with TalkBack

1. **Enable TalkBack**: Settings > Accessibility > TalkBack
2. **Basic Gestures**:
   - Single tap: Select element
   - Double tap: Activate element
   - Swipe right/left: Navigate elements
   - Two-finger tap: Stop/start speech

### Mobile Accessibility Checklist

- [ ] Touch targets are at least 44x44 pixels
- [ ] Content is accessible at 200% zoom
- [ ] Orientation changes don't break functionality
- [ ] Screen reader navigation works smoothly
- [ ] Form inputs are properly labeled on mobile
- [ ] Error messages are clearly announced
- [ ] Dynamic content updates are announced

## Testing Checklist

### Pre-Release Testing

#### Automated Testing
- [ ] axe-core tests pass with no violations
- [ ] Lighthouse accessibility score is 95+
- [ ] Custom accessibility tests pass

#### Manual Testing
- [ ] Keyboard navigation works throughout application
- [ ] Screen reader testing completed (NVDA or VoiceOver)
- [ ] Color contrast verified for all text and interactive elements
- [ ] Focus management works correctly in modals and dynamic content
- [ ] Form validation errors are accessible
- [ ] Mobile accessibility tested on iOS and Android

#### Component-Specific Testing
- [ ] All form inputs have proper labels
- [ ] All images have appropriate alt text
- [ ] All buttons have descriptive accessible names
- [ ] All links have descriptive text or aria-labels
- [ ] Data tables have proper headers and captions
- [ ] Error messages are associated with form fields

### Regression Testing

After any UI changes:
- [ ] Run automated accessibility tests
- [ ] Test keyboard navigation for affected areas
- [ ] Verify screen reader announcements for changed content
- [ ] Check color contrast if colors were modified

## Common Issues and Solutions

### Issue: Missing Form Labels

**Problem**: Form inputs without associated labels
```html
<!-- Problematic -->
<input type="email" placeholder="Email" />
```

**Solution**: Always associate labels with inputs
```html
<!-- Correct -->
<label for="email">Email Address</label>
<input id="email" type="email" placeholder="Enter your email" />
```

### Issue: Poor Focus Indicators

**Problem**: Focus indicators are not visible or too subtle
```css
/* Problematic */
button:focus {
  outline: none;
}
```

**Solution**: Provide clear, high-contrast focus indicators
```css
/* Correct */
button:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Issue: Inaccessible Modal Dialogs

**Problem**: Focus not trapped, no keyboard support
```svelte
<!-- Problematic -->
<div class="modal">
  <div class="modal-content">
    <h2>Modal Title</h2>
    <p>Modal content</p>
  </div>
</div>
```

**Solution**: Implement proper focus management
```svelte
<!-- Correct -->
<div 
  class="modal" 
  role="dialog" 
  aria-labelledby="modal-title"
  aria-modal="true"
>
  <div class="modal-content">
    <h2 id="modal-title">Modal Title</h2>
    <p>Modal content</p>
    <button onclick={closeModal}>Close</button>
  </div>
</div>
```

### Issue: Insufficient Color Contrast

**Problem**: Text doesn't meet contrast requirements
```css
/* Problematic - contrast ratio too low */
.text-light {
  color: #999999;
  background: #ffffff;
}
```

**Solution**: Use colors that meet WCAG requirements
```css
/* Correct - meets 4.5:1 contrast ratio */
.text-accessible {
  color: #374151; /* gray-700 */
  background: #ffffff;
}
```

### Issue: Missing Alternative Text

**Problem**: Images without alt text or with poor alt text
```html
<!-- Problematic -->
<img src="chart.png" alt="chart" />
```

**Solution**: Provide descriptive alternative text
```html
<!-- Correct -->
<img src="chart.png" alt="Bar chart showing 65% course completion rate across all students" />
```

## Reporting and Documentation

### Accessibility Test Reports

Generate regular accessibility reports:

```bash
# Generate comprehensive accessibility report
npm run test:a11y:report

# Generate Lighthouse accessibility report
lighthouse --only-categories=accessibility --output=html --output-path=./reports/accessibility.html https://localhost:5173
```

### Issue Tracking

Use the following template for accessibility issues:

```markdown
## Accessibility Issue: [Brief Description]

**Severity**: Critical/High/Medium/Low
**WCAG Guideline**: [e.g., 1.3.1 Info and Relationships]
**Affected Users**: [e.g., Screen reader users, Keyboard users]

### Description
[Detailed description of the issue]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Proposed Solution
[How to fix the issue]

### Testing Notes
[How to verify the fix]
```

This comprehensive accessibility testing approach ensures that our Personalized LMS is usable by all users, regardless of their abilities or the assistive technologies they use.