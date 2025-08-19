# Lesson Content Management System

## Overview

The Lesson Content Management System provides instructors with a comprehensive, unified editor for creating rich, interactive lessons with multiple media types. The system supports drag-and-drop functionality, accessibility features, and seamless integration with various content formats.

## Features

### Unified Lesson Editor ✅ IMPLEMENTED
- **Drag-and-Drop Interface**: ✅ Reorder content blocks easily with visual feedback
- **Multiple Content Types**: ✅ Support for rich text, images, videos, files, and YouTube videos
- **Form Validation**: ✅ Comprehensive validation for lesson data and content blocks
- **Accessibility-First**: ✅ Built-in accessibility features and validation
- **Auto-save Progress**: 🔄 Planned - Automatic saving of lesson progress

### Content Block System ✅ IMPLEMENTED
The lesson editor uses a modular content block system where each lesson consists of multiple content blocks that can be:
- ✅ Reordered via drag-and-drop with visual feedback
- ✅ Edited independently with dedicated editors
- ✅ Validated for completeness with error indicators
- ✅ Expanded/collapsed for better organization
- 🔄 Previewed in real-time (planned enhancement)

## Content Types

### 1. Rich Text Content ✅ IMPLEMENTED
- **WYSIWYG Editor**: ✅ Full-featured rich text editor with Tiptap integration
- **Supported Formats**: ✅ Headings, lists, links, bold, italic, underline, blockquotes
- **Content Sanitization**: ✅ Automatic HTML sanitization for security
- **Accessibility**: ✅ Semantic HTML output for screen readers
- **Word Count**: ✅ Automatic word count calculation

**Usage Guidelines:**
- Use headings to structure content hierarchically
- Keep paragraphs concise and focused
- Use lists for step-by-step instructions or key points
- Include descriptive link text for accessibility

### 2. Image Content ✅ IMPLEMENTED
- **Upload Support**: ✅ Direct file upload with MediaUploader component
- **Alt Text Required**: ✅ Mandatory alt text for accessibility compliance
- **Caption Support**: ✅ Optional captions for additional context
- **Format Support**: ✅ JPG, PNG, GIF, WebP
- **Preview**: ✅ Real-time image preview with responsive sizing
- **Auto Alt Text**: ✅ Automatic alt text generation from filename

**Accessibility Requirements:**
- Alt text is mandatory and must describe the image content
- Use descriptive, concise alt text (not "image of" or "picture of")
- Captions should provide additional context, not repeat alt text

**Best Practices:**
- Use high-quality, relevant images
- Optimize images for web (compress before upload)
- Ensure images are clear and readable at different sizes
- Consider color contrast for text overlays

### 3. Video Content ✅ IMPLEMENTED
- **Upload Support**: ✅ Direct video file upload with MediaUploader
- **Format Support**: ✅ MP4, WebM, MOV
- **Preview**: ✅ HTML5 video player with controls
- **Metadata**: ✅ Duration and file size tracking
- **Accessibility**: ✅ Support for captions (manual upload)

**Best Practices:**
- Keep videos focused and concise
- Ensure clear audio quality
- Provide captions for accessibility
- Use appropriate resolution (720p or 1080p recommended)
- Consider file size for loading performance

### 4. File Content ✅ IMPLEMENTED
- **Universal Support**: ✅ Support for most file types
- **Download Functionality**: ✅ Direct download links for students
- **Metadata Display**: ✅ File name, type, and size information
- **File Preview**: ✅ File icon and metadata display
- **Upload Integration**: ✅ MediaUploader component integration

**Supported File Types:**
- Documents: PDF, DOC, DOCX, TXT, RTF
- Spreadsheets: XLS, XLSX, CSV
- Presentations: PPT, PPTX
- Archives: ZIP, RAR (with caution)
- Code: Various programming language files

**Security Restrictions:**
- Executable files (.exe, .bat, .cmd) are blocked
- Scripts (.js, .vbs, .ps1) require manual review
- Unknown file types are flagged for review

### 5. YouTube Video Integration ✅ IMPLEMENTED
- **URL Validation**: ✅ Automatic YouTube URL parsing and validation
- **Embed Generation**: ✅ YouTubeEmbed component with secure embedding
- **Video ID Extraction**: ✅ Support for multiple YouTube URL formats
- **Metadata Extraction**: ✅ Automatic title retrieval via API
- **Preview**: ✅ Embedded video preview in editor

**Supported URL Formats:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

**Privacy and Security:**
- Enhanced privacy mode enabled by default
- No related videos shown at end
- Minimal YouTube branding
- HTTPS-only embedding

## File Upload System

### Storage Architecture
- **Supabase Storage**: Secure cloud storage with CDN delivery
- **Bucket Organization**: Organized by content type (images/, videos/, files/)
- **Unique Naming**: Timestamp and random ID prevent conflicts
- **Public URLs**: Direct access URLs for embedded content

### Upload Process
1. **Client-Side Validation**: File type and size validation before upload
2. **Server-Side Processing**: Additional security checks and metadata extraction
3. **Storage Upload**: Secure upload to Supabase Storage
4. **URL Generation**: Public URL generation for content access
5. **Database Recording**: Metadata storage in content blocks

### Security Measures
- **File Type Validation**: Whitelist of allowed file types
- **Size Limits**: Enforced limits based on content type
- **Virus Scanning**: Automatic malware detection (planned)
- **Access Control**: Instructor-only upload permissions
- **Content Sanitization**: HTML and script removal from uploads

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Alt Text Requirements**: Mandatory alt text for all images
- **Semantic HTML**: Proper heading structure and landmarks
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: Sufficient contrast ratios maintained

### Content Guidelines
- **Image Alt Text**: Descriptive, concise alternative text
- **Video Captions**: Encourage caption upload for videos
- **Link Descriptions**: Meaningful link text
- **Heading Structure**: Logical heading hierarchy
- **Color Independence**: Information not conveyed by color alone

## API Endpoints

### Lesson Management
- `GET /api/lessons?courseId={id}` - Get lessons for a course
- `POST /api/lessons` - Create new lesson
- `GET /api/lessons/{id}` - Get lesson details
- `PUT /api/lessons/{id}` - Update lesson
- `DELETE /api/lessons/{id}` - Delete lesson

### Content Blocks
- `POST /api/content-blocks` - Create content block
- `PUT /api/content-blocks/{id}` - Update content block
- `DELETE /api/content-blocks/{id}` - Delete content block

### Media Upload
- `POST /api/media/upload` - Upload media files
- `POST /api/youtube/validate` - Validate YouTube URLs

## Usage Instructions

### Creating a New Lesson

1. **Navigate to Course**: Go to the course where you want to add a lesson
2. **Click "Add Lesson"**: Use the add lesson button in the course interface
3. **Fill Basic Information**:
   - Enter lesson title (required)
   - Add description (optional)
   - Set estimated duration
   - Define learning objectives

4. **Add Content Blocks**:
   - Click "Add Content Block"
   - Choose content type from modal
   - Configure content using the block editor
   - Repeat for additional content

5. **Arrange Content**: Use drag-and-drop to reorder content blocks
6. **Save Lesson**: Click "Create Lesson" to save

### Editing Existing Lessons

1. **Access Lesson**: Navigate to the lesson from the course page
2. **Click "Edit Lesson"**: Use the edit button (instructor only)
3. **Modify Content**: Update any content blocks or metadata
4. **Reorder Blocks**: Drag and drop to change order
5. **Save Changes**: Click "Update Lesson"

### Content Block Management

#### Rich Text Blocks
1. Use the toolbar for formatting options
2. Add links with descriptive text
3. Structure content with headings
4. Use lists for better readability

#### Image Blocks
1. Click upload area or drag and drop image
2. Wait for upload completion
3. **Required**: Enter descriptive alt text
4. **Optional**: Add caption for context

#### Video Blocks
1. Upload video file (MP4 recommended)
2. Wait for processing and thumbnail generation
3. Preview video to ensure quality
4. Consider adding captions separately

#### File Blocks
1. Upload any supported file type
2. Verify file name is descriptive
3. Check file size is reasonable
4. Test download functionality

#### YouTube Blocks
1. Copy YouTube video URL
2. Paste URL in the input field
3. Click "Load Video" to validate
4. Preview embedded video

## File Size Limits and Formats

### Images
- **Maximum Size**: 10MB
- **Recommended Formats**: JPG (photos), PNG (graphics), WebP (modern browsers)
- **Optimization**: Compress images before upload for better performance

### Videos
- **Maximum Size**: 100MB
- **Recommended Formats**: MP4 (H.264 codec), WebM
- **Resolution**: 720p or 1080p recommended
- **Compression**: Use appropriate bitrates for web delivery

### Files
- **Maximum Size**: 50MB
- **Supported Formats**: Most document, spreadsheet, and presentation formats
- **Restrictions**: No executable files or potentially dangerous formats

## Best Practices

### Content Creation
1. **Plan Structure**: Outline lesson flow before creating content
2. **Use Mixed Media**: Combine text, images, and videos for engagement
3. **Keep Focused**: Each content block should have a clear purpose
4. **Test Accessibility**: Review content with accessibility in mind

### Media Guidelines
1. **Optimize Files**: Compress media for faster loading
2. **Use Descriptive Names**: Name files clearly for organization
3. **Provide Context**: Use captions and descriptions effectively
4. **Consider Bandwidth**: Be mindful of file sizes for mobile users

### Accessibility
1. **Alt Text**: Always provide meaningful alt text for images
2. **Captions**: Add captions to videos when possible
3. **Structure**: Use proper heading hierarchy
4. **Testing**: Test with screen readers when possible

## Troubleshooting

### Upload Issues
- **File Too Large**: Compress or split large files
- **Unsupported Format**: Convert to supported format
- **Upload Fails**: Check internet connection and try again
- **Slow Upload**: Consider file size and connection speed

### Content Display Issues
- **Images Not Loading**: Check file permissions and URLs
- **Videos Not Playing**: Verify format compatibility
- **YouTube Not Embedding**: Validate URL format
- **Layout Problems**: Check content block order and settings

### Accessibility Issues
- **Missing Alt Text**: Add descriptive alt text to all images
- **Poor Contrast**: Adjust colors for better visibility
- **Navigation Problems**: Ensure proper heading structure
- **Screen Reader Issues**: Test with accessibility tools

## Future Enhancements

### Planned Features
- **Interactive Content**: Quizzes and interactive elements within lessons
- **Version Control**: Track changes and revert to previous versions
- **Collaboration**: Multiple instructors editing same lesson
- **Analytics**: Track student engagement with content blocks
- **Templates**: Pre-built lesson templates for common formats

### Integration Improvements
- **LTI Support**: Integration with external learning tools
- **SCORM Compatibility**: Support for SCORM packages
- **API Expansion**: More granular API endpoints
- **Bulk Operations**: Import/export multiple lessons
- **Advanced Media**: 360° videos, AR/VR content support

This comprehensive lesson content management system provides instructors with powerful tools to create engaging, accessible, and interactive learning experiences while maintaining security and performance standards.