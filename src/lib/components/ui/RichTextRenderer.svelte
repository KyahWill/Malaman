<script lang="ts">
	import { onMount } from 'svelte';
	import DOMPurify from 'dompurify';

	interface Props {
		html: string;
		class?: string;
	}

	let { html, class: className = '' }: Props = $props();

	let sanitizedHtml = $state('');

	// Sanitization configuration for rendering
	const sanitizeConfig = {
		ALLOWED_TAGS: [
			'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'iframe', 'span', 'div'
		],
		ALLOWED_ATTR: [
			'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
			'style', 'class', 'data-youtube-video', 'frameborder', 'allowfullscreen'
		],
		ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
		ADD_ATTR: ['target'],
		ADD_TAGS: ['iframe']
	};

	// Sanitize HTML content
	function sanitizeContent(htmlContent: string): string {
		if (!htmlContent) return '';
		
		// Configure DOMPurify for safe rendering
		const clean = DOMPurify.sanitize(htmlContent, sanitizeConfig);
		
		// Add target="_blank" to external links
		return clean.replace(
			/<a\s+(?:[^>]*?\s+)?href="([^"]*)"(?:[^>]*?)>/gi,
			(match, url) => {
				if (url.startsWith('http') && !url.includes(window.location.hostname)) {
					return match.replace('>', ' target="_blank" rel="noopener noreferrer">');
				}
				return match;
			}
		);
	}

	// Update sanitized HTML when input changes
	$effect(() => {
		sanitizedHtml = sanitizeContent(html);
	});

	onMount(() => {
		sanitizedHtml = sanitizeContent(html);
	});
</script>

<div class="rich-text-content {className}">
	{@html sanitizedHtml}
</div>

<style>
	:global(.rich-text-content) {
		line-height: 1.6;
	}

	:global(.rich-text-content h1) {
		font-size: 1.875rem;
		font-weight: bold;
		margin-top: 1.5rem;
		margin-bottom: 1rem;
		line-height: 1.2;
	}

	:global(.rich-text-content h2) {
		font-size: 1.5rem;
		font-weight: bold;
		margin-top: 1.25rem;
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}

	:global(.rich-text-content h3) {
		font-size: 1.25rem;
		font-weight: bold;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		line-height: 1.4;
	}

	:global(.rich-text-content h4) {
		font-size: 1.125rem;
		font-weight: bold;
		margin-top: 0.75rem;
		margin-bottom: 0.5rem;
		line-height: 1.4;
	}

	:global(.rich-text-content h5) {
		font-size: 1rem;
		font-weight: bold;
		margin-top: 0.5rem;
		margin-bottom: 0.25rem;
		line-height: 1.5;
	}

	:global(.rich-text-content h6) {
		font-size: 0.875rem;
		font-weight: bold;
		margin-top: 0.5rem;
		margin-bottom: 0.25rem;
		line-height: 1.5;
	}

	:global(.rich-text-content p) {
		margin-bottom: 1rem;
	}

	:global(.rich-text-content ul) {
		list-style-type: disc;
		list-style-position: inside;
		margin-left: 1rem;
		margin-bottom: 1rem;
	}

	:global(.rich-text-content ol) {
		list-style-type: decimal;
		list-style-position: inside;
		margin-left: 1rem;
		margin-bottom: 1rem;
	}

	:global(.rich-text-content li) {
		margin-bottom: 0.25rem;
	}

	:global(.rich-text-content blockquote) {
		border-left: 4px solid #d1d5db;
		padding-left: 1rem;
		font-style: italic;
		color: #6b7280;
		margin: 1rem 0;
		background-color: #f9fafb;
		padding: 1rem;
		border-radius: 0.25rem;
	}

	:global(.rich-text-content a) {
		color: #2563eb;
		text-decoration: underline;
		transition: color 0.2s;
	}

	:global(.rich-text-content a:hover) {
		color: #1e40af;
	}

	:global(.rich-text-content img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	:global(.rich-text-content iframe) {
		width: 100%;
		border-radius: 0.5rem;
		margin: 1rem 0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	:global(.rich-text-content strong) {
		font-weight: 600;
	}

	:global(.rich-text-content em) {
		font-style: italic;
	}

	:global(.rich-text-content u) {
		text-decoration: underline;
	}

	:global(.rich-text-content s) {
		text-decoration: line-through;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		:global(.rich-text-content h1) {
			font-size: 1.5rem;
		}

		:global(.rich-text-content h2) {
			font-size: 1.25rem;
		}

		:global(.rich-text-content h3) {
			font-size: 1.125rem;
		}

		:global(.rich-text-content ul),
		:global(.rich-text-content ol) {
			margin-left: 0.5rem;
		}

		:global(.rich-text-content blockquote) {
			margin-left: 0;
			margin-right: 0;
		}
	}
</style>