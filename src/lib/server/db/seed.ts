import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import {
	organizations,
	roles,
	permissions,
	rolePermissions,
	users,
	userRoles,
	allowedEmailDomains,
	categories,
	tags,
	products,
	productTags,
	productVersions
} from './schema';
import { hashPassword } from '../auth/password';

const PERMISSIONS = [
	'users:create',
	'users:read',
	'users:reset_password',
	'users:force_logout',
	'users:update_status',
	'users:assign_role',
	'tools:create',
	'tools:read',
	'tools:publish',
	'tools:upload',
	'ai:prompt:read',
	'ai:prompt:deploy',
	'ai:settings:read',
	'files:upload',
	'chat:use',
	'audit:read',
	'system:settings'
] as const;

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
	super_admin: [...PERMISSIONS],
	admin: [
		'users:create',
		'users:read',
		'users:reset_password',
		'users:force_logout',
		'users:update_status',
		'users:assign_role',
		'tools:create',
		'tools:read',
		'tools:publish',
		'tools:upload',
		'files:upload',
		'chat:use'
	],
	content_editor: ['tools:create', 'tools:read', 'tools:upload', 'files:upload', 'chat:use'],
	ai_ops: ['tools:read', 'ai:prompt:read', 'ai:prompt:deploy', 'ai:settings:read', 'chat:use'],
	viewer: ['tools:read', 'chat:use'],
	end_user: ['tools:read', 'chat:use']
};

export async function seed() {
	console.log('Seeding database...');
	const connectionString = process.env.DATABASE_URL || 'postgresql://documenthub:documenthub_dev_2026@localhost:5432/documenthub';
	const client = postgres(connectionString);
	const db = drizzle(client);

	// 1. Get or Create Organization
	let [org] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.slug, 'documenthub'))
		.limit(1);

	if (!org) {
		const [newOrg] = await db
			.insert(organizations)
			.values({
				name: 'DocumentHub',
				slug: 'documenthub',
				isDefault: true
			})
			.returning();
		org = newOrg;
	}

	// 2. Insert Permissions
	for (const code of PERMISSIONS) {
		const [existingPerm] = await db
			.select()
			.from(permissions)
			.where(eq(permissions.code, code))
			.limit(1);
		if (!existingPerm) {
			await db.insert(permissions).values({ code, name: code });
		}
	}

	// 3. Insert Roles
	const roleNames = ['super_admin', 'admin', 'content_editor', 'ai_ops', 'viewer', 'end_user'];
	const roleMap: Record<string, string> = {};

	for (const name of roleNames) {
		let [role] = await db
			.select()
			.from(roles)
			.where(eq(roles.name, name))
			.limit(1);
		if (!role) {
			const [newRole] = await db
				.insert(roles)
				.values({
					organizationId: org.id,
					name,
					description: `${name} role`,
					isSystem: true
				})
				.returning();
			role = newRole;
		}
		roleMap[name] = role.id;
	}

	// 4. Role Permissions Mapping (Delete and re-insert to keep in sync)
	await db.delete(rolePermissions);
	for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
		for (const code of permCodes) {
			await db.insert(rolePermissions).values({
				roleId: roleMap[roleName],
				permissionCode: code
			});
		}
	}

	// 5. Get or Create Admin User
	const adminEmail = process.env.ADMIN_EMAIL || 'admin@documenthub.local';
	const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
	const passwordHash = await hashPassword(adminPassword);

	let [adminUser] = await db
		.select()
		.from(users)
		.where(eq(users.email, adminEmail))
		.limit(1);

	if (!adminUser) {
		const [newAdmin] = await db
			.insert(users)
			.values({
				organizationId: org.id,
				email: adminEmail,
				passwordHash,
				displayName: 'Super Admin',
				isActive: true,
				mustChangePassword: true
			})
			.returning();
		adminUser = newAdmin;
	}

	// 6. User Roles Mapping (Delete and re-insert to keep in sync)
	await db.delete(userRoles);
	await db.insert(userRoles).values({
		userId: adminUser.id,
		roleId: roleMap['super_admin']
	});

	const [existingDomain] = await db
		.select()
		.from(allowedEmailDomains)
		.where(eq(allowedEmailDomains.domainPattern, 'documenthub.local'))
		.limit(1);
	if (!existingDomain) {
		await db.insert(allowedEmailDomains).values({
			organizationId: org.id,
			domainPattern: 'documenthub.local',
			createdBy: adminUser.id
		});
	}

	// Clean out product-related tables to prevent duplicate errors on re-run
	await db.delete(productVersions);
	await db.delete(productTags);
	await db.delete(products);
	await db.delete(tags);
	await db.delete(categories);

	// --- Seed Categories ---
	const categoriesToSeed = [
		{ name: 'WordPress Plugin', slug: 'wordpress-plugin', description: 'WordPress Plugins và Add-ons', layoutType: 'plugin_tools_game' },
		{ name: 'CMS Tool', slug: 'cms-tool', description: 'Các công cụ CMS và mã nguồn độc lập', layoutType: 'cms_tools' },
		{ name: 'Mini Game', slug: 'mini-game', description: 'Các trò chơi mini HTML5 và game tương tác', layoutType: 'plugin_tools_game' },
		{ name: 'Documents & Tips', slug: 'documents-tips', description: 'Tài liệu và Thủ thuật hướng dẫn kỹ thuật', layoutType: 'documents_tips' },
		{ name: 'Social Chatbot', slug: 'social-chatbot', description: 'Chatbot tích hợp mạng xã hội', layoutType: 'chatbot_social' },
		{ name: 'Other', slug: 'other', description: 'Các sản phẩm và công cụ khác', layoutType: 'other' }
	];
	const categoryMap: Record<string, string> = {};
	for (const cat of categoriesToSeed) {
		const [seededCat] = await db
			.insert(categories)
			.values({
				organizationId: org.id,
				name: cat.name,
				slug: cat.slug,
				description: cat.description,
				layoutType: cat.layoutType
			})
			.returning();
		categoryMap[cat.name] = seededCat.id;
	}

	// --- Seed Tags ---
	const tagsToSeed = [
		{ name: 'helpdesk', slug: 'helpdesk' },
		{ name: 'tool', slug: 'tool' },
		{ name: 'advance', slug: 'advance' },
		{ name: 'digital', slug: 'digital' },
		{ name: 'team', slug: 'team' },
		{ name: 'social', slug: 'social' },
		{ name: 'game', slug: 'game' }
	];
	const tagMap: Record<string, string> = {};
	for (const tagItem of tagsToSeed) {
		const [seededTag] = await db
			.insert(tags)
			.values({
				organizationId: org.id,
				name: tagItem.name,
				slug: tagItem.slug
			})
			.returning();
		tagMap[tagItem.name] = seededTag.id;
	}

	// --- Seed Products ---
	const productsToSeed = [
		{
			id: 'wp-chat-assistant',
			name: 'WP Chat Assistant',
			categoryName: 'WordPress Plugin',
			tagNameList: ['helpdesk', 'tool', 'advance'],
			description: 'Tích hợp chatbot AI hỗ trợ khách hàng tự động vào website WordPress chỉ trong 5 phút.',
			detailedDescription: 'WP Chat Assistant giúp tự động hóa khâu chăm sóc khách hàng. Plugin sử dụng AI trả lời tức thì các câu hỏi thường gặp, hỗ trợ WooCommerce tra cứu đơn hàng nhanh chóng và cho phép tùy biến giao diện widget linh hoạt theo thương hiệu.',
			icon: 'icon-[lucide--message-square-text]',
			iconColor: 'text-emerald-500 bg-emerald-500/10',
			liveDemoUrl: 'https://demo.wpchatassistant.com',
			downloadUrl: '/uploads/wp-chat-assistant-v1.2.0.zip',
			fileSize: '4.8 MB',
			fileType: 'ZIP Plugin',
			downloadsCount: 1540,
			wpVersion: '6.0 hoặc cao hơn',
			phpVersion: '7.4 hoặc cao hơn',
			author: 'Mini Games Hub Team',
			ratingAverage: 4.8,
			ratingCount: 148,
			slideshowImages: [
				'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
				'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
			],
			guides: [
				{ title: 'Bước 1: Cài đặt Plugin', content: 'Tải tệp ZIP của plugin về máy. Trong trang quản trị WordPress, truy cập Plugins > Add New > Upload Plugin, chọn tệp ZIP và nhấn Install Now, sau đó kích hoạt plugin.' },
				{ title: 'Bước 2: Cấu hình API Key', content: 'Truy cập vào menu Chat Assistant mới xuất hiện ở thanh bên quản trị. Nhập mã API Key của bạn từ bảng điều khiển AI Hub để kích hoạt bộ nhớ thông minh cho bot.' }
			],
			faqs: [
				{ question: 'Plugin này có làm chậm website của tôi không?', answer: 'Hoàn toàn không. Plugin sử dụng API tải không đồng bộ, mọi tác vụ xử lý ngôn ngữ và suy luận AI đều diễn ra trên máy chủ đám mây.' }
			],
			versionsList: [
				{ versionNumber: 'v1.2.0', changelogRaw: 'Nâng cấp giao diện quản trị Admin mượt mà hơn theo chuẩn thiết kế tối giản.\nTối ưu hóa thời gian phản hồi của chatbot nhanh hơn 30%.\nSửa lỗi xung đột với plugin WP Rocket khi cache trang.', isCurrentActive: true, downloadUrl: '/uploads/wp-chat-assistant-v1.2.0.zip', fileSize: '4.8 MB', fileType: 'ZIP Plugin' },
				{ versionNumber: 'v1.1.0', changelogRaw: 'Hỗ trợ tích hợp sâu với WooCommerce tra cứu đơn hàng tự động.\nThêm tính năng tùy chọn xuất lịch sử chat của khách hàng dạng CSV.', isCurrentActive: false, downloadUrl: '/uploads/wp-chat-assistant-v1.1.0.zip', fileSize: '4.5 MB', fileType: 'ZIP Plugin' }
			]
		},
		{
			id: 'digital-card-builder',
			name: 'Digital Card Builder',
			categoryName: 'CMS Tool',
			tagNameList: ['digital', 'team', 'social'],
			description: 'Công cụ thiết kế danh thiếp điện tử thông minh và tạo trang cá nhân Bio chuyên nghiệp.',
			detailedDescription: 'Digital Card Builder giúp tạo nhanh danh thiếp số thông minh và trang cá nhân (Link-in-bio). Công cụ hỗ trợ kéo thả chỉnh sửa trực quan, tạo mã QR liên kết động, và tích hợp bộ phân tích thống kê lượt click thời gian thực.',
			icon: 'icon-[lucide--contact-2]',
			iconColor: 'text-sky-500 bg-sky-500/10',
			liveDemoUrl: 'https://cards.minigameshub.com',
			downloadUrl: '/uploads/digital-card-builder-v2.0.1.zip',
			fileSize: '12.5 MB',
			fileType: 'ZIP Source',
			downloadsCount: 920,
			wpVersion: 'Không yêu cầu (Standalone CMS)',
			phpVersion: '8.1 hoặc cao hơn',
			author: 'Mini Games Hub Team',
			ratingAverage: 4.6,
			ratingCount: 84,
			slideshowImages: [
				'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
			],
			guides: [
				{ title: 'Bước 1: Giải nén mã nguồn', content: 'Tải mã nguồn về và giải nén trên thư mục webroot của hosting hoặc server chạy PHP 8.1 trở lên.' }
			],
			faqs: [
				{ question: 'Công cụ này có hỗ trợ xuất mã QR không?', answer: 'Có. Hệ thống tự động tạo mã QR động cho từng danh thiếp cá nhân.' }
			],
			versionsList: [
				{ versionNumber: 'v2.0.1', changelogRaw: 'Thêm 5 mẫu giao diện Glassmorphism mới siêu đẹp.\nSửa lỗi hiển thị mã QR trên trình duyệt Safari di động.', isCurrentActive: true, downloadUrl: '/uploads/digital-card-builder-v2.0.1.zip', fileSize: '12.5 MB', fileType: 'ZIP Source' }
			]
		},
		{
			id: 'wp-sudoku-game',
			name: 'WP Sudoku Game',
			categoryName: 'WordPress Plugin',
			tagNameList: ['game', 'tool'],
			description: 'Tích hợp bảng trò chơi trí tuệ Sudoku hấp dẫn giữ chân người đọc trên website của bạn.',
			detailedDescription: 'WP Sudoku Game giúp chèn nhanh bảng Sudoku chuẩn quốc tế vào website. Hỗ trợ tạo bảng ngẫu nhiên theo 4 cấp độ khó, tối ưu hóa giao diện di động cảm ứng mượt mà và tự động tích hợp bảng xếp hạng điểm số.',
			icon: 'icon-[lucide--grid-3x3]',
			iconColor: 'text-amber-500 bg-amber-500/10',
			liveDemoUrl: 'https://demo.wpsudoku.com',
			downloadUrl: '/uploads/wp-sudoku-game-v1.0.0.zip',
			fileSize: '2.1 MB',
			fileType: 'ZIP Plugin',
			downloadsCount: 2150,
			wpVersion: '5.5 hoặc cao hơn',
			phpVersion: '7.2 hoặc cao hơn',
			author: 'Mini Games Hub Team',
			ratingAverage: 4.9,
			ratingCount: 310,
			slideshowImages: [
				'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
			],
			guides: [
				{ title: 'Bước 1: Cài đặt và Kích hoạt', content: 'Kích hoạt plugin trong thư mục Plugins của WordPress.' }
			],
			faqs: [
				{ question: 'Game có tương thích với thiết bị di động không?', answer: 'Hoàn toàn tương thích.' }
			],
			versionsList: [
				{ versionNumber: 'v1.0.0', changelogRaw: 'Phiên bản đầu tiên ra mắt với 4 cấp độ khó và tính năng tính giờ chơi.', isCurrentActive: true, downloadUrl: '/uploads/wp-sudoku-game-v1.0.0.zip', fileSize: '2.1 MB', fileType: 'ZIP Plugin' }
			]
		}
	];

	for (const prod of productsToSeed) {
		const categoryId = categoryMap[prod.categoryName] || null;
		const [seededProd] = await db
			.insert(products)
			.values({
				organizationId: org.id,
				slug: prod.id,
				name: prod.name,
				categoryId: categoryId,
				description: prod.description,
				detailedDescription: prod.detailedDescription,
				icon: prod.icon,
				iconColor: prod.iconColor,
				liveDemoUrl: prod.liveDemoUrl,
				downloadUrl: prod.downloadUrl,
				fileSize: prod.fileSize,
				fileType: prod.fileType,
				downloadsCount: prod.downloadsCount,
				wpVersion: prod.wpVersion,
				phpVersion: prod.phpVersion,
				author: prod.author,
				ratingAverage: prod.ratingAverage,
				ratingCount: prod.ratingCount,
				slideshowImages: prod.slideshowImages,
				customFields: {},
				guides: prod.guides,
				faqs: prod.faqs,
				enableDownload: true,
				createdBy: adminUser.id
			})
			.returning();

		// Seed Product Tag mapping
		for (const tagName of prod.tagNameList) {
			const tagId = tagMap[tagName];
			if (tagId) {
				await db.insert(productTags).values({
					productId: seededProd.id,
					tagId: tagId
				});
			}
		}

		// Seed Product Versions
		for (const ver of prod.versionsList) {
			await db.insert(productVersions).values({
				productId: seededProd.id,
				versionNumber: ver.versionNumber,
				changelogRaw: ver.changelogRaw,
				downloadUrl: ver.downloadUrl,
				fileSize: ver.fileSize,
				fileType: ver.fileType,
				isCurrentActive: ver.isCurrentActive,
				createdBy: adminUser.id
			});
		}
	}

	console.log('Seed complete.');
	console.log(`  Org: ${org.name} (${org.id})`);
	console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
	console.log('  Roles:', roleNames.join(', '));
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Seed failed:', err);
		process.exit(1);
	});
