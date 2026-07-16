import {
	pgTable,
	uuid,
	varchar,
	text,
	boolean,
	timestamp,
	jsonb,
	uniqueIndex,
	index,
	integer,
	real,
	customType
} from 'drizzle-orm/pg-core';

// ─── Organizations ────────────────────────────────────────

export const organizations = pgTable('organizations', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 255 }).notNull(),
	slug: varchar('slug', { length: 255 }).notNull().unique(),
	isDefault: boolean('is_default').default(false),
	settingsJson: jsonb('settings_json'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// ─── Users ────────────────────────────────────────────────

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organizationId: uuid('organization_id').references(() => organizations.id),
		email: varchar('email', { length: 255 }).notNull(),
		passwordHash: text('password_hash').notNull(),
		displayName: varchar('display_name', { length: 255 }),
		avatarUrl: text('avatar_url'),
		bio: text('bio'),
		isActive: boolean('is_active').default(true),
		mustChangePassword: boolean('must_change_password').default(false),
		lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
	},
	(t) => [uniqueIndex('uq_users_email_org').on(t.email, t.organizationId)]
);

// ─── Roles ────────────────────────────────────────────────

export const roles = pgTable(
	'roles',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organizationId: uuid('organization_id').references(() => organizations.id),
		name: varchar('name', { length: 100 }).notNull(),
		description: text('description'),
		isSystem: boolean('is_system').default(false)
	},
	(t) => [uniqueIndex('uq_roles_name_org').on(t.name, t.organizationId)]
);

// ─── Permissions ──────────────────────────────────────────

export const permissions = pgTable('permissions', {
	code: varchar('code', { length: 100 }).primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description')
});

// ─── Role ↔ Permission ────────────────────────────────────

export const rolePermissions = pgTable(
	'role_permissions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }),
		permissionCode: varchar('permission_code', { length: 100 }).references(() => permissions.code, {
			onDelete: 'cascade'
		})
	},
	(t) => [uniqueIndex('uq_role_permission').on(t.roleId, t.permissionCode)]
);

// ─── User ↔ Role ──────────────────────────────────────────

export const userRoles = pgTable(
	'user_roles',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
		roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' })
	},
	(t) => [uniqueIndex('uq_user_role').on(t.userId, t.roleId)]
);

// ─── Sessions ─────────────────────────────────────────────

export const sessions = pgTable(
	'sessions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
		organizationId: uuid('organization_id').references(() => organizations.id),
		tokenHash: text('token_hash').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		ipAddress: varchar('ip_address', { length: 45 }),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
	},
	(t) => [
		index('idx_sessions_token_hash').on(t.tokenHash),
		index('idx_sessions_user_id').on(t.userId)
	]
);

// ─── Allowed Email Domains ────────────────────────────────

export const allowedEmailDomains = pgTable('allowed_email_domains', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id),
	domainPattern: varchar('domain_pattern', { length: 255 }).notNull(),
	createdBy: uuid('created_by').references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// ─── 2FA Settings ─────────────────────────────────────────

export const userTwoFactorSettings = pgTable('user_two_factor_settings', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	isEnabled: boolean('is_enabled').default(false),
	secretEncrypted: text('secret_encrypted'),
	method: varchar('method', { length: 20 }).default('totp'),
	lastUsedAt: timestamp('last_used_at', { withTimezone: true })
});

// ─── Recovery Codes ───────────────────────────────────────

export const userRecoveryCodes = pgTable('user_recovery_codes', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	codeHash: text('code_hash').notNull(),
	isUsed: boolean('is_used').default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// ─── Audit Logs ───────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id),
	userId: uuid('user_id').references(() => users.id),
	action: varchar('action', { length: 100 }).notNull(),
	resourceType: varchar('resource_type', { length: 100 }),
	resourceId: varchar('resource_id', { length: 255 }),
	detailsJson: jsonb('details_json'),
	ipAddress: varchar('ip_address', { length: 45 }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// ─── Security Events ──────────────────────────────────────

export const securityEvents = pgTable('security_events', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id').references(() => organizations.id),
	eventType: varchar('event_type', { length: 100 }).notNull(),
	severity: varchar('severity', { length: 20 }).notNull(),
	detailsJson: jsonb('details_json'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// ─── Categories ──────────────────────────────────────────

export const categories = pgTable(
	'categories',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organizationId: uuid('organization_id')
			.references(() => organizations.id, { onDelete: 'cascade' })
			.notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		slug: varchar('slug', { length: 255 }).notNull(),
		description: text('description'),
		layoutType: varchar('layout_type', { length: 50 }).default('plugin_tools_game'),
		parentId: uuid('parent_id'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
	},
	(t) => [
		uniqueIndex('uq_categories_slug_org').on(t.slug, t.organizationId),
		index('idx_categories_org').on(t.organizationId)
	]
);

// ─── Tags ────────────────────────────────────────────────

export const tags = pgTable(
	'tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organizationId: uuid('organization_id')
			.references(() => organizations.id, { onDelete: 'cascade' })
			.notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		slug: varchar('slug', { length: 255 }).notNull(),
		description: text('description'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
	},
	(t) => [
		uniqueIndex('uq_tags_slug_org').on(t.slug, t.organizationId),
		index('idx_tags_org').on(t.organizationId)
	]
);

// ─── Products ────────────────────────────────────────────

export const products = pgTable(
	'products',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organizationId: uuid('organization_id')
			.references(() => organizations.id, { onDelete: 'cascade' })
			.notNull(),
		slug: varchar('slug', { length: 255 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
		description: text('description').notNull(),
		detailedDescription: text('detailed_description').notNull(),
		icon: varchar('icon', { length: 255 }).notNull(),
		iconColor: varchar('icon_color', { length: 255 }).notNull(),
		liveDemoUrl: varchar('live_demo_url', { length: 255 }),
		downloadUrl: varchar('download_url', { length: 255 }),
		fileSize: varchar('file_size', { length: 50 }),
		fileType: varchar('file_type', { length: 50 }),
		downloadsCount: integer('downloads_count').default(0),
		wpVersion: varchar('wp_version', { length: 100 }),
		phpVersion: varchar('php_version', { length: 100 }),
		author: varchar('author', { length: 255 }).notNull(),
		ratingAverage: real('rating_average').default(5.0),
		ratingCount: integer('rating_count').default(0),
		slideshowImages: jsonb('slideshow_images').default([]),
		customFields: jsonb('custom_fields').default({}),
		guides: jsonb('guides').default([]),
		faqs: jsonb('faqs').default([]),
		enableDownload: boolean('enable_download').default(false),
		enableSlideshow: boolean('enable_slideshow').default(true),
		enableGuides: boolean('enable_guides').default(true),
		enableFaqs: boolean('enable_faqs').default(true),
		detailedDescriptionDraft: text('detailed_description_draft'),
		guidesDraft: jsonb('guides_draft').default([]),
		faqsDraft: jsonb('faqs_draft').default([]),
		customFieldsDraft: jsonb('custom_fields_draft').default({}),
		draftStatus: varchar('draft_status', { length: 50 }).default('no_draft'),
		createdBy: uuid('created_by')
			.references(() => users.id, { onDelete: 'restrict' })
			.notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
	},
	(t) => [
		uniqueIndex('uq_products_slug_org').on(t.slug, t.organizationId),
		index('idx_products_org').on(t.organizationId),
		index('idx_products_category').on(t.categoryId)
	]
);

// ─── Product ↔ Tag Mapping ───────────────────────────────

export const productTags = pgTable(
	'product_tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		productId: uuid('product_id')
			.references(() => products.id, { onDelete: 'cascade' })
			.notNull(),
		tagId: uuid('tag_id')
			.references(() => tags.id, { onDelete: 'cascade' })
			.notNull()
	},
	(t) => [uniqueIndex('uq_product_tag').on(t.productId, t.tagId)]
);

// ─── Product ↔ Category Mapping ──────────────────────────

export const productCategories = pgTable(
	'product_categories',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		productId: uuid('product_id')
			.references(() => products.id, { onDelete: 'cascade' })
			.notNull(),
		categoryId: uuid('category_id')
			.references(() => categories.id, { onDelete: 'cascade' })
			.notNull()
	},
	(t) => [uniqueIndex('uq_product_category_link').on(t.productId, t.categoryId)]
);

// ─── Product Versions ────────────────────────────────────

export const productVersions = pgTable(
	'product_versions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		productId: uuid('product_id')
			.references(() => products.id, { onDelete: 'cascade' })
			.notNull(),
		versionNumber: varchar('version_number', { length: 50 }).notNull(),
		changelogRaw: text('changelog_raw').notNull(),
		downloadUrl: varchar('download_url', { length: 255 }),
		fileSize: varchar('file_size', { length: 50 }),
		fileType: varchar('file_type', { length: 50 }),
		isCurrentActive: boolean('is_current_active').default(false),
		publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow(),
		createdBy: uuid('created_by')
			.references(() => users.id, { onDelete: 'restrict' })
			.notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
	},
	(t) => [index('idx_product_versions_product').on(t.productId)]
);

// ─── Custom pgvector Type Definition ────────────────────────

export const pgVector = customType<{ data: number[] }>({
	dataType() {
		return 'vector(1536)';
	},
	toDriver(value: number[]): string {
		return JSON.stringify(value);
	},
	fromDriver(value: unknown): number[] {
		if (typeof value === 'string') {
			return value.slice(1, -1).split(',').map(Number);
		}
		return value as number[];
	}
});

// ─── Product Documents (Raw Uploads) ────────────────────────

export const productDocuments = pgTable(
	'product_documents',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		productId: uuid('product_id')
			.references(() => products.id, { onDelete: 'cascade' })
			.notNull(),
		versionId: uuid('version_id')
			.references(() => productVersions.id, { onDelete: 'cascade' }),
		fileName: varchar('file_name', { length: 255 }).notNull(),
		fileUrl: varchar('file_url', { length: 255 }).notNull(),
		rawContent: text('raw_content').notNull(),
		fileType: varchar('file_type', { length: 50 }).default('markdown'), // txt, md, pdf, docx
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
	},
	(t) => [index('idx_product_docs_product').on(t.productId)]
);

// ─── Product Knowledge Vectors (RAG Index) ──────────────────

export const productKnowledgeVectors = pgTable(
	'product_knowledge_vectors',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		productId: uuid('product_id')
			.references(() => products.id, { onDelete: 'cascade' })
			.notNull(),
		versionId: uuid('version_id')
			.references(() => productVersions.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		embedding: pgVector('embedding').notNull(),
		metadata: jsonb('metadata').default({}),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
	},
	(t) => [index('idx_product_vectors_product').on(t.productId)]
);

// ─── AI Prompts & Assistants ────────────────────────────────

export const aiPrompts = pgTable('ai_prompts', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id')
		.references(() => organizations.id, { onDelete: 'cascade' })
		.notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	systemPrompt: text('system_prompt').notNull(),
	temperature: real('temperature').default(0.7),
	maxTokens: integer('max_tokens').default(2048),
	modelAlias: varchar('model_alias', { length: 255 }).notNull(), // maps to 9router model alias
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const aiPromptMappings = pgTable('ai_prompt_mappings', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id')
		.references(() => organizations.id, { onDelete: 'cascade' })
		.notNull(),
	featureCode: varchar('feature_code', { length: 100 }).notNull(), // product_short_desc, product_detailed_desc, product_guide, product_faq, product_changelog, product_chat, homepage_chat
	promptId: uuid('prompt_id')
		.references(() => aiPrompts.id, { onDelete: 'cascade' })
		.notNull(),
	productId: uuid('product_id')
		.references(() => products.id, { onDelete: 'cascade' }), // null for global default mapping
	isActive: boolean('is_active').default(true),
	guestDailyQuota: integer('guest_daily_quota').default(10), // Limit for guests
	userDailyQuota: integer('user_daily_quota').default(50), // Limit for registered users
	enablePow: boolean('enable_pow').default(true), // Enable Proof of Work
	enableFingerprint: boolean('enable_fingerprint').default(true), // Enable Canvas Fingerprint
	dailyTokenBudget: real('daily_token_budget').default(5.0), // Daily token budget in USD for circuit breaker
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

