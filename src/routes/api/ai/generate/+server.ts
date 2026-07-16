import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { aiPrompts, aiPromptMappings } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { callNineRouter } from '$lib/server/ai/nineRouter';
import crypto from 'crypto';

// In-memory rate limiting and budget tracking (reset on server restart)
const guestUsageMap = new Map<string, { count: number; lastReset: string }>();
const userUsageMap = new Map<string, { count: number; lastReset: string }>();
const budgetUsageMap = new Map<string, { cost: number; lastReset: string }>();

// PoW verification helper
function verifyPoW(fingerprint: string, nonce: string, difficulty = '000') {
	const currentHour = new Date().toISOString().slice(0, 13); // changes hourly
	const challenge = `${fingerprint}-${currentHour}`;
	const hash = crypto.createHash('sha256').update(challenge + nonce).digest('hex');
	return hash.startsWith(difficulty);
}

export const POST: RequestHandler = async (event) => {
	try {
		const body = await event.request.json();
		const { productId, featureCode, inputData, powNonce, canvasFingerprint } = body;

		if (!featureCode || !canvasFingerprint) {
			return json({ success: false, error: 'Thiếu thông tin bắt buộc (featureCode, canvasFingerprint)' }, { status: 400 });
		}

		const orgId = event.locals.user?.organizationId || 'd8132d0b-b8aa-4a9e-9d18-fd6ecef01b32'; // fallback to default org if guest
		const user = event.locals.user;

		// 1. Find prompt mapping
		// First check for product-specific override
		let [mapping] = await db
			.select()
			.from(aiPromptMappings)
			.where(
				and(
					eq(aiPromptMappings.featureCode, featureCode),
					eq(aiPromptMappings.productId, productId || ''),
					eq(aiPromptMappings.organizationId, orgId),
					eq(aiPromptMappings.isActive, true)
				)
			)
			.limit(1);

		// If not found, check global default mapping (productId is null)
		if (!mapping) {
			const rows = await db
				.select()
				.from(aiPromptMappings)
				.where(
					and(
						eq(aiPromptMappings.featureCode, featureCode),
						eq(aiPromptMappings.organizationId, orgId),
						eq(aiPromptMappings.isActive, true)
					)
				);
			mapping = rows.find(r => !r.productId) as any;
		}

		if (!mapping) {
			return json({ success: false, error: `Chức năng AI cho '${featureCode}' chưa được cấu hình hoặc kích hoạt.` }, { status: 404 });
		}

		// 2. Security Check: Client PoW verification
		if (mapping.enablePow) {
			if (!powNonce || !verifyPoW(canvasFingerprint, powNonce)) {
				return json({ success: false, error: 'Xác minh Proof of Work (chống spam) thất bại hoặc không hợp lệ.' }, { status: 403 });
			}
		}

		// 3. Rate Limit / Quota check
		const today = new Date().toISOString().slice(0, 10);
		if (user) {
			// Registered User Quota
			const userLimit = mapping.userDailyQuota ?? 50;
			const record = userUsageMap.get(user.id) || { count: 0, lastReset: today };
			if (record.lastReset !== today) {
				record.count = 0;
				record.lastReset = today;
			}
			if (record.count >= userLimit) {
				return json({ success: false, error: `Hạn mức sử dụng AI của tài khoản đã hết (${userLimit} câu/ngày).` }, { status: 429 });
			}
			record.count++;
			userUsageMap.set(user.id, record);
		} else {
			// Guest Device Quota (fingerprint-based)
			const guestLimit = mapping.guestDailyQuota ?? 10;
			const record = guestUsageMap.get(canvasFingerprint) || { count: 0, lastReset: today };
			if (record.lastReset !== today) {
				record.count = 0;
				record.lastReset = today;
			}
			if (record.count >= guestLimit) {
				return json({ success: false, error: `Thiết bị của bạn đã đạt giới hạn câu hỏi miễn phí trong ngày (${guestLimit} câu/ngày).` }, { status: 429 });
			}
			record.count++;
			guestUsageMap.set(canvasFingerprint, record);
		}

		// 4. Circuit Breaker / USD Daily Budget check
		const budgetLimit = mapping.dailyTokenBudget ?? 5.0;
		const budgetRecord = budgetUsageMap.get(featureCode) || { cost: 0.0, lastReset: today };
		if (budgetRecord.lastReset !== today) {
			budgetRecord.cost = 0.0;
			budgetRecord.lastReset = today;
		}
		if (budgetRecord.cost >= budgetLimit) {
			return json({ success: false, error: 'Hạn mức chi phí AI của tính năng này trong ngày đã cạn. Chatbot tạm ngưng bảo trì.' }, { status: 503 });
		}

		// 5. Retrieve Prompt system instructions
		const [prompt] = await db
			.select()
			.from(aiPrompts)
			.where(and(eq(aiPrompts.id, mapping.promptId), eq(aiPrompts.organizationId, orgId)))
			.limit(1);

		if (!prompt) {
			return json({ success: false, error: 'Không tìm thấy cấu hình Prompt hệ thống.' }, { status: 500 });
		}

		// 6. Call 9Router Completion API
		const messages = [
			{ role: 'system', content: prompt.systemPrompt },
			{ role: 'user', content: `Sinh nội dung cho tính năng '${featureCode}' với thông tin đầu vào sau:\n${JSON.stringify(inputData)}` }
		];

		const aiResponse = await callNineRouter(
			messages,
			prompt.modelAlias,
			prompt.temperature ?? 0.7,
			prompt.maxTokens ?? 2048
		);

		if (!aiResponse || !aiResponse.choices || aiResponse.choices.length === 0) {
			throw new Error('Mẫu phản hồi AI từ 9Router không hợp lệ');
		}

		// 7. Update Daily Cost Budget
		const inputTokens = aiResponse.usage?.prompt_tokens || 0;
		const outputTokens = aiResponse.usage?.completion_tokens || 0;
		// rough estimate cost for open models in 9router
		const cost = (inputTokens * 0.0015 + outputTokens * 0.002) / 1000;
		budgetRecord.cost += cost;
		budgetUsageMap.set(featureCode, budgetRecord);

		const resultText = aiResponse.choices[0].message.content;

		return json({
			success: true,
			text: resultText,
			usage: {
				inputTokens,
				outputTokens,
				cost
			}
		});

	} catch (error: any) {
		console.error('API /api/ai/generate error:', error);
		return json({ success: false, error: error.message || 'Lỗi xử lý sinh nội dung AI' }, { status: 500 });
	}
};
