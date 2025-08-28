/**
 * CDN Optimization Service
 * Handles media optimization and delivery through CDN
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
}

interface VideoTransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm' | 'hls';
  thumbnail?: {
    time?: number; // seconds
    width?: number;
    height?: number;
  };
}

interface CDNConfig {
  baseUrl: string;
  transformationEndpoint: string;
  cacheHeaders: {
    maxAge: number;
    staleWhileRevalidate: number;
  };
  supportedFormats: {
    images: string[];
    videos: string[];
  };
}

export class CDNOptimizationService {
  private config: CDNConfig;
  private devicePixelRatio: number;
  private connectionSpeed: 'slow' | 'medium' | 'fast';

  constructor(config: CDNConfig) {
    this.config = config;
    this.devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.connectionSpeed = this.detectConnectionSpeed();
  }

  private detectConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return 'medium';
    }

    const connection = (navigator as any).connection;
    if (!connection) return 'medium';

    const effectiveType = connection.effectiveType;
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        return 'medium';
      case '4g':
      default:
        return 'fast';
    }
  }

  // Generate optimized image URL
  generateImageUrl(
    originalUrl: string,
    options: ImageTransformOptions = {}
  ): string {
    const {
      width,
      height,
      quality = this.getOptimalQuality(),
      format = this.getOptimalImageFormat(),
      fit = 'cover',
      blur,
      sharpen,
      grayscale
    } = options;

    // Adjust dimensions for device pixel ratio
    const adjustedWidth = width ? Math.round(width * this.devicePixelRatio) : undefined;
    const adjustedHeight = height ? Math.round(height * this.devicePixelRatio) : undefined;

    const params = new URLSearchParams();
    
    if (adjustedWidth) params.set('w', adjustedWidth.toString());
    if (adjustedHeight) params.set('h', adjustedHeight.toString());
    if (quality) params.set('q', quality.toString());
    if (format) params.set('f', format);
    if (fit) params.set('fit', fit);
    if (blur) params.set('blur', blur.toString());
    if (sharpen) params.set('sharpen', 'true');
    if (grayscale) params.set('grayscale', 'true');

    // Add original URL as parameter
    params.set('url', encodeURIComponent(originalUrl));

    return `${this.config.transformationEndpoint}?${params.toString()}`;
  }

  // Generate responsive image srcset
  generateResponsiveImageSrcSet(
    originalUrl: string,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1920],
    options: Omit<ImageTransformOptions, 'width'> = {}
  ): string {
    return breakpoints
      .map(width => {
        const url = this.generateImageUrl(originalUrl, { ...options, width });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  // Generate optimized video URL
  generateVideoUrl(
    originalUrl: string,
    options: VideoTransformOptions = {}
  ): string {
    const {
      width,
      height,
      quality = this.getOptimalVideoQuality(),
      format = this.getOptimalVideoFormat()
    } = options;

    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality);
    if (format) params.set('f', format);

    params.set('url', encodeURIComponent(originalUrl));

    return `${this.config.transformationEndpoint}/video?${params.toString()}`;
  }

  // Generate video thumbnail
  generateVideoThumbnail(
    originalUrl: string,
    options: VideoTransformOptions['thumbnail'] = {}
  ): string {
    const {
      time = 1,
      width = 320,
      height = 180
    } = options;

    const params = new URLSearchParams();
    params.set('url', encodeURIComponent(originalUrl));
    params.set('time', time.toString());
    params.set('w', width.toString());
    params.set('h', height.toString());
    params.set('f', this.getOptimalImageFormat());

    return `${this.config.transformationEndpoint}/thumbnail?${params.toString()}`;
  }

  // Get optimal image format based on browser support
  private getOptimalImageFormat(): string {
    if (typeof window === 'undefined') return 'jpeg';

    // Check for AVIF support
    if (this.supportsImageFormat('avif')) {
      return 'avif';
    }

    // Check for WebP support
    if (this.supportsImageFormat('webp')) {
      return 'webp';
    }

    return 'jpeg';
  }

  // Get optimal video format based on browser support
  private getOptimalVideoFormat(): string {
    if (typeof window === 'undefined') return 'mp4';

    const video = document.createElement('video');
    
    if (video.canPlayType('video/webm; codecs="vp9"')) {
      return 'webm';
    }
    
    return 'mp4';
  }

  // Get optimal quality based on connection speed
  private getOptimalQuality(): number {
    switch (this.connectionSpeed) {
      case 'slow':
        return 60;
      case 'medium':
        return 75;
      case 'fast':
        return 85;
      default:
        return 75;
    }
  }

  // Get optimal video quality based on connection speed
  private getOptimalVideoQuality(): 'auto' | 'low' | 'medium' | 'high' {
    switch (this.connectionSpeed) {
      case 'slow':
        return 'low';
      case 'medium':
        return 'medium';
      case 'fast':
        return 'high';
      default:
        return 'auto';
    }
  }

  // Check if browser supports image format
  private supportsImageFormat(format: string): boolean {
    if (typeof window === 'undefined') return false;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      const dataUrl = canvas.toDataURL(`image/${format}`);
      return dataUrl.indexOf(`data:image/${format}`) === 0;
    } catch {
      return false;
    }
  }

  // Generate placeholder image (low quality, small size)
  generatePlaceholder(
    originalUrl: string,
    width = 40,
    height = 40
  ): string {
    return this.generateImageUrl(originalUrl, {
      width,
      height,
      quality: 20,
      blur: 2,
      format: 'jpeg'
    });
  }

  // Generate progressive loading images
  generateProgressiveImages(
    originalUrl: string,
    targetWidth: number,
    targetHeight: number
  ): {
    placeholder: string;
    lowQuality: string;
    highQuality: string;
  } {
    return {
      placeholder: this.generatePlaceholder(originalUrl, 20, 20),
      lowQuality: this.generateImageUrl(originalUrl, {
        width: Math.round(targetWidth * 0.5),
        height: Math.round(targetHeight * 0.5),
        quality: 40
      }),
      highQuality: this.generateImageUrl(originalUrl, {
        width: targetWidth,
        height: targetHeight,
        quality: this.getOptimalQuality()
      })
    };
  }

  // Preload critical images
  async preloadImages(urls: string[]): Promise<void> {
    const preloadPromises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to preload ${url}`));
        document.head.appendChild(link);
      });
    });

    try {
      await Promise.all(preloadPromises);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }

  // Generate cache-optimized headers
  getCacheHeaders(): Record<string, string> {
    const { maxAge, staleWhileRevalidate } = this.config.cacheHeaders;
    
    return {
      'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
      'Vary': 'Accept, Accept-Encoding',
      'X-Content-Type-Options': 'nosniff'
    };
  }

  // Optimize image for different use cases
  optimizeForUseCase(
    originalUrl: string,
    useCase: 'thumbnail' | 'hero' | 'gallery' | 'avatar' | 'icon'
  ): string {
    const optimizations: Record<string, ImageTransformOptions> = {
      thumbnail: {
        width: 200,
        height: 200,
        fit: 'cover',
        quality: 70
      },
      hero: {
        width: 1920,
        height: 1080,
        fit: 'cover',
        quality: 85,
        sharpen: true
      },
      gallery: {
        width: 800,
        height: 600,
        fit: 'cover',
        quality: 80
      },
      avatar: {
        width: 100,
        height: 100,
        fit: 'cover',
        quality: 75
      },
      icon: {
        width: 64,
        height: 64,
        fit: 'contain',
        quality: 90
      }
    };

    return this.generateImageUrl(originalUrl, optimizations[useCase]);
  }

  // Generate adaptive bitrate video URLs
  generateAdaptiveVideoUrls(
    originalUrl: string
  ): {
    quality: string;
    url: string;
    bandwidth: number;
  }[] {
    const qualities = [
      { quality: 'low', width: 640, height: 360, bandwidth: 800000 },
      { quality: 'medium', width: 1280, height: 720, bandwidth: 2000000 },
      { quality: 'high', width: 1920, height: 1080, bandwidth: 5000000 }
    ];

    return qualities.map(({ quality, width, height, bandwidth }) => ({
      quality,
      bandwidth,
      url: this.generateVideoUrl(originalUrl, {
        width,
        height,
        quality: quality as any
      })
    }));
  }

  // Monitor CDN performance
  async measureCDNPerformance(url: string): Promise<{
    loadTime: number;
    size: number;
    cacheHit: boolean;
  }> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url);
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      const size = parseInt(response.headers.get('content-length') || '0');
      const cacheHit = response.headers.get('x-cache') === 'HIT';
      
      return { loadTime, size, cacheHit };
    } catch (error) {
      throw new Error(`Failed to measure CDN performance: ${error}`);
    }
  }
}

// Default CDN configuration
const defaultCDNConfig: CDNConfig = {
  baseUrl: process.env.PUBLIC_CDN_URL || '',
  transformationEndpoint: process.env.PUBLIC_CDN_TRANSFORM_URL || '/api/transform',
  cacheHeaders: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 86400 // 1 day
  },
  supportedFormats: {
    images: ['webp', 'avif', 'jpeg', 'png'],
    videos: ['mp4', 'webm', 'hls']
  }
};

// Global CDN service instance
export const cdnService = new CDNOptimizationService(defaultCDNConfig);

// Utility functions for common CDN operations
export const cdnUtils = {
  // Generate responsive image with automatic format detection
  responsiveImage: (url: string, sizes: string, options: ImageTransformOptions = {}) => {
    const srcset = cdnService.generateResponsiveImageSrcSet(url, undefined, options);
    const src = cdnService.generateImageUrl(url, { width: 800, ...options });
    
    return { src, srcset, sizes };
  },

  // Generate optimized avatar image
  avatar: (url: string, size = 100) => {
    return cdnService.generateImageUrl(url, {
      width: size,
      height: size,
      fit: 'cover',
      quality: 85
    });
  },

  // Generate video with thumbnail
  videoWithThumbnail: (url: string, options: VideoTransformOptions = {}) => {
    const videoUrl = cdnService.generateVideoUrl(url, options);
    const thumbnailUrl = cdnService.generateVideoThumbnail(url, options.thumbnail);
    
    return { videoUrl, thumbnailUrl };
  },

  // Generate progressive loading images
  progressive: (url: string, width: number, height: number) => {
    return cdnService.generateProgressiveImages(url, width, height);
  }
};