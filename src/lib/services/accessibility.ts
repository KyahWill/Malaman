/**
 * Accessibility Service
 * Provides comprehensive accessibility features and utilities
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Accessibility preferences store
export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  captionsEnabled: boolean;
  audioDescriptions: boolean;
}

const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  screenReaderMode: false,
  keyboardNavigation: true,
  focusIndicators: true,
  captionsEnabled: false,
  audioDescriptions: false
};

// Load preferences from localStorage
function loadPreferences(): AccessibilityPreferences {
  if (!browser) return defaultPreferences;
  
  try {
    const stored = localStorage.getItem('accessibility-preferences');
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load accessibility preferences:', error);
  }
  
  return defaultPreferences;
}

// Create accessibility store
export const accessibilityPreferences = writable<AccessibilityPreferences>(loadPreferences());

// Save preferences to localStorage when they change
if (browser) {
  accessibilityPreferences.subscribe(prefs => {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(prefs));
      applyAccessibilitySettings(prefs);
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  });
}

// Apply accessibility settings to the document
function applyAccessibilitySettings(prefs: AccessibilityPreferences) {
  if (!browser) return;
  
  const root = document.documentElement;
  
  // High contrast mode
  root.classList.toggle('high-contrast', prefs.highContrast);
  
  // Reduced motion
  root.classList.toggle('reduced-motion', prefs.reducedMotion);
  
  // Font size
  root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
  root.classList.add(`font-${prefs.fontSize}`);
  
  // Screen reader mode
  root.classList.toggle('screen-reader-mode', prefs.screenReaderMode);
  
  // Focus indicators
  root.classList.toggle('enhanced-focus', prefs.focusIndicators);
  
  // Update CSS custom properties
  root.style.setProperty('--accessibility-font-scale', getFontScale(prefs.fontSize));
}

function getFontScale(fontSize: AccessibilityPreferences['fontSize']): string {
  switch (fontSize) {
    case 'small': return '0.875';
    case 'medium': return '1';
    case 'large': return '1.125';
    case 'extra-large': return '1.25';
    default: return '1';
  }
}

// Keyboard navigation utilities
export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = [];
  private currentIndex = -1;
  
  constructor(private container: HTMLElement) {
    this.updateFocusableElements();
    this.setupEventListeners();
  }
  
  private updateFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
      '[role="tab"]:not([disabled])'
    ].join(', ');
    
    this.focusableElements = Array.from(
      this.container.querySelectorAll(selector)
    ) as HTMLElement[];
  }
  
  private setupEventListeners() {
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  private handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Tab':
        this.handleTabNavigation(event);
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        if (event.target && this.isInNavigableGroup(event.target as HTMLElement)) {
          this.handleArrowNavigation(event);
        }
        break;
      case 'Home':
      case 'End':
        if (event.target && this.isInNavigableGroup(event.target as HTMLElement)) {
          this.handleHomeEndNavigation(event);
        }
        break;
      case 'Escape':
        this.handleEscapeKey(event);
        break;
    }
  }
  
  private handleTabNavigation(event: KeyboardEvent) {
    // Custom tab handling for complex components
    const activeElement = document.activeElement as HTMLElement;
    const currentIndex = this.focusableElements.indexOf(activeElement);
    
    if (currentIndex !== -1) {
      event.preventDefault();
      const nextIndex = event.shiftKey 
        ? (currentIndex - 1 + this.focusableElements.length) % this.focusableElements.length
        : (currentIndex + 1) % this.focusableElements.length;
      
      this.focusableElements[nextIndex]?.focus();
    }
  }
  
  private handleArrowNavigation(event: KeyboardEvent) {
    event.preventDefault();
    const activeElement = document.activeElement as HTMLElement;
    const currentIndex = this.focusableElements.indexOf(activeElement);
    
    if (currentIndex !== -1) {
      const nextIndex = event.key === 'ArrowDown'
        ? (currentIndex + 1) % this.focusableElements.length
        : (currentIndex - 1 + this.focusableElements.length) % this.focusableElements.length;
      
      this.focusableElements[nextIndex]?.focus();
    }
  }
  
  private handleHomeEndNavigation(event: KeyboardEvent) {
    event.preventDefault();
    const targetIndex = event.key === 'Home' ? 0 : this.focusableElements.length - 1;
    this.focusableElements[targetIndex]?.focus();
  }
  
  private handleEscapeKey(event: KeyboardEvent) {
    // Close modals, dropdowns, etc.
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement.closest('[role="dialog"]') || activeElement.closest('[role="menu"]')) {
      event.preventDefault();
      // Dispatch custom escape event
      this.container.dispatchEvent(new CustomEvent('accessibility:escape'));
    }
  }
  
  private isInNavigableGroup(element: HTMLElement): boolean {
    return !!(
      element.closest('[role="menu"]') ||
      element.closest('[role="tablist"]') ||
      element.closest('[role="listbox"]') ||
      element.closest('.keyboard-navigable')
    );
  }
  
  public focusFirst() {
    this.focusableElements[0]?.focus();
  }
  
  public focusLast() {
    this.focusableElements[this.focusableElements.length - 1]?.focus();
  }
  
  public destroy() {
    this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}

// Screen reader utilities
export class ScreenReaderManager {
  private announcements: HTMLElement;
  
  constructor() {
    this.createAnnouncementRegion();
  }
  
  private createAnnouncementRegion() {
    if (!browser) return;
    
    this.announcements = document.createElement('div');
    this.announcements.setAttribute('aria-live', 'polite');
    this.announcements.setAttribute('aria-atomic', 'true');
    this.announcements.className = 'sr-only';
    this.announcements.id = 'accessibility-announcements';
    
    document.body.appendChild(this.announcements);
  }
  
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announcements) return;
    
    this.announcements.setAttribute('aria-live', priority);
    this.announcements.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (this.announcements) {
        this.announcements.textContent = '';
      }
    }, 1000);
  }
  
  public announcePageChange(title: string) {
    this.announce(`Navigated to ${title}`, 'assertive');
  }
  
  public announceProgress(current: number, total: number, context: string) {
    this.announce(`${context}: ${current} of ${total} completed`);
  }
  
  public announceError(error: string) {
    this.announce(`Error: ${error}`, 'assertive');
  }
  
  public announceSuccess(message: string) {
    this.announce(`Success: ${message}`);
  }
}

// Focus management utilities
export class FocusManager {
  private focusStack: HTMLElement[] = [];
  
  public saveFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }
  
  public restoreFocus() {
    const lastFocused = this.focusStack.pop();
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }
  
  public trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
}

// Color contrast utilities
export class ContrastChecker {
  public static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  public static meetsWCAGAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 4.5;
  }
  
  public static meetsWCAGAAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 7;
  }
  
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  private static getLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
}

// Initialize global accessibility services
export const screenReader = browser ? new ScreenReaderManager() : null;
export const focusManager = browser ? new FocusManager() : null;

// Derived stores for easy access
export const isHighContrast = derived(accessibilityPreferences, $prefs => $prefs.highContrast);
export const isReducedMotion = derived(accessibilityPreferences, $prefs => $prefs.reducedMotion);
export const fontSize = derived(accessibilityPreferences, $prefs => $prefs.fontSize);
export const isScreenReaderMode = derived(accessibilityPreferences, $prefs => $prefs.screenReaderMode);