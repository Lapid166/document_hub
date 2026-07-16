import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePermission } from '$lib/server/auth/guards';
import { saveFile } from '$lib/server/storage/upload';

export const POST: RequestHandler = async (event) => {
	requirePermission(event, 'files:upload');

	const formData = await event.request.formData();
	const file = formData.get('file');

	if (!file || !(file instanceof File)) {
		return json({ code: 'VALIDATION_ERROR', message: 'No file provided' }, { status: 400 });
	}

	try {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const result = await saveFile(file.name, buffer, file.type);
		return json({ success: true, ...result });
	} catch (error: any) {
		console.error('File upload error:', error);
		return json(
			{ code: 'UPLOAD_FAILED', message: error.message || 'File upload failed' },
			{ status: 500 }
		);
	}
};
