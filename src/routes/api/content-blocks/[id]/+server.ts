import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ContentBlockService } from '$lib/services/database.js';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	if (profile.role !== 'instructor') {
		throw error(403, 'Instructor access required');
	}

	try {
		const blockId = params.id;
		const updates = await request.json();

		const updatedBlock = await ContentBlockService.update(blockId, updates);
		return json(updatedBlock);
	} catch (err) {
		console.error('Failed to update content block:', err);
		throw error(500, 'Failed to update content block');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw error(401, 'Authentication required');
	}

	if (profile.role !== 'instructor') {
		throw error(403, 'Instructor access required');
	}

	try {
		const blockId = params.id;
		await ContentBlockService.delete(blockId);
		return json({ success: true });
	} catch (err) {
		console.error('Failed to delete content block:', err);
		throw error(500, 'Failed to delete content block');
	}
};