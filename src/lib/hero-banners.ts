import path from 'path';
import { HeroBanner } from '@/models/HeroBanner';
import { connectToDatabase } from '@/lib/db';
import { uploadFileToStorage, deleteFileFromStorage } from '@/lib/storage';

export const MAX_ACTIVE_HERO_BANNERS = 5;
export const MAX_BANNER_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_BANNER_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];

export const ALLOWED_BANNER_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validates uploaded image file against allowed types and file size limit.
 */
export function validateBannerImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No image file provided' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'Uploaded file is empty' };
  }

  if (file.size > MAX_BANNER_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 5 MB limit (file is ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
    };
  }

  const mime = file.type?.toLowerCase() || '';
  const ext = path.extname(file.name || '').toLowerCase();

  const isAllowedMime = ALLOWED_BANNER_MIME_TYPES.includes(mime);
  const isAllowedExt = ALLOWED_BANNER_EXTENSIONS.includes(ext);

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, JPEG, PNG, and WebP images are allowed.',
    };
  }

  return { valid: true };
}

/**
 * Saves uploaded image file to persistent object storage (Vercel Blob / persistent store) and returns the public URL.
 * Guarantees zero local filesystem dependency on read-only serverless environments like Vercel.
 */
export async function saveUploadedBannerFile(file: File): Promise<string> {
  return uploadFileToStorage(file, 'banners');
}

/**
 * Safely deletes an uploaded banner image file from persistent object storage.
 * Ensures the object is deleted if no other banner record references it.
 */
export async function deleteUploadedBannerFile(
  imageUrl: string,
  excludeBannerId?: string
): Promise<boolean> {
  return deleteFileFromStorage(imageUrl, 'banners', excludeBannerId);
}

/**
 * Enforces that at most 5 banners remain active.
 * When a new active banner is added (or existing activated), if total active exceeds 5,
 * the oldest active banners are deactivated (isActive set to false).
 * Historical records are preserved without deleting images or database entries.
 */
export async function enforceMaxActiveBanners(
  activatingCount: number = 1,
  excludeId?: string
): Promise<{ deactivatedIds: string[]; deactivatedCount: number }> {
  await connectToDatabase();

  const query: Record<string, unknown> = { isActive: true };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  // Fetch all currently active banners sorted newest first
  const activeBanners = await HeroBanner.find(query).sort({ createdAt: -1 });

  // How many existing active banners can remain so that + activatingCount <= MAX_ACTIVE_HERO_BANNERS
  const allowedExisting = Math.max(0, MAX_ACTIVE_HERO_BANNERS - activatingCount);

  if (activeBanners.length > allowedExisting) {
    // The items beyond allowedExisting are the oldest
    const toDeactivate = activeBanners.slice(allowedExisting);
    const deactivatedIds = toDeactivate.map((b) => b._id.toString());

    await HeroBanner.updateMany(
      { _id: { $in: deactivatedIds } },
      { $set: { isActive: false } }
    );

    return {
      deactivatedIds,
      deactivatedCount: deactivatedIds.length,
    };
  }

  return {
    deactivatedIds: [],
    deactivatedCount: 0,
  };
}
