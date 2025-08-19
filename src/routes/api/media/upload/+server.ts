import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	if (profile.role !== 'instructor') {
		throw error(403, 'Instructor access required');
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const type = formData.get('type') as string; // 'image', 'video', 'file'

		if (!file) {
			throw error(400, 'No file provided');
		}

		if (!type) {
			throw error(400, 'Media type is required');
		}

		// Validate file size (50MB limit)
		const maxSize = 50 * 1024 * 1024; // 50MB in bytes
		if (file.size > maxSize) {
			throw error(400, 'File size must be less than 50MB');
		}

		// Validate file type
		const allowedTypes: Record<string, string[]> = {
			image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
			video: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
			file: [] // Allow all file types for general files
		};

		if (type !== 'file' && allowedTypes[type]) {
			const allowed = allowedTypes[type];
			if (allowed.length > 0 && !allowed.includes(file.type)) {
				throw error(400, `Invalid file type for ${type}. Allowed types: ${allowed.join(', ')}`);
			}
		}

		// Generate unique filename
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(2);
		const extension = file.name.split('.').pop();
		const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
		const filename = `${timestamp}_${randomId}_${baseName}.${extension}`;
		
		// Upload to Supabase Storage
		const bucket = 'media';
		const path = `${type}s/${filename}`;

		const { data, error: uploadError } = await supabase.storage
			.from(bucket)
			.upload(path, file, {
				cacheControl: '3600',
				upsert: false
			});

		if (uploadError) {
			console.error('Supabase upload error:', uploadError);
			throw error(500, `Upload failed: ${uploadError.message}`);
		}

		// Get public URL
		const { data: urlData } = supabase.storage
			.from(bucket)
			.getPublicUrl(path);

		return json({
			url: urlData.publicUrl,
			filename: file.name,
			type: file.type,
			size: file.size,
			path: data.path
		});

	} catch (err) {
		console.error('Media upload error:', err);
		if (err instanceof Error) {
			throw error(500, err.message);
		}
		throw error(500, 'Failed to upload media');
	}
};