import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ContentBlockService } from '$lib/services/database.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	if (profile.role !== 'instructor') {
		throw error(403, 'Instructor access required');
	}

	try {
		const blockData = await request.json();
		
		// Validate required fields
		if (!blockData.lesson_id || !blockData.type) {
			throw error(400, 'Lesson ID and type are required');
		}

		const block = await ContentBlockService.create(blockData);
		return json(block, { status: 201 });
	} catch (err) {
		console.error('Failed to create content block:', err);
		if (err instanceof Error && err.message.includes('required')) {
			throw error(400, err.message);
		}
		throw error(500, 'Failed to create content block');
	}
};