import { NextRequest } from 'next/server';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import {
  validateCategoryImageFile,
  saveUploadedCategoryFile,
  deleteUploadedCategoryFile,
} from '@/lib/category-images';

/**
 * POST /api/admin/categories/upload
 * Handles category image file upload (multipart/form-data)
 */
export async function POST(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return errorResponse('Content-Type must be multipart/form-data', 400);
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const slugHint = (formData.get('slug') as string) || '';

    if (!file || typeof file === 'string') {
      return errorResponse('No image file uploaded', 400);
    }

    const fileObj = file as File;
    const validation = validateCategoryImageFile(fileObj);
    if (!validation.valid) {
      return errorResponse(validation.error || 'Invalid category image file', 400);
    }

    const imageUrl = await saveUploadedCategoryFile(fileObj, slugHint);

    return successResponse({ imageUrl }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload category image';
    console.error('Error in category image upload:', message);
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/admin/categories/upload
 * Deletes an uploaded image file if not used elsewhere
 */
export async function DELETE(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const imageUrl = body.imageUrl || new URL(req.url).searchParams.get('imageUrl') || '';
    const categoryId = body.categoryId || new URL(req.url).searchParams.get('categoryId') || undefined;

    if (!imageUrl) {
      return errorResponse('imageUrl is required', 400);
    }

    const deleted = await deleteUploadedCategoryFile(imageUrl, categoryId);

    return successResponse({ deleted, message: deleted ? 'File removed from disk' : 'File reference cleared' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete category image';
    return errorResponse(message, 500);
  }
}
