import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '$lib/server/db/client';
import { organizations, products, productVersions } from '$lib/server/db/schema';
import { eq, like, or } from 'drizzle-orm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface UploadResult {
	url: string;
	size: string;
	type: string;
}

// Helper to get active storage settings from organization
export async function getStorageSettings() {
	const [org] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.isDefault, true))
		.limit(1);

	const defaultSettings = {
		type: 'local' as const,
		s3: {
			endpoint: '',
			accessKey: '',
			secretKey: '',
			bucket: '',
			region: 'us-east-1'
		}
	};

	if (!org || !org.settingsJson) {
		return defaultSettings;
	}

	const settings = org.settingsJson as any;
	return {
		type: (settings.storage?.type || 'local') as 'local' | 's3',
		s3: {
			endpoint: settings.storage?.s3?.endpoint || '',
			accessKey: settings.storage?.s3?.accessKey || '',
			secretKey: settings.storage?.s3?.secretKey || '',
			bucket: settings.storage?.s3?.bucket || '',
			region: settings.storage?.s3?.region || 'us-east-1'
		}
	};
}

// Save storage settings to organization config
export async function saveStorageSettings(storageType: 'local' | 's3', s3Config?: any) {
	const [org] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.isDefault, true))
		.limit(1);

	if (!org) return;

	const currentSettings = (org.settingsJson as any) || {};
	const newSettings = {
		...currentSettings,
		storage: {
			type: storageType,
			s3: s3Config || currentSettings.storage?.s3 || {}
		}
	};

	await db
		.update(organizations)
		.set({ settingsJson: newSettings, updatedAt: new Date() })
		.where(eq(organizations.id, org.id));
}

// Core function to save file based on settings
export async function saveFile(
	filename: string,
	buffer: Buffer,
	mimeType: string
): Promise<UploadResult> {
	const settings = await getStorageSettings();
	const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
	const size = `${sizeMB} MB`;

	let type = 'File';
	if (mimeType.includes('zip') || filename.endsWith('.zip')) {
		type = 'ZIP Plugin';
	} else if (mimeType.includes('pdf') || filename.endsWith('.pdf')) {
		type = 'PDF Document';
	} else if (mimeType.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename)) {
		type = 'Image';
	} else if (filename.endsWith('.md') || filename.endsWith('.markdown')) {
		type = 'Markdown';
	}

	const sanitizedFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

	if (settings.type === 's3' && settings.s3.endpoint && settings.s3.bucket) {
		// S3 Upload
		const s3Client = new S3Client({
			endpoint: settings.s3.endpoint,
			region: settings.s3.region,
			credentials: {
				accessKeyId: settings.s3.accessKey,
				secretAccessKey: settings.s3.secretKey
			},
			forcePathStyle: true // Needed for MinIO/S3 compatible storage
		});

		await s3Client.send(
			new PutObjectCommand({
				Bucket: settings.s3.bucket,
				Key: sanitizedFilename,
				Body: buffer,
				ContentType: mimeType,
				ACL: 'public-read'
			})
		);

		// Resolve S3 URL
		const s3Url = `${settings.s3.endpoint}/${settings.s3.bucket}/${sanitizedFilename}`;
		return { url: s3Url, size, type };
	} else {
		// Local Storage
		const uploadDir = path.resolve('static/uploads');
		await fs.mkdir(uploadDir, { recursive: true });

		const filePath = path.join(uploadDir, sanitizedFilename);
		await fs.writeFile(filePath, buffer);

		const localUrl = `/uploads/${sanitizedFilename}`;
		return { url: localUrl, size, type };
	}
}

// Synchronize all local files to S3
export async function syncLocalToS3(): Promise<{ successCount: number; failedCount: number }> {
	const settings = await getStorageSettings();
	if (settings.type !== 's3' || !settings.s3.endpoint || !settings.s3.bucket) {
		throw new Error('S3 Storage is not properly configured.');
	}

	const s3Client = new S3Client({
		endpoint: settings.s3.endpoint,
		region: settings.s3.region,
		credentials: {
			accessKeyId: settings.s3.accessKey,
			secretAccessKey: settings.s3.secretKey
		},
		forcePathStyle: true
	});

	// Find local downloads
	const localVersions = await db
		.select()
		.from(productVersions)
		.where(like(productVersions.downloadUrl, '/uploads/%'));

	const localProducts = await db
		.select()
		.from(products)
		.where(like(products.downloadUrl, '/uploads/%'));

	let successCount = 0;
	let failedCount = 0;

	// Helper function to read, upload and update
	const uploadLocalFile = async (localUrl: string): Promise<string | null> => {
		try {
			const relativePath = localUrl.replace(/^\//, ''); // uploads/filename
			const localFilePath = path.resolve('static', relativePath);
			const fileBuffer = await fs.readFile(localFilePath);
			const filename = path.basename(localFilePath);

			// Determine Content Type
			let contentType = 'application/octet-stream';
			if (filename.endsWith('.zip')) contentType = 'application/zip';
			else if (filename.endsWith('.pdf')) contentType = 'application/pdf';
			else if (/\.(jpg|jpeg|png|webp)$/i.test(filename)) contentType = `image/${filename.split('.').pop()}`;

			await s3Client.send(
				new PutObjectCommand({
					Bucket: settings.s3.bucket,
					Key: filename,
					Body: fileBuffer,
					ContentType: contentType,
					ACL: 'public-read'
				})
			);

			const newUrl = `${settings.s3.endpoint}/${settings.s3.bucket}/${filename}`;
			successCount++;
			return newUrl;
		} catch (error) {
			console.error(`Failed to sync file ${localUrl}:`, error);
			failedCount++;
			return null;
		}
	};

	// 1. Sync product versions
	for (const version of localVersions) {
		if (version.downloadUrl) {
			const s3Url = await uploadLocalFile(version.downloadUrl);
			if (s3Url) {
				await db
					.update(productVersions)
					.set({ downloadUrl: s3Url, updatedAt: new Date() })
					.where(eq(productVersions.id, version.id));
			}
		}
	}

	// 2. Sync products downloadUrl
	for (const productItem of localProducts) {
		if (productItem.downloadUrl) {
			const s3Url = await uploadLocalFile(productItem.downloadUrl);
			if (s3Url) {
				await db
					.update(products)
					.set({ downloadUrl: s3Url, updatedAt: new Date() })
					.where(eq(products.id, productItem.id));
			}
		}
	}

	return { successCount, failedCount };
}
