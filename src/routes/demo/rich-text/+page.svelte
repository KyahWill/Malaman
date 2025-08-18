<script lang="ts">
	import { RichTextEditor, RichTextRenderer, Button, Card } from '$lib/components/ui';
	import { ContentSanitizationService } from '$lib/services';

	let editorContent = $state('<p>Welcome to the rich text editor! Try out the formatting options above.</p><p>You can:</p><ul><li><strong>Bold</strong> and <em>italic</em> text</li><li>Create <u>underlined</u> and <s>strikethrough</s> text</li><li>Add links and images</li><li>Create lists and quotes</li><li>Embed YouTube videos</li></ul><blockquote><p>This is a blockquote example</p></blockquote>');
	let showPreview = $state(false);
	let validationResult = $state<any>(null);

	function handleContentUpdate(content: string) {
		editorContent = content;
		// Validate content on update
		validationResult = ContentSanitizationService.validateAndSanitize(content);
	}

	function togglePreview() {
		showPreview = !showPreview;
	}

	function validateContent() {
		validationResult = ContentSanitizationService.validateAndSanitize(editorContent);
	}

	function auditContent() {
		const audit = ContentSanitizationService.auditContent(editorContent);
		console.log('Security Audit:', audit);
		alert(`Security Score: ${audit.securityScore}/100\nIssues: ${audit.issues.length}`);
	}

	// Example content for testing
	const exampleContent = `
		<h1>Rich Text Editor Demo</h1>
		<p>This is a demonstration of the rich text editor with various formatting options.</p>
		
		<h2>Text Formatting</h2>
		<p>You can make text <strong>bold</strong>, <em>italic</em>, <u>underlined</u>, or <s>strikethrough</s>.</p>
		
		<h3>Lists</h3>
		<ul>
			<li>Unordered list item 1</li>
			<li>Unordered list item 2</li>
		</ul>
		
		<ol>
			<li>Ordered list item 1</li>
			<li>Ordered list item 2</li>
		</ol>
		
		<blockquote>
			<p>This is a blockquote for highlighting important information.</p>
		</blockquote>
		
		<p>You can also add <a href="https://example.com" target="_blank" rel="noopener noreferrer">links</a> to external resources.</p>
	`;

	function loadExample() {
		editorContent = exampleContent;
	}

	function clearContent() {
		editorContent = '';
	}
</script>

<svelte:head>
	<title>Rich Text Editor Demo</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-4">Rich Text Editor Demo</h1>
		<p class="text-gray-600 mb-6">
			Test the rich text editor with Tiptap integration, content sanitization, and accessibility features.
		</p>
		
		<div class="flex gap-4 mb-6">
			<Button onclick={togglePreview}>
				{showPreview ? 'Show Editor' : 'Show Preview'}
			</Button>
			<Button onclick={loadExample} variant="secondary">
				Load Example
			</Button>
			<Button onclick={clearContent} variant="secondary">
				Clear Content
			</Button>
			<Button onclick={validateContent} variant="secondary">
				Validate Content
			</Button>
			<Button onclick={auditContent} variant="secondary">
				Security Audit
			</Button>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Editor Section -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold text-gray-900">Editor</h2>
			
			{#if !showPreview}
				<Card class="p-0">
					<RichTextEditor
						content={editorContent}
						onUpdate={handleContentUpdate}
						placeholder="Start writing your content here..."
						maxLength={10000}
						allowImages={true}
						allowVideos={true}
						allowLinks={true}
					/>
				</Card>
			{:else}
				<Card class="p-6">
					<h3 class="text-lg font-medium mb-4">Preview</h3>
					<RichTextRenderer content={editorContent} />
				</Card>
			{/if}
		</div>

		<!-- Info Section -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold text-gray-900">Information</h2>
			
			<!-- Content Stats -->
			<Card class="p-4">
				<h3 class="text-lg font-medium mb-3">Content Statistics</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span>Characters:</span>
						<span>{editorContent.length}</span>
					</div>
					<div class="flex justify-between">
						<span>Words:</span>
						<span>{ContentSanitizationService.countWords(editorContent)}</span>
					</div>
					<div class="flex justify-between">
						<span>Reading Time:</span>
						<span>{ContentSanitizationService.estimateReadingTime(editorContent)} min</span>
					</div>
				</div>
			</Card>

			<!-- Validation Results -->
			{#if validationResult}
				<Card class="p-4">
					<h3 class="text-lg font-medium mb-3">Validation Results</h3>
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium">Status:</span>
							<span class="text-sm px-2 py-1 rounded {validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
								{validationResult.isValid ? 'Valid' : 'Invalid'}
							</span>
						</div>
						
						{#if validationResult.errors.length > 0}
							<div>
								<span class="text-sm font-medium text-red-700">Errors:</span>
								<ul class="text-sm text-red-600 ml-4 list-disc">
									{#each validationResult.errors as error}
										<li>{error}</li>
									{/each}
								</ul>
							</div>
						{/if}
						
						{#if validationResult.warnings.length > 0}
							<div>
								<span class="text-sm font-medium text-yellow-700">Warnings:</span>
								<ul class="text-sm text-yellow-600 ml-4 list-disc">
									{#each validationResult.warnings as warning}
										<li>{warning}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</Card>
			{/if}

			<!-- Keyboard Shortcuts -->
			<Card class="p-4">
				<h3 class="text-lg font-medium mb-3">Keyboard Shortcuts</h3>
				<div class="space-y-1 text-sm">
					<div class="flex justify-between">
						<span>Bold:</span>
						<kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+B</kbd>
					</div>
					<div class="flex justify-between">
						<span>Italic:</span>
						<kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+I</kbd>
					</div>
					<div class="flex justify-between">
						<span>Underline:</span>
						<kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+U</kbd>
					</div>
					<div class="flex justify-between">
						<span>Link:</span>
						<kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+K</kbd>
					</div>
					<div class="flex justify-between">
						<span>Bullet List:</span>
						<kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Shift+8</kbd>
					</div>
					<div class="flex justify-between">
						<span>Numbered List:</span>
						<kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Shift+7</kbd>
					</div>
					<div class="flex justify-between">
						<span>Undo:</span>
						<kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Z</kbd>
					</div>
					<div class="flex justify-between">
						<span>Redo:</span>
						<kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Y</kbd>
					</div>
				</div>
			</Card>

			<!-- Accessibility Features -->
			<Card class="p-4">
				<h3 class="text-lg font-medium mb-3">Accessibility Features</h3>
				<ul class="text-sm space-y-1">
					<li>• Full keyboard navigation support</li>
					<li>• Screen reader compatible</li>
					<li>• ARIA labels and roles</li>
					<li>• High contrast toolbar buttons</li>
					<li>• Required alt text for images</li>
					<li>• Semantic HTML output</li>
					<li>• Focus management</li>
				</ul>
			</Card>
		</div>
	</div>

	<!-- Raw HTML Output (for debugging) -->
	<div class="mt-8">
		<Card class="p-4">
			<h3 class="text-lg font-medium mb-3">Raw HTML Output</h3>
			<pre class="text-xs bg-gray-50 p-4 rounded overflow-x-auto"><code>{editorContent}</code></pre>
		</Card>
	</div>
</div>

<style>
	kbd {
		font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
	}
</style>