import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateSectionContent } from '$lib/server/ai/client';

export const POST: RequestHandler = async (event) => {
	// Guard: Require login
	if (!event.locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { fieldName, productName, layoutType, rawContent, currentContent } = await event.request.json();

		if (!fieldName || !productName || !rawContent) {
			throw error(400, 'Thiếu tham số bắt buộc (fieldName, productName, rawContent)');
		}

		const result = await generateSectionContent(
			fieldName,
			productName,
			layoutType || 'other',
			rawContent,
			currentContent
		);

		return json({ success: true, result });
	} catch (err: any) {
		console.error('generate-section API error:', err);
		throw error(500, err.message || 'Lỗi hệ thống khi AI xử lý nội dung trường');
	}
};
