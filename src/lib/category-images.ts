import path from 'path';
import { uploadFileToStorage, deleteFileFromStorage } from '@/lib/storage';

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
 * Saves uploaded category image file to persistent storage (Vercel Blob / MongoDB fallback).
 * In production on Vercel with BLOB_READ_WRITE_TOKEN, stores permanently in Vercel Blob.
 * In local development or fallback environments, stores safely without crashing on read-only filesystems.
 */
export async function saveUploadedCategoryFile(file: File, slugHint?: string): Promise<string> {
  return uploadFileToStorage(file, 'categories', { slugHint });
}

/**
 * Safely deletes an uploaded category image file from persistent storage.
 * Checks if other categories are referencing the same image before unlinking or deleting from Blob.
 */
export async function deleteUploadedCategoryFile(
  imageUrl: string,
  excludeCategoryId?: string
): Promise<boolean> {
  return deleteFileFromStorage(imageUrl, 'categories', excludeCategoryId);
}
