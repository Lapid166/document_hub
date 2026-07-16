import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { products } from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { querySimilarContext } from '$lib/server/ai/rag';
import { chatRAGStream } from '$lib/server/ai/client';

export const POST: RequestHandler = async (event) => {
	const productId = event.params.id;
	const { message } = await event.request.json();

	if (!message || message.trim() === '') {
		throw error(400, 'Tin nhắn không được trống');
	}

	// 1. Fetch product to verify it exists and get its name
	const [product] = await db
		.select()
		.from(products)
		.where(
			or(eq(products.id, productId), eq(products.slug, productId))
		)
		.limit(1);

	if (!product) {
		throw error(404, 'Không tìm thấy sản phẩm');
	}

	try {
		// 2. Fetch context from RAG vector database (limit 3 chunks, similarity threshold 0.5)
		const context = await querySimilarContext(product.id, message, 3, 0.5);

		// 3. Generate streaming response from LLM using SSE
		const stream = await chatRAGStream(product.name, message, context);

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'X-Accel-Buffering': 'no' // Prevent Nginx from buffering stream
			}
		});
	} catch (err: any) {
		console.error('Error in chat API endpoint:', err);
		throw error(500, err.message || 'Lỗi xử lý chatbot AI');
	}
};
