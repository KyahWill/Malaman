<script lang="ts">
	import DOMPurify from 'dompurify';

	interface Props {
		content: string;
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();

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
		ADD_DATA_URI_TAGS: ['iframe']
	};

	function sanitizeContent(html: string): string {
		return DOMPurify.sanitize(html, sanitizeConfig);
	}

	let sanitizedContent = $derived(sanitizeContent(content));
</script>

<div 
	class="rich-text-content prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none {className}"
	role="article"
	aria-label="Rich text content"
>
	{@html sanitizedContent}
</div>

<style>
	:global(.rich-text-content h1) {
		font-size: 1.875rem;
		font-weight: bold;
		margin-top: 1.5rem;
		margin-bottom: 1rem;
		color: #111827;
	}

	:global(.rich-text-content h2) {
		font-size: 1.5rem;
		font-weight: bold;
		margin-top: 1.25rem;
		margin-bottom: 0.75rem;
		color: #111827;
	}

	:global(.rich-text-content h3) {
		font-size: 1.25rem;
		font-weight: bold;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		color: #111827;
	}

	:global(.rich-text-content h4) {
		font-size: 1.125rem;
		font-weight: bold;
		margin-top: 0.75rem;
		margin-bottom: 0.5rem;
		color: #111827;
	}

	:global(.rich-text-content h5) {
		font-size: 1rem;
		font-weight: bold;
		margin-top: 0.5rem;
		margin-bottom: 0.25rem;
		color: #111827;
	}

	:global(.rich-text-content h6) {
		font-size: 0.875rem;
		font-weight: bold;
		margin-top: 0.5rem;
		margin-bottom: 0.25rem;
		color: #111827;
	}

	:global(.rich-text-content p) {
		margin-bottom: 1rem;
		color: #374151;
		line-height: 1.625;
	}

	:global(.rich-text-content ul) {
		list-style-type: disc;
		list-style-position: inside;
		margin-left: 1rem;
		margin-bottom: 1rem;
	}

	:global(.rich-text-content ul li) {
		margin-bottom: 0.25rem;
	}

	:global(.rich-text-content ol) {
		list-style-type: decimal;
		list-style-position: inside;
		margin-left: 1rem;
		margin-bottom: 1rem;
	}

	:global(.rich-text-content ol li) {
		margin-bottom: 0.25rem;
	}

	:global(.rich-text-content li) {
		color: #374151;
	}

	:global(.rich-text-content blockquote) {
		border-left: 4px solid #93c5fd;
		padding-left: 1rem;
		font-style: italic;
		color: #6b7280;
		margin-bottom: 1rem;
		background-color: #f9fafb;
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
	}

	:global(.rich-text-content a) {
		color: #2563eb;
		text-decoration: underline;
		border-radius: 0.25rem;
	}

	:global(.rich-text-content a:hover) {
		color: #1e40af;
	}

	:global(.rich-text-content a:focus) {
		outline: none;
		box-shadow: 0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.1);
	}

	:global(.rich-text-content img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	:global(.rich-text-content iframe) {
		width: 100%;
		border-radius: 0.5rem;
		margin: 1rem 0;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	:global(.rich-text-content strong) {
		font-weight: 600;
		color: #111827;
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

	/* Focus styles for accessibility */
	:global(.rich-text-content *:focus) {
		outline: none;
		box-shadow: 0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.1);
		border-radius: 0.25rem;
	}
</style>