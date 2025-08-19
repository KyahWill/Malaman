import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	if (profile.role !== 'instructor') {
		throw error(403, 'Instructor access required');
	}

	try {
		const { url } = await request.json();

		if (!url) {
			throw error(400, 'YouTube URL is required');
		}

		// Extract video ID from various YouTube URL formats
		const videoId = extractYouTubeVideoId(url);
		
		if (!videoId) {
			throw error(400, 'Invalid YouTube URL');
		}

		// Validate video ID format
		if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
			throw error(400, 'Invalid YouTube video ID format');
		}

		// Generate thumbnail URLs
		const thumbnailUrls = {
			default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
			medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
			high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
			maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
		};

		// Basic video data (in a real implementation, you'd use YouTube Data API)
		const videoData = {
			video_id: videoId,
			title: `YouTube Video: ${videoId}`,
			thumbnail_url: thumbnailUrls.high,
			duration: 0, // Would be fetched from YouTube API
			channel_name: '', // Would be fetched from YouTube API
			description: '' // Would be fetched from YouTube API
		};

		return json({
			valid: true,
			videoId,
			videoData,
			thumbnailUrls,
			embedUrl: `https://www.youtube.com/embed/${videoId}`
		});

	} catch (err) {
		console.error('YouTube validation error:', err);
		if (err instanceof Error) {
			throw error(400, err.message);
		}
		throw error(500, 'Failed to validate YouTube URL');
	}
};

function extractYouTubeVideoId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
		/youtube\.com\/v\/([^&\n?#]+)/,
		/youtube\.com\/watch\?.*v=([^&\n?#]+)/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}

	return null;
}