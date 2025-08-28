/**
 * Accessibility Testing Utilities
 * Provides automated accessibility testing and validation
 */

import { ContrastChecker } from '$lib/services/accessibility';

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  element?: HTMLElement;
  selector?: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface AccessibilityTestResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  score: number; // 0-100
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export class AccessibilityTester {
  private container: HTMLElement;
  
  constructor(container: HTMLElement = document.body) {
    this.container = container;
  }
  
  /**
   * Run comprehensive accessibility tests
   */
  public async runTests(): Promise<AccessibilityTestResult> {
    const issues: AccessibilityIssue[] = [];
    
    // Run all test categories
    issues.push(...this.testImages());
    issues.push(...this.testHeadings());
    issues.push(...this.testLinks());
    issues.push(...this.testButtons());
    issues.push(...this.testForms());
    issues.push(...this.testTables());
    issues.push(...this.testLandmarks());
    issues.push(...this.testColorContrast());
    issues.push(...this.testKeyboardNavigation());
    issues.push(...this.testAriaLabels());
    issues.push(...this.testFocusManagement());
    issues.push(...this.testMediaAccessibility());
    
    const summary = this.summarizeIssues(issues);
    const score = this.calculateScore(summary);
    
    return {
      passed: issues.filter(i => i.type === 'error').length === 0,
      issues,
      score,
      summary
    };
  }
  
  /**
   * Test image accessibility
   */
  private testImages(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const images = this.container.querySelectorAll('img');
    
    images.forEach(img => {
      // Check for alt text
      if (!img.hasAttribute('alt')) {
        issues.push({
          type: 'error',
          rule: 'img-alt',
          message: 'Image missing alt attribute',
          element: img,
          impact: 'critical'
        });
      } else if (img.getAttribute('alt') === '') {
        // Empty alt is okay for decorative images, but check if it should be decorative
        const hasAriaHidden = img.getAttribute('aria-hidden') === 'true';
        const hasRole = img.getAttribute('role') === 'presentation';
        
        if (!hasAriaHidden && !hasRole) {
          issues.push({
            type: 'warning',
            rule: 'img-alt-empty',
            message: 'Image has empty alt text but may not be decorative',
            element: img,
            impact: 'moderate'
          });
        }
      }
      
      // Check for meaningful alt text
      const altText = img.getAttribute('alt');
      if (altText && (altText.toLowerCase().includes('image') || altText.toLowerCase().includes('picture'))) {
        issues.push({
          type: 'warning',
          rule: 'img-alt-meaningful',
          message: 'Alt text should not contain "image" or "picture"',
          element: img,
          impact: 'minor'
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Test heading structure
   */
  private testHeadings(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const headings = this.container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      issues.push({
        type: 'warning',
        rule: 'heading-structure',
        message: 'Page should have at least one heading',
        impact: 'moderate'
      });
      return issues;
    }
    
    // Check for h1
    const h1s = this.container.querySelectorAll('h1');
    if (h1s.length === 0) {
      issues.push({
        type: 'error',
        rule: 'h1-required',
        message: 'Page should have exactly one h1 element',
        impact: 'serious'
      });
    } else if (h1s.length > 1) {
      issues.push({
        type: 'warning',
        rule: 'h1-multiple',
        message: 'Page should have only one h1 element',
        impact: 'moderate'
      });
    }
    
    // Check heading hierarchy
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (previousLevel > 0 && level > previousLevel + 1) {
        issues.push({
          type: 'warning',
          rule: 'heading-hierarchy',
          message: `Heading level skipped from h${previousLevel} to h${level}`,
          element: heading,
          impact: 'moderate'
        });
      }
      
      // Check for empty headings
      if (!heading.textContent?.trim()) {
        issues.push({
          type: 'error',
          rule: 'heading-empty',
          message: 'Heading element is empty',
          element: heading,
          impact: 'serious'
        });
      }
      
      previousLevel = level;
    });
    
    return issues;
  }
  
  /**
   * Test link accessibility
   */
  private testLinks(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const links = this.container.querySelectorAll('a');
    
    links.forEach(link => {
      // Check for href
      if (!link.hasAttribute('href')) {
        issues.push({
          type: 'warning',
          rule: 'link-href',
          message: 'Link element should have href attribute or use button instead',
          element: link,
          impact: 'moderate'
        });
      }
      
      // Check for accessible name
      const accessibleName = this.getAccessibleName(link);
      if (!accessibleName) {
        issues.push({
          type: 'error',
          rule: 'link-name',
          message: 'Link must have accessible name',
          element: link,
          impact: 'critical'
        });
      } else if (accessibleName.toLowerCase().includes('click here') || 
                 accessibleName.toLowerCase().includes('read more')) {
        issues.push({
          type: 'warning',
          rule: 'link-meaningful',
          message: 'Link text should be meaningful and descriptive',
          element: link,
          impact: 'moderate'
        });
      }
      
      // Check external links
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http') && !href.includes(window.location.hostname))) {
        if (!link.hasAttribute('aria-label') && !link.textContent?.includes('external')) {
          issues.push({
            type: 'info',
            rule: 'link-external',
            message: 'External links should indicate they open in new window/tab',
            element: link,
            impact: 'minor'
          });
        }
      }
    });
    
    return issues;
  }
  
  /**
   * Test button accessibility
   */
  private testButtons(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const buttons = this.container.querySelectorAll('button, [role="button"]');
    
    buttons.forEach(button => {
      // Check for accessible name
      const accessibleName = this.getAccessibleName(button);
      if (!accessibleName) {
        issues.push({
          type: 'error',
          rule: 'button-name',
          message: 'Button must have accessible name',
          element: button,
          impact: 'critical'
        });
      }
      
      // Check for disabled state
      if (button.hasAttribute('disabled') && !button.hasAttribute('aria-disabled')) {
        issues.push({
          type: 'info',
          rule: 'button-disabled',
          message: 'Consider using aria-disabled instead of disabled attribute',
          element: button,
          impact: 'minor'
        });
      }
      
      // Check for toggle buttons
      if (button.getAttribute('aria-pressed') !== null) {
        const pressed = button.getAttribute('aria-pressed');
        if (pressed !== 'true' && pressed !== 'false') {
          issues.push({
            type: 'error',
            rule: 'button-toggle',
            message: 'Toggle button aria-pressed must be "true" or "false"',
            element: button,
            impact: 'serious'
          });
        }
      }
    });
    
    return issues;
  }
  
  /**
   * Test form accessibility
   */
  private testForms(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const formControls = this.container.querySelectorAll('input, select, textarea');
    
    formControls.forEach(control => {
      const type = control.getAttribute('type');
      
      // Skip hidden inputs
      if (type === 'hidden') return;
      
      // Check for labels
      const id = control.getAttribute('id');
      const ariaLabel = control.getAttribute('aria-label');
      const ariaLabelledby = control.getAttribute('aria-labelledby');
      
      let hasLabel = false;
      
      if (id) {
        const label = this.container.querySelector(`label[for="${id}"]`);
        hasLabel = !!label;
      }
      
      if (!hasLabel && !ariaLabel && !ariaLabelledby) {
        issues.push({
          type: 'error',
          rule: 'form-label',
          message: 'Form control must have associated label',
          element: control,
          impact: 'critical'
        });
      }
      
      // Check required fields
      if (control.hasAttribute('required') && !control.hasAttribute('aria-required')) {
        issues.push({
          type: 'info',
          rule: 'form-required',
          message: 'Required fields should have aria-required="true"',
          element: control,
          impact: 'minor'
        });
      }
      
      // Check for error states
      if (control.getAttribute('aria-invalid') === 'true') {
        const describedBy = control.getAttribute('aria-describedby');
        if (!describedBy) {
          issues.push({
            type: 'warning',
            rule: 'form-error',
            message: 'Invalid form control should reference error message',
            element: control,
            impact: 'moderate'
          });
        }
      }
    });
    
    return issues;
  }
  
  /**
   * Test table accessibility
   */
  private testTables(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const tables = this.container.querySelectorAll('table');
    
    tables.forEach(table => {
      // Check for caption or aria-label
      const caption = table.querySelector('caption');
      const ariaLabel = table.getAttribute('aria-label');
      const ariaLabelledby = table.getAttribute('aria-labelledby');
      
      if (!caption && !ariaLabel && !ariaLabelledby) {
        issues.push({
          type: 'warning',
          rule: 'table-caption',
          message: 'Table should have caption or aria-label',
          element: table,
          impact: 'moderate'
        });
      }
      
      // Check for headers
      const headers = table.querySelectorAll('th');
      const rows = table.querySelectorAll('tr');
      
      if (headers.length === 0 && rows.length > 1) {
        issues.push({
          type: 'error',
          rule: 'table-headers',
          message: 'Data table must have header cells',
          element: table,
          impact: 'serious'
        });
      }
      
      // Check header scope
      headers.forEach(header => {
        if (!header.hasAttribute('scope') && !header.hasAttribute('id')) {
          issues.push({
            type: 'warning',
            rule: 'table-scope',
            message: 'Table headers should have scope attribute',
            element: header,
            impact: 'moderate'
          });
        }
      });
    });
    
    return issues;
  }
  
  /**
   * Test landmark accessibility
   */
  private testLandmarks(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for main landmark
    const main = this.container.querySelector('main, [role="main"]');
    if (!main) {
      issues.push({
        type: 'error',
        rule: 'landmark-main',
        message: 'Page should have main landmark',
        impact: 'serious'
      });
    }
    
    // Check for navigation landmarks
    const navs = this.container.querySelectorAll('nav, [role="navigation"]');
    navs.forEach(nav => {
      const accessibleName = this.getAccessibleName(nav);
      if (navs.length > 1 && !accessibleName) {
        issues.push({
          type: 'warning',
          rule: 'landmark-nav-label',
          message: 'Multiple navigation landmarks should have unique labels',
          element: nav,
          impact: 'moderate'
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Test color contrast
   */
  private testColorContrast(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const textElements = this.container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
    
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Skip if no text content
      if (!element.textContent?.trim()) return;
      
      // Skip if transparent background (would need to check parent)
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') return;
      
      try {
        const contrast = ContrastChecker.getContrastRatio(color, backgroundColor);
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;
        
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        const requiredRatio = isLargeText ? 3 : 4.5;
        
        if (contrast < requiredRatio) {
          issues.push({
            type: 'error',
            rule: 'color-contrast',
            message: `Insufficient color contrast: ${contrast.toFixed(2)}:1 (required: ${requiredRatio}:1)`,
            element: element,
            impact: 'serious'
          });
        }
      } catch (error) {
        // Skip if color parsing fails
      }
    });
    
    return issues;
  }
  
  /**
   * Test keyboard navigation
   */
  private testKeyboardNavigation(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const interactiveElements = this.container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex], [role="button"], [role="link"], [role="menuitem"], [role="tab"]'
    );
    
    interactiveElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      
      // Check for positive tabindex
      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push({
          type: 'warning',
          rule: 'tabindex-positive',
          message: 'Avoid positive tabindex values',
          element: element,
          impact: 'moderate'
        });
      }
      
      // Check for keyboard event handlers
      const hasClick = element.hasAttribute('onclick') || element.addEventListener;
      const hasKeydown = element.hasAttribute('onkeydown');
      
      if (hasClick && !hasKeydown && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
        issues.push({
          type: 'warning',
          rule: 'keyboard-handler',
          message: 'Interactive element should handle keyboard events',
          element: element,
          impact: 'moderate'
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Test ARIA labels and properties
   */
  private testAriaLabels(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const elementsWithAria = this.container.querySelectorAll('[aria-labelledby], [aria-describedby]');
    
    elementsWithAria.forEach(element => {
      // Check aria-labelledby references
      const labelledby = element.getAttribute('aria-labelledby');
      if (labelledby) {
        const ids = labelledby.split(' ');
        ids.forEach(id => {
          const referencedElement = this.container.querySelector(`#${id}`);
          if (!referencedElement) {
            issues.push({
              type: 'error',
              rule: 'aria-labelledby',
              message: `aria-labelledby references non-existent element: ${id}`,
              element: element,
              impact: 'serious'
            });
          }
        });
      }
      
      // Check aria-describedby references
      const describedby = element.getAttribute('aria-describedby');
      if (describedby) {
        const ids = describedby.split(' ');
        ids.forEach(id => {
          const referencedElement = this.container.querySelector(`#${id}`);
          if (!referencedElement) {
            issues.push({
              type: 'error',
              rule: 'aria-describedby',
              message: `aria-describedby references non-existent element: ${id}`,
              element: element,
              impact: 'serious'
            });
          }
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Test focus management
   */
  private testFocusManagement(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const focusableElements = this.container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    // Check for focus traps in modals
    const modals = this.container.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    modals.forEach(modal => {
      const modalFocusable = modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (modalFocusable.length === 0) {
        issues.push({
          type: 'warning',
          rule: 'modal-focus',
          message: 'Modal should contain focusable elements',
          element: modal,
          impact: 'moderate'
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Test media accessibility
   */
  private testMediaAccessibility(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Test videos
    const videos = this.container.querySelectorAll('video');
    videos.forEach(video => {
      const tracks = video.querySelectorAll('track');
      const hasCaptions = Array.from(tracks).some(track => 
        track.getAttribute('kind') === 'captions' || track.getAttribute('kind') === 'subtitles'
      );
      
      if (!hasCaptions) {
        issues.push({
          type: 'warning',
          rule: 'video-captions',
          message: 'Video should have captions or subtitles',
          element: video,
          impact: 'moderate'
        });
      }
      
      // Check for controls
      if (!video.hasAttribute('controls') && !video.hasAttribute('aria-label')) {
        issues.push({
          type: 'warning',
          rule: 'video-controls',
          message: 'Video should have controls or custom control interface',
          element: video,
          impact: 'moderate'
        });
      }
    });
    
    // Test audio
    const audios = this.container.querySelectorAll('audio');
    audios.forEach(audio => {
      if (!audio.hasAttribute('controls')) {
        issues.push({
          type: 'warning',
          rule: 'audio-controls',
          message: 'Audio should have controls',
          element: audio,
          impact: 'moderate'
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Get accessible name for an element
   */
  private getAccessibleName(element: Element): string {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();
    
    // Check aria-labelledby
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    if (ariaLabelledby) {
      const ids = ariaLabelledby.split(' ');
      const texts = ids.map(id => {
        const el = this.container.querySelector(`#${id}`);
        return el?.textContent?.trim() || '';
      }).filter(Boolean);
      if (texts.length > 0) return texts.join(' ');
    }
    
    // Check associated label
    const id = element.getAttribute('id');
    if (id) {
      const label = this.container.querySelector(`label[for="${id}"]`);
      if (label?.textContent) return label.textContent.trim();
    }
    
    // Check text content
    const textContent = element.textContent?.trim();
    if (textContent) return textContent;
    
    // Check alt text for images
    if (element.tagName === 'IMG') {
      const alt = element.getAttribute('alt');
      if (alt) return alt.trim();
    }
    
    // Check title attribute
    const title = element.getAttribute('title');
    if (title) return title.trim();
    
    return '';
  }
  
  /**
   * Summarize issues by type
   */
  private summarizeIssues(issues: AccessibilityIssue[]) {
    return {
      errors: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      info: issues.filter(i => i.type === 'info').length
    };
  }
  
  /**
   * Calculate accessibility score
   */
  private calculateScore(summary: { errors: number; warnings: number; info: number }): number {
    const totalIssues = summary.errors + summary.warnings + summary.info;
    if (totalIssues === 0) return 100;
    
    // Weight errors more heavily
    const weightedScore = Math.max(0, 100 - (summary.errors * 10 + summary.warnings * 5 + summary.info * 1));
    return Math.round(weightedScore);
  }
}

/**
 * Quick accessibility check function
 */
export async function checkAccessibility(element?: HTMLElement): Promise<AccessibilityTestResult> {
  const tester = new AccessibilityTester(element);
  return await tester.runTests();
}

/**
 * Generate accessibility report
 */
export function generateAccessibilityReport(result: AccessibilityTestResult): string {
  const { issues, score, summary } = result;
  
  let report = `# Accessibility Report\n\n`;
  report += `**Score:** ${score}/100\n`;
  report += `**Status:** ${result.passed ? 'PASSED' : 'FAILED'}\n\n`;
  
  report += `## Summary\n`;
  report += `- Errors: ${summary.errors}\n`;
  report += `- Warnings: ${summary.warnings}\n`;
  report += `- Info: ${summary.info}\n\n`;
  
  if (issues.length > 0) {
    report += `## Issues\n\n`;
    
    const errorIssues = issues.filter(i => i.type === 'error');
    const warningIssues = issues.filter(i => i.type === 'warning');
    const infoIssues = issues.filter(i => i.type === 'info');
    
    if (errorIssues.length > 0) {
      report += `### Errors (${errorIssues.length})\n\n`;
      errorIssues.forEach((issue, index) => {
        report += `${index + 1}. **${issue.rule}** (${issue.impact})\n`;
        report += `   ${issue.message}\n`;
        if (issue.selector) {
          report += `   Selector: \`${issue.selector}\`\n`;
        }
        report += `\n`;
      });
    }
    
    if (warningIssues.length > 0) {
      report += `### Warnings (${warningIssues.length})\n\n`;
      warningIssues.forEach((issue, index) => {
        report += `${index + 1}. **${issue.rule}** (${issue.impact})\n`;
        report += `   ${issue.message}\n`;
        if (issue.selector) {
          report += `   Selector: \`${issue.selector}\`\n`;
        }
        report += `\n`;
      });
    }
    
    if (infoIssues.length > 0) {
      report += `### Information (${infoIssues.length})\n\n`;
      infoIssues.forEach((issue, index) => {
        report += `${index + 1}. **${issue.rule}** (${issue.impact})\n`;
        report += `   ${issue.message}\n`;
        if (issue.selector) {
          report += `   Selector: \`${issue.selector}\`\n`;
        }
        report += `\n`;
      });
    }
  } else {
    report += `## No Issues Found\n\nGreat job! No accessibility issues were detected.\n`;
  }
  
  return report;
}