import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryGlobalSimilarContext } from '$lib/server/ai/rag';
import { chatRAGStream } from '$lib/server/ai/client';

export const POST: RequestHandler = async (event) => {
	try {
		const { message } = await event.request.json();

		if (!message || message.trim() === '') {
			throw error(400, 'Tin nhắn không được trống');
		}

		// 1. Fetch context from global product knowledge bases (limit 4 chunks, similarity threshold 0.55)
		const context = await queryGlobalSimilarContext(message, 4, 0.55);

		// 2. Generate streaming response from LLM using SSE
		const stream = await chatRAGStream('Mini Games Hub', message, context);

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'X-Accel-Buffering': 'no'
			}
		});
	} catch (err: any) {
		console.error('Error in global chat API endpoint:', err);
		throw error(500, err.message || 'Lỗi xử lý chatbot AI');
	}
};
