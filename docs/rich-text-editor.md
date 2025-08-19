# Rich Text Editor Documentation

## Implementation Status: 🔄 IN PROGRESS

The rich text editor integration is currently in development. The content sanitization framework and basic components are in place, but the full Tiptap integration with formatting toolbar needs completion.

## Overview

The Rich Text Editor will be a comprehensive content editing solution built with Tiptap and Svelte 5, providing a secure, accessible, and feature-rich editing experience for the Personalized LMS platform.

## Features

### Core Functionality
- **WYSIWYG Editing**: Visual editing with real-time preview
- **Content Sanitization**: Automatic HTML sanitization using DOMPurify
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Mobile-friendly interface
- **Extensible**: Modular architecture for easy customization

### Formatting Options
- **Text Formatting**: Bold, italic, underline, strikethrough
- **Headings**: H1-H6 with semantic HTML
- **Lists**: Ordered and unordered lists
- **Alignment**: Left, center, right, justify
- **Quotes**: Blockquotes for highlighted content
- **Links**: External links with security attributes
- **Media**: Images and YouTube video embedding

### Security Features
- **Content Sanitization**: Removes malicious scripts and unsafe HTML
- **URL Validation**: Validates and sanitizes URLs
- **XSS Protection**: Prevents cross-site scripting attacks
- **Content Auditing**: Security scoring and issue detection

## Components

### RichTextEditor.svelte

The main editor component with full editing capabilities.

#### Props

```typescript
interface Props {
  content?: string;           // Initial content (HTML)
  placeholder?: string;       // Placeholder text
  editable?: boolean;         // Enable/disable editing
  class?: string;            // Additional CSS classes
  onUpdate?: (content: string) => void; // Content change callback
  maxLength?: number;         // Maximum character limit
  showToolbar?: boolean;      // Show/hide toolbar
  allowImages?: boolean;      // Enable image insertion
  allowVideos?: boolean;      // Enable video embedding
  allowLinks?: boolean;       // Enable link creation
}
```

#### Usage Example

```svelte
<script>
  import { RichTextEditor } from '$lib/components/ui';
  
  let content = '<p>Initial content</p>';
  
  function handleUpdate(newContent) {
    content = newContent;
    console.log('Content updated:', newContent);
  }
</script>

<RichTextEditor
  content={content}
  onUpdate={handleUpdate}
  placeholder="Start writing..."
  maxLength={5000}
  allowImages={true}
  allowVideos={true}
  allowLinks={true}
/>
```

### RichTextRenderer.svelte

Read-only component for displaying sanitized rich text content.

#### Props

```typescript
interface Props {
  content: string;    // HTML content to render
  class?: string;     // Additional CSS classes
}
```

#### Usage Example

```svelte
<script>
  import { RichTextRenderer } from '$lib/components/ui';
  
  const content = '<h1>Title</h1><p>Content with <strong>formatting</strong></p>';
</script>

<RichTextRenderer content={content} class="my-custom-styles" />
```

## Content Sanitization Service

The `ContentSanitizationService` provides comprehensive content validation and sanitization.

### Methods

#### sanitizeHtml(content, config?)
Sanitizes HTML content using DOMPurify.

```typescript
import { ContentSanitizationService } from '$lib/services';

const sanitized = ContentSanitizationService.sanitizeHtml(
  '<p>Content with <script>alert("xss")</script></p>'
);
// Result: '<p>Content with </p>'
```

#### validateAndSanitize(content, config?)
Validates and sanitizes content with detailed feedback.

```typescript
const result = ContentSanitizationService.validateAndSanitize(content);
console.log(result.isValid);           // boolean
console.log(result.errors);            // string[]
console.log(result.warnings);          // string[]
console.log(result.sanitizedContent);  // string
```

#### extractPlainText(content)
Extracts plain text from HTML content.

```typescript
const plainText = ContentSanitizationService.extractPlainText(
  '<p>Hello <strong>world</strong>!</p>'
);
// Result: 'Hello world!'
```

#### countWords(content)
Counts words in content.

```typescript
const wordCount = ContentSanitizationService.countWords(content);
```

#### estimateReadingTime(content, wordsPerMinute?)
Estimates reading time in minutes.

```typescript
const readingTime = ContentSanitizationService.estimateReadingTime(content, 200);
```

#### validateYouTubeUrl(url)
Validates YouTube URLs and extracts video IDs.

```typescript
const result = ContentSanitizationService.validateYouTubeUrl(
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
);
console.log(result.isValid);  // true
console.log(result.videoId);  // 'dQw4w9WgXcQ'
```

#### validateImageUrl(url)
Validates image URLs.

```typescript
const result = ContentSanitizationService.validateImageUrl(
  'https://example.com/image.jpg'
);
console.log(result.isValid);  // true
```

#### validateLinkUrl(url)
Validates and sanitizes link URLs.

```typescript
const result = ContentSanitizationService.validateLinkUrl('example.com');
console.log(result.sanitizedUrl);  // 'https://example.com'
```

#### auditContent(content)
Performs security audit on content.

```typescript
const audit = ContentSanitizationService.auditContent(content);
console.log(audit.securityScore);  // 0-100
console.log(audit.issues);         // Array of security issues
```

## Sanitization Configurations

### DEFAULT_RICH_TEXT_CONFIG
Standard configuration for rich text content.

```typescript
{
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'iframe', 'span', 'div'],
  allowedAttributes: ['href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height', 'style', 'class', 'data-youtube-video', 'frameborder', 'allowfullscreen'],
  maxLength: 50000
}
```

### STRICT_SANITIZATION_CONFIG
Restrictive configuration for user-generated content.

```typescript
{
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a'],
  allowedAttributes: ['href', 'target', 'rel', 'alt', 'title'],
  maxLength: 10000
}
```

### PLAIN_TEXT_CONFIG
Configuration that strips all HTML tags.

```typescript
{
  allowedTags: [],
  allowedAttributes: [],
  stripTags: true,
  maxLength: 5000
}
```

## Keyboard Shortcuts

The editor supports standard keyboard shortcuts for efficient editing:

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Shift+S` | Strikethrough |
| `Ctrl+Shift+7` | Ordered List |
| `Ctrl+Shift+8` | Bullet List |
| `Ctrl+Shift+B` | Blockquote |
| `Ctrl+K` | Add Link |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Tab` | Navigate toolbar |
| `Enter` | New paragraph |
| `Shift+Enter` | Line break |

## Accessibility Features

### Screen Reader Support
- Semantic HTML output
- ARIA labels and roles
- Proper heading hierarchy
- Alternative text for images

### Keyboard Navigation
- Full keyboard accessibility
- Focus management
- Tab order optimization
- Escape key handling
- Built-in keyboard shortcuts help (? button in toolbar)
- Modal accessibility with proper focus trapping

### Visual Accessibility
- High contrast toolbar buttons
- Clear focus indicators
- Scalable interface
- Color-blind friendly design

### Content Accessibility
- Required alt text for images
- Proper link attributes
- Semantic markup
- Heading structure validation

## Security Measures

### Content Sanitization
- XSS prevention
- Script tag removal
- Event handler stripping
- URL validation

### Security Policies
- Content Security Policy (CSP) compliance
- Safe URL patterns
- Iframe restrictions (YouTube only)
- Data URI limitations

### Audit Features
- Security scoring (0-100)
- Issue categorization (low/medium/high)
- Vulnerability detection
- Compliance checking

## Integration Examples

### Course Content Editor

```svelte
<script>
  import { RichTextEditor } from '$lib/components/ui';
  import { ContentSanitizationService } from '$lib/services';
  
  let lessonContent = '';
  let isValid = true;
  
  function handleContentUpdate(content) {
    const validation = ContentSanitizationService.validateAndSanitize(content);
    lessonContent = validation.sanitizedContent || content;
    isValid = validation.isValid;
  }
  
  async function saveLessonContent() {
    if (!isValid) return;
    
    // Save to database
    await fetch('/api/lessons/123/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: lessonContent })
    });
  }
</script>

<div class="lesson-editor">
  <RichTextEditor
    content={lessonContent}
    onUpdate={handleContentUpdate}
    placeholder="Enter lesson content..."
    maxLength={20000}
    allowImages={true}
    allowVideos={true}
    allowLinks={true}
  />
  
  <button 
    onclick={saveLessonContent}
    disabled={!isValid}
    class="save-button"
  >
    Save Lesson
  </button>
</div>
```

### Assessment Question Editor

```svelte
<script>
  import { RichTextEditor } from '$lib/components/ui';
  import { STRICT_SANITIZATION_CONFIG } from '$lib/services';
  
  let questionText = '';
  
  function handleQuestionUpdate(content) {
    // Use strict sanitization for assessment content
    questionText = ContentSanitizationService.sanitizeHtml(
      content, 
      STRICT_SANITIZATION_CONFIG
    );
  }
</script>

<RichTextEditor
  content={questionText}
  onUpdate={handleQuestionUpdate}
  placeholder="Enter question text..."
  maxLength={2000}
  allowImages={false}
  allowVideos={false}
  allowLinks={true}
  showToolbar={true}
/>
```

### Content Display

```svelte
<script>
  import { RichTextRenderer } from '$lib/components/ui';
  
  export let lesson;
</script>

<article class="lesson-content">
  <h1>{lesson.title}</h1>
  <RichTextRenderer 
    content={lesson.content} 
    class="prose prose-lg max-w-none"
  />
</article>
```

## Troubleshooting

### Common Issues

#### Editor Not Loading
- Check that all Tiptap packages are installed
- Verify component imports
- Check browser console for errors

#### Content Not Saving
- Verify sanitization passes validation
- Check network requests
- Ensure proper error handling

#### Accessibility Issues
- Test with screen readers
- Verify keyboard navigation
- Check ARIA attributes

#### Performance Issues
- Limit content length
- Optimize image sizes
- Use lazy loading for large content

### Debug Mode

Enable debug mode for development:

```svelte
<RichTextEditor
  content={content}
  onUpdate={handleUpdate}
  class="debug-mode"
/>

<style>
  :global(.debug-mode .ProseMirror) {
    border: 2px dashed red;
  }
</style>
```

## Best Practices

### Content Creation
1. Always provide alt text for images
2. Use semantic headings (H1-H6)
3. Keep content concise and scannable
4. Test with screen readers
5. Validate content before saving

### Security
1. Always sanitize user-generated content
2. Use appropriate sanitization configs
3. Regularly audit content security
4. Monitor for XSS attempts
5. Keep dependencies updated

### Performance
1. Set reasonable content length limits
2. Optimize images before insertion
3. Use lazy loading for large content
4. Monitor editor performance
5. Cache sanitized content when possible

### Accessibility
1. Provide keyboard alternatives
2. Use semantic HTML
3. Test with assistive technologies
4. Follow WCAG 2.1 AA guidelines
5. Provide clear instructions

## Testing

### Unit Tests
Test individual components and functions:

```typescript
import { ContentSanitizationService } from '$lib/services';

describe('ContentSanitizationService', () => {
  test('sanitizes malicious content', () => {
    const malicious = '<script>alert("xss")</script><p>Safe content</p>';
    const sanitized = ContentSanitizationService.sanitizeHtml(malicious);
    expect(sanitized).toBe('<p>Safe content</p>');
  });
  
  test('validates YouTube URLs', () => {
    const result = ContentSanitizationService.validateYouTubeUrl(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
    expect(result.isValid).toBe(true);
    expect(result.videoId).toBe('dQw4w9WgXcQ');
  });
});
```

### Integration Tests
Test editor functionality:

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';

test('editor updates content on input', async () => {
  const { getByRole } = render(RichTextEditor, {
    content: '<p>Initial</p>',
    onUpdate: vi.fn()
  });
  
  const editor = getByRole('textbox');
  await fireEvent.input(editor, { target: { innerHTML: '<p>Updated</p>' } });
  
  expect(onUpdate).toHaveBeenCalledWith('<p>Updated</p>');
});
```

### Accessibility Tests
Test with axe-core:

```typescript
import { axe } from 'jest-axe';
import { render } from '@testing-library/svelte';
import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';

test('editor is accessible', async () => {
  const { container } = render(RichTextEditor);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Migration Guide

### From Basic Textarea
Replace textarea elements with RichTextEditor:

```svelte
<!-- Before -->
<textarea bind:value={content} placeholder="Enter content..."></textarea>

<!-- After -->
<RichTextEditor 
  content={content} 
  onUpdate={(c) => content = c}
  placeholder="Enter content..."
/>
```

### From Other Editors
Migrate content and update handlers:

```svelte
<!-- Before (other editor) -->
<SomeEditor 
  value={content}
  onChange={handleChange}
  config={editorConfig}
/>

<!-- After -->
<RichTextEditor
  content={content}
  onUpdate={handleChange}
  allowImages={editorConfig.images}
  allowVideos={editorConfig.videos}
  allowLinks={editorConfig.links}
/>
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the examples
3. Test with the demo page (`/demo/rich-text`)
4. Check browser console for errors
5. Verify all dependencies are installed

## Changelog

### Version 1.0.0
- Initial release with Tiptap integration
- Content sanitization service
- Accessibility features
- Security auditing
- Comprehensive documentation