<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Link from '@tiptap/extension-link';
	import Image from '@tiptap/extension-image';
	import Youtube from '@tiptap/extension-youtube';
	import TextAlign from '@tiptap/extension-text-align';
	import Underline from '@tiptap/extension-underline';
	import { Color } from '@tiptap/extension-color';
	import { TextStyle } from '@tiptap/extension-text-style';
	import { Highlight } from '@tiptap/extension-highlight';
	import DOMPurify from 'dompurify';

	interface Props {
		content?: string;
		placeholder?: string;
		editable?: boolean;
		class?: string;
		onUpdate?: (content: string) => void;
		maxLength?: number;
		showToolbar?: boolean;
		allowImages?: boolean;
		allowVideos?: boolean;
		allowLinks?: boolean;
	}

	let {
		content = '',
		placeholder = 'Start writing...',
		editable = true,
		class: className = '',
		onUpdate,
		maxLength,
		showToolbar = true,
		allowImages = true,
		allowVideos = true,
		allowLinks = true
	}: Props = $props();

	let editor = $state<Editor | null>(null);
	let element: HTMLDivElement;
	let isLinkModalOpen = $state(false);
	let linkUrl = $state('');
	let linkText = $state('');
	let isImageModalOpen = $state(false);
	let imageUrl = $state('');
	let imageAlt = $state('');
	let isYoutubeModalOpen = $state(false);
	let youtubeUrl = $state('');
	let showKeyboardHelp = $state(false);

	// Sanitization configuration
	const sanitizeConfig = {
		ALLOWED_TAGS: [
			'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'iframe', 'span', 'div'
		],
		ALLOWED_ATTR: [
			'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
			'style', 'class', 'data-youtube-video', 'frameborder', 'allowfullscreen'
		],
		ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
	};

	// Global keyboard event handler for accessibility
	function handleKeyDown(event: KeyboardEvent) {
		// Close modals with Escape key
		if (event.key === 'Escape') {
			if (isLinkModalOpen) {
				isLinkModalOpen = false;
				event.preventDefault();
			} else if (isImageModalOpen) {
				isImageModalOpen = false;
				event.preventDefault();
			} else if (isYoutubeModalOpen) {
				isYoutubeModalOpen = false;
				event.preventDefault();
			} else if (showKeyboardHelp) {
				showKeyboardHelp = false;
				event.preventDefault();
			}
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeyDown);

		const extensions: any[] = [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3, 4, 5, 6]
				}
			}),
			TextStyle,
			Color,
			Highlight.configure({
				multicolor: true
			}),
			Underline,
			TextAlign.configure({
				types: ['heading', 'paragraph']
			})
		];

		if (allowLinks) {
			extensions.push(
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						rel: 'noopener noreferrer',
						target: '_blank'
					}
				})
			);
		}

		if (allowImages) {
			extensions.push(
				Image.configure({
					HTMLAttributes: {
						class: 'max-w-full h-auto rounded-lg'
					}
				})
			);
		}

		if (allowVideos) {
			extensions.push(
				Youtube.configure({
					width: 640,
					height: 480,
					HTMLAttributes: {
						class: 'rounded-lg'
					}
				})
			);
		}

		editor = new Editor({
			element,
			extensions,
			content: sanitizeContent(content),
			editable,
			onTransaction: () => {
				// Force re-render
				editor = editor;
			},
			onUpdate: ({ editor }) => {
				const html = editor.getHTML();
				const sanitizedHtml = sanitizeContent(html);
				
				// Check max length if specified
				if (maxLength && editor.getText().length > maxLength) {
					return;
				}
				
				onUpdate?.(sanitizedHtml);
			},
			editorProps: {
				attributes: {
					class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
					'aria-label': placeholder,
					role: 'textbox',
					'aria-multiline': 'true'
				}
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
		// Clean up event listener
		document.removeEventListener('keydown', handleKeyDown);
	});

	function sanitizeContent(html: string): string {
		return DOMPurify.sanitize(html, sanitizeConfig);
	}

	// Toolbar actions
	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	function toggleUnderline() {
		editor?.chain().focus().toggleUnderline().run();
	}

	function toggleStrike() {
		editor?.chain().focus().toggleStrike().run();
	}

	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}

	function toggleBlockquote() {
		editor?.chain().focus().toggleBlockquote().run();
	}

	function setHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
		editor?.chain().focus().toggleHeading({ level }).run();
	}

	function setTextAlign(alignment: 'left' | 'center' | 'right' | 'justify') {
		editor?.chain().focus().setTextAlign(alignment).run();
	}

	function openLinkModal() {
		const { from, to } = editor?.state.selection || { from: 0, to: 0 };
		linkText = editor?.state.doc.textBetween(from, to) || '';
		linkUrl = '';
		isLinkModalOpen = true;
	}

	function insertLink() {
		if (linkUrl) {
			if (linkText) {
				editor?.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`).run();
			} else {
				editor?.chain().focus().setLink({ href: linkUrl, target: '_blank' }).run();
			}
		}
		isLinkModalOpen = false;
		linkUrl = '';
		linkText = '';
	}

	function openImageModal() {
		imageUrl = '';
		imageAlt = '';
		isImageModalOpen = true;
	}

	function insertImage() {
		if (imageUrl && imageAlt) {
			editor?.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
		}
		isImageModalOpen = false;
		imageUrl = '';
		imageAlt = '';
	}

	function openYoutubeModal() {
		youtubeUrl = '';
		isYoutubeModalOpen = true;
	}

	function insertYoutube() {
		if (youtubeUrl) {
			editor?.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
		}
		isYoutubeModalOpen = false;
		youtubeUrl = '';
	}

	function undo() {
		editor?.chain().focus().undo().run();
	}

	function redo() {
		editor?.chain().focus().redo().run();
	}

	function toggleKeyboardHelp() {
		showKeyboardHelp = !showKeyboardHelp;
	}

	// Keyboard shortcuts info
	const keyboardShortcuts = [
		{ keys: 'Ctrl+B', action: 'Bold' },
		{ keys: 'Ctrl+I', action: 'Italic' },
		{ keys: 'Ctrl+U', action: 'Underline' },
		{ keys: 'Ctrl+Shift+S', action: 'Strikethrough' },
		{ keys: 'Ctrl+Shift+7', action: 'Ordered List' },
		{ keys: 'Ctrl+Shift+8', action: 'Bullet List' },
		{ keys: 'Ctrl+Shift+B', action: 'Blockquote' },
		{ keys: 'Ctrl+Z', action: 'Undo' },
		{ keys: 'Ctrl+Y', action: 'Redo' },
		{ keys: 'Ctrl+K', action: 'Add Link' },
		{ keys: 'Ctrl+Shift+1', action: 'Heading 1' },
		{ keys: 'Ctrl+Shift+2', action: 'Heading 2' },
		{ keys: 'Ctrl+Shift+3', action: 'Heading 3' },
		{ keys: 'Ctrl+Alt+0', action: 'Paragraph' },
		{ keys: 'Tab', action: 'Navigate toolbar' },
		{ keys: 'Escape', action: 'Close modals' }
	];

	// Character count
	let characterCount = $derived(editor?.getText()?.length || 0);
	let isOverLimit = $derived(maxLength ? characterCount > maxLength : false);
</script>

<div class="rich-text-editor border border-gray-300 rounded-lg overflow-hidden {className}">
	{#if showToolbar && editable}
		<div class="toolbar bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1" role="toolbar" aria-label="Text formatting toolbar">
			<!-- Text formatting -->
			<div class="flex gap-1 border-r border-gray-300 pr-2 mr-2">
				<button
					type="button"
					onclick={toggleBold}
					class="toolbar-btn {editor?.isActive('bold') ? 'active' : ''}"
					aria-label="Bold (Ctrl+B)"
					title="Bold (Ctrl+B)"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M5 3v14h5.5c2.5 0 4.5-2 4.5-4.5 0-1.5-.8-2.8-2-3.5 1.2-.7 2-2 2-3.5C15 3 13 1 10.5 1H5v2zm2 2h3.5c1.4 0 2.5 1.1 2.5 2.5S11.9 10 10.5 10H7V5zm0 7h4c1.7 0 3 1.3 3 3s-1.3 3-3 3H7v-6z"/>
					</svg>
				</button>
				
				<button
					type="button"
					onclick={toggleItalic}
					class="toolbar-btn {editor?.isActive('italic') ? 'active' : ''}"
					aria-label="Italic (Ctrl+I)"
					title="Italic (Ctrl+I)"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M8 1h8v2h-2.5L9.8 17H12v2H4v-2h2.5L10.2 3H8V1z"/>
					</svg>
				</button>
				
				<button
					type="button"
					onclick={toggleUnderline}
					class="toolbar-btn {editor?.isActive('underline') ? 'active' : ''}"
					aria-label="Underline (Ctrl+U)"
					title="Underline (Ctrl+U)"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M4 18h12v2H4v-2zM6 2v6c0 2.2 1.8 4 4 4s4-1.8 4-4V2h2v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V2h2z"/>
					</svg>
				</button>
				
				<button
					type="button"
					onclick={toggleStrike}
					class="toolbar-btn {editor?.isActive('strike') ? 'active' : ''}"
					aria-label="Strikethrough"
					title="Strikethrough"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M3 10h14v2H3v-2zm2-6h10v2H5V4zm0 12h10v2H5v-2z"/>
					</svg>
				</button>
			</div>

			<!-- Headings -->
			<div class="flex gap-1 border-r border-gray-300 pr-2 mr-2">
				<select
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						const level = parseInt(target.value);
						if (level === 0) {
							editor?.chain().focus().setParagraph().run();
						} else {
							setHeading(level as 1 | 2 | 3 | 4 | 5 | 6);
						}
					}}
					class="text-sm border border-gray-300 rounded px-2 py-1"
					aria-label="Text style"
				>
					<option value="0">Paragraph</option>
					<option value="1">Heading 1</option>
					<option value="2">Heading 2</option>
					<option value="3">Heading 3</option>
					<option value="4">Heading 4</option>
					<option value="5">Heading 5</option>
					<option value="6">Heading 6</option>
				</select>
			</div>

			<!-- Lists -->
			<div class="flex gap-1 border-r border-gray-300 pr-2 mr-2">
				<button
					type="button"
					onclick={toggleBulletList}
					class="toolbar-btn {editor?.isActive('bulletList') ? 'active' : ''}"
					aria-label="Bullet List"
					title="Bullet List"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M4 6a2 2 0 100-4 2 2 0 000 4zM4 12a2 2 0 100-4 2 2 0 000 4zM4 18a2 2 0 100-4 2 2 0 000 4zM8 5h10v2H8V5zM8 11h10v2H8v-2zM8 17h10v2H8v-2z"/>
					</svg>
				</button>
				
				<button
					type="button"
					onclick={toggleOrderedList}
					class="toolbar-btn {editor?.isActive('orderedList') ? 'active' : ''}"
					aria-label="Numbered List"
					title="Numbered List"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M3 4h1v1H3V4zM3 7h1v1H3V7zM3 10h1v1H3v-1zM6 4h11v2H6V4zM6 8h11v2H6V8zM6 12h11v2H6v-2z"/>
					</svg>
				</button>
				
				<button
					type="button"
					onclick={toggleBlockquote}
					class="toolbar-btn {editor?.isActive('blockquote') ? 'active' : ''}"
					aria-label="Quote"
					title="Quote"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M3 17h14v2H3v-2zM4 2v6l2-2V4h2V2H4zM10 2v6l2-2V4h2V2h-4z"/>
					</svg>
				</button>
			</div>

			<!-- Alignment -->
			<div class="flex gap-1 border-r border-gray-300 pr-2 mr-2">
				<button
					type="button"
					onclick={() => setTextAlign('left')}
					class="toolbar-btn {editor?.isActive({ textAlign: 'left' }) ? 'active' : ''}"
					aria-label="Align Left"
					title="Align Left"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M3 4h14v2H3V4zM3 8h10v2H3V8zM3 12h14v2H3v-2zM3 16h10v2H3v-2z"/>
					</svg>
				</button>
				
				<button
					type="button"
					onclick={() => setTextAlign('center')}
					class="toolbar-btn {editor?.isActive({ textAlign: 'center' }) ? 'active' : ''}"
					aria-label="Align Center"
					title="Align Center"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M3 4h14v2H3V4zM5 8h10v2H5V8zM3 12h14v2H3v-2zM5 16h10v2H5v-2z"/>
					</svg>
				</button>
				
				<button
					type="button"
					onclick={() => setTextAlign('right')}
					class="toolbar-btn {editor?.isActive({ textAlign: 'right' }) ? 'active' : ''}"
					aria-label="Align Right"
					title="Align Right"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M3 4h14v2H3V4zM7 8h10v2H7V8zM3 12h14v2H3v-2zM7 16h10v2H7v-2z"/>
					</svg>
				</button>
			</div>

			<!-- Media -->
			{#if allowLinks || allowImages || allowVideos}
				<div class="flex gap-1 border-r border-gray-300 pr-2 mr-2">
					{#if allowLinks}
						<button
							type="button"
							onclick={openLinkModal}
							class="toolbar-btn {editor?.isActive('link') ? 'active' : ''}"
							aria-label="Add Link (Ctrl+K)"
							title="Add Link (Ctrl+K)"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
							</svg>
						</button>
					{/if}
					
					{#if allowImages}
						<button
							type="button"
							onclick={openImageModal}
							class="toolbar-btn"
							aria-label="Add Image"
							title="Add Image"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
							</svg>
						</button>
					{/if}
					
					{#if allowVideos}
						<button
							type="button"
							onclick={openYoutubeModal}
							class="toolbar-btn"
							aria-label="Add YouTube Video"
							title="Add YouTube Video"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM8 9a1 1 0 000 2h4a1 1 0 100-2H8z"/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<!-- Undo/Redo -->
			<div class="flex gap-1 border-r border-gray-300 pr-2 mr-2">
				<button
					type="button"
					onclick={undo}
					class="toolbar-btn"
					disabled={!editor?.can().undo()}
					aria-label="Undo (Ctrl+Z)"
					title="Undo (Ctrl+Z)"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 110 14H8a1 1 0 110-2h3a5 5 0 000-10H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
					</svg>
				</button>
				
				<button
					type="button"
					onclick={redo}
					class="toolbar-btn"
					disabled={!editor?.can().redo()}
					aria-label="Redo (Ctrl+Y)"
					title="Redo (Ctrl+Y)"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 000 10h3a1 1 0 110 2H9A7 7 0 119 7h5.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
					</svg>
				</button>
			</div>

			<!-- Help -->
			<div class="flex gap-1">
				<button
					type="button"
					onclick={toggleKeyboardHelp}
					class="toolbar-btn"
					aria-label="Keyboard shortcuts help"
					title="Keyboard shortcuts help"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Editor -->
	<div bind:this={element} class="editor-content"></div>

	<!-- Character count -->
	{#if maxLength}
		<div class="px-4 py-2 text-sm text-gray-500 border-t border-gray-200 flex justify-between">
			<span>Characters: {characterCount}{maxLength ? `/${maxLength}` : ''}</span>
			{#if isOverLimit}
				<span class="text-red-500">Character limit exceeded</span>
			{/if}
		</div>
	{/if}
</div>

<!-- Link Modal -->
{#if isLinkModalOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-labelledby="link-modal-title" aria-modal="true">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h3 id="link-modal-title" class="text-lg font-semibold mb-4">Add Link</h3>
			<div class="space-y-4">
				<div>
					<label for="link-text" class="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
					<input
						id="link-text"
						type="text"
						bind:value={linkText}
						placeholder="Enter link text"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="link-url" class="block text-sm font-medium text-gray-700 mb-1">URL</label>
					<input
						id="link-url"
						type="url"
						bind:value={linkUrl}
						placeholder="https://example.com"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
			</div>
			<div class="flex justify-end gap-2 mt-6">
				<button
					type="button"
					onclick={() => { isLinkModalOpen = false; }}
					class="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={insertLink}
					disabled={!linkUrl}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Add Link
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Image Modal -->
{#if isImageModalOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-labelledby="image-modal-title" aria-modal="true">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h3 id="image-modal-title" class="text-lg font-semibold mb-4">Add Image</h3>
			<div class="space-y-4">
				<div>
					<label for="image-url" class="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
					<input
						id="image-url"
						type="url"
						bind:value={imageUrl}
						placeholder="https://example.com/image.jpg"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				<div>
					<label for="image-alt" class="block text-sm font-medium text-gray-700 mb-1">Alt Text (Required for Accessibility)</label>
					<input
						id="image-alt"
						type="text"
						bind:value={imageAlt}
						placeholder="Describe the image"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
			</div>
			<div class="flex justify-end gap-2 mt-6">
				<button
					type="button"
					onclick={() => { isImageModalOpen = false; }}
					class="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={insertImage}
					disabled={!imageUrl || !imageAlt}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Add Image
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- YouTube Modal -->
{#if isYoutubeModalOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-labelledby="youtube-modal-title" aria-modal="true">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h3 id="youtube-modal-title" class="text-lg font-semibold mb-4">Add YouTube Video</h3>
			<div class="space-y-4">
				<div>
					<label for="youtube-url" class="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
					<input
						id="youtube-url"
						type="url"
						bind:value={youtubeUrl}
						placeholder="https://www.youtube.com/watch?v=..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
			</div>
			<div class="flex justify-end gap-2 mt-6">
				<button
					type="button"
					onclick={() => { isYoutubeModalOpen = false; }}
					class="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={insertYoutube}
					disabled={!youtubeUrl}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Add Video
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Keyboard Help Modal -->
{#if showKeyboardHelp}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-labelledby="keyboard-help-title" aria-modal="true">
		<div class="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
			<h3 id="keyboard-help-title" class="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
			<div class="space-y-2">
				{#each keyboardShortcuts as shortcut}
					<div class="flex justify-between items-center">
						<span class="text-sm">{shortcut.action}</span>
						<kbd class="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{shortcut.keys}</kbd>
					</div>
				{/each}
			</div>
			<div class="flex justify-end mt-6">
				<button
					type="button"
					onclick={() => { showKeyboardHelp = false; }}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.ProseMirror) {
		outline: none;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: #adb5bd;
		pointer-events: none;
		height: 0;
	}

	.toolbar-btn {
		padding: 0.5rem;
		border-radius: 0.25rem;
		transition: background-color 0.2s;
	}

	.toolbar-btn:hover {
		background-color: #e5e7eb;
	}

	.toolbar-btn:focus {
		outline: none;
		box-shadow: 0 0 0 2px #3b82f6;
	}

	.toolbar-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.toolbar-btn.active {
		background-color: #dbeafe;
		color: #1d4ed8;
	}

	:global(.editor-content .ProseMirror) {
		min-height: 200px;
		padding: 1rem;
	}

	:global(.editor-content .ProseMirror h1) {
		font-size: 1.875rem;
		font-weight: bold;
		margin-top: 1.5rem;
		margin-bottom: 1rem;
	}

	:global(.editor-content .ProseMirror h2) {
		font-size: 1.5rem;
		font-weight: bold;
		margin-top: 1.25rem;
		margin-bottom: 0.75rem;
	}

	:global(.editor-content .ProseMirror h3) {
		font-size: 1.25rem;
		font-weight: bold;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	:global(.editor-content .ProseMirror h4) {
		font-size: 1.125rem;
		font-weight: bold;
		margin-top: 0.75rem;
		margin-bottom: 0.5rem;
	}

	:global(.editor-content .ProseMirror h5) {
		font-size: 1rem;
		font-weight: bold;
		margin-top: 0.5rem;
		margin-bottom: 0.25rem;
	}

	:global(.editor-content .ProseMirror h6) {
		font-size: 0.875rem;
		font-weight: bold;
		margin-top: 0.5rem;
		margin-bottom: 0.25rem;
	}

	:global(.editor-content .ProseMirror ul) {
		list-style-type: disc;
		list-style-position: inside;
		margin-left: 1rem;
		margin-bottom: 1rem;
	}

	:global(.editor-content .ProseMirror ol) {
		list-style-type: decimal;
		list-style-position: inside;
		margin-left: 1rem;
		margin-bottom: 1rem;
	}

	:global(.editor-content .ProseMirror blockquote) {
		border-left: 4px solid #d1d5db;
		padding-left: 1rem;
		font-style: italic;
		color: #6b7280;
		margin-bottom: 1rem;
	}

	:global(.editor-content .ProseMirror a) {
		color: #2563eb;
		text-decoration: underline;
	}

	:global(.editor-content .ProseMirror a:hover) {
		color: #1e40af;
	}

	:global(.editor-content .ProseMirror img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	:global(.editor-content .ProseMirror iframe) {
		width: 100%;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}
</style>