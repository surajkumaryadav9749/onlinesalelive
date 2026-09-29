import path from 'path';
import fs from 'fs/promises';
import { HeroBanner } from '@/models/HeroBanner';
import { connectToDatabase } from '@/lib/db';

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
 * Saves uploaded image file to `public/uploads/banners` and returns the public URL.
 */
export async function saveUploadedBannerFile(file: File): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name || '').toLowerCase() || '.webp';
  const rawBaseName = path.basename(file.name || 'banner', ext);
  const safeBaseName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const uniqueName = `${Date.now()}-${safeBaseName}${ext}`;

  const filePath = path.join(uploadsDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/uploads/banners/${uniqueName}`;
}

/**
 * Enforces that at most 5 banners remain active.
 * When a new active banner is added (or existing activated), if total active exceeds 5,
 * the oldest active banners are deactivated (isActive set to false).
 * Historical records are preserved.
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
