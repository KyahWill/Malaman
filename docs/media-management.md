# Media Management Guide

This document provides comprehensive guidance on media storage, management, and optimization in the Personalized LMS.

## Overview

The media management system provides secure, scalable file storage with support for images, videos, documents, and other file types. It includes automatic thumbnail generation, CDN integration, and comprehensive file management capabilities.

## Storage Architecture

### Storage Buckets

The system uses two main Supabase Storage buckets:

#### Media Bucket (`media`)
- **Purpose**: Primary storage for all user-uploaded files
- **Access**: Public read, authenticated write
- **Size Limit**: 100MB per file
- **Supported Types**:
  - Images: JPEG, PNG, GIF, WebP, SVG
  - Videos: MP4, WebM, QuickTime, AVI
  - Documents: PDF, Word, Excel, PowerPoint, Plain Text, CSV
  - Archives: ZIP, RAR, 7Z

#### Thumbnails Bucket (`thumbnails`)
- **Purpose**: Automatically generated thumbnails for images
- **Access**: Public read, authenticated write
- **Size Limit**: 5MB per file
- **Supported Types**: JPEG, PNG, WebP

### File Organization Structure

```
media/
├── images/
│   ├── {lesson_id}/
│   │   └── {timestamp}_{random}_{filename}.{ext}
│   └── {course_id}/
│       └── {timestamp}_{random}_{filename}.{ext}
├── videos/
│   ├── {lesson_id}/
│   │   └── {timestamp}_{random}_{filename}.{ext}
│   └── {course_id}/
│       └── {timestamp}_{random}_{filename}.{ext}
└── files/
    ├── {lesson_id}/
    │   └── {timestamp}_{random}_{filename}.{ext}
    └── {course_id}/
        └── {timestamp}_{random}_{filename}.{ext}

thumbnails/
└── {original_path_without_extension}_thumb.jpg
```

## File Upload Process

### 1. Client-Side Validation

Before upload, files are validated for:
- File size limits (varies by type)
- MIME type restrictions
- Security checks (dangerous file extensions)
- Type-specific validation (e.g., images must have image MIME type)

### 2. Server-Side Processing

The upload API endpoint (`/api/media/upload`) handles:
- Authentication verification
- Additional validation
- File storage to Supabase Storage
- Metadata extraction and storage
- Thumbnail generation (for images)
- Database record creation

### 3. Metadata Storage

File metadata is stored in the `media_files` table:

```sql
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  content_id UUID, -- Reference to lesson, course, etc.
  content_type TEXT, -- 'lesson', 'course', etc.
  thumbnail_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Policies

### Row Level Security (RLS)

All storage operations are protected by RLS policies:

#### Storage Objects
- **Upload**: Authenticated users can upload to both buckets
- **Read**: Public read access for all files (public buckets)
- **Update/Delete**: Users can modify their own files

#### Media Files Table
- **Read**: Users can view files they have access to
- **Insert**: Authenticated users can create records for their uploads
- **Update/Delete**: Users can modify their own file records

### File Type Restrictions

Dangerous file types are blocked:
- Executables: `.exe`, `.bat`, `.cmd`, `.scr`, `.pif`, `.com`
- Scripts: `.js`, `.vbs` (when uploaded as files, not content)

## API Endpoints

### Upload File
```http
POST /api/media/upload
Content-Type: multipart/form-data

file: File (required)
type: 'image' | 'video' | 'file' (required)
contentId: string (optional) - lesson or course ID
generateThumbnail: boolean (optional) - for images
```

**Response:**
```json
{
  "success": true,
  "url": "https://...",
  "metadata": {
    "filename": "images/lesson_123/1640995200000_abc123_example.jpg",
    "originalName": "example.jpg",
    "type": "image/jpeg",
    "size": 1024000,
    "uploadedAt": "2023-12-31T12:00:00Z",
    "contentId": "lesson_123",
    "thumbnailUrl": "https://...",
    "dimensions": { "width": 1920, "height": 1080 }
  }
}
```

### List Files
```http
GET /api/media/list?folder=images&limit=100
```

### Get File Info
```http
GET /api/media/{encodedFilePath}
```

### Delete File
```http
DELETE /api/media/{encodedFilePath}
```

### Storage Statistics
```http
GET /api/media/stats
```

### Cleanup Orphaned Files
```http
POST /api/media/cleanup
```

## Components

### MediaUploader Component

The `MediaUploader` component provides a drag-and-drop interface for file uploads:

```svelte
<MediaUploader
  type="image"
  maxSize={10}
  contentId={lessonId}
  generateThumbnail={true}
  onUpload={(url, metadata) => {
    // Handle successful upload
  }}
  currentUrl={existingFileUrl}
  disabled={false}
/>
```

**Props:**
- `type`: File type ('image', 'video', 'file')
- `maxSize`: Maximum file size in MB
- `contentId`: Associated content ID for organization
- `generateThumbnail`: Generate thumbnail for images
- `onUpload`: Callback function for successful uploads
- `currentUrl`: URL of existing file (for replacement)
- `disabled`: Disable upload functionality

### MediaManager Component

The `MediaManager` component provides an admin interface for file management:

```svelte
<MediaManager
  folder="images"
  showStats={true}
  allowDelete={true}
/>
```

## CDN Integration

### Configuration

CDN integration can be configured by setting the CDN URL in the `MediaStorageService`:

```typescript
const STORAGE_CONFIG = {
  cdnUrl: 'https://cdn.example.com' // Optional CDN URL
};
```

### URL Transformation

When a CDN is configured, public URLs are automatically transformed:
- Original: `https://project.supabase.co/storage/v1/object/public/media/file.jpg`
- CDN: `https://cdn.example.com/media/file.jpg`

## Thumbnail Generation

### Automatic Generation

Thumbnails are automatically generated for images when:
- `generateThumbnail` is set to `true` in upload options
- File type is an image
- Browser supports Canvas API

### Thumbnail Specifications

- Maximum dimensions: 300x300 pixels
- Maintains aspect ratio
- Format: JPEG with 80% quality
- Stored in separate `thumbnails` bucket

## Storage Optimization

### File Size Limits

| File Type | Maximum Size | Recommended Size |
|-----------|--------------|------------------|
| Images    | 10MB         | < 2MB            |
| Videos    | 100MB        | < 50MB           |
| Documents | 50MB         | < 10MB           |

### Best Practices

1. **Image Optimization**:
   - Use WebP format when possible
   - Compress images before upload
   - Provide appropriate alt text

2. **Video Optimization**:
   - Use MP4 format with H.264 codec
   - Consider YouTube embedding for large videos
   - Provide captions for accessibility

3. **Document Management**:
   - Use PDF for documents when possible
   - Provide descriptive filenames
   - Consider file accessibility

## Backup and Recovery

### Automated Backups

Supabase provides automated backups for:
- Database (including file metadata)
- Storage buckets (files)

### Manual Backup Procedures

1. **Database Backup**:
   ```bash
   supabase db dump --file backup.sql
   ```

2. **Storage Backup**:
   Use Supabase CLI or API to download all files from buckets

### Recovery Procedures

1. **Database Recovery**:
   ```bash
   supabase db reset
   psql -f backup.sql
   ```

2. **Storage Recovery**:
   Re-upload files to storage buckets and update database references

## Cleanup and Maintenance

### Orphaned File Cleanup

The system provides automatic cleanup of orphaned files (files not referenced in the database):

```typescript
// Manual cleanup via API
const result = await fetch('/api/media/cleanup', { method: 'POST' });
```

### Storage Monitoring

Monitor storage usage through:
- Storage statistics API endpoint
- Supabase dashboard
- Custom monitoring dashboards

### Maintenance Tasks

Regular maintenance should include:
1. Orphaned file cleanup (monthly)
2. Storage usage monitoring (weekly)
3. Backup verification (weekly)
4. Performance optimization (quarterly)

## Troubleshooting

### Common Issues

#### Upload Failures
- **Cause**: File size exceeds limits
- **Solution**: Compress file or increase limits
- **Prevention**: Client-side validation

#### Missing Thumbnails
- **Cause**: Thumbnail generation failed
- **Solution**: Regenerate thumbnails manually
- **Prevention**: Error handling in upload process

#### Access Denied Errors
- **Cause**: RLS policy restrictions
- **Solution**: Verify user permissions and policies
- **Prevention**: Proper authentication checks

#### Storage Quota Exceeded
- **Cause**: Too many files uploaded
- **Solution**: Clean up unused files or upgrade plan
- **Prevention**: Regular cleanup and monitoring

### Debug Tools

1. **Browser Developer Tools**: Check network requests and console errors
2. **Supabase Logs**: Monitor storage and database operations
3. **API Response Inspection**: Verify API responses and error messages

## Performance Optimization

### Client-Side Optimization

1. **Lazy Loading**: Load images only when needed
2. **Progressive Enhancement**: Show thumbnails first, full images on demand
3. **Caching**: Implement browser caching for static assets

### Server-Side Optimization

1. **CDN Usage**: Serve files through CDN for faster delivery
2. **Compression**: Enable gzip compression for text files
3. **Caching Headers**: Set appropriate cache headers

### Database Optimization

1. **Indexing**: Ensure proper indexes on media_files table
2. **Query Optimization**: Use efficient queries for file lookups
3. **Connection Pooling**: Use connection pooling for database access

## Migration and Upgrades

### Version Compatibility

When upgrading the system:
1. Check storage schema changes
2. Update RLS policies if needed
3. Migrate existing file metadata
4. Test upload/download functionality

### Data Migration

For migrating from other storage systems:
1. Export file metadata
2. Transfer files to Supabase Storage
3. Update database references
4. Verify file accessibility

## Compliance and Legal

### Data Protection

The system complies with data protection regulations:
- User consent for file uploads
- Right to data deletion
- Data portability (export functionality)
- Audit logging for file operations

### Accessibility

File uploads and management interfaces follow accessibility guidelines:
- Keyboard navigation support
- Screen reader compatibility
- Alt text requirements for images
- High contrast mode support

## Support and Resources

### Documentation Links
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [File Upload Best Practices](https://web.dev/file-upload-best-practices/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Community Resources
- GitHub Issues for bug reports
- Community forums for questions
- Documentation contributions welcome

---

This guide provides comprehensive coverage of the media management system. For specific implementation details, refer to the source code and API documentation.