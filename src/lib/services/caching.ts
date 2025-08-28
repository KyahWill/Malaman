/**
 * Caching Service
 * Provides in-memory and browser-based caching for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }

  set<T>(key: string, data: T, ttl = 300000): void { // Default 5 minutes
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  private startCleanup(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 300000);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

class BrowserCache {
  private prefix: string;
  private storage: Storage;

  constructor(prefix = 'lms_cache_', useSessionStorage = false) {
    this.prefix = prefix;
    this.storage = useSessionStorage ? sessionStorage : localStorage;
  }

  set<T>(key: string, data: T, ttl = 300000): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to cache data in browser storage:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  delete(key: string): void {
    this.storage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(this.storage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    });
  }

  cleanup(): void {
    const keys = Object.keys(this.storage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = this.storage.getItem(key);
          if (item) {
            const entry = JSON.parse(item);
            if (now - entry.timestamp > entry.ttl) {
              this.storage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted entries
          this.storage.removeItem(key);
        }
      }
    });
  }
}

export class CacheService {
  private memoryCache: MemoryCache;
  private browserCache: BrowserCache | null = null;

  constructor() {
    this.memoryCache = new MemoryCache();
    
    // Initialize browser cache only in browser environment
    if (typeof window !== 'undefined') {
      this.browserCache = new BrowserCache();
      // Clean up expired browser cache entries on initialization
      this.browserCache.cleanup();
    }
  }

  // Cache keys for different data types
  static readonly KEYS = {
    COURSE: (id: string) => `course_${id}`,
    COURSE_LIST: (filters: string) => `courses_${filters}`,
    LESSON: (id: string) => `lesson_${id}`,
    LESSON_CONTENT: (id: string) => `lesson_content_${id}`,
    USER_PROFILE: (id: string) => `profile_${id}`,
    STUDENT_PROGRESS: (studentId: string, courseId: string) => `progress_${studentId}_${courseId}`,
    ASSESSMENT: (id: string) => `assessment_${id}`,
    ROADMAP: (studentId: string) => `roadmap_${studentId}`,
    ANALYTICS: (type: string, id: string) => `analytics_${type}_${id}`,
    RECOMMENDATIONS: (studentId: string) => `recommendations_${studentId}`
  } as const;

  // TTL constants (in milliseconds)
  static readonly TTL = {
    SHORT: 60000,      // 1 minute
    MEDIUM: 300000,    // 5 minutes
    LONG: 900000,      // 15 minutes
    VERY_LONG: 3600000 // 1 hour
  } as const;

  set<T>(key: string, data: T, ttl = CacheService.TTL.MEDIUM, persistent = false): void {
    this.memoryCache.set(key, data, ttl);
    
    if (persistent && this.browserCache) {
      this.browserCache.set(key, data, ttl);
    }
  }

  get<T>(key: string, checkBrowser = false): T | null {
    // Try memory cache first
    let data = this.memoryCache.get<T>(key);
    
    if (data === null && checkBrowser && this.browserCache) {
      // Fallback to browser cache
      data = this.browserCache.get<T>(key);
      
      // If found in browser cache, restore to memory cache
      if (data !== null) {
        this.memoryCache.set(key, data);
      }
    }
    
    return data;
  }

  delete(key: string, fromBrowser = false): void {
    this.memoryCache.delete(key);
    
    if (fromBrowser && this.browserCache) {
      this.browserCache.delete(key);
    }
  }

  clear(clearBrowser = false): void {
    this.memoryCache.clear();
    
    if (clearBrowser && this.browserCache) {
      this.browserCache.clear();
    }
  }

  invalidatePattern(pattern: string): void {
    // Invalidate cache entries matching a pattern
    const regex = new RegExp(pattern);
    
    // Clear from memory cache
    const memoryStats = this.memoryCache.getStats();
    for (let i = 0; i < memoryStats.size; i++) {
      // Note: This is a simplified implementation
      // In a real scenario, we'd need to track keys separately
    }
    
    // Clear from browser cache
    if (this.browserCache && typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('lms_cache_') && regex.test(key)) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  getStats(): CacheStats {
    return this.memoryCache.getStats();
  }

  // Utility methods for common caching patterns
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = CacheService.TTL.MEDIUM,
    persistent = false
  ): Promise<T> {
    let data = this.get<T>(key, persistent);
    
    if (data === null) {
      data = await fetcher();
      this.set(key, data, ttl, persistent);
    }
    
    return data;
  }

  // Preload commonly accessed data
  async preloadCourseData(courseId: string): Promise<void> {
    try {
      // This would typically fetch and cache course, lessons, and related data
      // Implementation depends on your data fetching service
      console.log(`Preloading data for course ${courseId}`);
    } catch (error) {
      console.warn('Failed to preload course data:', error);
    }
  }

  destroy(): void {
    this.memoryCache.destroy();
  }
}

// Global cache instance
export const cacheService = new CacheService();

// Cache-aware data fetching utilities
export const withCache = {
  course: async (id: string, fetcher: () => Promise<any>) => {
    return cacheService.getOrSet(
      CacheService.KEYS.COURSE(id),
      fetcher,
      CacheService.TTL.LONG,
      true
    );
  },

  lesson: async (id: string, fetcher: () => Promise<any>) => {
    return cacheService.getOrSet(
      CacheService.KEYS.LESSON(id),
      fetcher,
      CacheService.TTL.MEDIUM,
      true
    );
  },

  userProfile: async (id: string, fetcher: () => Promise<any>) => {
    return cacheService.getOrSet(
      CacheService.KEYS.USER_PROFILE(id),
      fetcher,
      CacheService.TTL.LONG,
      true
    );
  },

  studentProgress: async (studentId: string, courseId: string, fetcher: () => Promise<any>) => {
    return cacheService.getOrSet(
      CacheService.KEYS.STUDENT_PROGRESS(studentId, courseId),
      fetcher,
      CacheService.TTL.SHORT // Progress data changes frequently
    );
  }
};