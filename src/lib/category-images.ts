import path from 'path';
import fs from 'fs/promises';
import { Category } from '@/models/Category';
import { CategoryImage } from '@/models/CategoryImage';
import { connectToDatabase } from '@/lib/db';

export const MAX_CATEGORY_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_CATEGORY_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];

export const ALLOWED_CATEGORY_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validates uploaded category image file against allowed formats and 5MB limit.
 */
export function validateCategoryImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No image file provided' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'Uploaded file is empty' };
  }

  if (file.size > MAX_CATEGORY_IMAGE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 5 MB limit (file is ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
    };
  }

  const mime = file.type?.toLowerCase() || '';
  const ext = path.extname(file.name || '').toLowerCase();

  const isAllowedMime = ALLOWED_CATEGORY_IMAGE_MIME_TYPES.includes(mime);
  const isAllowedExt = ALLOWED_CATEGORY_IMAGE_EXTENSIONS.includes(ext);

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, JPEG, PNG, and WebP images are supported.',
    };
  }

  return { valid: true };
}

/**
 * Saves uploaded image file to MongoDB and `public/uploads/categories` (if filesystem is writable).
 * Returns the public URL `/uploads/categories/...`.
 * Seamlessly handles read-only filesystems (EROFS) in serverless environments like Vercel.
 */
export async function saveUploadedCategoryFile(file: File, slugHint?: string): Promise<string> {
  const ext = path.extname(file.name || '').toLowerCase() || '.webp';
  const rawBaseName = slugHint ? slugHint : path.basename(file.name || 'category', ext);
  const safeBaseName = rawBaseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
  const uniqueName = `${Date.now()}-${safeBaseName}${ext}`;
  const publicUrl = `/uploads/categories/${uniqueName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType =
    file.type ||
    (ext === '.png'
      ? 'image/png'
      : ext === '.webp'
      ? 'image/webp'
      : ext === '.jpg' || ext === '.jpeg'
      ? 'image/jpeg'
      : 'application/octet-stream');

  // 1. Persist to MongoDB for serverless / Vercel persistence
  try {
    await connectToDatabase();
    await CategoryImage.findOneAndUpdate(
      { filename: uniqueName },
      {
        filename: uniqueName,
        mimeType,
        size: file.size,
        data: buffer,
        categorySlug: slugHint || '',
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (dbErr) {
    console.warn('[CategoryImage] MongoDB write warning:', dbErr);
  }

  // 2. Try writing to filesystem if writable (local dev / VPS)
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, uniqueName);
    await fs.writeFile(filePath, buffer);
  } catch {
    // Gracefully ignore EROFS or filesystem permissions in read-only serverless environments (Vercel)
    console.info('[CategoryImage] Filesystem is read-only (serverless/Vercel); file safely persisted in MongoDB.');
  }

  return publicUrl;
}

/**
 * Safely deletes an uploaded category image file from MongoDB and `public/uploads/categories`.
 * Checks if other categories are referencing the same image before unlinking.
 */
export async function deleteUploadedCategoryFile(
  imageUrl: string,
  excludeCategoryId?: string
): Promise<boolean> {
  if (!imageUrl || typeof imageUrl !== 'string') return false;

  // Only delete files residing in /uploads/categories/
  const normalizedUrl = imageUrl.trim();
  if (!normalizedUrl.startsWith('/uploads/categories/')) {
    return false;
  }

  try {
    await connectToDatabase();

    // Verify if another category still references this image
    const query: Record<string, unknown> = {
      $or: [{ image: normalizedUrl }, { imageUrl: normalizedUrl }],
    };
    if (excludeCategoryId) {
      query._id = { $ne: excludeCategoryId };
    }

    const count = await Category.countDocuments(query);
    if (count > 0) {
      // Image is still referenced by another category, do not delete
      return false;
    }

    const fileName = path.basename(normalizedUrl);

    // 1. Delete from MongoDB
    try {
      await CategoryImage.deleteOne({ filename: fileName });
    } catch (dbErr) {
      console.warn('[CategoryImage] MongoDB delete warning:', dbErr);
    }

    // 2. Try deleting from filesystem if present
    try {
      const fullPath = path.join(process.cwd(), 'public', 'uploads', 'categories', fileName);
      const safeDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
      if (fullPath.startsWith(safeDir)) {
        await fs.unlink(fullPath);
      }
    } catch {
      // Ignore EROFS or ENOENT
    }

    return true;
  } catch (err: unknown) {
    console.warn(`Could not delete old category image ${normalizedUrl}:`, err);
    return false;
  }
}
