import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { products, categories, tags, productTags, productVersions } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const productId = params.id;

	const [product] = await db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			categoryId: products.categoryId,
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
			createdAt: products.createdAt,
			updatedAt: products.updatedAt
		})
		.from(products)
		.where(or(eq(products.id, productId), eq(products.slug, productId)))
		.limit(1);

	if (!product) {
		throw redirect(302, '/');
	}

	// Fetch category name
	let categoryName = '';
	if (product.categoryId) {
		const [cat] = await db
			.select({ name: categories.name })
			.from(categories)
			.where(eq(categories.id, product.categoryId))
			.limit(1);
		if (cat) categoryName = cat.name;
	}

	// Fetch tags
	const dbProductTags = await db
		.select({ tagName: tags.name })
		.from(productTags)
		.innerJoin(tags, eq(productTags.tagId, tags.id))
		.where(eq(productTags.productId, product.id));

	const tagNames = dbProductTags.map((t) => t.tagName);

	// Fetch versions
	const dbVersions = await db
		.select()
		.from(productVersions)
		.where(eq(productVersions.productId, product.id));

	const changelogs = dbVersions.map((v) => {
		const pubDate = v.publishedAt || v.createdAt;
		return {
			version: v.versionNumber,
			date: pubDate ? new Date(pubDate).toLocaleDateString('vi-VN') : '',
			changes: v.changelogRaw.split('\n').filter(Boolean)
		};
	});

	return {
		product: {
			...product,
			category: categoryName,
			tags: tagNames,
			changelogs,
			slideshowImages: (product.slideshowImages || []) as string[],
			guides: (product.guides || []) as { title: string; content: string }[],
			faqs: (product.faqs || []) as { question: string; answer: string }[],
			lastUpdated: product.updatedAt
				? new Date(product.updatedAt).toLocaleDateString('vi-VN')
				: new Date(product.createdAt || '').toLocaleDateString('vi-VN')
		}
	};
};
