/**
 * CDN Image Transformation API
 * Provides on-the-fly image optimization and transformation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cdnService } from '$lib/services/cdnOptimization';

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    const searchParams = url.searchParams;
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      throw error(400, 'Missing required parameter: url');
    }

    // Parse transformation parameters
    const width = searchParams.get('w') ? parseInt(searchParams.get('w')!) : undefined;
    const height = searchParams.get('h') ? parseInt(searchParams.get('h')!) : undefined;
    const quality = searchParams.get('q') ? parseInt(searchParams.get('q')!) : undefined;
    const format = searchParams.get('f') as 'webp' | 'avif' | 'jpeg' | 'png' | undefined;
    const fit = searchParams.get('fit') as 'cover' | 'contain' | 'fill' | 'inside' | 'outside' | undefined;
    const blur = searchParams.get('blur') ? parseInt(searchParams.get('blur')!) : undefined;
    const sharpen = searchParams.get('sharpen') === 'true';
    const grayscale = searchParams.get('grayscale') === 'true';

    // Validate parameters
    if (width && (width < 1 || width > 4000)) {
      throw error(400, 'Width must be between 1 and 4000 pixels');
    }
    
    if (height && (height < 1 || height > 4000)) {
      throw error(400, 'Height must be between 1 and 4000 pixels');
    }
    
    if (quality && (quality < 1 || quality > 100)) {
      throw error(400, 'Quality must be between 1 and 100');
    }

    // Check if URL is from allowed domains (security measure)
    const allowedDomains = [
      process.env.PUBLIC_SUPABASE_URL?.replace('https://', ''),
      'localhost',
      '127.0.0.1'
    ].filter(Boolean);

    const urlObj = new URL(decodeURIComponent(imageUrl));
    const isAllowedDomain = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowedDomain) {
      throw error(403, 'Domain not allowed for transformation');
    }

    // Fetch the original image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw error(response.status, 'Failed to fetch original image');
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw error(400, 'URL does not point to an image');
    }

    // For now, we'll pass through the original image
    // In a production environment, you would use a service like Sharp, ImageMagick, or a cloud service
    const imageBuffer = await response.arrayBuffer();

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, stale-while-revalidate=86400');
    headers.set('Vary', 'Accept');
    
    // Add transformation info to headers for debugging
    headers.set('X-Transform-Width', width?.toString() || 'auto');
    headers.set('X-Transform-Height', height?.toString() || 'auto');
    headers.set('X-Transform-Quality', quality?.toString() || 'auto');
    headers.set('X-Transform-Format', format || 'original');

    return new Response(imageBuffer, { headers });

  } catch (err: any) {
    console.error('Image transformation error:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, 'Internal server error during image transformation');
  }
};

// Video transformation endpoint
export const POST: RequestHandler = async ({ request, url, fetch }) => {
  try {
    const { videoUrl, options } = await request.json();
    
    if (!videoUrl) {
      throw error(400, 'Missing required parameter: videoUrl');
    }

    // For video transformation, you would typically use a service like FFmpeg
    // or a cloud video processing service like Cloudinary, AWS Elemental, etc.
    
    // This is a placeholder implementation
    const transformedUrl = cdnService.generateVideoUrl(videoUrl, options);
    
    return json({
      originalUrl: videoUrl,
      transformedUrl,
      options,
      message: 'Video transformation queued (placeholder implementation)'
    });

  } catch (err: any) {
    console.error('Video transformation error:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, 'Internal server error during video transformation');
  }
};

// Thumbnail generation endpoint
export const PUT: RequestHandler = async ({ request, url, fetch }) => {
  try {
    const searchParams = url.searchParams;
    const videoUrl = searchParams.get('url');
    const time = searchParams.get('time') ? parseFloat(searchParams.get('time')!) : 1;
    const width = searchParams.get('w') ? parseInt(searchParams.get('w')!) : 320;
    const height = searchParams.get('h') ? parseInt(searchParams.get('h')!) : 180;
    
    if (!videoUrl) {
      throw error(400, 'Missing required parameter: url');
    }

    // Validate parameters
    if (time < 0) {
      throw error(400, 'Time must be a positive number');
    }
    
    if (width < 1 || width > 1920) {
      throw error(400, 'Width must be between 1 and 1920 pixels');
    }
    
    if (height < 1 || height > 1080) {
      throw error(400, 'Height must be between 1 and 1080 pixels');
    }

    // For thumbnail generation, you would typically use FFmpeg
    // This is a placeholder that returns a generic thumbnail
    
    const thumbnailUrl = cdnService.generateVideoThumbnail(videoUrl, { time, width, height });
    
    return json({
      videoUrl,
      thumbnailUrl,
      time,
      dimensions: { width, height },
      message: 'Thumbnail generation queued (placeholder implementation)'
    });

  } catch (err: any) {
    console.error('Thumbnail generation error:', err);
    
    if (err.status) {
      throw err;
    }
    
    throw error(500, 'Internal server error during thumbnail generation');
  }
};