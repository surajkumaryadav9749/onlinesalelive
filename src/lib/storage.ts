import path from 'path';
import fs from 'fs/promises';
import { put, del } from '@vercel/blob';
import { connectToDatabase } from '@/lib/db';
import { HeroBanner } from '@/models/HeroBanner';
import { HeroBannerImage } from '@/models/HeroBannerImage';
import { Category } from '@/models/Category';
import { CategoryImage } from '@/models/CategoryImage';

/**
 * Checks whether Vercel Blob storage is configured via BLOB_READ_WRITE_TOKEN.
 */
export function isBlobStorageConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return Boolean(token && token.trim().length > 0 && !token.includes('placeholder'));
}

/**
 * Checks if a given URL is a Vercel Blob storage URL.
 */
export function isBlobUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('blob.vercel-storage.com');
}

/**
 * Uploads an image file to persistent storage (Vercel Blob if configured, with resilient database fallback).
 * Guarantees zero unhandled filesystem writes on read-only serverless platforms like Vercel.
 */
export async function uploadFileToStorage(
  file: File,
  folder: 'banners' | 'categories',
  options?: { slugHint?: string }
): Promise<string> {
  const ext = path.extname(file.name || '').toLowerCase() || '.webp';
  const rawBaseName = options?.slugHint
    ? options.slugHint
    : path.basename(file.name || (folder === 'banners' ? 'hero-banner' : 'category'), ext);
  const safeBaseName = rawBaseName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 40);

  const mimeType =
    file.type ||
    (ext === '.png'
      ? 'image/png'
      : ext === '.webp'
      ? 'image/webp'
      : ext === '.jpg' || ext === '.jpeg'
      ? 'image/jpeg'
      : 'application/octet-stream');

  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. Primary Persistent Storage: Vercel Blob
  if (isBlobStorageConfigured()) {
    try {
      const pathname = `${folder}/${safeBaseName}${ext}`;
      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: true,
      });

      console.info(`[Storage] Uploaded image to Vercel Blob (${folder}): ${blob.url}`);
      return blob.url;
    } catch (blobErr) {
      console.error('[Storage] Vercel Blob upload failed, falling back to persistent DB storage:', blobErr);
    }
  }

  // 2. Resilient Database Persistence (for local dev, tests, or before BLOB_READ_WRITE_TOKEN is configured)
  const uniqueName = `${Date.now()}-${safeBaseName}${ext}`;
  const publicUrl = `/uploads/${folder}/${uniqueName}`;

  await connectToDatabase();

  if (folder === 'banners') {
    await HeroBannerImage.findOneAndUpdate(
      { filename: uniqueName },
      {
        filename: uniqueName,
        mimeType,
        size: file.size,
        data: buffer,
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.info(`[Storage] Banner persisted in MongoDB store: ${publicUrl}`);
  } else {
    await CategoryImage.findOneAndUpdate(
      { filename: uniqueName },
      {
        filename: uniqueName,
        mimeType,
        size: file.size,
        data: buffer,
        categorySlug: options?.slugHint || '',
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.info(`[Storage] Category image persisted in MongoDB store: ${publicUrl}`);
  }

  // 3. Optional local disk cache (only for categories in local dev when not on Vercel)
  if (folder === 'categories') {
    try {
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      if (!isServerless) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
        await fs.mkdir(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, uniqueName);
        await fs.writeFile(filePath, buffer);
      }
    } catch {
      // Non-fatal: read-only filesystem or permissions
    }
  }

  return publicUrl;
}

/**
 * Deletes an image from persistent storage (Vercel Blob or DB/local fallback).
 * Verifies reference count so an image still used by another entity is preserved.
 */
export async function deleteFileFromStorage(
  imageUrl: string,
  folder: 'banners' | 'categories',
  excludeId?: string
): Promise<boolean> {
  if (!imageUrl || typeof imageUrl !== 'string') return false;

  const normalizedUrl = imageUrl.trim();

  // A. Vercel Blob URL Deletion
  if (isBlobUrl(normalizedUrl)) {
    await connectToDatabase();

    if (folder === 'banners') {
      const query: Record<string, unknown> = { imageUrl: normalizedUrl };
      if (excludeId) query._id = { $ne: excludeId };
      const count = await HeroBanner.countDocuments(query);
      if (count > 0) {
        // Still referenced by another banner
        return false;
      }
    } else {
      const query: Record<string, unknown> = {
        $or: [{ image: normalizedUrl }, { imageUrl: normalizedUrl }],
      };
      if (excludeId) query._id = { $ne: excludeId };
      const count = await Category.countDocuments(query);
      if (count > 0) {
        // Still referenced by another category
        return false;
      }
    }

    try {
      await del(normalizedUrl);
      console.info(`[Storage] Deleted Vercel Blob object: ${normalizedUrl}`);
      return true;
    } catch (err) {
      console.warn(`[Storage] Could not delete Vercel Blob ${normalizedUrl}:`, err);
      return false;
    }
  }

  // B. Fallback / Legacy Local & DB Deletion
  const expectedPrefix = `/uploads/${folder}/`;
  if (normalizedUrl.startsWith(expectedPrefix)) {
    await connectToDatabase();

    if (folder === 'banners') {
      const query: Record<string, unknown> = { imageUrl: normalizedUrl };
      if (excludeId) query._id = { $ne: excludeId };
      const count = await HeroBanner.countDocuments(query);
      if (count > 0) return false;

      const fileName = path.basename(normalizedUrl);
      try {
        await HeroBannerImage.deleteOne({ filename: fileName });
      } catch (dbErr) {
        console.warn('[Storage] MongoDB banner image delete warning:', dbErr);
      }

      try {
        const fullPath = path.join(process.cwd(), 'public', 'uploads', 'banners', fileName);
        await fs.unlink(fullPath);
      } catch {
        // File may not exist on disk in serverless
      }
      return true;
    } else {
      const query: Record<string, unknown> = {
        $or: [{ image: normalizedUrl }, { imageUrl: normalizedUrl }],
      };
      if (excludeId) query._id = { $ne: excludeId };
      const count = await Category.countDocuments(query);
      if (count > 0) return false;

      const fileName = path.basename(normalizedUrl);
      try {
        await CategoryImage.deleteOne({ filename: fileName });
      } catch (dbErr) {
        console.warn('[Storage] MongoDB category image delete warning:', dbErr);
      }

      try {
        const fullPath = path.join(process.cwd(), 'public', 'uploads', 'categories', fileName);
        await fs.unlink(fullPath);
      } catch {
        // File may not exist on disk in serverless
      }
      return true;
    }
  }

  return false;
}
