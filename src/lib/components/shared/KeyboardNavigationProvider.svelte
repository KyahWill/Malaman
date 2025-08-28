<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { KeyboardNavigationManager, focusManager } from '$lib/services/accessibility';
  
  export let trapFocus = false;
  export let restoreFocus = true;
  export let skipLinks: { href: string; text: string }[] = [];
  
  const dispatch = createEventDispatcher();
  
  let container: HTMLElement;
  let navigationManager: KeyboardNavigationManager;
  let focusTrapCleanup: (() => void) | null = null;
  
  onMount(() => {
    if (container) {
      navigationManager = new KeyboardNavigationManager(container);
      
      // Set up focus trap if requested
      if (trapFocus && focusManager) {
        focusManager.saveFocus();
        focusTrapCleanup = focusManager.trapFocus(container);
      }
      
      // Listen for escape events
      container.addEventListener('accessibility:escape', handleEscape);
    }
    
    return () => {
      if (navigationManager) {
        navigationManager.destroy();
      }
      
      if (focusTrapCleanup) {
        focusTrapCleanup();
      }
      
      if (restoreFocus && focusManager) {
        focusManager.restoreFocus();
      }
      
      if (container) {
        container.removeEventListener('accessibility:escape', handleEscape);
      }
    };
  });
  
  function handleEscape() {
    dispatch('escape');
  }
  
  function handleSkipLink(href: string) {
    const target = document.querySelector(href);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
</script>

<div 
  bind:this={container}
  class="keyboard-navigation-provider"
  class:focus-trap={trapFocus}
>
  <!-- Skip links for keyboard users -->
  {#if skipLinks.length > 0}
    <div class="skip-links" aria-label="Skip navigation links">
      {#each skipLinks as link}
        <a 
          href={link.href}
          class="skip-link"
          on:click|preventDefault={() => handleSkipLink(link.href)}
        >
          {link.text}
        </a>
      {/each}
    </div>
  {/if}
  
  <slot />
</div>

<style>
  .keyboard-navigation-provider {
    position: relative;
  }
  
  .skip-links {
    position: absolute;
    top: -100px;
    left: 0;
    z-index: 9999;
    display: flex;
    gap: 0.5rem;
  }
  
  .skip-link {
    position: absolute;
    top: -100px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 0.5rem 1rem;
    text-decoration: none;
    border-radius: 0.25rem;
    font-weight: 500;
    white-space: nowrap;
    transition: top 0.2s ease;
  }
  
  .skip-link:focus {
    top: 0;
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .skip-link:hover {
    background: #333;
  }
  
  /* Focus trap styles */
  .focus-trap {
    isolation: isolate;
  }
  
  /* Enhanced focus indicators */
  :global(.enhanced-focus) .keyboard-navigation-provider *:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 0.25rem;
  }
  
  /* High contrast mode */
  :global(.high-contrast) .skip-link {
    background: white;
    color: black;
    border: 2px solid black;
  }
  
  :global(.high-contrast) .skip-link:focus {
    outline: 3px solid #ffff00;
    outline-offset: 2px;
  }
</style>