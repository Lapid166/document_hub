<script lang="ts">
	let { data } = $props();
	const initialProducts = data.products;

	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import { invalidateAll } from '$app/navigation';

	// Toast System Alert
	let toast = $state({ show: false, text: '', type: 'success' as 'success' | 'info' | 'error' });
	function triggerToast(text: string, type: 'success' | 'info' | 'error' = 'success') {
		toast.text = text;
		toast.type = type;
		toast.show = true;
		setTimeout(() => {
			toast.show = false;
		}, 3000);
	}

	let adminProducts = $state<any[]>([...initialProducts]);

	let agents = $state([
		{
			id: 'orchestrator',
			name: 'Orchestrator Agent',
			role: 'Điều phối & Intent Classifier',
			status: 'active',
			model: 'gpt-4o',
			temperature: 0.1,
			draftPending: false,
			systemPrompt:
				"You are the central Orchestrator Agent. Analyze the user's incoming request or query and classify their intent (Q&A, designer SVG request, changelog diff check). Dynamically route the input context to the appropriate downstream agent."
		},
		{
			id: 'creator',
			name: 'Content Creator Agent',
			role: 'Sinh tài liệu thô & Intro/FAQs',
			status: 'active',
			model: 'gpt-4o',
			temperature: 0.3,
			draftPending: false,
			systemPrompt:
				'You are the Content Creator Agent. Analyze the raw upload documents of technical software. Automatically draft a standardized, human-friendly summary including: Introduction, Step-by-Step Installation Guides, and typical FAQs. Keep tone professional.'
		},
		{
			id: 'qa',
			name: 'QA/RAG Agent',
			role: 'Trợ lý Hỏi/Đáp QA Streaming',
			status: 'active',
			model: 'gpt-4o-mini',
			temperature: 0.0,
			draftPending: false,
			systemPrompt:
				'Role: You are a strict technical support assistant for [Tool_Name].\nContext: {Provided_Knowledge_Base_From_MCP_Server}\n\nStrict Rules:\n1. Answer the user\'s question ONLY using the facts directly stated in the Context above.\n2. If the answer cannot be derived with 100% certainty from the Context, reply exactly with: "Tôi xin lỗi, câu hỏi nằm ngoài phạm vi tài liệu hướng dẫn của công cụ này."\n3. Do not assume, extrapolate, or combine external knowledge.'
		},
		{
			id: 'designer',
			name: 'Designer Agent',
			role: 'Sinh Vector Icon SVG tự động',
			status: 'active',
			model: 'gpt-4o',
			temperature: 0.4,
			draftPending: false,
			systemPrompt:
				'Role: Professional UI/UX Vector Graphic Expert.\nTask: Generate a modern, minimalistic SVG icon based on the tool description.\n\nOutput Format Constraint:\nReturn ONLY valid, raw SVG code inside a single markdown code block. No explanations, no conversation, no HTML wraps.'
		},
		{
			id: 'seo',
			name: 'SEO Agent',
			role: 'Sinh Meta tag & JSON-LD SEO',
			status: 'active',
			model: 'gpt-4o-mini',
			temperature: 0.2,
			draftPending: false,
			systemPrompt:
				'Read the human-approved tool content. Generate optimized search metadata complying with Google standards: Meta Title (<=60 chars), Meta Description (<=160 chars), and structured schema.org JSON-LD tag.'
		},
		{
			id: 'changelog',
			name: 'Changelog Agent',
			role: 'Phân tích chênh lệch & Diff',
			status: 'active',
			model: 'gpt-4o',
			temperature: 0.1,
			draftPending: false,
			systemPrompt:
				'You analyze document updates. Read the raw text of the previous version and the new version. Draft an automated changelog highlighting additions, modifications, and deletions in a concise bullet-point list.'
		},
		{
			id: 'knowledge',
			name: 'Knowledge Refresh Agent',
			role: 'Chunking & Đồng bộ Vector DB',
			status: 'active',
			model: 'text-embedding-3-small',
			temperature: 0.0,
			draftPending: false,
			systemPrompt:
				'Receive newly published documents. Perform structural markdown parsing (by headings, lists, codeblocks) with 10-15% overlap. Create vector embeddings and push to pgvector namespace using tools.'
		}
	]);

	let activeAssistants = $derived(agents.filter((a) => a.status === 'active').length);
	let pendingAgents = $derived(agents.filter((a) => a.draftPending));

	// Prompt editor state variables
	let selectedAgent = $state<(typeof agents)[0] | null>(null);
	let editedPrompt = $state('');
	let selectedModel = $state('gpt-4o-mini');
	let editedTemp = $state(0.2);
	let isPromptModalOpen = $state(false);

	// Track drafts separately to satisfy "Draft-First" approval logic
	let promptDrafts = $state<{ [agentId: string]: { prompt: string; model: string; temp: number } }>(
		{}
	);

	function openEditPromptModal(agent: (typeof agents)[0]) {
		selectedAgent = agent;
		const draft = promptDrafts[agent.id];
		editedPrompt = draft ? draft.prompt : agent.systemPrompt;
		selectedModel = draft ? draft.model : agent.model;
		editedTemp = draft ? draft.temp : agent.temperature;
		isPromptModalOpen = true;
	}

	function savePromptDraft() {
		if (!selectedAgent) return;
		promptDrafts[selectedAgent.id] = {
			prompt: editedPrompt,
			model: selectedModel,
			temp: editedTemp
		};
		// Mark agent as having a pending draft
		agents = agents.map((a) => (a.id === selectedAgent!.id ? { ...a, draftPending: true } : a));
		triggerToast('Đã tạo đề xuất nháp thành công. Vui lòng phê duyệt ở danh sách.', 'info');
		isPromptModalOpen = false;
	}

	function approvePrompt(agentId: string) {
		const draft = promptDrafts[agentId];
		if (!draft) return;
		agents = agents.map((a) =>
			a.id === agentId
				? {
						...a,
						systemPrompt: draft.prompt,
						model: draft.model,
						temperature: draft.temp,
						draftPending: false
					}
				: a
		);
		delete promptDrafts[agentId];
		const agent = agents.find((a) => a.id === agentId);
		triggerToast(`Đã áp dụng cấu hình mới cho ${agent?.name}`);
	}

	function rejectPrompt(agentId: string) {
		delete promptDrafts[agentId];
		agents = agents.map((a) => (a.id === agentId ? { ...a, draftPending: false } : a));
		const agent = agents.find((a) => a.id === agentId);
		triggerToast(`Đã huỷ bản đề xuất của ${agent?.name}`, 'info');
	}

	function toggleAgentStatus(agentId: string) {
		agents = agents.map((a) => {
			if (a.id === agentId) {
				const nextStatus = a.status === 'active' ? 'disabled' : 'active';
				return { ...a, status: nextStatus };
			}
			return a;
		});
		triggerToast('Cập nhật trạng thái Agent thành công');
	}

	// ==========================================
	// 9ROUTER & REAL PROMPT CONSOLE STATES
	// ==========================================
	let apiSubTab = $state('gateway'); // 'gateway' | 'prompts' | 'mappings'

	// 9Router connections & aliases loaded from db.json
	let providerConnections = $state(data.nineRouterDb?.providerConnections || []);
	let modelAliases = $state(data.nineRouterDb?.modelAliases || {});

	// Prompts and Mappings loaded from database
	let dbPrompts = $state(data.prompts || []);
	let dbPromptMappings = $state(data.promptMappings || []);

	$effect(() => {
		providerConnections = data.nineRouterDb?.providerConnections || [];
	});
	$effect(() => {
		modelAliases = data.nineRouterDb?.modelAliases || {};
	});
	$effect(() => {
		dbPrompts = data.prompts || [];
	});
	$effect(() => {
		dbPromptMappings = data.promptMappings || [];
	});


	// Modal states for 9Router
	let isConnectionModalOpen = $state(false);
	let connectionEditId = $state<string | null>(null);
	let connLabel = $state('');
	let connProvider = $state('opencode');
	let connApiKey = $state('');
	let connBaseURL = $state('');
	let connIsActive = $state(true);

	// Modal states for Prompts
	let isPromptEditorModalOpen = $state(false);
	let promptEditId = $state<string | null>(null);
	let promptName = $state('');
	let promptDescription = $state('');
	let promptSystem = $state('');
	let promptTemp = $state(0.7);
	let promptMaxTokens = $state(2048);
	let promptModelAlias = $state('smart-model');

	// Modal states for Mappings
	let isMappingModalOpen = $state(false);
	let mappingEditId = $state<string | null>(null);
	let mapFeatureCode = $state('product_short_desc');
	let mapPromptId = $state('');
	let mapProductId = $state('');
	let mapGuestQuota = $state(10);
	let mapUserQuota = $state(50);
	let mapEnablePow = $state(true);
	let mapEnableFingerprint = $state(true);
	let mapDailyBudget = $state(5.0);

	// 9Router CRUD Functions
	async function saveConnection() {
		let updatedConns = [...providerConnections];
		if (connectionEditId) {
			updatedConns = updatedConns.map((c: any) => c.id === connectionEditId ? {
				id: c.id,
				provider: connProvider,
				apiKey: connApiKey,
				authType: 'api_key',
				label: connLabel,
				baseURL: connBaseURL,
				isActive: connIsActive
			} : c);
		} else {
			updatedConns.push({
				id: 'conn-' + Date.now(),
				provider: connProvider,
				apiKey: connApiKey,
				authType: 'api_key',
				label: connLabel,
				baseURL: connBaseURL,
				isActive: connIsActive
			});
		}

		const formData = new FormData();
		formData.append('connectionsJson', JSON.stringify(updatedConns));
		const res = await fetch('?/updateNineRouterConfig', { method: 'POST', body: formData });
		if (res.ok) {
			providerConnections = updatedConns;
			triggerToast('Lưu kết nối thành công');
			isConnectionModalOpen = false;
		} else {
			triggerToast('Lỗi khi lưu kết nối', 'error');
		}
	}

	async function deleteConnection(id: string) {
		if (!confirm('Bạn có chắc chắn muốn xóa kết nối này?')) return;
		const updatedConns = providerConnections.filter((c: any) => c.id !== id);
		const formData = new FormData();
		formData.append('connectionsJson', JSON.stringify(updatedConns));
		const res = await fetch('?/updateNineRouterConfig', { method: 'POST', body: formData });
		if (res.ok) {
			providerConnections = updatedConns;
			triggerToast('Xóa kết nối thành công');
		} else {
			triggerToast('Lỗi khi xóa kết nối', 'error');
		}
	}

	async function toggleConnectionStatus(id: string) {
		const updatedConns = providerConnections.map((c: any) => c.id === id ? { ...c, isActive: !c.isActive } : c);
		const formData = new FormData();
		formData.append('connectionsJson', JSON.stringify(updatedConns));
		const res = await fetch('?/updateNineRouterConfig', { method: 'POST', body: formData });
		if (res.ok) {
			providerConnections = updatedConns;
			triggerToast('Cập nhật trạng thái kết nối thành công');
		} else {
			triggerToast('Lỗi khi cập nhật trạng thái', 'error');
		}
	}

	// Model Aliases functions
	let newAliasKey = $state('');
	let newAliasVal = $state('');
	async function saveModelAliases() {
		const formData = new FormData();
		formData.append('modelAliasesJson', JSON.stringify(modelAliases));
		const res = await fetch('?/updateNineRouterConfig', { method: 'POST', body: formData });
		if (res.ok) {
			triggerToast('Lưu Model Aliases thành công');
		} else {
			triggerToast('Lỗi khi lưu Model Aliases', 'error');
		}
	}

	let editingAliasKey = $state<string | null>(null);

	function addModelAlias() {
		if (!newAliasKey.trim() || !newAliasVal.trim()) return;
		
		const updated = { ...modelAliases };
		if (editingAliasKey && editingAliasKey !== newAliasKey.trim()) {
			delete updated[editingAliasKey];
		}
		updated[newAliasKey.trim()] = newAliasVal.trim();
		modelAliases = updated;
		
		newAliasKey = '';
		newAliasVal = '';
		editingAliasKey = null;
		saveModelAliases();
	}

	function startEditModelAlias(key: string) {
		editingAliasKey = key;
		newAliasKey = key;
		newAliasVal = modelAliases[key];
	}

	function cancelEditModelAlias() {
		editingAliasKey = null;
		newAliasKey = '';
		newAliasVal = '';
	}

	function removeModelAlias(key: string) {
		if (editingAliasKey === key) {
			cancelEditModelAlias();
		}
		const updated = { ...modelAliases };
		delete updated[key];
		modelAliases = updated;
		saveModelAliases();
	}

	// Prompts CRUD Functions
	async function savePrompt() {
		const formData = new FormData();
		if (promptEditId) formData.append('id', promptEditId);
		formData.append('name', promptName);
		formData.append('description', promptDescription);
		formData.append('systemPrompt', promptSystem);
		formData.append('temperature', promptTemp.toString());
		formData.append('maxTokens', promptMaxTokens.toString());
		formData.append('modelAlias', promptModelAlias);

		const res = await fetch('?/upsertPrompt', { method: 'POST', body: formData });
		if (res.ok) {
			triggerToast('Lưu Prompt thành công');
			isPromptEditorModalOpen = false;
			await invalidateAll();
		} else {
			triggerToast('Lỗi khi lưu Prompt', 'error');
		}
	}

	async function deletePrompt(id: string) {
		if (!confirm('Bạn có chắc chắn muốn xóa Prompt này?')) return;
		const formData = new FormData();
		formData.append('id', id);
		const res = await fetch('?/deletePrompt', { method: 'POST', body: formData });
		if (res.ok) {
			triggerToast('Xóa Prompt thành công');
			await invalidateAll();
		} else {
			triggerToast('Lỗi khi xóa Prompt', 'error');
		}
	}

	// Mappings CRUD Functions
	async function saveMapping() {
		const formData = new FormData();
		if (mappingEditId) formData.append('id', mappingEditId);
		formData.append('featureCode', mapFeatureCode);
		formData.append('promptId', mapPromptId);
		formData.append('productId', mapProductId);
		formData.append('guestDailyQuota', mapGuestQuota.toString());
		formData.append('userDailyQuota', mapUserQuota.toString());
		formData.append('enablePow', mapEnablePow.toString());
		formData.append('enableFingerprint', mapEnableFingerprint.toString());
		formData.append('dailyTokenBudget', mapDailyBudget.toString());

		const res = await fetch('?/savePromptMapping', { method: 'POST', body: formData });
		if (res.ok) {
			triggerToast('Lưu Ánh Xạ thành công');
			isMappingModalOpen = false;
			await invalidateAll();
		} else {
			triggerToast('Lỗi khi lưu Ánh Xạ', 'error');
		}
	}

	async function deleteMapping(id: string) {
		if (!confirm('Bạn có chắc chắn muốn xóa Ánh Xạ này?')) return;
		const formData = new FormData();
		formData.append('id', id);
		const res = await fetch('?/deletePromptMapping', { method: 'POST', body: formData });
		if (res.ok) {
			triggerToast('Xóa Ánh Xạ thành công');
			await invalidateAll();
		} else {
			triggerToast('Lỗi khi xóa Ánh Xạ', 'error');
		}
	}

	// Searchable Model Alias dropdown states
	let isModelAliasDropdownOpen = $state(false);
	let modelAliasSearchQuery = $state('');
	let filteredModelAliases = $derived.by(() => {
		const query = modelAliasSearchQuery.trim().toLowerCase();
		const keys = Object.keys(modelAliases);
		if (!query) return keys;
		return keys.filter(k => k.toLowerCase().includes(query));
	});

	function clickOutsideModelAlias(node: HTMLElement) {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
				isModelAliasDropdownOpen = false;
			}
		};
		document.addEventListener('click', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

</script>

<div class="flex flex-col gap-6 w-full animate-slide-in">
	<!-- Tab Navigation -->
	<div class="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/30 dark:border-zinc-800/60 pb-4">
		<div class="flex flex-col">
			<h2 class="text-base font-bold text-zinc-900 dark:text-white font-sans">
				Quản Trị Hệ Thống Trí Tuệ Nhân Tạo (AI Console)
			</h2>
			<p class="text-xs text-zinc-450 dark:text-zinc-550 font-sans">
				Cấu hình cổng kết nối 9Router Gateway, tinh chỉnh Prompts, thiết lập hạn ngạch & bảo mật
			</p>
		</div>
		<div class="flex gap-2 bg-zinc-100/60 dark:bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 font-sans">
			<button
				type="button"
				onclick={() => apiSubTab = 'gateway'}
				class="px-3.5 py-1.5 text-xs font-semibold rounded-lg zen-transition {apiSubTab === 'gateway' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}"
			>
				9Router Gateway
			</button>
			<button
				type="button"
				onclick={() => apiSubTab = 'prompts'}
				class="px-3.5 py-1.5 text-xs font-semibold rounded-lg zen-transition {apiSubTab === 'prompts' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}"
			>
				Quản lý Prompts
			</button>
			<button
				type="button"
				onclick={() => apiSubTab = 'mappings'}
				class="px-3.5 py-1.5 text-xs font-semibold rounded-lg zen-transition {apiSubTab === 'mappings' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}"
			>
				Ánh xạ & Bảo mật
			</button>
		</div>
	</div>

	<!-- SUBTAB 1: 9ROUTER GATEWAY -->
	{#if apiSubTab === 'gateway'}
		<div class="flex flex-col gap-6 w-full animate-slide-in">
			<!-- Provider Connections Card -->
			<Card hover={false} span="flex flex-col gap-4 p-6">
				<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
					<div>
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
							Danh sách kết nối nhà cung cấp (Connections)
						</h3>
						<p class="text-[11px] text-zinc-450 dark:text-zinc-550 mt-0.5 font-sans">
							Cấu hình API Key và base URL của các cổng AI dịch vụ (Lưu trực tiếp vào 9router db.json)
						</p>
					</div>
					<Button variant="primary" size="sm" onclick={() => {
						connectionEditId = null;
						connLabel = '';
						connProvider = 'opencode';
						connApiKey = '';
						connBaseURL = '';
						connIsActive = true;
						isConnectionModalOpen = true;
					}}>
						+ Thêm Kết Nối
					</Button>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs border-collapse">
						<thead>
							<tr class="border-b border-zinc-200/30 dark:border-zinc-800/40 text-zinc-400 font-sans">
								<th class="py-2.5 font-semibold">Tên hiển thị</th>
								<th class="py-2.5 font-semibold">Provider</th>
								<th class="py-2.5 font-semibold">Base URL</th>
								<th class="py-2.5 font-semibold">Trạng thái</th>
								<th class="py-2.5 font-semibold text-right">Thao tác</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-150/20 dark:divide-zinc-800/20 text-zinc-700 dark:text-zinc-350">
							{#if providerConnections.length === 0}
								<tr>
									<td colspan="5" class="py-4 text-center text-zinc-400 font-sans">Chưa cấu hình kết nối nào.</td>
								</tr>
							{:else}
								{#each providerConnections as conn}
									<tr class="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40">
										<td class="py-3 font-semibold text-zinc-900 dark:text-white font-sans">{conn.label || conn.provider}</td>
										<td class="py-3 font-mono text-[10px]"><Badge variant="neutral">{conn.provider}</Badge></td>
										<td class="py-3 font-mono text-[10px] text-zinc-400">{conn.baseURL || 'Mặc định'}</td>
										<td class="py-3">
											<button type="button" onclick={() => toggleConnectionStatus(conn.id)} class="cursor-pointer">
												<Badge variant={conn.isActive ? 'success' : 'neutral'}>
													{conn.isActive ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}
												</Badge>
											</button>
										</td>
										<td class="py-3 text-right">
											<div class="inline-flex gap-2 font-sans">
												<button type="button" onclick={() => {
													connectionEditId = conn.id;
													connLabel = conn.label || '';
													connProvider = conn.provider;
													connApiKey = conn.apiKey;
													connBaseURL = conn.baseURL || '';
													connIsActive = conn.isActive !== false;
													isConnectionModalOpen = true;
												}} class="text-emerald-500 hover:text-emerald-600 font-semibold cursor-pointer">Sửa</button>
												<button type="button" onclick={() => deleteConnection(conn.id)} class="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer">Xóa</button>
											</div>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</Card>

			<!-- Model Aliases Card -->
			<Card hover={false} span="flex flex-col gap-4 p-6">
				<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
					<div>
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
							Ánh xạ định danh mô hình (Model Aliases)
						</h3>
						<p class="text-[11px] text-zinc-450 dark:text-zinc-550 mt-0.5 font-sans">
							Định nghĩa tên mô hình rút gọn (alias) và ánh xạ tới dòng mô hình gốc của nhà cung cấp
						</p>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Form thêm / sửa nhanh -->
					<div class="flex flex-col gap-3 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30">
						<h4 class="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-sans">
							{editingAliasKey ? 'Cập nhật Model Alias' : 'Thêm Alias Mới'}
						</h4>
						<div class="flex flex-col gap-1">
							<label class="text-[10px] text-zinc-400 uppercase font-semibold font-sans">Tên Alias (Sử dụng trong Code/Assistant)</label>
							<Input id="new-alias-key" placeholder="Ví dụ: fast-model" bind:value={newAliasKey} />
						</div>
						<div class="flex flex-col gap-1">
							<label class="text-[10px] text-zinc-400 uppercase font-semibold font-sans">Tên Model gốc của Provider</label>
							<Input id="new-alias-val" placeholder="Ví dụ: gemini-1.5-flash hoặc claude-3-5-sonnet" bind:value={newAliasVal} />
						</div>
						<div class="flex justify-end gap-2 mt-1">
							{#if editingAliasKey}
								<Button variant="secondary" size="sm" onclick={cancelEditModelAlias}>
									Hủy
								</Button>
								<Button variant="primary" size="sm" onclick={addModelAlias}>
									Lưu Thay Đổi
								</Button>
							{:else}
								<Button variant="primary" size="sm" onclick={addModelAlias}>
									+ Thêm Alias
								</Button>
							{/if}
						</div>
					</div>

					<!-- Danh sách aliases -->
					<div class="flex flex-col gap-2">
						<h4 class="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-sans">Danh sách Aliases hiện tại</h4>
						<div class="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1 zen-scrollbar">
							{#if Object.keys(modelAliases).length === 0}
								<div class="text-xs text-zinc-400 text-center py-4 font-sans">Chưa định nghĩa alias nào.</div>
							{:else}
								{#each Object.entries(modelAliases) as [key, val]}
									<div class="flex items-center justify-between p-2.5 rounded-lg border border-zinc-150/40 bg-white dark:border-zinc-800 dark:bg-zinc-950 text-xs font-sans">
										<div class="flex flex-col">
											<span class="font-bold text-zinc-900 dark:text-white font-mono">{key}</span>
											<span class="text-[10px] text-zinc-450 font-mono mt-0.5">→ {val}</span>
										</div>
										<div class="flex gap-1.5">
											<button type="button" onclick={() => startEditModelAlias(key)} class="p-1 text-zinc-450 hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-all cursor-pointer">
												<span class="icon-[lucide--edit-3] h-4 w-4"></span>
											</button>
											<button type="button" onclick={() => removeModelAlias(key)} class="p-1 text-zinc-450 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all cursor-pointer">
												<span class="icon-[lucide--trash-2] h-4 w-4"></span>
											</button>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	<!-- SUBTAB 2: PROMPTS CRUD -->
	{#if apiSubTab === 'prompts'}
		<div class="flex flex-col gap-4 w-full animate-slide-in">
			<Card hover={false} span="flex flex-col gap-6 p-6">
				<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
					<div>
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
							Danh sách kho lưu trữ Prompt (System Prompts Library)
						</h3>
						<p class="text-[11px] text-zinc-450 dark:text-zinc-550 mt-0.5 font-sans">
							Quản lý nội dung hướng dẫn của hệ thống, nhiệt độ sinh và mô hình dự kiến cho từng Prompt
						</p>
					</div>
					<Button variant="primary" size="sm" onclick={() => {
						promptEditId = null;
						promptName = '';
						promptDescription = '';
						promptSystem = '';
						promptTemp = 0.7;
						promptMaxTokens = 2048;
						promptModelAlias = 'smart-model';
						isPromptEditorModalOpen = true;
					}}>
						+ Tạo Prompt Mới
					</Button>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#if dbPrompts.length === 0}
						<div class="col-span-full text-center py-8 text-zinc-400 text-xs font-sans">
							Chưa có prompt nào trong cơ sở dữ liệu. Nhấn nút "Tạo Prompt Mới" để bắt đầu.
						</div>
					{:else}
						{#each dbPrompts as prompt}
							<Card hover={false} span="flex flex-col gap-3 relative justify-between min-h-[220px]">
								<div class="flex flex-col gap-2">
									<div class="flex items-start justify-between">
										<div class="flex items-center gap-2">
											<span class="icon-[lucide--bot] h-5 w-5 text-emerald-500 shrink-0 font-sans"></span>
											<span class="text-xs font-bold text-zinc-900 dark:text-white leading-tight font-sans">{prompt.name}</span>
										</div>
										<Badge variant="neutral">{prompt.modelAlias}</Badge>
									</div>
									<p class="text-[11px] text-zinc-450 dark:text-zinc-550 line-clamp-2 font-sans">{prompt.description || 'Không có mô tả.'}</p>
									<div class="h-[1px] w-full bg-zinc-100 dark:bg-zinc-800 my-1"></div>
									<div class="flex flex-col gap-0.5">
										<span class="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 font-sans">System Prompt</span>
										<p class="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono line-clamp-3 bg-zinc-50/50 dark:bg-zinc-950/20 p-2 rounded border border-zinc-200/20 dark:border-zinc-850/40 whitespace-pre-wrap">{prompt.systemPrompt}</p>
									</div>
								</div>

								<div class="flex items-center justify-between text-[10px] border-t border-zinc-100 dark:border-zinc-800/60 pt-2 mt-1 font-sans">
									<span class="font-mono text-zinc-400">Temp: <b class="text-zinc-700 dark:text-zinc-300">{prompt.temperature}</b></span>
									<div class="flex gap-2">
										<button type="button" onclick={() => {
											promptEditId = prompt.id;
											promptName = prompt.name;
											promptDescription = prompt.description || '';
											promptSystem = prompt.systemPrompt;
											promptTemp = prompt.temperature || 0.7;
											promptMaxTokens = prompt.maxTokens || 2048;
											promptModelAlias = prompt.modelAlias;
											isPromptEditorModalOpen = true;
										}} class="text-emerald-500 hover:text-emerald-600 font-semibold cursor-pointer">Sửa</button>
										<button type="button" onclick={() => deletePrompt(prompt.id)} class="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer">Xóa</button>
									</div>
								</div>
							</Card>
						{/each}
					{/if}
				</div>
			</Card>
		</div>
	{/if}

	<!-- SUBTAB 3: PROMPT MAPPINGS & SECURITY LIMITS -->
	{#if apiSubTab === 'mappings'}
		<div class="flex flex-col gap-4 w-full animate-slide-in">
			<Card hover={false} span="flex flex-col gap-6 p-6">
				<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
					<div>
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
							Ánh xạ tác vụ & Cấu hình hạn ngạch Bảo mật (Prompt Mappings & Quotas)
						</h3>
						<p class="text-[11px] text-zinc-450 dark:text-zinc-550 mt-0.5 font-sans">
							Liên kết các nút chức năng AI trong hệ thống với các Prompt mẫu, đồng thời thiết lập giới hạn bảo mật, ngăn chặn spam
						</p>
					</div>
					<Button variant="primary" size="sm" onclick={() => {
						mappingEditId = null;
						mapFeatureCode = 'product_short_desc';
						mapPromptId = dbPrompts[0]?.id || '';
						mapProductId = '';
						mapGuestQuota = 10;
						mapUserQuota = 50;
						mapEnablePow = true;
						mapEnableFingerprint = true;
						mapDailyBudget = 5.0;
						isMappingModalOpen = true;
					}}>
						+ Tạo Ánh Xạ
					</Button>
				</div>

				<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
					{#if dbPromptMappings.length === 0}
						<div class="col-span-full text-center py-8 text-zinc-400 text-xs font-sans">
							Chưa có cấu hình ánh xạ nào. Hãy tạo ánh xạ để liên kết các nút chức năng AI.
						</div>
					{:else}
						{#each dbPromptMappings as mapping}
							{@const linkedPrompt = dbPrompts.find(p => p.id === mapping.promptId)}
							{@const linkedProduct = adminProducts.find(p => p.id === mapping.productId)}
							<Card hover={false} span="flex flex-col gap-4 p-5">
								<!-- Header -->
								<div class="flex items-start justify-between">
									<div class="flex flex-col">
										<span class="text-xs font-bold text-zinc-900 dark:text-white font-mono bg-zinc-100 dark:bg-zinc-850 px-2 py-1 rounded">
											{mapping.featureCode}
										</span>
										<span class="text-[10px] text-zinc-450 mt-1 font-sans">
											Phạm vi: {linkedProduct ? `Sản phẩm ${linkedProduct.name}` : 'Mặc định toàn cầu (Global)'}
										</span>
									</div>
									<div class="flex gap-2 font-sans">
										<button type="button" onclick={() => {
											mappingEditId = mapping.id;
											mapFeatureCode = mapping.featureCode;
											mapPromptId = mapping.promptId;
											mapProductId = mapping.productId || '';
											mapGuestQuota = mapping.guestDailyQuota ?? 10;
											mapUserQuota = mapping.userDailyQuota ?? 50;
											mapEnablePow = mapping.enablePow !== false;
											mapEnableFingerprint = mapping.enableFingerprint !== false;
											mapDailyBudget = mapping.dailyTokenBudget ?? 5.0;
											isMappingModalOpen = true;
										}} class="text-emerald-500 hover:text-emerald-600 text-xs font-semibold cursor-pointer">Sửa</button>
										<button type="button" onclick={() => deleteMapping(mapping.id)} class="text-rose-500 hover:text-rose-600 text-xs font-semibold cursor-pointer">Xóa</button>
									</div>
								</div>

								<!-- Linked Prompt Name -->
								<div class="flex items-center gap-2 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-150/40 dark:border-zinc-800">
									<span class="icon-[lucide--bot] h-4 w-4 text-emerald-500"></span>
									<span class="font-semibold font-sans text-zinc-500">Prompt kết nối:</span>
									<span class="text-zinc-700 dark:text-zinc-300 font-semibold">{linkedPrompt ? linkedPrompt.name : 'Chưa liên kết hoặc Prompt bị xóa'}</span>
								</div>

								<!-- Security & Limits Grid -->
								<div class="grid grid-cols-2 gap-3 text-[11px] font-sans">
									<div class="flex flex-col gap-1 p-2.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/30">
										<span class="text-zinc-400 font-semibold uppercase tracking-wider text-[8px] font-sans">Hạn mức câu hỏi (Ngày)</span>
										<span class="text-zinc-800 dark:text-zinc-200 mt-0.5">Khách: <b>{mapping.guestDailyQuota}</b> | Thành viên: <b>{mapping.userDailyQuota}</b></span>
									</div>
									<div class="flex flex-col gap-1 p-2.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/30">
										<span class="text-zinc-400 font-semibold uppercase tracking-wider text-[8px] font-sans">Bảo vệ Spam (Bot-Spam)</span>
										<span class="text-zinc-800 dark:text-zinc-200 mt-0.5 flex gap-1.5 font-bold font-sans">
											<Badge variant={mapping.enablePow ? 'success' : 'neutral'}>PoW</Badge>
											<Badge variant={mapping.enableFingerprint ? 'success' : 'neutral'}>Fingerprint</Badge>
										</span>
									</div>
									<div class="flex flex-col gap-1 p-2.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/30 col-span-2">
										<span class="text-zinc-400 font-semibold uppercase tracking-wider text-[8px] font-sans">Ngân sách AI tối đa (Daily Circuit Breaker)</span>
										<span class="text-zinc-800 dark:text-zinc-200 mt-0.5 font-mono"><b>${mapping.dailyTokenBudget} USD</b> / ngày</span>
									</div>
								</div>
							</Card>
						{/each}
					{/if}
				</div>
			</Card>
		</div>
	{/if}

	<!-- Modals -->
	<!-- Modal 1: 9Router Provider Connection -->
	<Modal open={isConnectionModalOpen} title={connectionEditId ? "Cấu hình kết nối 9Router" : "Thêm kết nối mới"} size="md" overflowVisible={true}>
		<div class="flex flex-col gap-4 py-2 font-sans">
			<Input id="conn-lbl" label="Tên hiển thị kết nối" placeholder="Ví dụ: OpenCode Zen Gateway" bind:value={connLabel} />
			
			<Select id="conn-prov" label="Mã AI Provider" options={[
				{ value: 'opencode', label: 'OpenCode' },
				{ value: 'openai', label: 'OpenAI' },
				{ value: 'anthropic', label: 'Anthropic' },
				{ value: 'google', label: 'Google Gemini' },
				{ value: 'openrouter', label: 'OpenRouter' }
			]} bind:value={connProvider} />

			<Input id="conn-url" label="Custom API Endpoint (Base URL)" placeholder="Ví dụ: https://opencode.ai/zen/v1" bind:value={connBaseURL} />
			<Input id="conn-key" type="password" label="API Key của Connection" placeholder="Nhập mã API key bảo mật..." bind:value={connApiKey} />

			<div class="flex items-center gap-2 mt-2">
				<input id="conn-act" type="checkbox" bind:checked={connIsActive} class="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer h-4 w-4" />
				<label for="conn-act" class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">Kích hoạt kết nối này</label>
			</div>
		</div>

		{#snippet footer()}
			<div class="flex gap-2 font-sans">
				<Button variant="secondary" size="md" onclick={() => isConnectionModalOpen = false}>Hủy</Button>
				<Button variant="primary" size="md" onclick={saveConnection}>Lưu Lại</Button>
			</div>
		{/snippet}
	</Modal>

	<!-- Modal 2: AI Prompt Editor -->
	<Modal open={isPromptEditorModalOpen} title={promptEditId ? "Chỉnh sửa Prompt" : "Tạo Prompt Mới"} size="lg" overflowVisible={true}>
		<div class="flex flex-col gap-4 py-2 font-sans">
			<div class="grid grid-cols-2 gap-4">
				<Input id="prompt-nm" label="Tên Prompt" placeholder="Ví dụ: Viết FAQ chuẩn hóa" bind:value={promptName} />
			<div class="relative">
				<label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-sans" for="prompt-alias">Model Alias đích (9Router)</label>
				<div class="relative" use:clickOutsideModelAlias>
					<button
						id="prompt-alias"
						type="button"
						class="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border bg-zinc-50/50 px-3 py-2 text-left text-sm text-zinc-900 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950/40 dark:text-zinc-550 border-zinc-200 hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-800/80 dark:hover:border-emerald-500/50 focus:outline-none focus:ring-2 cursor-pointer font-mono"
						onclick={() => isModelAliasDropdownOpen = !isModelAliasDropdownOpen}
					>
						<span class="truncate font-semibold">{promptModelAlias || 'Chọn một Model Alias'}</span>
						<span class="icon-[lucide--chevron-down] text-zinc-400 h-4.5 w-4.5"></span>
					</button>

					{#if isModelAliasDropdownOpen}
						<div class="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200/70 bg-white/95 p-2 shadow-xl shadow-zinc-950/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/95 flex flex-col gap-2">
							<input
								type="text"
								placeholder="Tìm kiếm Model Alias..."
								bind:value={modelAliasSearchQuery}
								class="w-full text-xs rounded-lg border border-zinc-200 bg-zinc-50/30 px-2.5 py-1.5 text-zinc-950 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
								onclick={(e) => e.stopPropagation()}
							/>

							<div class="flex flex-col max-h-[160px] overflow-y-auto zen-scrollbar">
								{#if filteredModelAliases.length === 0}
									{#if modelAliasSearchQuery.trim()}
										<button
											type="button"
											class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/10 cursor-pointer font-bold font-sans"
											onclick={() => {
												promptModelAlias = modelAliasSearchQuery.trim();
												isModelAliasDropdownOpen = false;
											}}
										>
											+ Sử dụng alias "{modelAliasSearchQuery.trim()}"
										</button>
									{:else}
										<div class="text-[11px] text-zinc-400 text-center py-2 font-sans">Chưa cấu hình Model Alias nào</div>
									{/if}
								{:else}
									{#each filteredModelAliases as alias}
										<button
											type="button"
											class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all duration-200 text-zinc-650 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-850/50 dark:hover:text-zinc-50 cursor-pointer {promptModelAlias === alias ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold' : ''}"
											onclick={() => {
												promptModelAlias = alias;
												isModelAliasDropdownOpen = false;
											}}
										>
											<div class="flex flex-col font-sans">
												<span class="font-mono font-bold text-left">{alias}</span>
												<span class="text-[9px] text-zinc-450 font-mono mt-0.5 text-left">({modelAliases[alias]})</span>
											</div>
											{#if promptModelAlias === alias}
												<span class="icon-[lucide--check] h-3.5 w-3.5 text-emerald-500"></span>
											{/if}
										</button>
									{/each}
									
									{#if modelAliasSearchQuery.trim() && !filteredModelAliases.includes(modelAliasSearchQuery.trim())}
										<button
											type="button"
											class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/10 cursor-pointer font-bold font-sans border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1"
											onclick={() => {
												promptModelAlias = modelAliasSearchQuery.trim();
												isModelAliasDropdownOpen = false;
											}}
										>
											+ Sử dụng alias "{modelAliasSearchQuery.trim()}"
										</button>
									{/if}
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>
			</div>

			<Input id="prompt-desc" label="Mô tả công dụng của Prompt" placeholder="Ví dụ: Prompt chuyên trách tạo câu hỏi thường gặp..." bind:value={promptDescription} />

			<div class="grid grid-cols-2 gap-4">
				<div>
					<div class="flex justify-between items-center mb-1.5">
						<label class="text-[10px] font-semibold uppercase tracking-wider text-zinc-450 font-sans" for="prompt-temp">Nhiệt độ (Temperature)</label>
						<span class="text-xs font-mono font-bold text-emerald-500">{promptTemp}</span>
					</div>
					<input id="prompt-temp" type="range" min="0" max="1.5" step="0.05" bind:value={promptTemp} class="w-full accent-emerald-500 h-10" />
				</div>
				<Input id="prompt-max" type="number" label="Max Tokens tối đa" placeholder="2048" bind:value={promptMaxTokens as any} />
			</div>

			<div class="flex flex-col gap-1">
				<label class="text-[10px] font-semibold uppercase tracking-wider text-zinc-450 font-sans" for="prompt-sys">System Prompt (Chỉ thị ẩn hệ thống)</label>
				<textarea id="prompt-sys" placeholder="Bạn là trợ lý AI chuyên trách..." rows="6" bind:value={promptSystem} class="w-full font-mono text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-zinc-950 transition-colors duration-200 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-500"></textarea>
			</div>
		</div>

		{#snippet footer()}
			<div class="flex gap-2">
				<Button variant="secondary" size="md" onclick={() => isPromptEditorModalOpen = false}>Hủy</Button>
				<Button variant="primary" size="md" onclick={savePrompt}>Lưu Lại</Button>
			</div>
		{/snippet}
	</Modal>

	<!-- Modal 3: Mapping & Security configurations -->
	<Modal open={isMappingModalOpen} title={mappingEditId ? "Cấu hình Ánh Xạ & Bảo Mật" : "Tạo Ánh Xạ Tác Vụ Mới"} size="md" overflowVisible={true}>
		<div class="flex flex-col gap-4 py-2 font-sans">
			<Select id="map-code" label="Mã tính năng chức năng (Feature Code)" options={[
				{ value: 'product_short_desc', label: 'Tạo Mô tả ngắn (Product Short Description)' },
				{ value: 'product_detailed_desc', label: 'Tạo Mô tả chi tiết (Product Detailed Description)' },
				{ value: 'product_guide', label: 'Tạo Hướng dẫn sử dụng (Product Installation Guide)' },
				{ value: 'product_faq', label: 'Tạo FAQs (Product FAQs)' },
				{ value: 'product_changelog', label: 'Tạo Nhật ký phiên bản (Product Version Changelog)' },
				{ value: 'product_chat', label: 'Hỏi đáp khách hàng tại trang chi tiết (Product Page Q&A Chatbot)' },
				{ value: 'homepage_chat', label: 'Tư vấn Floating tại trang chủ (Homepage Consultation Chatbot)' }
			]} bind:value={mapFeatureCode} />

			<Select id="map-pr" label="Prompt hệ thống sử dụng" options={dbPrompts.map(p => ({
				value: p.id,
				label: p.name
			}))} bind:value={mapPromptId} />

			<Select id="map-prod" label="Ghi đè cho Sản phẩm cụ thể (Override Scope)" options={[
				{ value: '', label: 'Tất cả sản phẩm (Global Default)' },
				...adminProducts.map(p => ({ value: p.id, label: p.name }))
			]} bind:value={mapProductId} />

			<div class="h-[1px] w-full bg-zinc-200/40 dark:bg-zinc-800/40 my-1 font-sans"></div>
			<h4 class="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 font-sans">
				<span class="icon-[lucide--shield-check] text-emerald-500"></span>
				<span>Cấu Hình Bảo Mật & Hạn Ngạch</span>
			</h4>

			<div class="grid grid-cols-2 gap-4 font-sans">
				<Input id="map-gq" type="number" label="Hạn mức khách vãng lai/ngày" placeholder="10" bind:value={mapGuestQuota as any} />
				<Input id="map-uq" type="number" label="Hạn mức thành viên/ngày" placeholder="50" bind:value={mapUserQuota as any} />
			</div>

			<Input id="map-bd" type="number" label="Ngân sách Token tối đa ngày ($USD)" placeholder="5.0" bind:value={mapDailyBudget as any} />

			<div class="flex flex-col gap-2 mt-2 font-sans">
				<div class="flex items-center gap-2 font-sans">
					<input id="map-pow" type="checkbox" bind:checked={mapEnablePow} class="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer h-4 w-4" />
					<label for="map-pow" class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">Bật cơ chế chống bot bằng Proof of Work (SHA-256)</label>
				</div>
				<div class="flex items-center gap-2 font-sans">
					<input id="map-fg" type="checkbox" bind:checked={mapEnableFingerprint} class="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer h-4 w-4" />
					<label for="map-fg" class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">Nhận dạng phần cứng bằng Canvas Device Fingerprint</label>
				</div>
			</div>
		</div>

		{#snippet footer()}
			<div class="flex gap-2 font-sans">
				<Button variant="secondary" size="md" onclick={() => isMappingModalOpen = false}>Hủy</Button>
				<Button variant="primary" size="md" onclick={saveMapping}>Lưu Lại</Button>
			</div>
		{/snippet}
	</Modal>
</div>

<!-- Toast System Alert Popup -->
{#if toast.show}
	<div
		class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-lg border border-zinc-200/50 bg-white/90 dark:border-zinc-800/50 dark:bg-zinc-900/90 transition-all duration-300 animate-slide-in"
	>
		{#if toast.type === 'success'}
			<div
				class="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"
			>
				<span class="icon-[lucide--check-circle-2] h-4.5 w-4.5"></span>
			</div>
		{:else}
			<div
				class="h-6 w-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0"
			>
				<span class="icon-[lucide--alert-triangle] h-4.5 w-4.5"></span>
			</div>
		{/if}
		<span class="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{toast.text}</span>
	</div>
{/if}
