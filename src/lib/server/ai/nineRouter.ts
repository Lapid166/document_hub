import fs from 'fs/promises';
import path from 'path';
import { env } from '$env/dynamic/private';

// Resolve NINE_ROUTER_DB_PATH from env, default to local directory if not set
export function getNineRouterDbPath() {
	return env.NINE_ROUTER_DB_PATH || path.join(process.cwd(), 'db/9router.json');
}

// Default template for db.json containing OpenCode Demo connection
const DEFAULT_DB_JSON = {
	providerConnections: [
		{
			id: 'opencode-demo-connection',
			provider: 'opencode',
			apiKey: 'sk-fPJPzWaLC6doPyRTclW9j34DBIZX6UQYwA8xIus4NQiqmskh6XA8wQKHeXquPKsF',
			authType: 'api_key',
			label: 'OpenCode Demo Gateway',
			baseURL: 'https://opencode.ai/zen/v1',
			isActive: true
		}
	],
	modelAliases: {
		'fast-model': 'gemini-1.5-flash',
		'smart-model': 'claude-3-5-sonnet',
		'code-model': 'deepseek-coder'
	},
	providerNodes: [],
	apiKeys: [],
	combos: [],
	settings: {
		defaultModel: 'fast-model'
	},
	pricing: {}
};

/**
 * Safely reads the 9router configuration file.
 * Automatically initializes with default OpenCode settings if file doesn't exist.
 */
export async function readNineRouterDb() {
	const dbPath = getNineRouterDbPath();
	try {
		const data = await fs.readFile(dbPath, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		// File does not exist, initialize it
		await writeNineRouterDb(DEFAULT_DB_JSON);
		return JSON.parse(JSON.stringify(DEFAULT_DB_JSON));
	}
}

/**
 * Writes the configuration data to the 9router db.json file.
 */
export async function writeNineRouterDb(data: any) {
	const dbPath = getNineRouterDbPath();
	try {
		await fs.mkdir(path.dirname(dbPath), { recursive: true });
		await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
	} catch (error: any) {
		console.error('Failed to write 9router db.json:', error);
		throw new Error(`Cannot write 9router db.json: ${error.message}`);
	}
}

/**
 * Calls the 9Router Completion API.
 * Maps custom parameters and handles standard JSON responses.
 */
export async function callNineRouter(
	messages: { role: string; content: string }[],
	model: string,
	temperature = 0.7,
	maxTokens = 2048
) {
	const apiUrl = env.NINE_ROUTER_API_URL || 'http://localhost:20128';
	const apiKey = env.NINE_ROUTER_API_KEY || '';

	try {
		const response = await fetch(`${apiUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
			},
			body: JSON.stringify({
				model,
				messages,
				temperature,
				max_tokens: maxTokens
			})
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`9Router API returned status ${response.status}: ${errText}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error('Error calling 9Router completions:', error);
		throw error;
	}
}

/**
 * Returns a readable stream directly forwarding the SSE stream from 9Router.
 */
export async function streamNineRouter(
	messages: { role: string; content: string }[],
	model: string,
	temperature = 0.7,
	maxTokens = 2048
) {
	const apiUrl = env.NINE_ROUTER_API_URL || 'http://localhost:20128';
	const apiKey = env.NINE_ROUTER_API_KEY || '';

	try {
		const response = await fetch(`${apiUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
			},
			body: JSON.stringify({
				model,
				messages,
				temperature,
				max_tokens: maxTokens,
				stream: true
			})
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`9Router Stream API returned status ${response.status}: ${errText}`);
		}

		return response.body; // Returns the ReadableStream
	} catch (error: any) {
		console.error('Error streaming from 9Router:', error);
		throw error;
	}
}
