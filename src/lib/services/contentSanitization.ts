import DOMPurify from 'dompurify';

/**
 * Content sanitization service for rich text content
 * Provides secure HTML sanitization and validation
 */

export interface SanitizationConfig {
	allowedTags?: string[];
	allowedAttributes?: string[];
	allowedUriRegexp?: RegExp;
	maxLength?: number;
	stripTags?: boolean;
}

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	sanitizedContent?: string;
}

/**
 * Default sanitization configuration for rich text content
 */
export const DEFAULT_RICH_TEXT_CONFIG: SanitizationConfig = {
	allowedTags: [
		'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'iframe', 'span', 'div'
	],
	allowedAttributes: [
		'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
		'style', 'class', 'data-youtube-video', 'frameborder', 'allowfullscreen'
	],
	allowedUriRegexp: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
	maxLength: 50000 // 50KB limit for rich text content
};

/**
 * Strict sanitization configuration for user-generated content
 */
export const STRICT_SANITIZATION_CONFIG: SanitizationConfig = {
	allowedTags: [
		'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'ul', 'ol', 'li', 'blockquote', 'a'
	],
	allowedAttributes: [
		'href', 'target', 'rel', 'alt', 'title'
	],
	allowedUriRegexp: /^https?:\/\//i,
	maxLength: 10000 // 10KB limit for strict content
};

/**
 * Plain text configuration - strips all HTML
 */
export const PLAIN_TEXT_CONFIG: SanitizationConfig = {
	allowedTags: [],
	allowedAttributes: [],
	stripTags: true,
	maxLength: 5000
};

export class ContentSanitizationService {
	/**
	 * Sanitize HTML content using DOMPurify
	 */
	static sanitizeHtml(content: string, config: SanitizationConfig = DEFAULT_RICH_TEXT_CONFIG): string {
		if (!content || typeof content !== 'string') {
			return '';
		}

		const purifyConfig: any = {
			ALLOWED_TAGS: config.allowedTags || [],
			ALLOWED_ATTR: config.allowedAttributes || [],
			ALLOWED_URI_REGEXP: config.allowedUriRegexp,
			ADD_ATTR: ['target'], // Always add target for security
			ADD_DATA_URI_TAGS: ['iframe'], // Allow data URIs for iframes (YouTube embeds)
			FORBID_SCRIPT: true,
			FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
			FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
			KEEP_CONTENT: true,
			RETURN_DOM: false,
			RETURN_DOM_FRAGMENT: false,
			RETURN_DOM_IMPORT: false,
			SANITIZE_DOM: true,
			WHOLE_DOCUMENT: false
		};

		// Strip all tags if configured
		if (config.stripTags) {
			purifyConfig.ALLOWED_TAGS = [];
			purifyConfig.KEEP_CONTENT = true;
		}

		let sanitized = DOMPurify.sanitize(content, purifyConfig) as unknown as string;

		// Apply length limit
		if (config.maxLength && sanitized.length > config.maxLength) {
			sanitized = sanitized.substring(0, config.maxLength);
		}

		return sanitized;
	}

	/**
	 * Validate and sanitize content with detailed feedback
	 */
	static validateAndSanitize(content: string, config: SanitizationConfig = DEFAULT_RICH_TEXT_CONFIG): ValidationResult {
		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: []
		};

		if (!content || typeof content !== 'string') {
			result.isValid = false;
			result.errors.push('Content must be a non-empty string');
			return result;
		}

		// Check length before sanitization
		if (config.maxLength && content.length > config.maxLength) {
			result.warnings.push(`Content length (${content.length}) exceeds maximum (${config.maxLength}). Content will be truncated.`);
		}

		// Sanitize content
		try {
			result.sanitizedContent = this.sanitizeHtml(content, config);
		} catch (error) {
			result.isValid = false;
			result.errors.push(`Sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			return result;
		}

		// Check for potentially dangerous content patterns
		const dangerousPatterns = [
			/javascript:/i,
			/vbscript:/i,
			/data:text\/html/i,
			/on\w+\s*=/i, // Event handlers
			/<script/i,
			/<object/i,
			/<embed/i,
			/<form/i
		];

		for (const pattern of dangerousPatterns) {
			if (pattern.test(content)) {
				result.warnings.push('Potentially dangerous content detected and removed during sanitization');
				break;
			}
		}

		// Validate image alt text requirements
		const imgTags = content.match(/<img[^>]*>/gi);
		if (imgTags) {
			for (const imgTag of imgTags) {
				if (!imgTag.includes('alt=')) {
					result.warnings.push('Images should include alt text for accessibility');
				}
			}
		}

		// Validate link targets
		const linkTags = content.match(/<a[^>]*>/gi);
		if (linkTags) {
			for (const linkTag of linkTags) {
				if (linkTag.includes('href=') && !linkTag.includes('target=')) {
					result.warnings.push('External links should specify target attribute');
				}
			}
		}

		return result;
	}

	/**
	 * Extract plain text from HTML content
	 */
	static extractPlainText(content: string): string {
		return this.sanitizeHtml(content, PLAIN_TEXT_CONFIG);
	}

	/**
	 * Count words in content (plain text)
	 */
	static countWords(content: string): number {
		const plainText = this.extractPlainText(content);
		return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
	}

	/**
	 * Estimate reading time in minutes
	 */
	static estimateReadingTime(content: string, wordsPerMinute: number = 200): number {
		const wordCount = this.countWords(content);
		return Math.ceil(wordCount / wordsPerMinute);
	}

	/**
	 * Validate YouTube URL and extract video ID
	 */
	static validateYouTubeUrl(url: string): { isValid: boolean; videoId?: string; error?: string } {
		if (!url || typeof url !== 'string') {
			return { isValid: false, error: 'URL is required' };
		}

		const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
		const match = url.match(youtubeRegex);

		if (!match) {
			return { isValid: false, error: 'Invalid YouTube URL format' };
		}

		return { isValid: true, videoId: match[1] };
	}

	/**
	 * Validate image URL
	 */
	static validateImageUrl(url: string): { isValid: boolean; error?: string } {
		if (!url || typeof url !== 'string') {
			return { isValid: false, error: 'URL is required' };
		}

		try {
			const urlObj = new URL(url);
			
			// Check protocol
			if (!['http:', 'https:', 'data:'].includes(urlObj.protocol)) {
				return { isValid: false, error: 'Only HTTP, HTTPS, and data URLs are allowed' };
			}

			// Check for common image extensions
			const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
			const hasImageExtension = imageExtensions.some(ext => 
				urlObj.pathname.toLowerCase().endsWith(ext)
			);

			// Allow data URLs for base64 images
			if (urlObj.protocol === 'data:' && !url.startsWith('data:image/')) {
				return { isValid: false, error: 'Data URLs must be image types' };
			}

			if (urlObj.protocol !== 'data:' && !hasImageExtension) {
				return { isValid: false, error: 'URL should point to an image file' };
			}

			return { isValid: true };
		} catch (error) {
			return { isValid: false, error: 'Invalid URL format' };
		}
	}

	/**
	 * Validate and sanitize link URL
	 */
	static validateLinkUrl(url: string): { isValid: boolean; sanitizedUrl?: string; error?: string } {
		if (!url || typeof url !== 'string') {
			return { isValid: false, error: 'URL is required' };
		}

		try {
			// Add protocol if missing
			let fullUrl = url;
			if (!url.match(/^https?:\/\//i)) {
				fullUrl = `https://${url}`;
			}

			const urlObj = new URL(fullUrl);
			
			// Only allow HTTP and HTTPS
			if (!['http:', 'https:'].includes(urlObj.protocol)) {
				return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
			}

			// Basic domain validation
			if (!urlObj.hostname || urlObj.hostname.length < 3) {
				return { isValid: false, error: 'Invalid domain name' };
			}

			return { isValid: true, sanitizedUrl: fullUrl };
		} catch (error) {
			return { isValid: false, error: 'Invalid URL format' };
		}
	}

	/**
	 * Security audit for content
	 */
	static auditContent(content: string): {
		securityScore: number; // 0-100
		issues: Array<{ severity: 'low' | 'medium' | 'high'; message: string }>;
	} {
		const issues: Array<{ severity: 'low' | 'medium' | 'high'; message: string }> = [];
		let securityScore = 100;

		// Check for script tags
		if (/<script/i.test(content)) {
			issues.push({ severity: 'high', message: 'Script tags detected' });
			securityScore -= 30;
		}

		// Check for event handlers
		if (/on\w+\s*=/i.test(content)) {
			issues.push({ severity: 'high', message: 'Event handlers detected' });
			securityScore -= 25;
		}

		// Check for javascript: URLs
		if (/javascript:/i.test(content)) {
			issues.push({ severity: 'high', message: 'JavaScript URLs detected' });
			securityScore -= 25;
		}

		// Check for data URLs (potential XSS vector)
		if (/data:(?!image\/)/i.test(content)) {
			issues.push({ severity: 'medium', message: 'Non-image data URLs detected' });
			securityScore -= 15;
		}

		// Check for external iframes (except YouTube)
		const iframes = content.match(/<iframe[^>]*>/gi);
		if (iframes) {
			for (const iframe of iframes) {
				if (!iframe.includes('youtube.com') && !iframe.includes('youtu.be')) {
					issues.push({ severity: 'medium', message: 'External iframe detected' });
					securityScore -= 10;
				}
			}
		}

		// Check for missing alt text on images
		const images = content.match(/<img[^>]*>/gi);
		if (images) {
			for (const img of images) {
				if (!img.includes('alt=')) {
					issues.push({ severity: 'low', message: 'Image missing alt text (accessibility issue)' });
					securityScore -= 2;
				}
			}
		}

		return {
			securityScore: Math.max(0, securityScore),
			issues
		};
	}
}

// Export commonly used configurations are already exported above