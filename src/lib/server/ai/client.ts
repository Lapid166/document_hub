import { env } from '$env/dynamic/private';
import { readNineRouterDb } from './nineRouter';

export interface GeneratedContent {
	detailedDescription: string;
	guides: { title: string; content: string }[];
	faqs: { question: string; answer: string }[];
}

/**
 * Calls LLM to generate description, guides and FAQs from raw document contents.
 * Fallbacks to a simulated response if API key is not configured.
 */
export async function generateProductContent(
	productName: string,
	layoutType: string,
	documentsContent: string
): Promise<GeneratedContent> {
	const apiKey = env.OPENAI_API_KEY;

	if (!apiKey) {
		// Simulated fallback RAG response for offline/dev testing
		return {
			detailedDescription: `### Giới thiệu về ${productName}
Đây là tài liệu được phân tích tự động bằng AI từ tài liệu thô. ${productName} cung cấp các tính năng tối ưu hỗ trợ người dùng theo chuẩn giao diện ${layoutType}.

#### Các tính năng cốt lõi:
- **Tích hợp nhanh chóng**: Cấu hình và hoạt động chỉ trong vài bước đơn giản.
- **Tối ưu hóa hiệu năng**: Trải nghiệm mượt mà, tải nhanh và tiết kiệm tài nguyên hệ thống.
- **An toàn & Bảo mật**: Tuân thủ tuyệt đối các chuẩn bảo mật hiện hành.`,
			guides: [
				{
					title: 'Bước 1: Chuẩn bị cài đặt',
					content: `Đảm bảo hệ thống của bạn đáp ứng các yêu cầu tối thiểu của bố cục ${layoutType}. Tải file nguồn về máy tính.`
				},
				{
					title: 'Bước 2: Cấu hình và Chạy thử',
					content: `Giải nén (nếu có) hoặc tải tài liệu lên trang cấu hình admin. Tiến hành chạy thử nghiệm và kiểm tra log.`
				}
			],
			faqs: [
				{
					question: `Sản phẩm ${productName} này có miễn phí không?`,
					answer: 'Phiên bản này được cung cấp theo giấy phép chuẩn của doanh nghiệp, vui lòng kiểm tra tệp LICENSE đi kèm để biết thêm chi tiết.'
				},
				{
					question: 'Làm thế nào để cập nhật phiên bản mới?',
					answer: 'Bạn chỉ cần tải tài liệu thô của phiên bản mới lên mục Quản lý Phiên bản, hệ thống sẽ tự động đồng bộ hóa cơ sở dữ liệu vector.'
				}
			]
		};
	}

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				response_format: { type: 'json_object' },
				messages: [
					{
						role: 'system',
						content: `You are the Content Creator Agent. Analyze the raw upload documents of technical software.
Automatically draft a standardized, human-friendly summary including:
- detailedDescription (string in markdown formatting)
- guides (array of objects with "title" and "content")
- faqs (array of objects with "question" and "answer")

You must respond with a valid JSON object matching this schema:
{
  "detailedDescription": "markdown text",
  "guides": [{"title": "step title", "content": "step details"}],
  "faqs": [{"question": "faq question", "answer": "faq answer"}]
}
Keep tone professional.`
					},
					{
						role: 'user',
						content: `Product Name: ${productName}\nLayout Type: ${layoutType}\nRaw Documents Content:\n${documentsContent}`
					}
				],
				temperature: 0.3
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenAI API error: ${errorText}`);
		}

		const data = await response.json();
		const resultJson = JSON.parse(data.choices[0].message.content);
		return {
			detailedDescription: resultJson.detailedDescription || '',
			guides: resultJson.guides || [],
			faqs: resultJson.faqs || []
		};
	} catch (e: any) {
		console.error('LLM Content Generation failed:', e);
		throw e;
	}
}

/**
 * Generates automated changelog by comparing new raw content with old raw content.
 */
export async function generateChangelog(
	oldDocs: string,
	newDocs: string
): Promise<string> {
	const apiKey = env.OPENAI_API_KEY;

	if (!apiKey) {
		return `- Nâng cấp và cải tiến các chức năng cốt lõi.
- Tối ưu hóa hiệu suất cơ sở dữ liệu vector RAG.
- Sửa lỗi tương thích hiển thị giao diện người dùng.`;
	}

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: 'You analyze document updates. Read the raw text of the previous version and the new version. Draft an automated changelog highlighting additions, modifications, and deletions in a concise bullet-point list.'
					},
					{
						role: 'user',
						content: `PREVIOUS VERSION DOCUMENTS:\n${oldDocs}\n\nNEW VERSION DOCUMENTS:\n${newDocs}`
					}
				],
				temperature: 0.2
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenAI API error: ${errorText}`);
		}

		const data = await response.json();
		return data.choices[0].message.content || '';
	} catch (e) {
		console.error('LLM Changelog Generation failed:', e);
		return 'Không thể tự sinh changelog do lỗi API AI.';
	}
}

/**
 * RAG Chat Stream SSE completion. Streams response word-by-word.
 */
export async function chatRAGStream(
	productName: string,
	query: string,
	context: string
): Promise<ReadableStream> {
	let apiKey = '';
	let baseURL = 'https://api.openai.com/v1';
	let modelName = 'gpt-4o-mini';

	try {
		const dbData = await readNineRouterDb();
		const activeConn = dbData.providerConnections.find((c: any) => c.isActive);
		if (activeConn) {
			apiKey = activeConn.apiKey || '';
			baseURL = activeConn.baseURL || 'https://api.openai.com/v1';
			const rawModel = dbData.modelAliases['fast-model'] || 'gpt-4o-mini';
			modelName = rawModel;
		}
	} catch (e) {
		console.warn('Failed to load 9Router config in chatRAGStream, falling back to env keys.', e);
	}

	if (!apiKey) {
		apiKey = env.OPENAI_API_KEY || '';
	}

	let cleanBaseURL = baseURL.replace(/\/+$/, '');

	if (!apiKey) {
		const words = `Tôi là trợ lý AI chuyên biệt của **${productName}**. Dựa vào tài liệu của sản phẩm, tôi xin phép trả lời câu hỏi của bạn:\n\n${
			context 
				? `Dữ liệu tham chiếu tìm thấy:\n${context.substring(0, 200)}...\n\nĐây là câu trả lời mô phỏng do hệ thống chưa cấu hình API Key của nhà cung cấp trong AI Console.` 
				: 'Tôi xin lỗi, câu hỏi nằm ngoài phạm vi tài liệu hướng dẫn của công cụ này.'
		}`.split(' ');

		return new ReadableStream({
			async start(controller) {
				const encoder = new TextEncoder();
				for (const word of words) {
					controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`));
					await new Promise((resolve) => setTimeout(resolve, 80));
				}
				controller.enqueue(encoder.encode('data: [DONE]\n\n'));
				controller.close();
			}
		});
	}

	try {
		const response = await fetch(`${cleanBaseURL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: modelName,
				stream: true,
				messages: [
					{
						role: 'system',
						content: `Role: You are a strict technical support assistant for ${productName}.
Context: ${context}

Strict Rules:
1. Answer the user's question ONLY using the facts directly stated in the Context above.
2. If the answer cannot be derived with 100% certainty from the Context, or if the question is unrelated to the product, you MUST reply exactly with: "Tôi xin lỗi, câu hỏi nằm ngoài phạm vi tài liệu hướng dẫn của công cụ này."
3. Do not assume, extrapolate, or combine external knowledge.
4. Keep the answer concise, technical and in Vietnamese.`
					},
					{
						role: 'user',
						content: query
					}
				],
				temperature: 0.0
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenAI Chat completions stream failed: ${errorText}`);
		}

		return new ReadableStream({
			async start(controller) {
				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				const encoder = new TextEncoder();
				if (!reader) {
					controller.close();
					return;
				}

				let buffer = '';
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split('\n');
						buffer = lines.pop() || '';

						for (const line of lines) {
							const cleanLine = line.trim();
							if (!cleanLine) continue;
							if (cleanLine.startsWith('data: ')) {
								const dataStr = cleanLine.slice(6);
								if (dataStr === '[DONE]') {
									controller.enqueue(encoder.encode('data: [DONE]\n\n'));
									continue;
								}
								try {
									const parsed = JSON.parse(dataStr);
									const text = parsed.choices[0].delta.content || '';
									if (text) {
										controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
									}
								} catch (err) {
									// Ignore parsing errors of incomplete JSON lines
								}
							}
						}
					}
				} catch (e) {
					console.error('Error during LLM stream reading:', e);
				} finally {
					controller.close();
				}
			}
		});
	} catch (e) {
		console.error('Failed to query OpenAI Stream:', e);
		throw e;
	}
}

/**
 * Generates content for a single specific section of a product.
 */
export async function generateSectionContent(
	fieldName: 'detailedDescription' | 'guides' | 'faqs' | 'changelog',
	productName: string,
	layoutType: string,
	rawContent: string,
	currentContent?: string
): Promise<string> {
	const apiKey = env.OPENAI_API_KEY;

	if (!apiKey) {
		// Mock generated content based on field type
		if (fieldName === 'detailedDescription') {
			return `### Mô Tả Chi Tiết: ${productName} (AI Generated)
Đây là tài liệu chi tiết được tổng hợp tự động dựa trên tài liệu thô bạn cung cấp.

#### Thông tin thô tham khảo:
> ${rawContent.substring(0, 300)}...

#### Cấu trúc hoạt động:
1. **Khởi chạy ban đầu**: Đọc cấu hình theo bố cục loại \`${layoutType}\`.
2. **Xử lý dữ liệu**: Tối ưu hóa hóa luồng hoạt động.
3. **Kết xuất đầu ra**: Đảm bảo phản hồi nhanh chóng.
${currentContent ? `\n*Nội dung trước đó cũng đã được xem xét và tích hợp.*` : ''}`;
		} else if (fieldName === 'guides') {
			return JSON.stringify([
				{
					title: `Hướng dẫn cài đặt ${productName} (Bước 1)`,
					content: `Dựa vào tài liệu thô: "${rawContent.substring(0, 100)}...", tiến hành chuẩn bị môi trường chạy phù hợp.`
				},
				{
					title: 'Bước 2: Cấu hình tham số',
					content: 'Điền các trường thông số kỹ thuật cần thiết trong tab Thông số trước khi kích hoạt chính thức.'
				}
			]);
		} else if (fieldName === 'faqs') {
			return JSON.stringify([
				{
					question: `Làm sao để tích hợp ${productName}?`,
					answer: `Bạn chỉ cần làm theo hướng dẫn các bước hoặc tham khảo văn bản thô: "${rawContent.substring(0, 100)}..."`
				},
				{
					question: 'Hệ thống có tự phục hồi lỗi không?',
					answer: 'Có, các tác vụ chạy nền được bảo vệ và có cơ chế thử lại tự động khi gặp sự cố đột ngột.'
				}
			]);
		} else { // changelog
			return `- **Nâng cấp AI**: Tích hợp trợ lý AI cục bộ cho từng phân mục.
- **Tái cấu trúc UX**: Chuyển đổi giao diện đăng sản phẩm sang dạng tab.
- **Thông tin thô**: Đã xử lý bản cập nhật từ tài liệu: "${rawContent.substring(0, 100)}..."`;
		}
	}

	let systemPrompt = '';
	let responseFormat: any = undefined;

	if (fieldName === 'detailedDescription') {
		systemPrompt = `You are an AI assistant helping a software editor write a detailed description in markdown format for the product named "${productName}".
Analyze the raw user input document. Write a clear, comprehensive, and professional markdown description.
If current content is provided, merge and refine it with the new raw input instead of discarding it.
Return only the markdown text.`;
	} else if (fieldName === 'guides') {
		systemPrompt = `You are an AI assistant helping a software editor write step-by-step guides for the product named "${productName}".
Analyze the raw user input document. Generate a JSON array of guide steps: [{"title": "step title", "content": "step description"}].
If current guides are provided (in JSON), refine or extend them with the new raw input.
Return ONLY a valid JSON array matching the schema: [{"title": "string", "content": "string"}].`;
		responseFormat = { type: 'json_object' };
	} else if (fieldName === 'faqs') {
		systemPrompt = `You are an AI assistant helping a software editor write FAQ questions and answers for the product named "${productName}".
Analyze the raw user input document. Generate a JSON array of FAQs: [{"question": "faq question", "answer": "faq answer"}].
If current FAQs are provided (in JSON), refine or extend them with the new raw input.
Return ONLY a valid JSON array matching the schema: [{"question": "string", "answer": "string"}].`;
		responseFormat = { type: 'json_object' };
	} else { // changelog
		systemPrompt = `You are an AI assistant helping a software editor write a release changelog list for a new version of "${productName}".
Analyze the raw user input (such as commit logs, git diffs, or raw notes). Write a bulleted list outlining modifications, additions, and bug fixes.
Return only the bulleted markdown text list.`;
	}

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				response_format: responseFormat,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: `Raw Input Document:\n${rawContent}\n\n${currentContent ? `Current Content:\n${currentContent}` : ''}` }
				],
				temperature: 0.3
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenAI API error: ${errorText}`);
		}

		const data = await response.json();
		return data.choices[0].message.content || '';
	} catch (e: any) {
		console.error('generateSectionContent failed:', e);
		throw e;
	}
}
