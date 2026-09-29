import path from 'path';
import fs from 'fs/promises';
import { Category } from '@/models/Category';
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
 * Saves uploaded image file to `public/uploads/categories` and returns the public URL.
 */
export async function saveUploadedCategoryFile(file: File, slugHint?: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name || '').toLowerCase() || '.webp';
  const rawBaseName = slugHint ? slugHint : path.basename(file.name || 'category', ext);
  const safeBaseName = rawBaseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
  const uniqueName = `${Date.now()}-${safeBaseName}${ext}`;

  const filePath = path.join(uploadsDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/uploads/categories/${uniqueName}`;
}

/**
 * Safely deletes an uploaded category image file from `public/uploads/categories`.
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
    const fullPath = path.join(process.cwd(), 'public', 'uploads', 'categories', fileName);

    // Prevent directory traversal
    const safeDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
    if (!fullPath.startsWith(safeDir)) {
      return false;
    }

    await fs.unlink(fullPath);
    return true;
  } catch (err: unknown) {
    // If file doesn't exist (ENOENT), ignore gracefully
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ENOENT') {
      return false;
    }
    console.warn(`Could not delete old category image ${normalizedUrl}:`, err);
    return false;
  }
}
