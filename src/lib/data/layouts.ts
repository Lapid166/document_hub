export interface LayoutConfig {
	id: string;
	name: string;
	showWpPhpSpecs: boolean;
	showDemoUrl: boolean;
	showDownloadFile: boolean;
	showSlideshowToggle: boolean;
	showGuidesToggle: boolean;
	showFaqsToggle: boolean;
	customFieldsPlaceholder: { key: string; value: string }[];
}

export const PRODUCT_LAYOUTS: Record<string, LayoutConfig> = {
	documents_tips: {
		id: 'documents_tips',
		name: 'Tài liệu & Thủ thuật',
		showWpPhpSpecs: false,
		showDemoUrl: false,
		showDownloadFile: true, // For document downloads (PDF, docs)
		showSlideshowToggle: true,
		showGuidesToggle: true,
		showFaqsToggle: true,
		customFieldsPlaceholder: [
			{ key: 'Format', value: 'PDF / Ebook' },
			{ key: 'Language', value: 'Tiếng Việt' }
		]
	},
	plugin_tools_game: {
		id: 'plugin_tools_game',
		name: 'Công cụ Plugin & Game Plugin',
		showWpPhpSpecs: true,
		showDemoUrl: true,
		showDownloadFile: true,
		showSlideshowToggle: true,
		showGuidesToggle: true,
		showFaqsToggle: true,
		customFieldsPlaceholder: [
			{ key: 'License', value: 'GPLv3' },
			{ key: 'PHP Version Required', value: '7.4' }
		]
	},
	cms_tools: {
		id: 'cms_tools',
		name: 'Công cụ CMS',
		showWpPhpSpecs: false,
		showDemoUrl: true,
		showDownloadFile: true,
		showSlideshowToggle: true,
		showGuidesToggle: true,
		showFaqsToggle: true,
		customFieldsPlaceholder: [
			{ key: 'CMS Type', value: 'WordPress / Joomla' },
			{ key: 'License', value: 'GPLv3' }
		]
	},
	chatbot_social: {
		id: 'chatbot_social',
		name: 'Chatbot Mạng xã hội',
		showWpPhpSpecs: false,
		showDemoUrl: true,
		showDownloadFile: false,
		showSlideshowToggle: true,
		showGuidesToggle: true,
		showFaqsToggle: true,
		customFieldsPlaceholder: [
			{ key: 'Platforms', value: 'Facebook, Telegram' },
			{ key: 'API Provider', value: 'Gemini AI' }
		]
	},
	other: {
		id: 'other',
		name: 'Sản phẩm khác',
		showWpPhpSpecs: false,
		showDemoUrl: true,
		showDownloadFile: true,
		showSlideshowToggle: true,
		showGuidesToggle: true,
		showFaqsToggle: true,
		customFieldsPlaceholder: []
	}
};
