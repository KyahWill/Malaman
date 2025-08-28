<script lang="ts">
  import { accessibilityPreferences, type AccessibilityPreferences } from '$lib/services/accessibility';
  import { Button } from '$lib/components/ui';
  import { Card } from '$lib/components/ui';
  
  let isOpen = false;
  let preferences: AccessibilityPreferences;
  
  // Subscribe to preferences
  accessibilityPreferences.subscribe(prefs => {
    preferences = prefs;
  });
  
  function updatePreference<K extends keyof AccessibilityPreferences>(
    key: K, 
    value: AccessibilityPreferences[K]
  ) {
    accessibilityPreferences.update(prefs => ({
      ...prefs,
      [key]: value
    }));
  }
  
  function resetToDefaults() {
    accessibilityPreferences.set({
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      screenReaderMode: false,
      keyboardNavigation: true,
      focusIndicators: true,
      captionsEnabled: false,
      audioDescriptions: false
    });
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<!-- Accessibility Settings Button -->
<div class="accessibility-settings">
  <Button
    variant="ghost"
    size="sm"
    on:click={() => isOpen = !isOpen}
    aria-label="Open accessibility settings"
    aria-expanded={isOpen}
    aria-controls="accessibility-panel"
    class="accessibility-toggle"
  >
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6"/>
      <path d="m21 12-6-3-6 3-6-3"/>
    </svg>
    <span class="sr-only">Accessibility Settings</span>
  </Button>
  
  {#if isOpen}
    <div 
      id="accessibility-panel"
      class="accessibility-panel"
      role="dialog"
      aria-labelledby="accessibility-title"
      aria-modal="true"
    >
      <Card class="accessibility-card">
        <div class="accessibility-header">
          <h2 id="accessibility-title" class="text-lg font-semibold">
            Accessibility Settings
          </h2>
          <Button
            variant="ghost"
            size="sm"
            on:click={() => isOpen = false}
            aria-label="Close accessibility settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </Button>
        </div>
        
        <div class="accessibility-content">
          <!-- Visual Settings -->
          <fieldset class="setting-group">
            <legend class="setting-group-title">Visual Settings</legend>
            
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  bind:checked={preferences.highContrast}
                  on:change={() => updatePreference('highContrast', !preferences.highContrast)}
                  class="setting-checkbox"
                />
                <span class="setting-text">High Contrast Mode</span>
              </label>
              <p class="setting-description">
                Increases contrast between text and background colors for better visibility.
              </p>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  bind:checked={preferences.reducedMotion}
                  on:change={() => updatePreference('reducedMotion', !preferences.reducedMotion)}
                  class="setting-checkbox"
                />
                <span class="setting-text">Reduce Motion</span>
              </label>
              <p class="setting-description">
                Minimizes animations and transitions that may cause discomfort.
              </p>
            </div>
            
            <div class="setting-item">
              <label for="font-size" class="setting-text">Font Size</label>
              <select
                id="font-size"
                bind:value={preferences.fontSize}
                on:change={(e) => updatePreference('fontSize', e.currentTarget.value as any)}
                class="setting-select"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
              <p class="setting-description">
                Adjusts the base font size throughout the application.
              </p>
            </div>
          </fieldset>
          
          <!-- Navigation Settings -->
          <fieldset class="setting-group">
            <legend class="setting-group-title">Navigation Settings</legend>
            
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  bind:checked={preferences.keyboardNavigation}
                  on:change={() => updatePreference('keyboardNavigation', !preferences.keyboardNavigation)}
                  class="setting-checkbox"
                />
                <span class="setting-text">Enhanced Keyboard Navigation</span>
              </label>
              <p class="setting-description">
                Enables advanced keyboard shortcuts and navigation features.
              </p>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  bind:checked={preferences.focusIndicators}
                  on:change={() => updatePreference('focusIndicators', !preferences.focusIndicators)}
                  class="setting-checkbox"
                />
                <span class="setting-text">Enhanced Focus Indicators</span>
              </label>
              <p class="setting-description">
                Shows clearer visual indicators when elements are focused.
              </p>
            </div>
          </fieldset>
          
          <!-- Screen Reader Settings -->
          <fieldset class="setting-group">
            <legend class="setting-group-title">Screen Reader Settings</legend>
            
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  bind:checked={preferences.screenReaderMode}
                  on:change={() => updatePreference('screenReaderMode', !preferences.screenReaderMode)}
                  class="setting-checkbox"
                />
                <span class="setting-text">Screen Reader Optimizations</span>
              </label>
              <p class="setting-description">
                Optimizes the interface for screen reader users with additional context and descriptions.
              </p>
            </div>
          </fieldset>
          
          <!-- Media Settings -->
          <fieldset class="setting-group">
            <legend class="setting-group-title">Media Settings</legend>
            
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  bind:checked={preferences.captionsEnabled}
                  on:change={() => updatePreference('captionsEnabled', !preferences.captionsEnabled)}
                  class="setting-checkbox"
                />
                <span class="setting-text">Enable Captions</span>
              </label>
              <p class="setting-description">
                Shows captions for videos when available.
              </p>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  bind:checked={preferences.audioDescriptions}
                  on:change={() => updatePreference('audioDescriptions', !preferences.audioDescriptions)}
                  class="setting-checkbox"
                />
                <span class="setting-text">Audio Descriptions</span>
              </label>
              <p class="setting-description">
                Enables audio descriptions for visual content when available.
              </p>
            </div>
          </fieldset>
          
          <!-- Actions -->
          <div class="setting-actions">
            <Button
              variant="outline"
              on:click={resetToDefaults}
              class="reset-button"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </Card>
    </div>
  {/if}
</div>

<style>
  .accessibility-settings {
    position: relative;
  }
  
  .accessibility-panel {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    margin-top: 0.5rem;
    width: 400px;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  .accessibility-card {
    padding: 1.5rem;
  }
  
  .accessibility-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .accessibility-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .setting-group {
    border: none;
    padding: 0;
    margin: 0;
  }
  
  .setting-group-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .setting-item {
    margin-bottom: 1rem;
  }
  
  .setting-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
  }
  
  .setting-checkbox {
    margin-top: 0.125rem;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
  
  .setting-text {
    font-weight: 500;
    color: #111827;
    line-height: 1.25;
  }
  
  .setting-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
    margin-left: 1.75rem;
    line-height: 1.4;
  }
  
  .setting-select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: white;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
  
  .setting-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .setting-actions {
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .reset-button {
    width: 100%;
  }
  
  /* High contrast mode styles */
  :global(.high-contrast) .accessibility-panel {
    background: black;
    border-color: white;
    color: white;
  }
  
  :global(.high-contrast) .accessibility-card {
    background: black;
    color: white;
  }
  
  :global(.high-contrast) .setting-text {
    color: white;
  }
  
  :global(.high-contrast) .setting-description {
    color: #d1d5db;
  }
  
  :global(.high-contrast) .setting-select {
    background: black;
    color: white;
    border-color: white;
  }
  
  /* Enhanced focus indicators */
  :global(.enhanced-focus) .setting-checkbox:focus,
  :global(.enhanced-focus) .setting-select:focus {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
  }
  
  /* Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  /* Reduced motion */
  :global(.reduced-motion) * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Font size scaling */
  :global(.font-small) {
    font-size: 0.875rem;
  }
  
  :global(.font-large) {
    font-size: 1.125rem;
  }
  
  :global(.font-extra-large) {
    font-size: 1.25rem;
  }
</style>