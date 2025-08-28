/**
 * Lazy Loading Utilities
 * Provides intersection observer-based lazy loading for content and images
 */

interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
  placeholder?: string;
}

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollState {
  scrollTop: number;
  startIndex: number;
  endIndex: number;
  visibleItems: any[];
  totalHeight: number;
}

// Intersection Observer for lazy loading
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private loadedElements = new WeakSet();

  constructor(options: LazyLoadOptions = {}) {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const {
      rootMargin = '50px',
      threshold = 0.1,
      once = true
    } = options;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
          this.loadElement(entry.target as HTMLElement);
          
          if (once) {
            this.loadedElements.add(entry.target);
            this.observer?.unobserve(entry.target);
          }
        }
      });
    }, {
      rootMargin,
      threshold
    });
  }

  private loadElement(element: HTMLElement): void {
    // Handle different types of lazy loading
    if (element.tagName === 'IMG') {
      this.loadImage(element as HTMLImageElement);
    } else if (element.hasAttribute('data-lazy-component')) {
      this.loadComponent(element);
    } else if (element.hasAttribute('data-lazy-content')) {
      this.loadContent(element);
    }

    // Dispatch custom event
    element.dispatchEvent(new CustomEvent('lazyloaded', {
      bubbles: true,
      detail: { element }
    }));
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.getAttribute('data-src');
    const srcset = img.getAttribute('data-srcset');
    
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    
    if (srcset) {
      img.srcset = srcset;
      img.removeAttribute('data-srcset');
    }

    // Add loading class for CSS transitions
    img.classList.add('lazy-loading');
    
    img.onload = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
    };

    img.onerror = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      
      // Set fallback image if available
      const fallback = img.getAttribute('data-fallback');
      if (fallback && img.src !== fallback) {
        img.src = fallback;
      }
    };
  }

  private loadComponent(element: HTMLElement): void {
    const componentName = element.getAttribute('data-lazy-component');
    const componentProps = element.getAttribute('data-component-props');
    
    // This would integrate with your component loading system
    // For now, just remove the loading placeholder
    element.classList.remove('lazy-placeholder');
    element.classList.add('lazy-loaded');
  }

  private loadContent(element: HTMLElement): void {
    const contentUrl = element.getAttribute('data-lazy-content');
    
    if (contentUrl) {
      fetch(contentUrl)
        .then(response => response.text())
        .then(html => {
          element.innerHTML = html;
          element.classList.remove('lazy-placeholder');
          element.classList.add('lazy-loaded');
        })
        .catch(error => {
          console.error('Failed to load lazy content:', error);
          element.classList.add('lazy-error');
        });
    }
  }

  observe(element: HTMLElement): void {
    if (this.observer) {
      this.observer.observe(element);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadElement(element);
    }
  }

  unobserve(element: HTMLElement): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Virtual scrolling for large lists
export class VirtualScroller {
  private container: HTMLElement;
  private options: VirtualScrollOptions;
  private state: VirtualScrollState;
  private items: any[];
  private onStateChange?: (state: VirtualScrollState) => void;

  constructor(
    container: HTMLElement,
    items: any[],
    options: VirtualScrollOptions,
    onStateChange?: (state: VirtualScrollState) => void
  ) {
    this.container = container;
    this.items = items;
    this.options = { overscan: 5, ...options };
    this.onStateChange = onStateChange;

    this.state = {
      scrollTop: 0,
      startIndex: 0,
      endIndex: 0,
      visibleItems: [],
      totalHeight: items.length * options.itemHeight
    };

    this.updateVisibleItems();
    this.setupScrollListener();
  }

  private setupScrollListener(): void {
    this.container.addEventListener('scroll', () => {
      this.state.scrollTop = this.container.scrollTop;
      this.updateVisibleItems();
    });
  }

  private updateVisibleItems(): void {
    const { itemHeight, containerHeight, overscan = 5 } = this.options;
    const { scrollTop } = this.state;

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      this.items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    // Update state
    this.state.startIndex = startIndex;
    this.state.endIndex = endIndex;
    this.state.visibleItems = this.items.slice(startIndex, endIndex + 1);

    // Notify state change
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  updateItems(newItems: any[]): void {
    this.items = newItems;
    this.state.totalHeight = newItems.length * this.options.itemHeight;
    this.updateVisibleItems();
  }

  scrollToIndex(index: number): void {
    const scrollTop = index * this.options.itemHeight;
    this.container.scrollTop = scrollTop;
  }

  getState(): VirtualScrollState {
    return { ...this.state };
  }
}

// Svelte action for lazy loading
export function lazyLoad(element: HTMLElement, options: LazyLoadOptions = {}) {
  const loader = new LazyLoader(options);
  loader.observe(element);

  return {
    destroy() {
      loader.unobserve(element);
      loader.disconnect();
    }
  };
}

// Svelte action for lazy loading images
export function lazyImage(img: HTMLImageElement, { src, srcset, placeholder, fallback }: {
  src: string;
  srcset?: string;
  placeholder?: string;
  fallback?: string;
}) {
  // Set placeholder
  if (placeholder) {
    img.src = placeholder;
  }

  // Set data attributes for lazy loading
  img.setAttribute('data-src', src);
  if (srcset) {
    img.setAttribute('data-srcset', srcset);
  }
  if (fallback) {
    img.setAttribute('data-fallback', fallback);
  }

  // Add loading class
  img.classList.add('lazy-image');

  const loader = new LazyLoader();
  loader.observe(img);

  return {
    update(newParams: { src: string; srcset?: string; placeholder?: string; fallback?: string }) {
      img.setAttribute('data-src', newParams.src);
      if (newParams.srcset) {
        img.setAttribute('data-srcset', newParams.srcset);
      }
      if (newParams.fallback) {
        img.setAttribute('data-fallback', newParams.fallback);
      }
    },
    destroy() {
      loader.unobserve(img);
      loader.disconnect();
    }
  };
}

// Utility for progressive image loading
export function createProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string,
  alt: string = ''
): HTMLImageElement {
  const img = document.createElement('img');
  img.alt = alt;
  img.classList.add('progressive-image');

  // Load low quality image first
  img.src = lowQualitySrc;
  img.classList.add('progressive-loading');

  // Preload high quality image
  const highQualityImg = new Image();
  highQualityImg.onload = () => {
    img.src = highQualitySrc;
    img.classList.remove('progressive-loading');
    img.classList.add('progressive-loaded');
  };
  highQualityImg.src = highQualitySrc;

  return img;
}

// Infinite scroll utility
export class InfiniteScroller {
  private container: HTMLElement;
  private loadMore: () => Promise<any[]>;
  private options: {
    threshold?: number;
    rootMargin?: string;
  };
  private observer: IntersectionObserver | null = null;
  private sentinel: HTMLElement | null = null;
  private loading = false;

  constructor(
    container: HTMLElement,
    loadMore: () => Promise<any[]>,
    options: { threshold?: number; rootMargin?: string } = {}
  ) {
    this.container = container;
    this.loadMore = loadMore;
    this.options = { threshold: 0.1, rootMargin: '100px', ...options };

    this.setupInfiniteScroll();
  }

  private setupInfiniteScroll(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    // Create sentinel element
    this.sentinel = document.createElement('div');
    this.sentinel.className = 'infinite-scroll-sentinel';
    this.sentinel.style.height = '1px';
    this.container.appendChild(this.sentinel);

    // Setup observer
    this.observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !this.loading) {
          this.loading = true;
          
          try {
            const newItems = await this.loadMore();
            
            // Dispatch event with new items
            this.container.dispatchEvent(new CustomEvent('itemsloaded', {
              detail: { items: newItems }
            }));
          } catch (error) {
            console.error('Failed to load more items:', error);
            
            this.container.dispatchEvent(new CustomEvent('loadingerror', {
              detail: { error }
            }));
          } finally {
            this.loading = false;
          }
        }
      },
      {
        root: this.container,
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin
      }
    );

    this.observer.observe(this.sentinel);
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.sentinel && this.sentinel.parentNode) {
      this.sentinel.parentNode.removeChild(this.sentinel);
    }
  }
}

// Svelte action for infinite scroll
export function infiniteScroll(
  container: HTMLElement,
  { loadMore, threshold = 0.1, rootMargin = '100px' }: {
    loadMore: () => Promise<any[]>;
    threshold?: number;
    rootMargin?: string;
  }
) {
  const scroller = new InfiniteScroller(container, loadMore, { threshold, rootMargin });

  return {
    destroy() {
      scroller.destroy();
    }
  };
}

// Preloading utilities
export const preloader = {
  images: (urls: string[]): Promise<HTMLImageElement[]> => {
    return Promise.all(
      urls.map(url => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      })
    );
  },

  content: async (urls: string[]): Promise<string[]> => {
    return Promise.all(
      urls.map(url => fetch(url).then(response => response.text()))
    );
  },

  components: async (componentPaths: string[]): Promise<any[]> => {
    // This would integrate with your component loading system
    return Promise.all(
      componentPaths.map(path => import(path))
    );
  }
};

// CSS for lazy loading (to be added to global styles)
export const lazyLoadingCSS = `
.lazy-image {
  transition: opacity 0.3s ease;
}

.lazy-loading {
  opacity: 0.5;
}

.lazy-loaded {
  opacity: 1;
}

.lazy-error {
  opacity: 0.3;
  filter: grayscale(100%);
}

.lazy-placeholder {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.progressive-image {
  transition: filter 0.3s ease;
}

.progressive-loading {
  filter: blur(2px);
}

.progressive-loaded {
  filter: blur(0);
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.infinite-scroll-sentinel {
  pointer-events: none;
}
`;