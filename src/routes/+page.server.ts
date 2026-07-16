import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { products, categories, tags, productTags } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Query products with category names
	const dbProducts = await db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			category: categories.name,
			description: products.description,
			detailedDescription: products.detailedDescription,
			icon: products.icon,
			iconColor: products.iconColor,
			liveDemoUrl: products.liveDemoUrl,
			downloadUrl: products.downloadUrl,
			fileSize: products.fileSize,
			fileType: products.fileType,
			downloadsCount: products.downloadsCount,
			wpVersion: products.wpVersion,
			phpVersion: products.phpVersion,
			author: products.author,
			ratingAverage: products.ratingAverage,
			ratingCount: products.ratingCount,
			slideshowImages: products.slideshowImages,
			customFields: products.customFields,
			guides: products.guides,
			faqs: products.faqs,
			enableDownload: products.enableDownload,
			createdAt: products.createdAt
		})
		.from(products)
		.leftJoin(categories, eq(products.categoryId, categories.id));

	// Query product tags mappings
	const dbProductTags = await db
		.select({
			productId: productTags.productId,
			tagName: tags.name
		})
		.from(productTags)
		.innerJoin(tags, eq(productTags.tagId, tags.id));

	const tagsMap = dbProductTags.reduce(
		(acc, curr) => {
			if (!acc[curr.productId]) acc[curr.productId] = [];
			acc[curr.productId].push(curr.tagName);
			return acc;
		},
		{} as Record<string, string[]>
	);

	const formattedProducts = dbProducts.map((p) => ({
		...p,
		tags: tagsMap[p.id] || [],
		slideshowImages: (p.slideshowImages || []) as string[],
		guides: (p.guides || []) as { title: string; content: string }[],
		faqs: (p.faqs || []) as { question: string; answer: string }[],
		lastUpdated: p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : ''
	}));

	const dbCategories = await db.select().from(categories);
	const dbTags = await db.select().from(tags);

	return {
		products: formattedProducts,
		categories: dbCategories,
		tags: dbTags
	};
};
