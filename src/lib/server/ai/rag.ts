import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/client';
import { products, productDocuments, productKnowledgeVectors } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Generates OpenAI embedding vector (1536 dimensions) for a given text.
 * Fallbacks to a mock vector if API key is not configured.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	const apiKey = env.OPENAI_API_KEY;

	if (!apiKey) {
		// Mock 1536-dimension vector for offline testing
		const mockVector = new Array(1536).fill(0);
		// Simple hash function to generate deterministic values based on text for pseudo-matching
		let hash = 0;
		for (let i = 0; i < text.length; i++) {
			hash = text.charCodeAt(i) + ((hash << 5) - hash);
		}
		for (let i = 0; i < 10; i++) {
			mockVector[i] = Math.abs((hash + i) % 100) / 100;
		}
		return mockVector;
	}

	try {
		const response = await fetch('https://api.openai.com/v1/embeddings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'text-embedding-3-small',
				input: text
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenAI Embeddings API failed: ${errorText}`);
		}

		const data = await response.json();
		return data.data[0].embedding;
	} catch (e) {
		console.error('Failed to generate embedding:', e);
		throw e;
	}
}

/**
 * Semantic chunking of text with overlap.
 */
export function chunkText(text: string, chunkSize = 600, overlap = 80): string[] {
	if (!text) return [];
	const chunks: string[] = [];
	let index = 0;

	while (index < text.length) {
		const end = Math.min(index + chunkSize, text.length);
		let chunk = text.substring(index, end);
		chunks.push(chunk);

		if (end === text.length) break;
		index += chunkSize - overlap;
	}

	return chunks;
}

/**
 * Syncs a product's knowledge vectors by reading all approved descriptions,
 * guides, faqs, and uploaded raw documents, chunking them, and writing embeddings to DB.
 */
export async function syncProductKnowledge(productId: string): Promise<void> {
	// 1. Fetch product
	const [product] = await db
		.select()
		.from(products)
		.where(eq(products.id, productId))
		.limit(1);

	if (!product) return;

	// 2. Clear old knowledge vectors
	await db.delete(productKnowledgeVectors).where(eq(productKnowledgeVectors.productId, productId));

	const chunksToEmbed: { content: string; metadata: any }[] = [];

	// 3. Chunk & embed detailedDescription
	if (product.detailedDescription) {
		const descChunks = chunkText(product.detailedDescription);
		descChunks.forEach((chunk, index) => {
			chunksToEmbed.push({
				content: chunk,
				metadata: { source: 'description', index }
			});
		});
	}

	// 4. Chunk & embed Guides
	const guides = (product.guides || []) as { title: string; content: string }[];
	guides.forEach((g, index) => {
		const text = `Hướng Dẫn > ${g.title}:\n${g.content}`;
		chunksToEmbed.push({
			content: text,
			metadata: { source: 'guide', index, title: g.title }
		});
	});

	// 5. Chunk & embed FAQs
	const faqs = (product.faqs || []) as { question: string; answer: string }[];
	faqs.forEach((faq, index) => {
		const text = `Câu Hỏi FAQ:\nHỏi: ${faq.question}\nTrả lời: ${faq.answer}`;
		chunksToEmbed.push({
			content: text,
			metadata: { source: 'faq', index, question: faq.question }
		});
	});

	// 6. Chunk & embed Uploaded Raw Documents
	const docs = await db
		.select()
		.from(productDocuments)
		.where(eq(productDocuments.productId, productId));

	for (const doc of docs) {
		if (doc.rawContent) {
			const docChunks = chunkText(doc.rawContent, 800, 100);
			docChunks.forEach((chunk, index) => {
				chunksToEmbed.push({
					content: chunk,
					metadata: { source: 'raw_document', fileName: doc.fileName, docId: doc.id, index }
				});
			});
		}
	}

	// 7. Generate embeddings and insert in batch
	for (const chunk of chunksToEmbed) {
		try {
			const vector = await generateEmbedding(chunk.content);
			await db.insert(productKnowledgeVectors).values({
				productId,
				content: chunk.content,
				embedding: vector,
				metadata: chunk.metadata
			});
		} catch (err) {
			console.error(`Error embedding chunk: ${chunk.content.substring(0, 30)}`, err);
		}
	}

	console.log(`Successfully synced ${chunksToEmbed.length} knowledge vectors for product ${productId}`);
}

/**
 * Queries the product's knowledge vectors using cosine distance similarity.
 * Returns a concatenated context string of top matching chunks.
 */
export async function querySimilarContext(
	productId: string,
	queryText: string,
	limit = 3,
	similarityThreshold = 0.65
): Promise<string> {
	try {
		// 1. Get embedding for the user query
		const queryVector = await generateEmbedding(queryText);

		// Convert queryVector to PostgreSQL string representation format '[val1, val2, ...]'
		const vectorStr = `[${queryVector.join(',')}]`;

		// 2. Query usingpgvector cosine distance <=> operator
		// In Drizzle, we execute custom SQL queries to search using <=> operator
		// Cosine Similarity = 1 - Cosine Distance. We want: 1 - (embedding <=> queryVector) >= threshold
		const results = await db.execute(sql`
			SELECT content, metadata, (1 - (embedding <=> ${vectorStr}::vector)) as similarity
			FROM product_knowledge_vectors
			WHERE product_id = ${productId}::uuid
			AND (1 - (embedding <=> ${vectorStr}::vector)) >= ${similarityThreshold}
			ORDER BY embedding <=> ${vectorStr}::vector
			LIMIT ${limit};
		`);

		if (!results || results.length === 0) {
			return '';
		}

		// Concatenate matching chunks to form the RAG context
		const context = results
			.map((row: any) => `[Nguồn: ${row.metadata?.source || 'Tài liệu'}]\n${row.content}`)
			.join('\n\n---\n\n');

		return context;
	} catch (e) {
		console.error('Vector query search failed:', e);
		return '';
	}
}
